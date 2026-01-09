<?php

require __DIR__ . '/../vendor/autoload.php';

use Illuminate\Support\Facades\DB;

$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make('Illuminate\\Contracts\\Console\\Kernel')->bootstrap();

$created = 0;

$modules = DB::table('modules')->select('id','title','has_pretest','has_posttest','passing_grade')->get();

foreach ($modules as $m) {
    if ($m->has_pretest) {
        $exists = DB::table('quizzes')->where(function($q) use ($m) {
            $q->where('module_id', $m->id)->orWhere('training_program_id', $m->id);
        })->where('type', 'pretest')->exists();

        if (! $exists) {
            $questionCount = DB::table('questions')->where('module_id', $m->id)->where('question_type','pretest')->count() ?: 5;
            DB::table('quizzes')->insert([
                'module_id' => $m->id,
                'name' => $m->title . ' - Pre-Test',
                'type' => 'pretest',
                'description' => 'Auto-created pretest for this training.',
                'is_active' => 1,
                'question_count' => $questionCount,
                'time_limit' => 15,
                'passing_score' => $m->passing_grade ?? 70,
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ]);
            $created++;
            echo "Created pretest quiz for module {$m->id}\n";
        }
    }
    if ($m->has_posttest) {
        $exists = DB::table('quizzes')->where(function($q) use ($m) {
            $q->where('module_id', $m->id)->orWhere('training_program_id', $m->id);
        })->where('type', 'posttest')->exists();

        if (! $exists) {
            $questionCount = DB::table('questions')->where('module_id', $m->id)->where('question_type','posttest')->count() ?: 5;
            DB::table('quizzes')->insert([
                'module_id' => $m->id,
                'name' => $m->title . ' - Post-Test',
                'type' => 'posttest',
                'description' => 'Auto-created posttest for this training.',
                'is_active' => 1,
                'question_count' => $questionCount,
                'time_limit' => 15,
                'passing_score' => $m->passing_grade ?? 70,
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ]);
            $created++;
            echo "Created posttest quiz for module {$m->id}\n";
        }
    }
}

echo "Done. Created $created quizzes.\n";
