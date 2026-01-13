<?php

require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

echo "=== Checking Quizzes Table Schema ===\n";

// Check if quizzes table exists
if (!Schema::hasTable('quizzes')) {
    echo "❌ Table 'quizzes' does not exist!\n";
    exit(1);
}

echo "✅ Table 'quizzes' exists\n";

// Get quizzes table columns
$columns = Schema::getColumnListing('quizzes');
echo "\nQuizzes table columns:\n";
foreach ($columns as $column) {
    echo "  - $column\n";
}

// Check foreign keys and indexes in a DB-driver-aware way
$driver = DB::getPdo()->getAttribute(PDO::ATTR_DRIVER_NAME);

if ($driver === 'sqlite') {
    echo "\n=== Checking Foreign Key Constraints (SQLite) ===\n";
    try {
        $foreignKeys = DB::select("PRAGMA foreign_key_list('quizzes')");

        if (count($foreignKeys) > 0) {
            echo "Foreign key constraints found:\n";
            foreach ($foreignKeys as $fk) {
                // PRAGMA foreign_key_list returns 'from','table','to'
                echo "  - {$fk->from} -> {$fk->table}({$fk->to})\n";
            }
        } else {
            echo "No foreign key constraints found on quizzes table.\n";
        }
    } catch (Exception $e) {
        echo "Could not check foreign keys (sqlite): " . $e->getMessage() . "\n";
    }

    echo "\n=== Checking Indexes (SQLite) ===\n";
    try {
        $indexes = DB::select("PRAGMA index_list('quizzes')");

        if (count($indexes) > 0) {
            echo "Indexes found:\n";
            foreach ($indexes as $idx) {
                $unique = isset($idx->unique) && $idx->unique == 1 ? 'UNIQUE' : 'INDEX';
                // Get columns in index
                $cols = DB::select("PRAGMA index_info('" . $idx->name . "')");
                $colNames = array_map(function($c){ return $c->name; }, $cols);
                echo "  - {$idx->name} ({$unique}): " . implode(', ', $colNames) . "\n";
            }
        } else {
            echo "No indexes found on quizzes table.\n";
        }
    } catch (Exception $e) {
        echo "Could not check indexes (sqlite): " . $e->getMessage() . "\n";
    }
} else {
    // MySQL / MariaDB
    echo "\n=== Checking Foreign Key Constraints ===\n";
    try {
        $foreignKeys = DB::select("
            SELECT
                COLUMN_NAME,
                CONSTRAINT_NAME,
                REFERENCED_TABLE_NAME,
                REFERENCED_COLUMN_NAME
            FROM
                INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE
                TABLE_NAME = 'quizzes'
                AND TABLE_SCHEMA = DATABASE()
                AND REFERENCED_TABLE_NAME IS NOT NULL
        ");

        if (count($foreignKeys) > 0) {
            echo "Foreign key constraints found:\n";
            foreach ($foreignKeys as $fk) {
                echo "  - {$fk->COLUMN_NAME} -> {$fk->REFERENCED_TABLE_NAME}({$fk->REFERENCED_COLUMN_NAME})\n";
            }
        } else {
            echo "No foreign key constraints found on quizzes table.\n";
        }
    } catch (Exception $e) {
        echo "Could not check foreign keys: " . $e->getMessage() . "\n";
    }

    // Check indexes
    echo "\n=== Checking Indexes ===\n";
    try {
        $indexes = DB::select("
            SELECT
                INDEX_NAME,
                COLUMN_NAME,
                NON_UNIQUE
            FROM
                INFORMATION_SCHEMA.STATISTICS
            WHERE
                TABLE_NAME = 'quizzes'
                AND TABLE_SCHEMA = DATABASE()
            ORDER BY
                INDEX_NAME, SEQ_IN_INDEX
        ");

        if (count($indexes) > 0) {
            echo "Indexes found:\n";
            $currentIndex = null;
            foreach ($indexes as $index) {
                if ($currentIndex !== $index->INDEX_NAME) {
                    $type = $index->NON_UNIQUE == 0 ? 'UNIQUE' : 'INDEX';
                    echo "  - {$index->INDEX_NAME} ($type): {$index->COLUMN_NAME}";
                    $currentIndex = $index->INDEX_NAME;
                } else {
                    echo ", {$index->COLUMN_NAME}";
                }
            }
            echo "\n";
        } else {
            echo "No indexes found on quizzes table.\n";
        }
    } catch (Exception $e) {
        echo "Could not check indexes: " . $e->getMessage() . "\n";
    }
}

echo "\n=== Done ===\n";
