<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Simulate a GET request to the route
$routeCollection = app('router')->getRoutes();

foreach ($routeCollection as $route) {
    if (strpos($route->uri, 'question-management') !== false) {
        echo "Route: " . $route->uri . " => Methods: " . implode(', ', $route->methods) . "\n";
    }
}
