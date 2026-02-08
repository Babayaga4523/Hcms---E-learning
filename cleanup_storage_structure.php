<?php
/**
 * Storage Structure Cleanup - Fixed Version
 */

echo "=== CLEANING UP REDUNDANT STORAGE FOLDERS ===\n\n";

$storagePath = realpath('storage/app/public');
$redundantPath = $storagePath . '/public';

// Phase 1: Handle redundant public folder
if (is_dir($redundantPath)) {
    echo "📦 Found redundant 'storage/app/public/public' folder\n";
    
    $items = array_diff(scandir($redundantPath), ['.', '..']);
    echo "   Items to merge: " . count($items) . "\n";
    
    foreach ($items as $item) {
        $src = $redundantPath . '/' . $item;
        $dest = $storagePath . '/' . $item;
        
        if (is_dir($src)) {
            // Handle subdirectory
            echo "   Processing folder: $item\n";
            
            if (is_dir($dest)) {
                // Merge into existing folder
                $subItems = new RecursiveIteratorIterator(
                    new RecursiveDirectoryIterator($src, RecursiveDirectoryIterator::SKIP_DOTS),
                    RecursiveIteratorIterator::SELF_FIRST
                );
                
                foreach ($subItems as $file) {
                    $relative = substr($file->getPathname(), strlen($src) + 1);
                    $targetPath = $dest . '/' . $relative;
                    
                    if ($file->isDir()) {
                        if (!is_dir($targetPath)) {
                            mkdir($targetPath, 0755, true);
                            echo "     ✓ Created: $relative/\n";
                        }
                    } else {
                        if (!is_file($targetPath)) {
                            copy($file->getPathname(), $targetPath);
                            echo "     ✓ Copied: $relative\n";
                        } else {
                            echo "     ~ Skipped (exists): $relative\n";
                        }
                    }
                }
            } else {
                // Move entire folder
                rename($src, $dest);
                echo "     ✓ Moved folder to root\n";
            }
        } else {
            // Handle file
            if (file_exists($dest)) {
                echo "     ~ Skipped (exists): $item\n";
            } else {
                copy($src, $dest);
                echo "     ✓ Moved file: $item\n";
            }
        }
    }
    
    // Remove empty redundant folder
    if (is_dir_empty($redundantPath)) {
        rmdir($redundantPath);
        echo "\n✓ Removed empty redundant folder\n";
    }
}

// Phase 2: Verify final structure
echo "\n✅ FINAL STORAGE STRUCTURE:\n";
echo str_repeat("-", 50) . "\n";
echo "/storage/ (public)\n";

$dirs = ['questions', 'materials', 'training-materials', 'training-programs'];
foreach ($dirs as $dir) {
    $path = $storagePath . '/' . $dir;
    if (is_dir($path)) {
        $count = countFiles($path);
        echo "  ├─ $dir/ ($count items)\n";
    }
}

echo "\n📌 STRUCTURE IS NOW CLEAN\n";
echo "No more nested 'public' folders\n";

function is_dir_empty($dir) {
    $files = array_diff(scandir($dir), ['.', '..']);
    return count($files) === 0;
}

function countFiles($dir) {
    $count = 0;
    $files = array_diff(scandir($dir), ['.', '..']);
    foreach ($files as $file) {
        if (is_file($dir . '/' . $file)) {
            $count++;
        } elseif (is_dir($dir . '/' . $file)) {
            $count += countFiles($dir . '/' . $file);
        }
    }
    return $count;
}
