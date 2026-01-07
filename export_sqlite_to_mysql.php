<?php

// Script to export SQLite data to MySQL compatible SQL

try {
    // Connect to SQLite
    $sqlite = new PDO('sqlite:' . __DIR__ . '/database/database.sqlite');
    $sqlite->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Get all tables from SQLite
    $tables = $sqlite->query("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");

    $sql = "-- Exported from SQLite to MySQL\n\n";

    foreach ($tables as $table) {
        $tableName = $table['name'];

        // Get table schema
        $schema = $sqlite->query("PRAGMA table_info($tableName)");
        $columns = [];
        $createSql = "CREATE TABLE `$tableName` (\n";

        foreach ($schema as $col) {
            $colName = $col['name'];
            $colType = $col['type'];
            $notNull = $col['notnull'] ? 'NOT NULL' : 'NULL';
            $default = $col['dflt_value'] !== null ? "DEFAULT " . $col['dflt_value'] : '';

            // Convert SQLite types to MySQL
            $colType = strtoupper($colType);
            if ($colType == 'INTEGER') $colType = 'INT';
            if ($colType == 'VARCHAR') $colType = 'VARCHAR(255)';
            if ($colType == 'TEXT') $colType = 'TEXT';
            if ($colType == 'REAL') $colType = 'DECIMAL(10,2)';
            if ($colType == 'BLOB') $colType = 'BLOB';

            $columns[] = "`$colName` $colType $notNull $default";
        }

        $createSql .= implode(",\n", $columns) . "\n);\n\n";
        $sql .= $createSql;

        // Get data
        $data = $sqlite->query("SELECT * FROM $tableName");
        foreach ($data as $row) {
            $values = [];
            foreach ($row as $value) {
                $values[] = $sqlite->quote($value);
            }
            $sql .= "INSERT INTO `$tableName` VALUES (" . implode(", ", $values) . ");\n";
        }
        $sql .= "\n";
    }

    // Write to file
    file_put_contents('exported_data.sql', $sql);

    echo "Data exported to exported_data.sql\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>