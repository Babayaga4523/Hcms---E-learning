<?php

// Simple script to test the debug endpoint
$url = 'http://127.0.0.1:8000/admin/debug-top-performers';

// Perform HTTP GET using file_get_contents (avoids cURL deprecation warning)
$opts = [
    'http' => [
        'method' => 'GET',
        'header' => "Accept: application/json\r\nContent-Type: application/json\r\n",
        'timeout' => 10,
    ],
];
$context = stream_context_create($opts);

$response = @file_get_contents($url, false, $context);
$httpCode = null;
if (isset($http_response_header) && preg_match('#HTTP/\d\.\d\s+(\d+)#', $http_response_header[0], $m)) {
    $httpCode = (int)$m[1];
}

// Fallback to cURL if file_get_contents failed and cURL is available
if ($response === false) {
    if (function_exists('curl_init')) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Accept: application/json',
            'Content-Type: application/json',
        ]);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE) ?: $httpCode;
        // intentionally not calling curl_close() to avoid deprecation warnings; PHP will clean up the handle at script end.
    } else {
        echo "HTTP request failed and cURL not available.\n";
        exit(1);
    }
}

if ($httpCode === null) {
    // If we still don't have an HTTP code, treat as failure
    echo "No HTTP response received.\n";
    exit(1);
}

// Handle successful response
if ($httpCode === 200) {
    $data = json_decode($response, true);
    echo "Top Performers Count: " . $data['count'] . "\n\n";

    foreach ($data['top_performers'] as $i => $performer) {
        echo ($i + 1) . ". {$performer['name']}\n";
        echo "   NIP: " . ($performer['nip'] ?? 'NULL') . "\n";
        echo "   Department: " . ($performer['department'] ?? 'NULL') . "\n";
        echo "   Location: " . ($performer['location'] ?? 'NULL') . "\n";
        echo "   Points: {$performer['total_points']}\n";
        echo "   Completed Trainings: {$performer['completed_trainings']}\n";
        echo "   Certifications: {$performer['certifications']}\n\n";
    }
} else {
    echo "Response: $response\n";
}