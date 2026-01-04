<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SystemSettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $settings = [
            // General Settings
            [
                'key' => 'app_name',
                'value' => 'Wondr Learning',
                'type' => 'string',
                'group' => 'general',
                'description' => 'Application name displayed in the system',
            ],
            [
                'key' => 'app_url',
                'value' => 'http://localhost',
                'type' => 'string',
                'group' => 'general',
                'description' => 'Base URL of the application',
            ],
            [
                'key' => 'timezone',
                'value' => 'Asia/Jakarta',
                'type' => 'string',
                'group' => 'general',
                'description' => 'Default timezone for the system',
            ],
            [
                'key' => 'locale',
                'value' => 'id',
                'type' => 'string',
                'group' => 'general',
                'description' => 'Default language locale',
            ],
            [
                'key' => 'maintenance_mode',
                'value' => 'false',
                'type' => 'boolean',
                'group' => 'general',
                'description' => 'Enable/disable maintenance mode',
            ],
            
            // Security Settings
            [
                'key' => 'enable_two_factor',
                'value' => 'true',
                'type' => 'boolean',
                'group' => 'security',
                'description' => 'Enable two-factor authentication',
            ],
            [
                'key' => 'session_timeout',
                'value' => '30',
                'type' => 'integer',
                'group' => 'security',
                'description' => 'Session timeout in minutes',
            ],
            
            // Data & Backup Settings
            [
                'key' => 'max_upload_size',
                'value' => '50',
                'type' => 'integer',
                'group' => 'data',
                'description' => 'Maximum file upload size in MB',
            ],
            [
                'key' => 'backup_enabled',
                'value' => 'true',
                'type' => 'boolean',
                'group' => 'data',
                'description' => 'Enable automatic backups',
            ],
            [
                'key' => 'backup_frequency',
                'value' => 'daily',
                'type' => 'string',
                'group' => 'data',
                'description' => 'Backup frequency (daily, weekly, monthly)',
            ],
            
            // API Settings
            [
                'key' => 'enable_api',
                'value' => 'true',
                'type' => 'boolean',
                'group' => 'api',
                'description' => 'Enable API access',
            ],
            [
                'key' => 'api_rate_limit',
                'value' => '1000',
                'type' => 'integer',
                'group' => 'api',
                'description' => 'API rate limit per hour',
            ],
        ];

        foreach ($settings as $setting) {
            DB::table('system_settings')->updateOrInsert(
                ['key' => $setting['key']],
                array_merge($setting, [
                    'created_at' => now(),
                    'updated_at' => now(),
                ])
            );
        }
    }
}
