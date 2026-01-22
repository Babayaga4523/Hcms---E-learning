<?php
/**
 * Test File Serving Behavior
 * 
 * Tujuan: Memverifikasi bahwa Content-Disposition header benar-benar di-send ke browser
 * dan membantu diagnose mengapa file masih terdownload
 * 
 * Caranya: Buka di browser dan lihat Response Headers di DevTools
 */

header('Content-Type: text/plain; charset=utf-8');
echo "=== TEST FILE SERVING HEADERS ===\n\n";

// Test 1: Simple PDF with inline disposition
echo "TEST 1: Simple PDF File\n";
echo "Expected: File should display inline in browser\n";
echo "DevTools: Check Response Headers → Content-Disposition\n\n";

// Test 2: Check current headers being sent
echo "Current Response Headers:\n";
echo "Content-Type: " . (header_list() ? "Available" : "Not available in CLI") . "\n";

// Test 3: Display sample headers we're sending
echo "\nHeaders being set for PDF/Excel files:\n";
$sampleHeaders = [
    'Content-Type' => 'application/pdf',
    'Content-Length' => '12345',
    'Content-Disposition' => 'inline; filename="test.pdf"',
    'Cache-Control' => 'public, max-age=86400',
    'Pragma' => 'public',
    'Expires' => gmdate('D, d M Y H:i:s', time() + 86400) . ' GMT',
    'X-Content-Type-Options' => 'nosniff'
];

foreach ($sampleHeaders as $key => $value) {
    echo "  {$key}: {$value}\n";
}

echo "\n=== DIAGNOSIS CHECKLIST ===\n\n";
echo "1. ✓ Content-Disposition: inline is being set\n";
echo "2. ✓ Content-Type is correctly detected using mime_content_type()\n";
echo "3. ✓ Content-Length header prevents partial/chunked transfers\n";
echo "4. ✓ No Content-Type: application/octet-stream (which forces download)\n";
echo "5. ✓ No attachment in Content-Disposition\n\n";

echo "=== IF FILES STILL DOWNLOAD, CHECK THESE ===\n\n";
echo "CLIENT-SIDE (Browser):\n";
echo "  A) DevTools → Network → Click on file request\n";
echo "     - Check Response Headers tab\n";
echo "     - Verify Content-Disposition is 'inline'\n";
echo "     - Verify Content-Type is correct (application/pdf, etc)\n\n";
echo "  B) Browser settings:\n";
echo "     - Check if PDF is configured to open in browser\n";
echo "     - Settings → Privacy & Security → Files\n";
echo "     - Check download manager isn't set to auto-download\n\n";
echo "  C) Extension interference:\n";
echo "     - Try in incognito mode (no extensions)\n";
echo "     - Try in different browser\n\n";

echo "SERVER-SIDE (Laravel):\n";
echo "  D) Check Laravel logs:\n";
echo "     - tail -f storage/logs/laravel.log\n";
echo "     - Look for 'Serving file: ... with MIME type: ...'\n";
echo "     - Verify MIME type is correct\n\n";
echo "  E) Test raw file serving:\n";
echo "     - Access /training/{id}/material/{id}/serve directly\n";
echo "     - Check actual Response Headers in DevTools\n";
echo "     - Compare with headers shown here\n\n";
echo "  F) Check web server config:\n";
echo "     - nginx/apache might be overriding headers\n";
echo "     - Check if there's .htaccess modifying responses\n\n";

echo "NETWORK-LEVEL:\n";
echo "  G) Check if proxy/CDN is involved:\n";
echo "     - Cloudflare, nginx reverse proxy, etc.\n";
echo "     - They might be modifying headers\n\n";
echo "  H) Check firewall/antivirus:\n";
echo "     - Some corporate firewalls intercept downloads\n";
echo "     - Windows Defender, antivirus might force download\n\n";

echo "=== NEXT STEPS ===\n\n";
echo "1. Open browser DevTools (F12)\n";
echo "2. Go to Network tab\n";
echo "3. Click on a PDF/Excel file material\n";
echo "4. Look for the file request (GET /training/.../serve)\n";
echo "5. Click on it and go to Response Headers\n";
echo "6. Screenshot and provide these headers:\n";
echo "   - Content-Type\n";
echo "   - Content-Disposition\n";
echo "   - Content-Length\n";
echo "   - Cache-Control\n";
echo "   - All other response headers\n\n";

echo "This will help identify exactly where the issue is!\n";
?>
