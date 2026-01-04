@echo off
REM ============================================
REM HCMS E-Learning System - Quick Start Script
REM ============================================

echo.
echo ========================================
echo   HCMS E-Learning - Setup & Run
echo ========================================
echo.

REM Check if composer is installed
composer --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Composer tidak terinstall. Download dari https://getcomposer.org
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js tidak terinstall. Download dari https://nodejs.org
    pause
    exit /b 1
)

echo ✅ Composer dan Node.js terdeteksi

echo.
echo Step 1: Install PHP Dependencies...
composer install
if errorlevel 1 (
    echo ❌ Gagal install composer packages
    pause
    exit /b 1
)
echo ✅ PHP Dependencies installed

echo.
echo Step 2: Setup .env file...
if not exist .env (
    copy .env.example .env
    echo ✅ .env file created. PLEASE EDIT UNTUK DATABASE CONFIG!
    pause
)

echo.
echo Step 3: Generate APP_KEY...
php artisan key:generate
echo ✅ APP_KEY generated

echo.
echo Step 4: Install Node Dependencies...
npm install --legacy-peer-deps
if errorlevel 1 (
    echo ❌ Gagal install npm packages
    pause
    exit /b 1
)
echo ✅ Node Dependencies installed

echo.
echo Step 5: Run Database Migrations...
echo ⚠️  Make sure MySQL is running!
php artisan migrate --force
if errorlevel 1 (
    echo ❌ Migration failed. Check your .env database config
    pause
    exit /b 1
)
echo ✅ Database migrations completed

echo.
echo Step 6: Seed Dummy Data...
php artisan db:seed --class=DashboardSeeder
if errorlevel 1 (
    echo ❌ Seeding failed
    pause
    exit /b 1
)
echo ✅ Dummy data seeded

echo.
echo ========================================
echo   Setup Complete! 🎉
echo ========================================
echo.
echo 📝 Test Users Created:
echo   Email: budi.santoso@bni.co.id
echo   Password: password123
echo.
echo 🚀 Starting Development Servers...
echo.
echo IMPORTANT: Keep both terminal windows open!
echo.
echo 1️⃣  Laravel Server (http://localhost:8000)
echo 2️⃣  Vite Dev Server (http://localhost:5173)
echo.
pause

REM Create two terminal windows for running servers
start cmd /k "php artisan serve"
start cmd /k "npm run dev"

echo.
echo ✅ Servers started! Open http://localhost:8000 in your browser
echo.
pause
