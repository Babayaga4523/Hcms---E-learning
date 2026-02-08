<?php
$host = 'localhost';
$db = 'hcms_elearning';
$user = 'root';
$pass = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass);
    
    echo "Users enrolled in Training/Module 16:\n";
    $stmt = $pdo->query("
        SELECT u.id, u.email, u.name, ut.status
        FROM user_trainings ut
        JOIN users u ON u.id = ut.user_id
        WHERE ut.module_id = 16
    ");
    $enrollments = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "Found " . count($enrollments) . " enrollments\n";
    
    foreach ($enrollments as $e) {
        echo "- User ID {$e['id']}: {$e['email']} ({$e['name']}) - Status: {$e['status']}\n";
    }
    
    if (empty($enrollments)) {
        echo "\nNo users enrolled. Checking admin user...\n";
        
        $stmt = $pdo->query("SELECT id, email, name FROM users WHERE email LIKE '%admin%' LIMIT 1");
        $admin = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($admin) {
            echo "Found admin user: ID {$admin['id']}, Email: {$admin['email']}\n";
            
            echo "\nEnrolling admin in training 16...\n";
            $pdo->query("
                INSERT IGNORE INTO user_trainings (user_id, module_id, status)
                VALUES ({$admin['id']}, 16, 'assigned')
            ");
            echo "Done.\n";
        }
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
