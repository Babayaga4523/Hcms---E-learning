<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$certId = $argv[1] ?? 7;
use App\Models\Certificate;
use App\Models\TrainingMaterial;
use App\Models\UserMaterialProgress;
use App\Models\Module;

$cert = Certificate::find($certId);
if (!$cert) {
    echo "CERT_NOT_FOUND\n";
    exit(0);
}
$moduleId = $cert->module_id;
$userId = $cert->user_id;

echo "CERT_FOUND id={$cert->id} module_id={$moduleId} user_id={$userId}\n";
$module = Module::with('trainingMaterials')->find($moduleId);
$legacy = [];
$nextId = 1;
if ($module) {
    if ($module->video_url) $legacy[] = $nextId++;
    if ($module->document_url) $legacy[] = $nextId++;
    if ($module->presentation_url) $legacy[] = $nextId++;
}
$mids = $module->trainingMaterials->pluck('id')->toArray();
$expected = array_merge($legacy, $mids);

echo "expected_material_ids: " . json_encode($expected) . "\n";
$completed = UserMaterialProgress::where('user_id', $userId)->whereIn('training_material_id', $expected)->where('is_completed', true)->pluck('training_material_id')->toArray();

echo "completed_material_ids: " . json_encode($completed) . "\n";

$prePassed = \App\Models\ExamAttempt::where('user_id', $userId)->where('module_id', $moduleId)->where('exam_type','pre_test')->where('is_passed', true)->exists();
$postPassed = \App\Models\ExamAttempt::where('user_id', $userId)->where('module_id', $moduleId)->where('exam_type','post_test')->where('is_passed', true)->exists();

echo "pretest_passed: ".($prePassed? '1':'0')." posttest_passed: ".($postPassed? '1':'0')."\n";

$eligibility = [];
$eligibility['materials_total'] = count($expected);
$eligibility['materials_completed'] = count($completed);
$eligibility['pretest_required'] = \App\Models\Question::where('module_id',$moduleId)->where('question_type','pretest')->count() > 0;
$eligibility['posttest_required'] = \App\Models\Question::where('module_id',$moduleId)->where('question_type','posttest')->count() > 0;

$eligibility['pretest_passed'] = $prePassed;
$eligibility['posttest_passed'] = $postPassed;

echo "eligibility: " . json_encode($eligibility) . "\n";

// show user_training
$ut = \App\Models\UserTraining::where('user_id',$userId)->where('module_id',$moduleId)->first();
echo "user_training: ".json_encode($ut? $ut->toArray(): null)."\n";

// show certificate metadata
echo "certificate metadata: ".json_encode($cert->metadata)."\n";
