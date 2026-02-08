@echo off
REM Storage Link Fixer for Windows
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║     STORAGE SYMLINK FIXER - WINDOWS                       ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

set CURRENT_DIR=%cd%
set PUBLIC_STORAGE=%CURRENT_DIR%\public\storage
set STORAGE_APP_PUBLIC=%CURRENT_DIR%\storage\app\public

echo Checking current symlink:
echo %PUBLIC_STORAGE%
echo.

if exist "%PUBLIC_STORAGE%" (
    echo Existing link found, checking if it's valid...
    if not exist "%PUBLIC_STORAGE%\questions" (
        echo ❌ Symlink is broken or points to wrong location
        echo Removing broken link...
        rmdir "%PUBLIC_STORAGE%"
        if %ERRORLEVEL% EQU 0 (
            echo ✅ Removed broken link
        ) else (
            echo ❌ Failed to remove link (may need admin privileges)
            exit /b 1
        )
    ) else (
        echo ✅ Symlink appears valid
        echo.
        echo Checking if files are accessible:
        dir "%PUBLIC_STORAGE%\questions" /b
        if %ERRORLEVEL% EQU 0 (
            echo ✅ Files are accessible
        ) else (
            echo ❌ Files not accessible
        )
        exit /b 0
    )
) else (
    echo ⚠️  No symlink found
)

echo.
echo Creating new symlink:
echo From: %PUBLIC_STORAGE%
echo To:   %STORAGE_APP_PUBLIC%
echo.

mkdir "%STORAGE_APP_PUBLIC%" 2>nul
mklink /J "%PUBLIC_STORAGE%" "%STORAGE_APP_PUBLIC%"

if %ERRORLEVEL% EQU 0 (
    echo ✅ Symlink created successfully
    echo.
    echo Verifying:
    dir "%PUBLIC_STORAGE%\questions" /b
    echo.
    echo ✅ Setup complete!
) else (
    echo ❌ Failed to create symlink
    echo Note: May require administrator privileges
    echo To fix manually, run Command Prompt as Administrator:
    echo mklink /J "%PUBLIC_STORAGE%" "%STORAGE_APP_PUBLIC%"
    exit /b 1
)
