<?php
require __DIR__ . '/../vendor/autoload.php';
use Illuminate\Support\Facades\DB;

$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make('Illuminate\\Contracts\\Console\\Kernel')->bootstrap();

$moduleId = isset($argv[1]) ? (int)$argv[1] : 3;

$module = DB::table('modules')->where('id', $moduleId)->first();
if (! $module) {
    echo "Module $moduleId not found\n";
    exit(1);
}

$preCount = DB::table('questions')->where('module_id', $moduleId)->where('question_type', 'pretest')->count();
$postCount = DB::table('questions')->where('module_id', $moduleId)->where('question_type', 'posttest')->count();
$quizzes = DB::table('quizzes')->where('module_id', $moduleId)->get();

echo "Module: {$module->id} - {$module->title}\n";
echo "has_pretest: " . ($module->has_pretest ? '1' : '0') . " | has_posttest: " . ($module->has_posttest ? '1' : '0') . "\n";
echo "pretest questions: $preCount | posttest questions: $postCount\n";
echo "existing quizzes count: " . $quizzes->count() . "\n";
foreach ($quizzes as $q) {
    echo " - Quiz: id={$q->id} type={$q->type} is_active={$q->is_active} question_count={$q->question_count}\n";
}

$created = 0;
if ($preCount > 0) {
    $exists = DB::table('quizzes')->where('module_id', $moduleId)->where('type', 'pretest')->exists();
    if (! $exists) {
        DB::table('quizzes')->insert([
            'module_id' => $moduleId,
            'name' => $module->title . ' - Pre-Test',
            'type' => 'pretest',
            'description' => 'Auto-created pretest for this training.',
            'is_active' => 1,
            'question_count' => $preCount,
            'time_limit' => 15,
            'passing_score' => $module->passing_grade ?? 70,
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s')
        ]);
        $created++;
        echo "Created pretest quiz for module $moduleId\n";
        DB::table('modules')->where('id', $moduleId)->update(['has_pretest' => 1]);
    }
}
if ($postCount > 0) {
    $exists = DB::table('quizzes')->where('module_id', $moduleId)->where('type', 'posttest')->exists();
    if (! $exists) {
        DB::table('quizzes')->insert([
            'module_id' => $moduleId,
            'name' => $module->title . ' - Post-Test',
            'type' => 'posttest',
            'description' => 'Auto-created posttest for this training.',
            'is_active' => 1,
            'question_count' => $postCount,
            'time_limit' => 15,
            'passing_score' => $module->passing_grade ?? 70,
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s')
        ]);
        $created++;
        echo "Created posttest quiz for module $moduleId\n";
        DB::table('modules')->where('id', $moduleId)->update(['has_posttest' => 1]);
    }
}

if ($created === 0) {
    echo "No quizzes created. If you expect quizzes, either add pretest/posttest questions or set module has_pretest/has_posttest flags.\n";
} else {
    echo "Done. Created $created quizzes and updated module flags.\n";
}
