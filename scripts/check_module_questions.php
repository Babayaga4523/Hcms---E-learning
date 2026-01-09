<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make('Illuminate\\Contracts\\Console\\Kernel')->bootstrap();

$module = \App\Models\Module::with(['trainingMaterials','questions'=>function($q){
    $q->select('id','module_id','question_text','image_url','question_type','options','correct_answer','difficulty','explanation','points','order','created_at','updated_at');
}])->find(34);
if (!$module) {
    echo "Module 34 not found\n";
    exit;
}

echo "Module: {$module->id} - {$module->title}\n";
echo "Questions: " . $module->questions->count() . "\n";
foreach ($module->questions as $q) {
    echo "- Q{$q->id}: options=" . (is_array($q->options) ? json_encode($q->options) : ($q->options ?? 'NULL')) . " correct={$q->correct_answer}\n";
}
