<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Question;

$moduleId = 5;
$questions = Question::where('module_id', $moduleId)
    ->select(['id', 'question_text', 'options', 'image_url'])
    ->limit(10)
    ->get();

foreach ($questions as $q) {
    echo "ID: {$q->id}\n";
    echo "Q: " . substr($q->question_text,0,80) . "\n";
    $opts = [];
    if ($q->options) {
        $opts = is_string($q->options) ? json_decode($q->options, true) : $q->options;
        if ($opts instanceof \Illuminate\Support\Collection) {
            $opts = $opts->toArray();
        }
    }

    // normalization copied from controller
    if (is_array($opts) && count($opts) > 0) {
        $normalized = [];
        $isAssoc = array_keys($opts) !== range(0, count($opts) - 1);

        if ($isAssoc) {
            foreach ($opts as $k => $v) {
                if (is_string($v)) {
                    $normalized[] = ['label' => $k, 'text' => $v];
                } elseif (is_array($v) && isset($v['text'])) {
                    $normalized[] = ['label' => ($v['label'] ?? $k), 'text' => $v['text']];
                }
            }
        } else {
            $labels = ['a','b','c','d','e','f'];
            foreach ($opts as $i => $v) {
                if (is_string($v)) {
                    $normalized[] = ['label' => ($v['label'] ?? $labels[$i] ?? (string)$i), 'text' => $v];
                } elseif (is_array($v)) {
                    if (isset($v['text'])) {
                        $normalized[] = ['label' => ($v['label'] ?? ($labels[$i] ?? (string)$i)), 'text' => $v['text']];
                    } elseif (isset($v[0])) {
                        $normalized[] = ['label' => ($v['label'] ?? ($labels[$i] ?? (string)$i)), 'text' => $v[0]];
                    }
                }
            }
        }

        $opts = $normalized;
    }

    if (!$opts || !is_array($opts) || count($opts) === 0) {
        $opts = [];
        foreach (['a','b','c','d'] as $label) {
            $field = 'option_' . $label;
            if (isset($q->$field) && $q->$field !== null && $q->$field !== '') {
                $opts[] = ['label' => $label, 'text' => $q->$field];
            }
        }
    }

    echo "Options count: " . count($opts) . "\n";
    foreach ($opts as $o) {
        echo "  - [{$o['label']}] " . ($o['text'] ?? '(no text)') . "\n";
    }

    echo "Image URL: " . ($q->image_url ?? '(none)') . "\n";
    echo "---\n";
}
