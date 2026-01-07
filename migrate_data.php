<?php

// Script to migrate data from SQLite to MySQL

try {
    // Connect to SQLite
    $sqlite = new PDO('sqlite:' . __DIR__ . '/database/database.sqlite');
    $sqlite->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Connect to MySQL
    $mysql = new PDO('mysql:host=127.0.0.1;dbname=hcms_elearning;charset=utf8mb4', 'hcms_user', 'strong_password');
    $mysql->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Disable foreign key checks
    $mysql->exec('SET FOREIGN_KEY_CHECKS = 0');

    // Get all tables from SQLite, exclude migrations
    $tables = $sqlite->query("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != 'migrations'");

    foreach ($tables as $table) {
        $tableName = $table['name'];

        echo "Migrating table: $tableName\n";

        try {
            // Get data
            $data = $sqlite->query("SELECT * FROM $tableName");
            $rows = $data->fetchAll(PDO::FETCH_ASSOC);

            if (empty($rows)) {
                echo "No data in $tableName\n";
                continue;
            }

            // Prepare INSERT statement
            $columns = array_keys($rows[0]);
            $placeholders = str_repeat('?,', count($columns) - 1) . '?';
            $stmt = $mysql->prepare("INSERT INTO `$tableName` (`" . implode('`,`', $columns) . "`) VALUES ($placeholders)");

            // Insert data
            foreach ($rows as $row) {
                $values = array_values($row);
                $stmt->execute($values);
            }

            echo "Migrated " . count($rows) . " rows to $tableName\n";
        } catch (Exception $e) {
            echo "Error migrating $tableName: " . $e->getMessage() . "\n";
            continue;
        }
    }

    // Enable foreign key checks
    $mysql->exec('SET FOREIGN_KEY_CHECKS = 1');

    echo "Data migration completed!\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>