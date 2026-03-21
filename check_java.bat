@echo off
echo ========================================
echo Checking Java Configuration
echo ========================================
echo.

echo [1] Checking JAVA_HOME...
if defined JAVA_HOME (
    echo JAVA_HOME is set to: %JAVA_HOME%
) else (
    echo WARNING: JAVA_HOME is not set!
    echo.
    echo Looking for Java installations...

    REM Check common Android Studio Java locations
    if exist "C:\Program Files\Android\Android Studio\jbr" (
        echo Found JBR in Android Studio: C:\Program Files\Android\Android Studio\jbr
        setx JAVA_HOME "C:\Program Files\Android\Android Studio\jbr"
        echo JAVA_HOME has been set. Please restart your terminal.
    ) else if exist "%LOCALAPPDATA%\Android\Sdk\jre" (
        echo Found JRE in Android SDK: %LOCALAPPDATA%\Android\Sdk\jre
        setx JAVA_HOME "%LOCALAPPDATA%\Android\Sdk\jre"
        echo JAVA_HOME has been set. Please restart your terminal.
    ) else (
        echo ERROR: Could not find Java installation!
        echo Please install JDK or set JAVA_HOME manually.
    )
)

echo.
echo [2] Checking Java version...
java -version 2>&1

echo.
echo [3] Checking ANDROID_HOME...
if defined ANDROID_HOME (
    echo ANDROID_HOME is set to: %ANDROID_HOME%
) else (
    echo WARNING: ANDROID_HOME is not set!
    if exist "%LOCALAPPDATA%\Android\Sdk" (
        echo Found Android SDK: %LOCALAPPDATA%\Android\Sdk
        setx ANDROID_HOME "%LOCALAPPDATA%\Android\Sdk"
        echo ANDROID_HOME has been set. Please restart your terminal.
    )
)

echo.
echo ========================================
echo Configuration Check Complete
echo ========================================
pause
