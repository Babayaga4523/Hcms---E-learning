<?php
// Simple database query without Laravel bootstrap
$host = 'localhost';
$db = 'hcms_elearning';
$user = 'root';
$pass = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "=== MATERIAL 18 ===\n";
    $stmt = $pdo->query("SELECT * FROM training_materials WHERE id = 18");
    $m18 = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($m18) {
        echo json_encode($m18, JSON_PRETTY_PRINT) . "\n";
    } else {
        echo "Material ID 18 NOT FOUND\n";
    }
    
    echo "\n=== MATERIAL 19 ===\n";
    $stmt = $pdo->query("SELECT * FROM training_materials WHERE id = 19");
    $m19 = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($m19) {
        echo json_encode($m19, JSON_PRETTY_PRINT) . "\n";
    } else {
        echo "Material ID 19 NOT FOUND\n";
    }
    
    echo "\n=== ALL MATERIALS ===\n";
    $stmt = $pdo->query("SELECT id, module_id, title, file_type, file_path, pdf_path FROM training_materials ORDER BY id DESC LIMIT 5");
    $all = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($all, JSON_PRETTY_PRINT) . "\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
