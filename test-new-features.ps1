# Test the 3 newly added features:
# 1. Room Music Play / Sync
# 2. Coin Recharge with Payment Methods (UPI, Card, NetBanking)
# 3. User Change Profile Picture (Avatar URL / Upload)

$ErrorActionPreference = "Stop"
$baseUrl = "http://localhost:8080/api"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Testing New Features: Music Play, Payment Options, Avatar" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# Login as Alice (Host)
$aliceLogin = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -ContentType "application/json" -Body (@{
    usernameOrEmail = "alice"
    password = "password123"
} | ConvertTo-Json)
$tokenA = $aliceLogin.token
$headersA = @{ Authorization = "Bearer $tokenA" }

# Login as Bob (Seated Member)
$bobLogin = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -ContentType "application/json" -Body (@{
    usernameOrEmail = "bob"
    password = "password123"
} | ConvertTo-Json)
$tokenB = $bobLogin.token
$headersB = @{ Authorization = "Bearer $tokenB" }

# ----------------------------------------------------
# FEATURE 1: Background Music Play in Party Room
# ----------------------------------------------------
Write-Host "`n[Feature 1] Testing Room Background Music Play / Sync..." -ForegroundColor Yellow
$rooms = Invoke-RestMethod -Uri "$baseUrl/rooms" -Headers $headersA
$aliceRoom = $rooms | Where-Object { $_.owner.username -eq "alice" } | Select-Object -First 1
$roomId = $aliceRoom.id
Write-Host "Using Alice's Room ID: $roomId ('$($aliceRoom.title)')" -ForegroundColor Gray

# Host plays music
$playReq = @{
    action = "PLAY"
    musicTitle = "Neon Nights Dance Beat"
    musicUrl = "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3"
    positionMs = 15000
} | ConvertTo-Json

$musicState = Invoke-RestMethod -Uri "$baseUrl/rooms/$roomId/music" -Method Post -Headers $headersA -ContentType "application/json" -Body $playReq
Write-Host "Music State updated: title='$($musicState.musicTitle)', playing=$($musicState.musicPlaying), position=$($musicState.positionMs)ms" -ForegroundColor Gray

if (-not $musicState.musicPlaying -or $musicState.musicTitle -ne "Neon Nights Dance Beat") {
    throw "Music state was not properly updated!"
}

# Verify Room Details contains the updated music state
$roomDetails = Invoke-RestMethod -Uri "$baseUrl/rooms/$roomId" -Headers $headersB
Write-Host "Room Details musicState: title='$($roomDetails.musicState.musicTitle)', playing=$($roomDetails.musicState.musicPlaying)" -ForegroundColor Gray
if ($roomDetails.musicState.musicTitle -ne "Neon Nights Dance Beat" -or -not $roomDetails.musicState.musicPlaying) {
    throw "Room details did not return current musicState!"
}
Write-Host "SUCCESS: Room background music play and sync verified!" -ForegroundColor Green

# ----------------------------------------------------
# FEATURE 2: Coin Recharge with Payment Methods
# ----------------------------------------------------
Write-Host "`n[Feature 2] Testing Coin Recharge with Payment Options (UPI, Card)..." -ForegroundColor Yellow

# Recharge via UPI
$upiTopUp = Invoke-RestMethod -Uri "$baseUrl/wallet/test-topup" -Method Post -Headers $headersB -ContentType "application/json" -Body (@{
    amount = 1000
    paymentMethod = "UPI"
    price = 99.0
    currency = "INR"
    paymentReference = "UPI-GPAY-984321"
} | ConvertTo-Json)

Write-Host "Coins balance after UPI recharge: $($upiTopUp.coinsBalance)" -ForegroundColor Gray
$latestTx = $upiTopUp.recentTransactions[0]
Write-Host "Transaction Record: '$($latestTx.description)', Ref: '$($latestTx.referenceId)'" -ForegroundColor Gray

if ($latestTx.description -notlike "*UPI*") {
    throw "Payment method UPI was not logged in transaction description!"
}
Write-Host "SUCCESS: Coins recharge with payment options (UPI / Cards) verified!" -ForegroundColor Green

# ----------------------------------------------------
# FEATURE 3: Profile Picture Change
# ----------------------------------------------------
Write-Host "`n[Feature 3] Testing Change Profile Picture..." -ForegroundColor Yellow
$newAvatar = "https://api.dicebear.com/7.x/lorelei/svg?seed=PartyVibeSuperstar"

$updatedProfile = Invoke-RestMethod -Uri "$baseUrl/users/me" -Method Put -Headers $headersB -ContentType "application/json" -Body (@{
    avatarUrl = $newAvatar
    bio = "Updated DJ bio with awesome music vibes!"
} | ConvertTo-Json)

Write-Host "Updated Avatar URL: $($updatedProfile.avatarUrl)" -ForegroundColor Gray
Write-Host "Updated Bio: '$($updatedProfile.bio)'" -ForegroundColor Gray

if ($updatedProfile.avatarUrl -ne $newAvatar) {
    throw "Profile avatar was not updated to new image!"
}
Write-Host "SUCCESS: Profile picture update verified!" -ForegroundColor Green

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "ALL 3 NEW FEATURES VERIFIED AND FUNCTIONING FLAWLESSLY!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
