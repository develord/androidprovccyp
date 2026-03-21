@echo off
echo Building APK...
cd android
call gradlew.bat assembleRelease
echo.
echo APK Location: android\app\build\outputs\apk\release\app-release.apk
