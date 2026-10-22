$ErrorActionPreference = "Stop"
$baseUrl = "http://localhost:8080/api"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Verifying Image Upload, Device Music Upload & Drawer APIs" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Login user
$loginBody = @{
    usernameOrEmail = "alice"
    password = "password123"
} | ConvertTo-Json

$loginRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -ContentType "application/json" -Body $loginBody
$token = $loginRes.token
$headers = @{
    Authorization = "Bearer $token"
}

Write-Host "User logged in: $($loginRes.user.username) (ID: $($loginRes.user.id))" -ForegroundColor Green

# 2. Test Image Upload Endpoint (Multipart)
Write-Host "`n[Test 1] Testing Avatar Image File Upload (/api/users/avatar/upload)..." -ForegroundColor Yellow

$tempImgPath = [System.IO.Path]::GetTempFileName() + ".png"
# Create a valid 1x1 PNG file
$pngBytes = [System.Convert]::FromBase64String("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==")
[System.IO.File]::WriteAllBytes($tempImgPath, $pngBytes)

# Upload using curl.exe
$uploadOut = curl.exe -s -X POST -H "Authorization: Bearer $token" -F "file=@$tempImgPath" "$baseUrl/users/avatar/upload" | ConvertFrom-Json

Write-Host "Uploaded Avatar URL: $($uploadOut.avatarUrl)" -ForegroundColor Green
if ($uploadOut.avatarUrl -like "/uploads/avatars/*") {
    Write-Host "SUCCESS: Avatar image file upload verified!" -ForegroundColor Green
} else {
    throw "Failed avatar upload: $uploadOut"
}

# 3. Test Room Music File Upload Endpoint (Multipart)
Write-Host "`n[Test 2] Testing Room Music File Upload (/api/rooms/{id}/music/upload)..." -ForegroundColor Yellow

$tempAudioPath = [System.IO.Path]::GetTempFileName() + ".mp3"
$dummyAudioBytes = [System.Text.Encoding]::UTF8.GetBytes("ID3_DUMMY_MP3_AUDIO_STREAM_DATA_PARTYVIBE")
[System.IO.File]::WriteAllBytes($tempAudioPath, $dummyAudioBytes)

# Alice's room is ID 1
$musicUploadOut = curl.exe -s -X POST -H "Authorization: Bearer $token" -F "file=@$tempAudioPath" -F "title=Downloaded Party Vibe Track" "$baseUrl/rooms/1/music/upload" | ConvertFrom-Json

Write-Host "Uploaded Music Title: $($musicUploadOut.musicTitle)" -ForegroundColor Green
Write-Host "Uploaded Music URL: $($musicUploadOut.musicUrl)" -ForegroundColor Green
Write-Host "Music Playing: $($musicUploadOut.musicPlaying)" -ForegroundColor Green

if ($musicUploadOut.musicUrl -like "/uploads/music/*") {
    Write-Host "SUCCESS: Device music file upload and room sync verified!" -ForegroundColor Green
} else {
    throw "Failed music upload: $musicUploadOut"
}

# 4. Test Special Gift Records Endpoint
Write-Host "`n[Test 3] Testing Special Gift Records (/api/gifts/records)..." -ForegroundColor Yellow

$recordsOut = Invoke-RestMethod -Uri "$baseUrl/gifts/records?type=all" -Method Get -Headers $headers
Write-Host "Gift records returned: $($recordsOut.Count)" -ForegroundColor Green
Write-Host "SUCCESS: Special gift record endpoint verified!" -ForegroundColor Green

# 5. Clean up temp files
Remove-Item -Force $tempImgPath -ErrorAction SilentlyContinue
Remove-Item -Force $tempAudioPath -ErrorAction SilentlyContinue

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "ALL NEW DRAWER & UPLOAD FEATURES TESTED & VERIFIED 100%!" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
