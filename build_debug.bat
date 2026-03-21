@echo off
echo ========================================
echo Building CryptoAdviser APK - Debug Mode
echo ========================================
echo.

cd "%~dp0"

echo [Step 1/5] Checking Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
node --version
echo.

echo [Step 2/5] Checking npm...
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm not found
    pause
    exit /b 1
)
npm --version
echo.

echo [Step 3/5] Checking Java...
where java >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: Java not found in PATH
    echo Trying to use Android Studio's Java...
) else (
    java -version 2>&1
)
echo.

echo [Step 4/5] Navigating to android directory...
cd android
if %errorlevel% neq 0 (
    echo ERROR: Cannot access android directory
    pause
    exit /b 1
)
echo Current directory: %CD%
echo.

echo [Step 5/5] Building APK with Gradle...
echo This may take 5-10 minutes...
echo.

if exist gradlew.bat (
    call gradlew.bat assembleRelease
) else (
    echo ERROR: gradlew.bat not found
    pause
    exit /b 1
)

echo.
echo ========================================
if exist "app\build\outputs\apk\release\app-release.apk" (
    echo BUILD SUCCESS!
    echo.
    echo APK Location:
    echo %~dp0android\app\build\outputs\apk\release\app-release.apk
    echo.
    echo File size:
    dir /s "app\build\outputs\apk\release\app-release.apk" | find "app-release.apk"
) else (
    echo BUILD FAILED or APK not found
    echo Check the output above for errors
)
echo ========================================

pause
