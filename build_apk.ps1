Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Building CryptoAdviser APK" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to the project directory
Set-Location $PSScriptRoot

# Check if android directory exists
if (!(Test-Path "android")) {
    Write-Host "ERROR: android directory not found!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "[1/2] Navigating to android directory..." -ForegroundColor Yellow
Set-Location android

Write-Host "[2/2] Building APK with Gradle..." -ForegroundColor Yellow
Write-Host "This may take several minutes..." -ForegroundColor Gray
Write-Host ""

# Run Gradle build
if (Test-Path "gradlew.bat") {
    & .\gradlew.bat assembleRelease
} else {
    Write-Host "ERROR: gradlew.bat not found!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

# Check if APK was created
$apkPath = "app\build\outputs\apk\release\app-release.apk"
if (Test-Path $apkPath) {
    Write-Host "BUILD SUCCESS!" -ForegroundColor Green
    Write-Host ""
    Write-Host "APK Location:" -ForegroundColor Yellow
    $fullPath = Resolve-Path $apkPath
    Write-Host $fullPath -ForegroundColor White
    Write-Host ""

    # Show file size
    $fileSize = (Get-Item $apkPath).Length / 1MB
    Write-Host "File size: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Yellow
} else {
    Write-Host "BUILD FAILED or APK not found" -ForegroundColor Red
    Write-Host "Check the output above for errors" -ForegroundColor Yellow
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Read-Host "Press Enter to exit"
