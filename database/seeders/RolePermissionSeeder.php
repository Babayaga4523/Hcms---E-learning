<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\Permission;
use App\Models\Department;
use App\Models\User;
use Illuminate\Database\Seeder;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Create Permissions
        $permissions = [
            // User Management
            ['name' => 'View Users', 'slug' => 'view_users', 'category' => 'users'],
            ['name' => 'Create User', 'slug' => 'create_user', 'category' => 'users'],
            ['name' => 'Edit User', 'slug' => 'edit_user', 'category' => 'users'],
            ['name' => 'Delete User', 'slug' => 'delete_user', 'category' => 'users'],
            ['name' => 'Reset User Password', 'slug' => 'reset_password', 'category' => 'users'],
            
            // Training Management
            ['name' => 'View Trainings', 'slug' => 'view_trainings', 'category' => 'trainings'],
            ['name' => 'Create Training', 'slug' => 'create_training', 'category' => 'trainings'],
            ['name' => 'Edit Training', 'slug' => 'edit_training', 'category' => 'trainings'],
            ['name' => 'Delete Training', 'slug' => 'delete_training', 'category' => 'trainings'],
            ['name' => 'Assign Training', 'slug' => 'assign_training', 'category' => 'trainings'],
            
            // Reports
            ['name' => 'View Reports', 'slug' => 'view_reports', 'category' => 'reports'],
            ['name' => 'Export Reports', 'slug' => 'export_reports', 'category' => 'reports'],
            
            // Compliance
            ['name' => 'View Compliance', 'slug' => 'view_compliance', 'category' => 'compliance'],
            ['name' => 'Approve Training', 'slug' => 'approve_training', 'category' => 'compliance'],
            ['name' => 'Verify Evidence', 'slug' => 'verify_evidence', 'category' => 'compliance'],
            
            // System
            ['name' => 'Manage Roles', 'slug' => 'manage_roles', 'category' => 'system'],
            ['name' => 'Manage Permissions', 'slug' => 'manage_permissions', 'category' => 'system'],
            ['name' => 'Manage Departments', 'slug' => 'manage_departments', 'category' => 'system'],
            ['name' => 'View Activity Logs', 'slug' => 'view_activity_logs', 'category' => 'system'],
            ['name' => 'View Dashboard', 'slug' => 'view_dashboard', 'category' => 'system'],
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(
                ['slug' => $permission['slug']],
                $permission
            );
        }

        // Create Roles
        $adminRole = Role::firstOrCreate(['name' => 'Admin'], [
            'description' => 'Full system access',
            'is_active' => true,
        ]);

        $managerRole = Role::firstOrCreate(['name' => 'Manager'], [
            'description' => 'Training and user management',
            'is_active' => true,
        ]);

        $instructorRole = Role::firstOrCreate(['name' => 'Instructor'], [
            'description' => 'Can create and manage trainings',
            'is_active' => true,
        ]);

        $userRole = Role::firstOrCreate(['name' => 'User'], [
            'description' => 'Standard user role',
            'is_active' => true,
        ]);

        // Assign all permissions to Admin
        $adminRole->permissions()->sync(Permission::pluck('id')->toArray());

        // Assign permissions to Manager
        $managerPermissions = Permission::whereIn('slug', [
            'view_users', 'create_user', 'edit_user', 'reset_password',
            'view_trainings', 'create_training', 'edit_training', 'assign_training',
            'view_reports', 'export_reports', 'view_compliance',
            'manage_departments', 'view_activity_logs', 'view_dashboard'
        ])->pluck('id')->toArray();
        $managerRole->permissions()->sync($managerPermissions);

        // Assign permissions to Instructor
        $instructorPermissions = Permission::whereIn('slug', [
            'view_trainings', 'create_training', 'edit_training',
            'view_reports', 'view_dashboard'
        ])->pluck('id')->toArray();
        $instructorRole->permissions()->sync($instructorPermissions);

        // Assign permissions to User
        $userPermissions = Permission::whereIn('slug', [
            'view_dashboard'
        ])->pluck('id')->toArray();
        $userRole->permissions()->sync($userPermissions);

        // Create Departments
        $depts = [
            ['name' => 'IT Department', 'code' => 'IT', 'description' => 'Information Technology'],
            ['name' => 'HR Department', 'code' => 'HR', 'description' => 'Human Resources'],
            ['name' => 'Finance Department', 'code' => 'FIN', 'description' => 'Finance & Accounting'],
            ['name' => 'Operations', 'code' => 'OPS', 'description' => 'Operations Team'],
            ['name' => 'Compliance & Risk', 'code' => 'COMP', 'description' => 'Compliance & Risk Management'],
        ];

        foreach ($depts as $dept) {
            Department::firstOrCreate(['name' => $dept['name']], $dept);
        }

        $this->command->info('Roles, Permissions, and Departments seeded successfully!');
    }
}
