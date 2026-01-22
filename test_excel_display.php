<?php
/**
 * Test file untuk memverifikasi bahwa Excel/PPT tidak auto-download
 * dan ditampilkan di MaterialViewer dengan proper headers
 */

$baseUrl = 'http://127.0.0.1:8000';

// Test 1: Check Excel file serving endpoint
echo "=== Test 1: Excel File Serving Headers ===\n";
$excelUrl = $baseUrl . '/training/71/material/72/serve';

$ch = curl_init($excelUrl);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HEADER => true,
    CURLOPT_NOBODY => true,
    CURLOPT_TIMEOUT => 10,
    CURLOPT_FOLLOWLOCATION => false,
    CURLOPT_COOKIE => 'XSRF-TOKEN=abc; laravel_session=xyz' // Dummy cookies for testing
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

echo "Status Code: $httpCode\n";

// Parse headers
$headerLines = explode("\r\n", $response);
foreach ($headerLines as $line) {
    if (stripos($line, 'Content-Disposition') !== false) {
        echo "✓ " . $line . "\n";
        // Check if it's 'inline' not 'attachment'
        if (stripos($line, 'inline') !== false) {
            echo "  ✓ GOOD: File will display inline (not auto-download)\n";
        } else if (stripos($line, 'attachment') !== false) {
            echo "  ✗ PROBLEM: File will auto-download\n";
        }
    }
    if (stripos($line, 'Content-Type') !== false) {
        echo "✓ " . $line . "\n";
    }
}

// curl_close() is deprecated in PHP 8.0+
// Handle is automatically closed when out of scope

echo "\n=== Explanation ===\n";
echo "Content-Disposition: inline   → File displays in browser\n";
echo "Content-Disposition: attachment → File auto-downloads\n";
echo "\nYour frontend (ExcelViewer) will:\n";
echo "1. Fetch file with credentials: include\n";
echo "2. Parse with SheetJS library\n";
echo "3. Display as interactive table\n";
echo "4. Provide optional download button\n";
