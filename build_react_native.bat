@echo off
echo Building CryptoAdviser APK with React Native CLI...
echo.

REM Build with React Native CLI (will use bundled Java from Android)
cd "%~dp0"
npx react-native build-android --mode=release

echo.
if exist "android\app\build\outputs\apk\release\app-release.apk" (
    echo ✓ BUILD SUCCESS!
    echo.
    echo APK location:
    echo %~dp0android\app\build\outputs\apk\release\app-release.apk
) else (
    echo × Build may have failed. Check output above.
)

pause
