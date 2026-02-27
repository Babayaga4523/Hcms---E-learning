#!/usr/bin/env bash

echo "=========================================="
echo "Dashboard API Manual Test"
echo "=========================================="

# Get any user token for testing - first create a test user if needed
USER_EMAIL="test@example.com"

# Test if server is running
echo "Checking if server is running..."
curl -s http://127.0.0.1:8000 > /dev/null
if [ $? -ne 0 ]; then
    echo "⚠️ Server not responding. Check if 'php artisan serve' is running"
    exit 1
fi

echo "✅ Server is running"
echo ""

# Since we need auth, we'll make a simple test
echo "Testing API endpoint accessibility:"
echo ""

# Just check if routes are registered
echo "1. Checking /api/user/leaderboard/monthly..."
curl -s -X OPTIONS http://127.0.0.1:8000/api/user/leaderboard/monthly -H "Content-Type: application/json" -w "\nHTTP Status: %{http_code}\n" || echo "Route check failed (this is expected without auth)"

echo ""
echo "2. Checking /api/user/dashboard/statistics..."
curl -s -X OPTIONS http://127.0.0.1:8000/api/user/dashboard/statistics -H "Content-Type: application/json" -w "\nHTTP Status: %{http_code}\n" || echo "Route check failed (this is expected without auth)"

echo ""
echo "3. Checking /api/user/dashboard/goals..."
curl -s -X OPTIONS http://127.0.0.1:8000/api/user/dashboard/goals -H "Content-Type: application/json" -w "\nHTTP Status: %{http_code}\n" || echo "Route check failed (this is expected without auth)"

echo ""
echo "=========================================="
echo "Note: Full API testing requires authentication."
echo "Use the Dashboard UI to test with real user session."
echo "================= ========================"
