<?php
/**
 * AUTOMATED AUTHORIZATION GATE FIXER
 * 
 * Purpose: Automatically adds $this->authorize() calls to controller methods
 * Usage: php fix-authorization-gates.php
 * 
 * This script identifies Laravel controller methods that are missing authorization
 * checks and inserts appropriate $this->authorize() statements
 */

class AuthorizationGateFixer {
    private $controllersPath = __DIR__ . '/../../app/Http/Controllers/Admin';
    private $methodPatterns = [
        'public function index' => 'view',
        'public function show' => 'view',
        'public function create' => 'create',
        'public function store' => 'create',
        'public function edit' => 'update',
        'public function update' => 'update',
        'public function destroy' => 'delete',
        'public function delete' => 'delete',
        'public function getRoles' => 'view-roles',
        'public function getPermissions' => 'view-permissions',
        'public function getMetrics' => 'view-dashboard',
        'public function saveSettings' => 'manage-settings',
        'public function createBackup' => 'manage-system',
        'public function bulkDelete' => 'delete',
        'public function bulkUpdate' => 'update',
    ];

    private $controllerGates = [
        'UserController' => 'manage-users',
        'DashboardMetricsController' => 'view-dashboard',
        'AdminAnalyticsController' => 'view-analytics',
        'SettingsController' => 'manage-settings',
        'ComplianceController' => 'manage-compliance',
        'ReportController' => 'view-reports',
        'SystemSettingsController' => 'manage-system',
        'PreTestPostTestController' => 'manage-tests',
        'TrainingScheduleController' => 'manage-schedules',
        'NotificationController' => 'manage-notifications',
        'AnnouncementController' => 'manage-announcements',
        'EmailConfigurationController' => 'manage-email-config',
        'NotificationPreferencesController' => 'manage-notification-prefs',
        'ReminderController' => 'manage-reminders',
        'ContentIngestionController' => 'manage-content',
        'SmartContentController' => 'manage-smart-content',
        'CommandController' => 'execute-commands',
        'QuizGeneratorController' => 'manage-quizzes',
        'ReportingAnalyticsController' => 'view-detailed-reports',
        'AnalyticsController' => 'view-analytics',
    ];

    public function run() {
        echo "🔐 Authorization Gate Fixer - Starting...\n";
        echo "📁 Target: {$this->controllersPath}\n\n";

        $files = array_diff(scandir($this->controllersPath), ['.', '..']);
        $fixedCount = 0;
        $totalFiles = 0;

        foreach ($files as $file) {
            if (pathinfo($file, PATHINFO_EXTENSION) !== 'php') {
                continue;
            }

            $totalFiles++;
            $filePath = "{$this->controllersPath}/{$file}";
            $fixed = $this->fixFile($filePath);

            if ($fixed > 0) {
                $fixedCount += $fixed;
                echo "✅ {$file}: Added {$fixed} authorization check(s)\n";
            } else {
                echo "⏭️  {$file}: No changes needed\n";
            }
        }

        echo "\n📊 Summary: Fixed {$fixedCount} methods across {$totalFiles} files\n";
        echo "✨ Authorization gates implementation complete!\n";
    }

    private function fixFile($filePath) {
        $content = file_get_contents($filePath);
        $originalContent = $content;
        $fixedCount = 0;

        // Get controller name
        preg_match('/class\s+(\w+)\s+extends/', $content, $matches);
        $controllerName = $matches[1] ?? null;

        if (!$controllerName) {
            return 0;
        }

        $defaultGate = $this->controllerGates[$controllerName] ?? null;

        foreach ($this->methodPatterns as $methodSignature => $gateType) {
            $pattern = '/(' . preg_quote($methodSignature) . '\s*\([^)]*\)\s*\{)/';
            
            if (preg_match($pattern, $content, $matches, PREG_OFFSET_CAPTURE)) {
                // Check if authorization already exists after this method
                $afterMethod = substr($content, $matches[0][1] + strlen($matches[0][0]), 300);
                
                if (!preg_match('/\$this->authorize\(|Gate::authorize\(|abort\s*\(401|abort\s*\(403/', $afterMethod)) {
                    $gate = $gateType !== 'view' ? $gateType : ($defaultGate ?? 'view-dashboard');
                    
                    $replacement = $matches[1][0] . "\n        \$this->authorize('{$gate}');";
                    $content = substr_replace(
                        $content,
                        $replacement,
                        $matches[0][1],
                        strlen($matches[0][0])
                    );
                    
                    $fixedCount++;
                }
            }
        }

        // Write back if changed
        if ($content !== $originalContent) {
            file_put_contents($filePath, $content);
        }

        return $fixedCount;
    }
}

// Run the fixer
$fixer = new AuthorizationGateFixer();
$fixer->run();
