#!/bin/bash

# File: setup-learner-analytics.sh
# Script untuk setup Learner Performance & Analytics features

set -e

echo "🚀 Setting up Learner Performance & Analytics..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check if files exist
echo -e "${BLUE}[1/6]${NC} Checking if all files are created..."
files=(
    "resources/js/Pages/Learner/LearnerPerformance.jsx"
    "resources/js/Pages/Learner/LearnerProgressDetail.jsx"
    "app/Http/Controllers/Learner/LearnerPerformanceController.php"
    "app/Http/Controllers/Learner/LearnerProgressController.php"
    "app/Traits/LearningAnalyticsTrait.php"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
    else
        echo -e "${YELLOW}✗${NC} $file (not found)"
    fi
done

echo ""

# Step 2: Clear caches
echo -e "${BLUE}[2/6]${NC} Clearing caches..."
php artisan config:clear
php artisan route:clear
php artisan cache:clear
echo -e "${GREEN}✓${NC} Caches cleared"

echo ""

# Step 3: Recache routes
echo -e "${BLUE}[3/6]${NC} Re-caching routes..."
php artisan route:cache
echo -e "${GREEN}✓${NC} Routes cached"

echo ""

# Step 4: Install npm dependencies (if needed)
echo -e "${BLUE}[4/6]${NC} Checking npm dependencies..."
if ! npm ls recharts &> /dev/null; then
    echo -e "${YELLOW}Installing recharts...${NC}"
    npm install recharts
    echo -e "${GREEN}✓${NC} Recharts installed"
else
    echo -e "${GREEN}✓${NC} Recharts already installed"
fi

echo ""

# Step 5: Build assets
echo -e "${BLUE}[5/6]${NC} Building assets..."
npm run dev
echo -e "${GREEN}✓${NC} Assets built"

echo ""

# Step 6: Database check
echo -e "${BLUE}[6/6]${NC} Checking database tables..."
php artisan tinker --execute="
    echo 'Checking required tables...' . PHP_EOL;
    \$tables = [
        'users' => 'users table',
        'user_trainings' => 'user_trainings table',
        'module_progress' => 'module_progress table',
        'modules' => 'modules table',
    ];
    
    foreach (\$tables as \$table => \$label) {
        \$exists = \Illuminate\Support\Facades\Schema::hasTable(\$table);
        echo (\$exists ? '✓ ' : '✗ ') . \$label . PHP_EOL;
    }
"

echo ""
echo -e "${GREEN}✓ Setup complete!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Login to your application: http://localhost:8000"
echo "2. Navigate to Learner Performance: http://localhost:8000/learner/performance"
echo "3. Check Progress Detail: http://localhost:8000/learner/progress-detail"
echo ""
echo -e "${YELLOW}Troubleshooting:${NC}"
echo "- Check browser console for JavaScript errors"
echo "- Verify API endpoints are working: validateLearnerAnalytics()"
echo "- Check Laravel logs: tail -f storage/logs/laravel.log"
echo ""
