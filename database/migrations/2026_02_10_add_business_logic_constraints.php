<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add unique constraint to prevent duplicate enrollments
        Schema::table('user_trainings', function (Blueprint $table) {
            if (!$this->hasIndex('user_trainings', 'unique_user_module')) {
                $table->unique(['user_id', 'module_id'], 'unique_user_module')
                    ->comment('Prevent duplicate enrollments for same user-module pair');
            }
        });

        // Add passing_grade to user_trainings for certificate validation
        Schema::table('user_trainings', function (Blueprint $table) {
            if (!Schema::hasColumn('user_trainings', 'passing_grade')) {
                $table->decimal('passing_grade', 5, 2)->nullable()->after('final_score')
                    ->comment('Minimum score required to pass');
            }
            
            if (!Schema::hasColumn('user_trainings', 'state_history')) {
                $table->json('state_history')->nullable()->after('status')
                    ->comment('Track all state transitions for audit trail');
            }
            
            if (!Schema::hasColumn('user_trainings', 'certificate_issued_at')) {
                $table->timestamp('certificate_issued_at')->nullable()->after('completed_at')
                    ->comment('Timestamp when certificate was issued');
            }
            
            if (!Schema::hasColumn('user_trainings', 'prerequisites_met')) {
                $table->boolean('prerequisites_met')->default(false)->after('is_certified')
                    ->comment('Whether all prerequisites are completed');
            }
        });

        // Create table for department hierarchy
        if (!Schema::hasTable('department_hierarchy')) {
            Schema::create('department_hierarchy', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('department_id');
                $table->unsignedBigInteger('parent_department_id')->nullable();
                $table->integer('level')->default(0);
                $table->string('path')->index()->comment('Hierarchy path like /1/5/12/');
                $table->timestamps();
                
                $table->foreign('department_id')->references('id')->on('departments')->onDelete('cascade');
                $table->foreign('parent_department_id')->references('id')->on('departments')->onDelete('set null');
            });
        }

        // Add compliance tracking to user_trainings
        Schema::table('user_trainings', function (Blueprint $table) {
            if (!Schema::hasColumn('user_trainings', 'compliance_status')) {
                $table->enum('compliance_status', ['compliant', 'non_compliant', 'escalated'])
                    ->default('compliant')->after('status')
                    ->comment('Track compliance state for escalation');
            }
            
            if (!Schema::hasColumn('user_trainings', 'escalation_level')) {
                $table->integer('escalation_level')->default(0)->after('compliance_status')
                    ->comment('0=none, 1=manager notified, 2=department head, 3=executive');
            }
            
            if (!Schema::hasColumn('user_trainings', 'escalated_at')) {
                $table->timestamp('escalated_at')->nullable()->after('escalation_level')
                    ->comment('When escalation was triggered');
            }
        });

        // Create compliance audit log
        if (!Schema::hasTable('compliance_audit_logs')) {
            Schema::create('compliance_audit_logs', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_training_id');
                $table->enum('action', ['state_change', 'escalation', 'resolution', 'certification'])
                    ->index();
                $table->string('old_value')->nullable();
                $table->string('new_value')->nullable();
                $table->unsignedBigInteger('triggered_by')->nullable();
                $table->text('reason')->nullable();
                $table->timestamps();
                
                $table->foreign('user_training_id')->references('id')->on('user_trainings')->onDelete('cascade');
                $table->foreign('triggered_by')->references('id')->on('users')->onDelete('set null');
            });
        }

        // Add permission sync tracking
        Schema::table('user_roles', function (Blueprint $table) {
            if (!Schema::hasColumn('user_roles', 'assigned_at')) {
                $table->timestamp('assigned_at')->useCurrent()->comment('When role was assigned');
            }
            
            if (!Schema::hasColumn('user_roles', 'assigned_by')) {
                $table->unsignedBigInteger('assigned_by')->nullable()->comment('Who assigned this role');
            }
            
            if (!Schema::hasColumn('user_roles', 'active')) {
                $table->boolean('active')->default(true)->comment('Soft deactivate without removing');
            }
        });

        // Add foreign key constraint for assigned_by
        Schema::table('user_roles', function (Blueprint $table) {
            try {
                $table->foreign('assigned_by')->references('id')->on('users')->onDelete('set null');
            } catch (\Exception $e) {
                // Ignore if constraint already exists
            }
        });

        // Create role permission sync log
        if (!Schema::hasTable('role_permission_sync_logs')) {
            Schema::create('role_permission_sync_logs', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('role_id');
                $table->string('action'); // 'permission_added', 'permission_removed', 'role_synced'
                $table->unsignedBigInteger('permission_id')->nullable();
                $table->integer('affected_users_count')->default(0);
                $table->timestamp('synced_at')->nullable();
                $table->timestamps();
                
                $table->foreign('role_id')->references('id')->on('roles')->onDelete('cascade');
                $table->foreign('permission_id')->references('id')->on('permissions')->onDelete('set null');
            });
        }

        // Add role assignment validation table
        if (!Schema::hasTable('role_department_compatibility')) {
            Schema::create('role_department_compatibility', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('role_id');
                $table->unsignedBigInteger('allowed_department_id')->nullable();
                $table->boolean('is_restricted')->default(false);
                $table->text('notes')->nullable();
                $table->timestamps();
                
                $table->unique(['role_id', 'allowed_department_id'], 'unique_role_dept');
                $table->foreign('role_id')->references('id')->on('roles')->onDelete('cascade');
                $table->foreign('allowed_department_id')->references('id')->on('departments')->onDelete('cascade');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('role_department_compatibility');
        Schema::dropIfExists('role_permission_sync_logs');
        Schema::table('user_roles', function (Blueprint $table) {
            $table->dropForeignKeyIfExists('user_roles_assigned_by_foreign');
            $table->dropColumn(['assigned_at', 'assigned_by', 'active']);
        });
        Schema::dropIfExists('compliance_audit_logs');
        Schema::table('user_trainings', function (Blueprint $table) {
            $table->dropIndexIfExists('unique_user_module');
            $table->dropColumn([
                'passing_grade', 'state_history', 'certificate_issued_at',
                'prerequisites_met', 'compliance_status', 'escalation_level', 'escalated_at'
            ]);
        });
        Schema::dropIfExists('department_hierarchy');
    }

    private function hasIndex($table, $indexName)
    {
        return collect(Schema::getIndexes($table))->pluck('name')->contains($indexName);
    }
};
