<?php
// Get authentication first
$ch = curl_init('http://127.0.0.1:8000/');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_COOKIEJAR, 'cookies.txt');
curl_setopt($ch, CURLOPT_COOKIEFILE, 'cookies.txt');
curl_exec($ch);
curl_close($ch);

// Login
$ch = curl_init('http://127.0.0.1:8000/login');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
    'email' => 'admin@example.com',
    'password' => 'password'
]));
curl_setopt($ch, CURLOPT_COOKIEJAR, 'cookies.txt');
curl_setopt($ch, CURLOPT_COOKIEFILE, 'cookies.txt');
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
$response = curl_exec($ch);
curl_close($ch);

echo "Login response received. Testing material serve...\n\n";

// Now test material serve
$ch = curl_init('http://127.0.0.1:8000/training/16/material/18/serve');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_BINARYTRANSFER, true);
curl_setopt($ch, CURLOPT_COOKIEFILE, 'cookies.txt');
curl_setopt($ch, CURLOPT_COOKIEJAR, 'cookies.txt');

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$content_type = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
curl_close($ch);

// Split headers and body
list($headers, $body) = explode("\r\n\r\n", $response, 2);

echo "HTTP Status: $http_code\n";
echo "Content-Type: $content_type\n";
echo "Response Headers:\n";
echo $headers . "\n\n";

if ($http_code >= 400) {
    echo "Response Body (error):\n";
    $decoded = json_decode($body, true);
    if ($decoded) {
        echo json_encode($decoded, JSON_PRETTY_PRINT) . "\n";
    } else {
        echo substr($body, 0, 1000) . "\n";
    }
} else if ($http_code == 200) {
    echo "File served successfully!\n";
    echo "Body size: " . strlen($body) . " bytes\n";
    
    // Check if it looks like a video file
    if (strpos($body, 'ftyp') !== false || strpos($body, 'wide') !== false) {
        echo "✓ File content looks like MP4 video\n";
    }
}
