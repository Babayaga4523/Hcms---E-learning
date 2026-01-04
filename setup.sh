#!/bin/bash

# ============================================
# HCMS E-Learning System - Quick Start Script
# ============================================

echo ""
echo "========================================"
echo "  HCMS E-Learning - Setup & Run"
echo "========================================"
echo ""

# Check if composer is installed
if ! command -v composer &> /dev/null; then
    echo "❌ Composer tidak terinstall. Download dari https://getcomposer.org"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ Node.js tidak terinstall. Download dari https://nodejs.org"
    exit 1
fi

echo "✅ Composer dan Node.js terdeteksi"

echo ""
echo "Step 1: Install PHP Dependencies..."
composer install
if [ $? -ne 0 ]; then
    echo "❌ Gagal install composer packages"
    exit 1
fi
echo "✅ PHP Dependencies installed"

echo ""
echo "Step 2: Setup .env file..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ .env file created. PLEASE EDIT UNTUK DATABASE CONFIG!"
    read -p "Press enter to continue..."
fi

echo ""
echo "Step 3: Generate APP_KEY..."
php artisan key:generate
echo "✅ APP_KEY generated"

echo ""
echo "Step 4: Install Node Dependencies..."
npm install --legacy-peer-deps
if [ $? -ne 0 ]; then
    echo "❌ Gagal install npm packages"
    exit 1
fi
echo "✅ Node Dependencies installed"

echo ""
echo "Step 5: Run Database Migrations..."
echo "⚠️  Make sure MySQL is running!"
php artisan migrate --force
if [ $? -ne 0 ]; then
    echo "❌ Migration failed. Check your .env database config"
    exit 1
fi
echo "✅ Database migrations completed"

echo ""
echo "Step 6: Seed Dummy Data..."
php artisan db:seed --class=DashboardSeeder
if [ $? -ne 0 ]; then
    echo "❌ Seeding failed"
    exit 1
fi
echo "✅ Dummy data seeded"

echo ""
echo "========================================"
echo "   Setup Complete! 🎉"
echo "========================================"
echo ""
echo "📝 Test Users Created:"
echo "   Email: budi.santoso@bni.co.id"
echo "   Password: password123"
echo ""
echo "🚀 Starting Development Servers..."
echo ""
echo "IMPORTANT: Keep both terminal windows open!"
echo ""
echo "1️⃣  Laravel Server (http://localhost:8000)"
echo "2️⃣  Vite Dev Server (http://localhost:5173)"
echo ""
read -p "Press enter to start servers..."

echo ""
echo "Starting servers in separate windows..."
echo ""

# Start servers in background
php artisan serve &
npm run dev &

echo ""
echo "✅ Servers started! Open http://localhost:8000 in your browser"
echo ""
echo "Press Ctrl+C to stop servers"
echo ""

wait
