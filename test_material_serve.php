<?php
// Test material serve endpoint
$ch = curl_init('http://127.0.0.1:8000/training/16/material/18/serve');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_COOKIE, 'XSRF-TOKEN=; laravel_session=');

// Add authentication headers (if using sessions)
curl_setopt($ch, CURLOPT_COOKIEFILE, 'cookies.txt');
curl_setopt($ch, CURLOPT_COOKIEJAR, 'cookies.txt');

$response = curl_exec($ch);
$info = curl_getinfo($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$content_type = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);

curl_close($ch);

echo "HTTP Status: $http_code\n";
echo "Content-Type: $content_type\n";
echo "Response Headers:\n";

// Extract headers
list($headers, $body) = explode("\r\n\r\n", $response, 2);
echo $headers . "\n\n";

// If error, show body
if ($http_code >= 400) {
    echo "Response Body:\n";
    echo substr($body, 0, 500) . "\n";
}

// Try to find the file directly
$filePath = 'C:\\Users\\Yoga Krisna\\hcms-elearning\\storage\\app\\public\\materials\\1770192915_silva_2.mp4';
echo "\n\nDirect file check:\n";
echo "File exists: " . (file_exists($filePath) ? 'YES' : 'NO') . "\n";
echo "File size: " . (file_exists($filePath) ? filesize($filePath) : 'N/A') . " bytes\n";
