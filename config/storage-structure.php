<?php
/**
 * Storage Configuration & Documentation
 * 
 * Definisi struktur storage folder untuk menghindari confusion
 */

return [
    'public' => [
        'root' => storage_path('app/public'),
        'url_prefix' => '/storage',
        'symlink' => 'public/storage -> storage/app/public',
        
        'folders' => [
            'questions' => [
                'path' => 'storage/app/public/questions',
                'public_url' => '/storage/questions',
                'description' => 'Quiz & exam question images',
                'allowed_formats' => ['jpg', 'jpeg', 'png', 'gif', 'webp'],
                'max_size' => 5242880, // 5MB
                'usage' => [
                    'Image uploads for pretest/posttest questions',
                    'Used by Question model\'s image_url column',
                    'Displayed in TakeQuiz.jsx component',
                ]
            ],
            
            'materials' => [
                'path' => 'storage/app/public/materials',
                'public_url' => '/storage/materials',
                'description' => 'Training program materials and resources',
                'subdirectories' => ['documents', 'presentations', 'videos'],
                'usage' => [
                    'PDF documents',
                    'PowerPoint presentations',
                    'Video files',
                    'Reference materials',
                ]
            ],
            
            'training-programs' => [
                'path' => 'storage/app/public/training-programs',
                'public_url' => '/storage/training-programs',
                'description' => 'Training program assets',
                'usage' => [
                    'Program covers/images',
                    'Certificates',
                    'Program-specific files',
                ]
            ],
        ]
    ],
    
    'private' => [
        'root' => storage_path('app/private'),
        'description' => 'Private files not accessible via HTTP',
        'folders' => [
            'exports' => 'Data exports',
            'backups' => 'Backup files',
            'temp' => 'Temporary files',
        ]
    ],
    
    'access_patterns' => [
        'Store question image' => [
            'Handler' => 'ImageUploadHandler::handle()',
            'Location' => 'storage/app/public/questions/{filename}',
            'Database' => 'questions.image_url = /storage/questions/{filename}',
            'Access' => 'http://127.0.0.1:8000/storage/questions/{filename}',
        ],
        
        'Store training material' => [
            'Handler' => 'MaterialUploadHandler or direct Storage::disk("public")->put()',
            'Location' => 'storage/app/public/materials/{type}/{filename}',
            'Database' => 'training_materials.file_url',
            'Access' => 'http://127.0.0.1:8000/storage/materials/{type}/{filename}',
        ],
    ],
    
    'symlink_info' => [
        'source' => 'storage/app/public',
        'target' => 'public/storage',
        'purpose' => 'Makes uploaded files accessible via web server',
        'setup' => 'php artisan storage:link',
        'windows_notes' => 'Uses NTFS junction, requires admin privileges',
    ],
];
