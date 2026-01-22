#!/bin/bash

# Comprehensive File Serving Diagnostic Script
# Usage: chmod +x diagnose_file_serving.sh && ./diagnose_file_serving.sh

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  HCMS E-Learning File Serving Diagnostic Tool                ║"
echo "║  Purpose: Identify why PDF/Excel files are auto-downloading  ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
PASS=0
FAIL=0

# Helper functions
pass() {
    echo -e "${GREEN}✓ $1${NC}"
    ((PASS++))
}

fail() {
    echo -e "${RED}✗ $1${NC}"
    ((FAIL++))
}

warn() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

echo "═══════════════════════════════════════════════════════════════"
echo "1. CHECKING ENVIRONMENT"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Check PHP
if command -v php &> /dev/null; then
    PHP_VERSION=$(php -v | head -n 1)
    pass "PHP installed: $PHP_VERSION"
else
    fail "PHP not found"
fi

# Check Laravel
if [ -f "artisan" ]; then
    pass "Laravel artisan found"
else
    fail "Laravel artisan not found"
fi

# Check storage directory
if [ -d "storage/logs" ]; then
    pass "Laravel logs directory exists"
else
    fail "Laravel logs directory not found"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "2. CHECKING FILE SERVING IMPLEMENTATION"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Check MaterialController
if grep -q "Content-Disposition.*inline" app/Http/Controllers/User/MaterialController.php; then
    pass "MaterialController has 'Content-Disposition: inline' header"
else
    fail "MaterialController missing 'inline' disposition"
fi

# Check mime_content_type usage
if grep -q "mime_content_type" app/Http/Controllers/User/MaterialController.php; then
    pass "MaterialController uses mime_content_type()"
else
    fail "MaterialController not using mime_content_type()"
fi

# Check response()->stream() for PDF
if grep -q "response()->stream" app/Http/Controllers/User/MaterialController.php; then
    pass "MaterialController uses response()->stream() for files"
else
    fail "MaterialController not using response()->stream()"
fi

# Check ExcelToPdfService
if [ -f "app/Services/ExcelToPdfService.php" ]; then
    pass "ExcelToPdfService exists"
    
    if grep -q "class ExcelToPdfService" app/Services/ExcelToPdfService.php; then
        pass "ExcelToPdfService class definition found"
    else
        fail "ExcelToPdfService class not properly defined"
    fi
else
    fail "ExcelToPdfService file not found"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "3. CHECKING FRONTEND IMPLEMENTATION"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Check MaterialViewer
if [ -f "resources/js/Pages/User/Material/MaterialViewer.jsx" ]; then
    pass "MaterialViewer component exists"
    
    # Check PDFViewer
    if grep -q "const PDFViewer" resources/js/Pages/User/Material/MaterialViewer.jsx; then
        pass "PDFViewer component found"
    else
        fail "PDFViewer component not found"
    fi
    
    # Check ExcelViewer
    if grep -q "const ExcelViewer" resources/js/Pages/User/Material/MaterialViewer.jsx; then
        pass "ExcelViewer component found"
    else
        fail "ExcelViewer component not found"
    fi
    
    # Check PowerPointViewer
    if grep -q "const PowerPointViewer" resources/js/Pages/User/Material/MaterialViewer.jsx; then
        pass "PowerPointViewer component found"
    else
        fail "PowerPointViewer component not found"
    fi
    
    # Check file type detection
    if grep -q "isPdfFile\|isExcelFile\|isPowerpointFile" resources/js/Pages/User/Material/MaterialViewer.jsx; then
        pass "File type detection logic found"
    else
        fail "File type detection logic not found"
    fi
else
    fail "MaterialViewer component not found"
fi

# Check if build exists
if [ -f "public/build/assets/MaterialViewer-"*.js ]; then
    pass "MaterialViewer build artifact exists"
else
    fail "MaterialViewer build artifact not found - need to run: npm run build"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "4. CHECKING STORAGE STRUCTURE"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Check public disk
if [ -d "storage/app/public" ]; then
    pass "storage/app/public directory exists"
else
    fail "storage/app/public directory not found"
fi

# Check training materials
if [ -d "storage/app/public/training-materials" ]; then
    pass "training-materials directory exists"
    
    if [ -d "storage/app/public/training-materials/pdf" ]; then
        PDFCOUNT=$(find storage/app/public/training-materials/pdf -type f -name "*.pdf" 2>/dev/null | wc -l)
        info "Found $PDFCOUNT PDF files in conversion directory"
    else
        warn "pdf subdirectory not found - will be created on first conversion"
    fi
else
    fail "training-materials directory not found"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "5. CHECKING CONFIGURATION FILES"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Check .htaccess
if [ -f "public/.htaccess" ]; then
    info "public/.htaccess found - checking for problematic rules..."
    
    if grep -q "attachment" public/.htaccess 2>/dev/null; then
        fail "public/.htaccess contains 'attachment' rule - may force download"
    else
        pass "public/.htaccess doesn't contain 'attachment'"
    fi
    
    if grep -i "disposition" public/.htaccess 2>/dev/null; then
        fail "public/.htaccess modifies Content-Disposition header"
    else
        pass "public/.htaccess doesn't modify Content-Disposition"
    fi
else
    info "public/.htaccess not found (using nginx or no rewrite rules)"
fi

# Check nginx config (if exists)
if command -v nginx &> /dev/null; then
    info "nginx detected - checking configuration..."
    
    if grep -r "Content-Disposition\|attachment" /etc/nginx/ 2>/dev/null | grep -q "attachment"; then
        fail "nginx config contains problematic Content-Disposition rules"
    else
        pass "nginx config doesn't override Content-Disposition"
    fi
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "6. CHECKING LOGS"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Check Laravel log
if [ -f "storage/logs/laravel.log" ]; then
    pass "laravel.log exists"
    
    # Check for recent file serving logs
    if grep -q "Serving file:" storage/logs/laravel.log; then
        RECENT=$(grep "Serving file:" storage/logs/laravel.log | tail -1)
        info "Recent log: $RECENT"
    else
        warn "No 'Serving file:' logs found - materials haven't been served yet"
    fi
    
    # Check for errors
    if grep -i "error\|exception" storage/logs/laravel.log | tail -5 &>/dev/null; then
        LASTLINE=$(grep -i "error\|exception" storage/logs/laravel.log | tail -1)
        warn "Recent error: $LASTLINE"
    fi
else
    fail "laravel.log not found"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "7. TEST RESULTS SUMMARY"
echo "═══════════════════════════════════════════════════════════════"
echo ""

TOTAL=$((PASS + FAIL))
echo -e "Tests Passed: ${GREEN}$PASS${NC}"
echo -e "Tests Failed: ${RED}$FAIL${NC}"
echo -e "Total Tests:  $TOTAL"
echo ""

if [ $FAIL -eq 0 ]; then
    pass "All implementation checks passed!"
    echo ""
    echo "✅ Backend and Frontend Implementation: READY"
    echo "❓ User-Facing Behavior: REQUIRES BROWSER TESTING"
    echo ""
    echo "Next Steps:"
    echo "  1. Open browser DevTools (F12)"
    echo "  2. Go to Network tab"
    echo "  3. Click on a PDF/Excel material in MaterialViewer"
    echo "  4. Find GET request to /training/.../material/.../serve"
    echo "  5. Check Response Headers for:"
    echo "     - Content-Type: application/pdf (or correct type)"
    echo "     - Content-Disposition: inline; filename=..."
    echo ""
    echo "If headers are correct but file still downloads:"
    echo "  → Issue is CLIENT-SIDE (browser settings, extensions, antivirus)"
    echo ""
    echo "If headers are WRONG (attachment or octet-stream):"
    echo "  → Issue is SERVER-SIDE (.htaccess, nginx, middleware)"
else
    fail "Some checks failed - review implementation"
    echo ""
    echo "Failed items above need to be fixed."
    echo "Review FILE_SERVING_SOLUTION_FINAL.md for details."
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Additional info
echo "📄 Documentation Files:"
echo "  • FILE_SERVING_SOLUTION_FINAL.md - Complete implementation"
echo "  • TROUBLESHOOTING_GUIDE.md - Diagnostic steps"
echo "  • COMPLETE_IMPLEMENTATION_STATUS.md - Full reference"
echo "  • EXCEL_TO_PDF_IMPLEMENTATION.md - Conversion details"
echo ""

echo "🔍 Quick Diagnostic Commands:"
echo ""
echo "  Check PHP mime_content_type():"
echo "    php -r \"echo mime_content_type('test.pdf');\""
echo ""
echo "  View recent logs:"
echo "    tail -50 storage/logs/laravel.log"
echo ""
echo "  Check file serving headers:"
echo "    curl -I http://localhost/training/1/material/1/serve"
echo ""
echo "  Test ExcelToPdfService:"
echo "    php test_excel_to_pdf_conversion.php"
echo ""

exit $FAIL
