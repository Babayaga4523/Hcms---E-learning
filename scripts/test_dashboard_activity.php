<?php
require __DIR__ . '/../vendor/autoload.php';
use Illuminate\Support\Facades\DB;

$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make('Illuminate\\Contracts\\Console\\Kernel')->bootstrap();

$userId = isset($argv[1]) ? (int)$argv[1] : 7;

$examAttempts = DB::table('exam_attempts')
    ->where('user_id', $userId)
    ->orderBy('finished_at', 'desc')
    ->limit(5)
    ->get();

$resultAttempts = [];
foreach ($examAttempts as $attempt) {
    $module = DB::table('modules')->where('id', $attempt->module_id)->first();
    if (! $module) continue;
    $time = $attempt->finished_at ?: $attempt->started_at;
    $timestamp = $time ? strtotime($time) : 0;
    $resultAttempts[] = [
        'title' => (($attempt->exam_type === 'pre_test') ? 'Pre-Test' : 'Post-Test') . ' - ' . $module->title,
        'time' => $time ? (new DateTime($time))->format('Y-m-d H:i:s') : 'Belum selesai',
        'timestamp' => $timestamp,
        'score' => (int)$attempt->percentage,
        'passed' => (bool)$attempt->is_passed,
    ];
}

$completionsRaw = DB::table('user_trainings')
    ->where('user_id', $userId)
    ->where('status', 'completed')
    ->orderBy('completed_at', 'desc')
    ->limit(5)
    ->get();

$resultCompletions = [];
foreach ($completionsRaw as $ct) {
    $module = DB::table('modules')->where('id', $ct->module_id)->first();
    if (! $module) continue;
    $time = $ct->completed_at;
    $timestamp = $time ? strtotime($time) : 0;
    $resultCompletions[] = [
        'title' => 'Training Selesai - ' . $module->title,
        'time' => $time ? (new DateTime($time))->format('Y-m-d H:i:s') : null,
        'timestamp' => $timestamp,
        'score' => $ct->final_score,
        'passed' => $ct->final_score >= ($module->passing_grade ?? 70),
    ];
}

$activities = collect($resultAttempts)->merge($resultCompletions)->sortByDesc('timestamp')->values()->map(function($item){ unset($item['timestamp']); return $item; });

print_r($activities->toArray());
