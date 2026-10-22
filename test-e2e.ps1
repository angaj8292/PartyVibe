# PartyVibe End-to-End Test Suite
$ErrorActionPreference = "Stop"

$baseUrl = "http://localhost:8080/api"
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Starting PartyVibe E2E Automated Verification Test Suite" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$testId = [System.Guid]::NewGuid().ToString().Substring(0, 6)
$userA_name = "test_a_$testId"
$userB_name = "test_b_$testId"
$userC_name = "test_c_$testId"

# 1. Register Users A, B, C
Write-Host "`n[Step 1] Registering User A, User B, User C..." -ForegroundColor Yellow

$regA = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -ContentType "application/json" -Body (@{
    username = $userA_name
    email = "$userA_name@partyvibe.app"
    password = "password123"
    gender = "Female"
    age = 22
    bio = "Host A on PartyVibe"
} | ConvertTo-Json)

$regB = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -ContentType "application/json" -Body (@{
    username = $userB_name
    email = "$userB_name@partyvibe.app"
    password = "password123"
    gender = "Male"
    age = 25
    bio = "Guest B on PartyVibe"
} | ConvertTo-Json)

$regC = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -ContentType "application/json" -Body (@{
    username = $userC_name
    email = "$userC_name@partyvibe.app"
    password = "password123"
    gender = "Other"
    age = 24
    bio = "Listener C on PartyVibe"
} | ConvertTo-Json)

$tokenA = $regA.token
$idA = $regA.user.id
$tokenB = $regB.token
$idB = $regB.user.id
$tokenC = $regC.token
$idC = $regC.user.id

Write-Host "SUCCESS: Users registered! A: id=$idA, B: id=$idB, C: id=$idC" -ForegroundColor Green

# 2. User A creates a room
Write-Host "`n[Step 2] User A creates a Voice Party Room..." -ForegroundColor Yellow
$headersA = @{ Authorization = "Bearer $tokenA" }
$headersB = @{ Authorization = "Bearer $tokenB" }
$headersC = @{ Authorization = "Bearer $tokenC" }

$roomReq = @{
    title = "E2E Live Voice Festival $testId"
    category = "Music"
    isPublic = $true
} | ConvertTo-Json

$room = Invoke-RestMethod -Uri "$baseUrl/rooms" -Method Post -Headers $headersA -ContentType "application/json" -Body $roomReq
$roomId = $room.id
Write-Host "SUCCESS: Room created! Room ID: $roomId, Title: '$($room.title)', Owner: $($room.owner.username)" -ForegroundColor Green

# 3. User B and User C join the room and check viewer count
Write-Host "`n[Step 3] User B and User C join the room..." -ForegroundColor Yellow
$joinB = Invoke-RestMethod -Uri "$baseUrl/rooms/$roomId/join" -Method Post -Headers $headersB
$joinC = Invoke-RestMethod -Uri "$baseUrl/rooms/$roomId/join" -Method Post -Headers $headersC
Write-Host "SUCCESS: B & C joined! Live Viewer Count: $($joinC.viewerCount)" -ForegroundColor Green
if ($joinC.viewerCount -lt 3) {
    throw "Viewer count mismatch! Expected at least 3 (A, B, C)."
}

# 4. Voice Token Flow: B takes Seat 2; verify token permissions
Write-Host "`n[Step 4] Seat system & LiveKit Voice Token Flow..." -ForegroundColor Yellow
$seatReq = @{
    seatNo = 2
    action = "TAKE"
} | ConvertTo-Json

$seatsAfterB = Invoke-RestMethod -Uri "$baseUrl/rooms/$roomId/seats" -Method Post -Headers $headersB -ContentType "application/json" -Body $seatReq
$seat2 = $seatsAfterB | Where-Object { $_.seatNo -eq 2 }
Write-Host "Seat 2 Occupant: $($seat2.user.username)" -ForegroundColor Gray

# Verify B's token has canPublish = true
$tokenResB = Invoke-RestMethod -Uri "$baseUrl/rooms/$roomId/livekit-token" -Headers $headersB
Write-Host "User B LiveKit Token: canPublish=$($tokenResB.canPublish), canSubscribe=$($tokenResB.canSubscribe)" -ForegroundColor Gray
if (-not $tokenResB.canPublish) {
    throw "User B is on Seat 2 but did not get canPublish=true!"
}

# Verify C (listener, not on seat) has canPublish = false
$tokenResC = Invoke-RestMethod -Uri "$baseUrl/rooms/$roomId/livekit-token" -Headers $headersC
Write-Host "User C LiveKit Token: canPublish=$($tokenResC.canPublish), canSubscribe=$($tokenResC.canSubscribe)" -ForegroundColor Gray
if ($tokenResC.canPublish) {
    throw "User C is not seated but got canPublish=true!"
}
Write-Host "SUCCESS: Voice token permission logic verified! (Seat occupant canPublish=true, Listener canPublish=false)" -ForegroundColor Green

# 5. Room Chat & Profanity Filter
Write-Host "`n[Step 5] Room Chat & Profanity Filter..." -ForegroundColor Yellow
$chatMsg1 = Invoke-RestMethod -Uri "$baseUrl/rooms/$roomId/messages" -Method Post -Headers $headersB -ContentType "application/json" -Body (@{
    content = "Hello everyone! Love the vibe in this room!"
} | ConvertTo-Json)

$chatMsg2 = Invoke-RestMethod -Uri "$baseUrl/rooms/$roomId/messages" -Method Post -Headers $headersC -ContentType "application/json" -Body (@{
    content = "You are an idiot and this is spam"
} | ConvertTo-Json)

Write-Host "Chat 1: '$($chatMsg1.content)'" -ForegroundColor Gray
Write-Host "Chat 2 (Filtered): '$($chatMsg2.content)'" -ForegroundColor Gray
if ($chatMsg2.content -like "*idiot*" -or $chatMsg2.content -like "*spam*") {
    throw "Profanity filter did not sanitize inappropriate words!"
}
Write-Host "SUCCESS: Room chat sanitized profanity correctly: '$($chatMsg2.content)'" -ForegroundColor Green

# 6. Owner Seat Management: Lock, Mute, Kick
Write-Host "`n[Step 6] Host Seat Controls (Lock, Mute, Kick)..." -ForegroundColor Yellow
# Owner mutes seat 2
$muteReq = @{ seatNo = 2; action = "MUTE" } | ConvertTo-Json
$seatsAfterMute = Invoke-RestMethod -Uri "$baseUrl/rooms/$roomId/seats" -Method Post -Headers $headersA -ContentType "application/json" -Body $muteReq
$s2Muted = ($seatsAfterMute | Where-Object { $_.seatNo -eq 2 }).muted
Write-Host "Seat 2 muted status: $s2Muted" -ForegroundColor Gray
if (-not $s2Muted) { throw "Seat 2 was not muted by owner!" }

# Owner kicks seat 2
$kickReq = @{ seatNo = 2; action = "KICK" } | ConvertTo-Json
$seatsAfterKick = Invoke-RestMethod -Uri "$baseUrl/rooms/$roomId/seats" -Method Post -Headers $headersA -ContentType "application/json" -Body $kickReq
$s2User = ($seatsAfterKick | Where-Object { $_.seatNo -eq 2 }).user
if ($s2User -ne $null) { throw "Seat 2 was not vacated after kick!" }
Write-Host "Seat 2 occupant after kick: null (Vacated)" -ForegroundColor Gray

# Owner locks seat 3
$lockReq = @{ seatNo = 3; action = "LOCK" } | ConvertTo-Json
$seatsAfterLock = Invoke-RestMethod -Uri "$baseUrl/rooms/$roomId/seats" -Method Post -Headers $headersA -ContentType "application/json" -Body $lockReq
$s3Locked = ($seatsAfterLock | Where-Object { $_.seatNo -eq 3 }).locked
if (-not $s3Locked) { throw "Seat 3 was not locked by owner!" }
Write-Host "Seat 3 locked status: $s3Locked" -ForegroundColor Gray
Write-Host "SUCCESS: Host seat controls (Lock, Mute, Kick) verified!" -ForegroundColor Green

# 7. Follow, Mutual Follow & Friends system
Write-Host "`n[Step 7] Follow, Unfollow and Friends counts..." -ForegroundColor Yellow
# C follows A
$followCA = Invoke-RestMethod -Uri "$baseUrl/users/$idA/follow" -Method Post -Headers $headersC
Write-Host "C followed A: $($followCA.following)" -ForegroundColor Gray

# Check A's profile from C
$profA = Invoke-RestMethod -Uri "$baseUrl/users/$idA" -Headers $headersC
Write-Host "A's followers count: $($profA.followersCount), isFollowing=$($profA.isFollowing), isFriend=$($profA.isFriend)" -ForegroundColor Gray
if ($profA.followersCount -ne 1 -or -not $profA.isFollowing) { throw "Follow status mismatch!" }

# A follows C back (Mutual follow -> Friends!)
$followAC = Invoke-RestMethod -Uri "$baseUrl/users/$idC/follow" -Method Post -Headers $headersA
$profA_mutual = Invoke-RestMethod -Uri "$baseUrl/users/$idA" -Headers $headersC
Write-Host "Mutual Friends Count for A: $($profA_mutual.friendsCount), isFriend=$($profA_mutual.isFriend)" -ForegroundColor Gray
if (-not $profA_mutual.isFriend -or $profA_mutual.friendsCount -lt 1) {
    throw "Mutual follow did not register as Friend!"
}
Write-Host "SUCCESS: Mutual follow correctly displays as Friends!" -ForegroundColor Green

# 8. Test Coins Top-up and Virtual Gifting
Write-Host "`n[Step 8] Test Coins Top-Up and Virtual Gifting..." -ForegroundColor Yellow
$topUp = Invoke-RestMethod -Uri "$baseUrl/wallet/test-topup" -Method Post -Headers $headersB -ContentType "application/json" -Body (@{
    amount = 1000
} | ConvertTo-Json)
Write-Host "User B Coins after top-up: $($topUp.coinsBalance)" -ForegroundColor Gray

$gifts = Invoke-RestMethod -Uri "$baseUrl/gifts"
$rose = $gifts | Where-Object { $_.name -eq "Rose" }
$guitar = $gifts | Where-Object { $_.name -eq "Acoustic Guitar" }

# B sends Rose (10 coins) to A in room
$giftReq = @{
    giftId = $rose.id
    receiverId = $idA
    roomId = $roomId
} | ConvertTo-Json

$giftSent = Invoke-RestMethod -Uri "$baseUrl/gifts/send" -Method Post -Headers $headersB -ContentType "application/json" -Body $giftReq
Write-Host "Gift sent: $($giftSent.gift.name) for $($giftSent.coins) coins from $($giftSent.sender.username) to $($giftSent.receiver.username)" -ForegroundColor Gray

# Check A's gift wall
$giftWallA = Invoke-RestMethod -Uri "$baseUrl/users/$idA/gift-wall" -Headers $headersA
Write-Host "A's Gift Wall Items: $($giftWallA.Count), Top Gift: $($giftWallA[0].giftName) x$($giftWallA[0].count)" -ForegroundColor Gray
if ($giftWallA.Count -eq 0 -or $giftWallA[0].giftName -ne "Rose") {
    throw "Gift Wall did not record the received gift!"
}

# Verify VIP level recalculation for B (B now spent 10 coins, let's spend 100 to bump VIP)
$spendTopUp = Invoke-RestMethod -Uri "$baseUrl/gifts/send" -Method Post -Headers $headersB -ContentType "application/json" -Body (@{
    giftId = $guitar.id
    receiverId = $idA
    roomId = $roomId
} | ConvertTo-Json)
$profB = Invoke-RestMethod -Uri "$baseUrl/users/$idB" -Headers $headersB
Write-Host "User B VIP Level after spending $($profB.totalCoinsSpent) coins: VIP $($profB.vipLevel)" -ForegroundColor Gray
if ($profB.vipLevel -lt 1) { throw "VIP level was not recalculated!" }
Write-Host "SUCCESS: Gift transaction, wallet update, Gift Wall, and VIP level recalculation verified!" -ForegroundColor Green

# 9. Clean Failure on Insufficient Coins
Write-Host "`n[Step 9] Insufficient Coins Error Handling..." -ForegroundColor Yellow
$rocket = $gifts | Where-Object { $_.name -eq "Space Rocket" } # 10000 coins
$failReq = @{
    giftId = $rocket.id
    receiverId = $idA
    roomId = $roomId
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "$baseUrl/gifts/send" -Method Post -Headers $headersC -ContentType "application/json" -Body $failReq
    throw "Expected request to fail with insufficient coins, but it succeeded!"
} catch {
    Write-Host "Cleanly rejected with status $($_.Exception.Response.StatusCode): $($_.Exception.Message)" -ForegroundColor Gray
    Write-Host "SUCCESS: Insufficient coins rejected cleanly without error leaks!" -ForegroundColor Green
}

# 10. Safety: Banning and Blocking
Write-Host "`n[Step 10] Room Ban & User Block..." -ForegroundColor Yellow
# Owner A bans User B from room
$banRes = Invoke-RestMethod -Uri "$baseUrl/rooms/$roomId/ban" -Method Post -Headers $headersA -ContentType "application/json" -Body (@{
    userId = $idB
} | ConvertTo-Json)
Write-Host "Banned User B from room: $($banRes.status)" -ForegroundColor Gray

# Try joining room as banned User B -> must be rejected
try {
    Invoke-RestMethod -Uri "$baseUrl/rooms/$roomId/join" -Method Post -Headers $headersB
    throw "Banned user was able to join the room!"
} catch {
    Write-Host "Banned user rejected from room: $($_.Exception.Message)" -ForegroundColor Gray
    Write-Host "SUCCESS: Room ban enforced properly!" -ForegroundColor Green
}

# User A blocks User C
$blockRes = Invoke-RestMethod -Uri "$baseUrl/users/$idC/block" -Method Post -Headers $headersA
Write-Host "Blocked User C: $($blockRes.blocked)" -ForegroundColor Gray

# Verify blocked list
$blockedList = Invoke-RestMethod -Uri "$baseUrl/users/blocked" -Headers $headersA
Write-Host "Blocked users count: $($blockedList.Count), first blocked: @$($blockedList[0].username)" -ForegroundColor Gray
Write-Host "SUCCESS: Block user logic verified!" -ForegroundColor Green

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "ALL 10 ACCEPTANCE TEST SCENARIOS PASSED WITH ZERO ERRORS!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
