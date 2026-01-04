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
        Schema::table('modules', function (Blueprint $table) {
            // Add new columns to modules table
            if (!Schema::hasColumn('modules', 'approval_status')) {
                $table->string('approval_status')->default('draft')->after('status'); // draft, pending_approval, approved, rejected
            }
            if (!Schema::hasColumn('modules', 'approved_at')) {
                $table->timestamp('approved_at')->nullable()->after('approval_status');
            }
            if (!Schema::hasColumn('modules', 'approved_by')) {
                $table->unsignedBigInteger('approved_by')->nullable()->after('approved_at');
            }
            if (!Schema::hasColumn('modules', 'compliance_required')) {
                $table->boolean('compliance_required')->default(false)->after('approved_by');
            }
            if (!Schema::hasColumn('modules', 'start_date')) {
                $table->date('start_date')->nullable()->after('compliance_required');
            }
            if (!Schema::hasColumn('modules', 'end_date')) {
                $table->date('end_date')->nullable()->after('start_date');
            }
            if (!Schema::hasColumn('modules', 'instructor_id')) {
                $table->unsignedBigInteger('instructor_id')->nullable()->after('end_date');
            }
            if (!Schema::hasColumn('modules', 'template_id')) {
                $table->unsignedBigInteger('template_id')->nullable()->after('instructor_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('modules', function (Blueprint $table) {
            $table->dropColumn([
                'approval_status',
                'approved_at',
                'approved_by',
                'compliance_required',
                'start_date',
                'end_date',
                'instructor_id',
                'template_id'
            ]);
        });
    }
};
