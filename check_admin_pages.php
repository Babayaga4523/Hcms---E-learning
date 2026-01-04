<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\File;

echo "\n=== COMPREHENSIVE ADMIN PAGES ANALYSIS ===\n\n";

// 1. List all Admin JSX pages
$adminPagesPath = resource_path('js/Pages/Admin');
$pages = File::files($adminPagesPath);

echo "📄 ADMIN PAGES FOUND: " . count($pages) . "\n";
echo str_repeat("=", 80) . "\n\n";

$pageAnalysis = [];

foreach ($pages as $page) {
    $filename = $page->getFilename();
    if (pathinfo($filename, PATHINFO_EXTENSION) !== 'jsx') continue;
    
    $pageName = pathinfo($filename, PATHINFO_FILENAME);
    $content = file_get_contents($page->getPathname());
    
    // Extract imports
    preg_match_all('/import\s+.*?\s+from\s+[\'"](.+?)[\'"]/', $content, $imports);
    
    // Extract axios calls (API endpoints)
    preg_match_all('/axios\.(get|post|put|delete)\([\'"](.+?)[\'"]/', $content, $apiCalls);
    
    // Extract Inertia.visit or Inertia.get/post
    preg_match_all('/Inertia\.(visit|get|post)\([\'"](.+?)[\'"]/', $content, $inertiaLinks);
    
    // Extract Link href
    preg_match_all('/<Link\s+href=[\'"](.+?)[\'"]/', $content, $linkHrefs);
    
    // Extract route() helper
    preg_match_all('/route\([\'"](.+?)[\'"]/', $content, $routeHelpers);
    
    $pageAnalysis[$pageName] = [
        'filename' => $filename,
        'imports' => array_unique($imports[1] ?? []),
        'api_endpoints' => array_unique($apiCalls[2] ?? []),
        'inertia_links' => array_unique($inertiaLinks[2] ?? []),
        'link_hrefs' => array_unique($linkHrefs[1] ?? []),
        'route_helpers' => array_unique($routeHelpers[1] ?? []),
        'size' => $page->getSize(),
        'lines' => substr_count($content, "\n") + 1
    ];
}

// 2. Get all registered routes
$routes = Route::getRoutes();
$adminRoutes = [];

foreach ($routes as $route) {
    $uri = $route->uri();
    if (str_starts_with($uri, 'admin/') || str_starts_with($uri, 'api/admin/')) {
        $adminRoutes[] = [
            'uri' => $uri,
            'name' => $route->getName(),
            'methods' => implode('|', $route->methods()),
            'action' => $route->getActionName()
        ];
    }
}

echo "🔗 REGISTERED ADMIN ROUTES: " . count($adminRoutes) . "\n\n";

// 3. Analyze each page
foreach ($pageAnalysis as $pageName => $analysis) {
    echo "📄 {$pageName}.jsx\n";
    echo "   Size: " . number_format($analysis['size']) . " bytes | Lines: {$analysis['lines']}\n";
    
    // API Endpoints
    if (!empty($analysis['api_endpoints'])) {
        echo "   \n   🔌 API Endpoints Used:\n";
        foreach ($analysis['api_endpoints'] as $endpoint) {
            $found = false;
            foreach ($adminRoutes as $route) {
                if ($route['uri'] === ltrim($endpoint, '/')) {
                    $found = true;
                    break;
                }
            }
            $status = $found ? "✅" : "❌";
            echo "      {$status} {$endpoint}\n";
        }
    }
    
    // Route helpers
    if (!empty($analysis['route_helpers'])) {
        echo "   \n   🛣️  Route Helpers:\n";
        foreach ($analysis['route_helpers'] as $routeName) {
            $found = false;
            foreach ($adminRoutes as $route) {
                if ($route['name'] === $routeName) {
                    $found = true;
                    break;
                }
            }
            $status = $found ? "✅" : "❌";
            echo "      {$status} route('{$routeName}')\n";
        }
    }
    
    // Links to other pages
    if (!empty($analysis['inertia_links']) || !empty($analysis['link_hrefs'])) {
        echo "   \n   🔗 Navigation Links:\n";
        $allLinks = array_merge($analysis['inertia_links'], $analysis['link_hrefs']);
        foreach (array_unique($allLinks) as $link) {
            echo "      → {$link}\n";
        }
    }
    
    echo "\n" . str_repeat("-", 80) . "\n\n";
}

// 4. Check for missing routes
echo "\n=== MISSING ROUTES ANALYSIS ===\n\n";

$allUsedEndpoints = [];
foreach ($pageAnalysis as $pageName => $analysis) {
    foreach ($analysis['api_endpoints'] as $endpoint) {
        $allUsedEndpoints[] = ltrim($endpoint, '/');
    }
}
$allUsedEndpoints = array_unique($allUsedEndpoints);

$missingRoutes = [];
foreach ($allUsedEndpoints as $endpoint) {
    $found = false;
    foreach ($adminRoutes as $route) {
        if ($route['uri'] === $endpoint) {
            $found = true;
            break;
        }
    }
    if (!$found) {
        $missingRoutes[] = $endpoint;
    }
}

if (!empty($missingRoutes)) {
    echo "❌ MISSING ROUTES (" . count($missingRoutes) . "):\n";
    foreach ($missingRoutes as $route) {
        echo "   - {$route}\n";
    }
} else {
    echo "✅ All API endpoints have corresponding routes!\n";
}

// 5. Page interconnections
echo "\n\n=== PAGE INTERCONNECTIONS ===\n\n";

$connections = [];
foreach ($pageAnalysis as $pageName => $analysis) {
    $connections[$pageName] = [];
    
    foreach ($analysis['inertia_links'] as $link) {
        // Extract page name from Inertia route
        if (preg_match('/admin\/(.+?)(?:\/|$)/', $link, $matches)) {
            $targetPage = ucfirst(str_replace('-', '', $matches[1]));
            if (isset($pageAnalysis[$targetPage])) {
                $connections[$pageName][] = $targetPage;
            }
        }
    }
    
    foreach ($analysis['link_hrefs'] as $link) {
        if (preg_match('/admin\/(.+?)(?:\/|$)/', $link, $matches)) {
            $targetPage = ucfirst(str_replace('-', '', $matches[1]));
            if (isset($pageAnalysis[$targetPage])) {
                $connections[$pageName][] = $targetPage;
            }
        }
    }
}

foreach ($connections as $fromPage => $toPages) {
    if (!empty($toPages)) {
        echo "📄 {$fromPage} → " . implode(', ', array_unique($toPages)) . "\n";
    }
}

// 6. Isolated pages (no incoming/outgoing connections)
echo "\n\n=== ISOLATED PAGES (No Clear Navigation Links) ===\n\n";

$isolatedPages = [];
foreach ($pageAnalysis as $pageName => $analysis) {
    $hasOutgoing = !empty($connections[$pageName]);
    
    $hasIncoming = false;
    foreach ($connections as $from => $toPages) {
        if (in_array($pageName, $toPages)) {
            $hasIncoming = true;
            break;
        }
    }
    
    if (!$hasOutgoing && !$hasIncoming) {
        $isolatedPages[] = $pageName;
    }
}

if (!empty($isolatedPages)) {
    echo "⚠️  Pages without clear navigation connections:\n";
    foreach ($isolatedPages as $page) {
        echo "   - {$page}.jsx\n";
    }
    echo "\n   ℹ️  These pages might be accessed via:\n";
    echo "      - Direct URL typing\n";
    echo "      - External links\n";
    echo "      - Custom navigation components\n";
} else {
    echo "✅ All pages have navigation connections!\n";
}

// 7. Common layouts check
echo "\n\n=== LAYOUT USAGE ===\n\n";

$layoutUsage = [];
foreach ($pageAnalysis as $pageName => $analysis) {
    foreach ($analysis['imports'] as $import) {
        if (str_contains($import, 'Layout')) {
            $layoutName = basename($import, '.jsx');
            if (!isset($layoutUsage[$layoutName])) {
                $layoutUsage[$layoutName] = [];
            }
            $layoutUsage[$layoutName][] = $pageName;
        }
    }
}

foreach ($layoutUsage as $layout => $pages) {
    echo "🎨 {$layout} (" . count($pages) . " pages):\n";
    foreach ($pages as $page) {
        echo "   - {$page}.jsx\n";
    }
    echo "\n";
}

// 8. Summary
echo "\n=== SUMMARY ===\n\n";
echo "Total Admin Pages: " . count($pageAnalysis) . "\n";
echo "Total Admin Routes: " . count($adminRoutes) . "\n";
echo "Missing Routes: " . count($missingRoutes) . "\n";
echo "Isolated Pages: " . count($isolatedPages) . "\n";
echo "Page Connections: " . count(array_filter($connections, fn($c) => !empty($c))) . " pages with outgoing links\n";

echo "\n";
if (count($missingRoutes) > 0) {
    echo "⚠️  ACTION REQUIRED: Fix missing routes\n";
}
if (count($isolatedPages) > 5) {
    echo "⚠️  WARNING: Many isolated pages detected\n";
}
if (count($missingRoutes) === 0 && count($isolatedPages) < 5) {
    echo "✅ Overall structure looks good!\n";
}

echo "\n";
