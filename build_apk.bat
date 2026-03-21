@echo off
echo ========================================
echo Building CryptoAdviser APK Release
echo ========================================

cd android

echo.
echo [1/2] Cleaning previous builds...
call gradlew.bat clean

echo.
echo [2/2] Building release APK...
call gradlew.bat assembleRelease

echo.
echo ========================================
echo Build Complete!
echo ========================================
echo.
echo APK Location:
echo android\app\build\outputs\apk\release\app-release.apk
echo.

pause
