<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\AsCollection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Question extends Model
{
    use HasFactory;

    protected $fillable = [
        'module_id',
        'quiz_id',
        'question_text',
        'image_url',
        'question_type',
        'difficulty',
        'points',
        'explanation',
        'options',
        'answers',
        'correct_answer',
        'order',
        // Legacy fields for backward compatibility
        'option_a',
        'option_b',
        'option_c',
        'option_d',
    ];

    protected $casts = [
        'options' => 'array', // Changed from AsCollection to array for better compatibility
        'answers' => 'json',
    ];

    const QUESTION_TYPES = [
        'multiple_choice' => 'Multiple Choice',
        'true_false' => 'True/False',
        'fill_blank' => 'Fill in the Blank',
        'essay' => 'Essay/Short Answer',
    ];

    const DIFFICULTY_LEVELS = [
        'easy' => 'Mudah',
        'medium' => 'Sedang',
        'hard' => 'Sulit',
    ];

    const DIFFICULTY_POINTS = [
        'easy' => 3,
        'medium' => 5,
        'hard' => 7,
    ];

    /**
     * Relasi ke Module (untuk backward compatibility)
     */
    public function module(): BelongsTo
    {
        return $this->belongsTo(Module::class);
    }

    /**
     * Relasi ke Quiz
     */
    public function quiz(): BelongsTo
    {
        return $this->belongsTo(Quiz::class);
    }

    /**
     * Relasi ke User Exam Answers
     */
    public function userAnswers(): HasMany
    {
        return $this->hasMany(UserExamAnswer::class);
    }

    /**
     * Get all options sebagai array (legacy support)
     */
    public function getOptions(): array
    {
        // New format with JSON
        if ($this->options && is_array($this->options) || ($this->options instanceof \Illuminate\Support\Collection)) {
            return $this->options->toArray();
        }

        // Legacy format with option_a, option_b, etc
        return [
            'a' => $this->option_a,
            'b' => $this->option_b,
            'c' => $this->option_c,
            'd' => $this->option_d,
        ];
    }

    /**
     * Get normalized options untuk frontend (accessor)
     * Menangani multiple format: JSON modern, legacy option_a/b/c/d, dan various data structures
     * Ini menghindari normalisasi logic yang panjang di dalam controller
     */
    public function getNormalizedOptionsAttribute(): array
    {
        $opts = [];

        // 1. Coba parse dari column options (JSON format modern)
        if ($this->options) {
            $opts = is_string($this->options) ? json_decode($this->options, true) : $this->options;
            if ($opts instanceof \Illuminate\Support\Collection) {
                $opts = $opts->toArray();
            }
        }

        // 2. Normalisasi berbagai format opsi ke standard format
        if (is_array($opts) && count($opts) > 0) {
            $normalized = [];
            $isAssoc = array_keys($opts) !== range(0, count($opts) - 1);

            if ($isAssoc) {
                // Format associatif seperti ['a' => 'text', 'b' => 'text2', ...]
                foreach ($opts as $k => $v) {
                    if (is_string($v)) {
                        $normalized[] = ['label' => $k, 'text' => $v];
                    } elseif (is_array($v) && isset($v['text'])) {
                        $normalized[] = ['label' => ($v['label'] ?? $k), 'text' => $v['text']];
                    }
                }
            } else {
                // Format sequential dengan objects atau strings
                $labels = ['a', 'b', 'c', 'd', 'e', 'f'];
                foreach ($opts as $i => $v) {
                    if (is_string($v)) {
                        $normalized[] = ['label' => ($labels[$i] ?? (string)$i), 'text' => $v];
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

        // 3. Jika masih kosong, coba legacy format option_a, option_b, dst
        if (!$opts || !is_array($opts) || count($opts) === 0) {
            $opts = [];
            foreach (['a', 'b', 'c', 'd'] as $label) {
                $field = 'option_' . $label;
                if (isset($this->$field) && $this->$field !== null && $this->$field !== '') {
                    $opts[] = ['label' => $label, 'text' => $this->$field];
                }
            }
        }

        // 4. Bersihkan dan normalize output
        $opts = array_values(array_map(function ($o) {
            if (!is_array($o)) return null;
            $label = isset($o['label']) ? (string)$o['label'] : null;
            $text = isset($o['text']) ? trim((string)$o['text']) : (isset($o[0]) ? trim((string)$o[0]) : null);
            if (!$text) return null;
            return ['label' => $label ?? '', 'text' => $text];
        }, $opts));

        // Remove any nulls (invalid options)
        return array_values(array_filter($opts));
    }

    /**
     * Check if answer is correct
     */
    public function isAnswerCorrect($answer): bool
    {
        if ($this->question_type === 'multiple_choice' || 
            $this->question_type === 'true_false' ||
            $this->question_type === 'fill_blank') {
            
            // For fill_blank, do case-insensitive comparison
            if ($this->question_type === 'fill_blank') {
                return strtolower(trim($answer)) === strtolower(trim($this->correct_answer));
            }
            
            return $answer === $this->correct_answer;
        }

        // Essay questions require manual grading
        return false;
    }

    /**
     * Get difficulty label
     */
    public function getDifficultyLabel(): string
    {
        return self::DIFFICULTY_LEVELS[$this->difficulty] ?? 'Unknown';
    }

    /**
     * Get question type label
     */
    public function getTypeLabel(): string
    {
        return self::QUESTION_TYPES[$this->question_type] ?? 'Unknown';
    }

    /**
     * Get full image URL with storage path
     */
    public function getImageUrlAttribute($value)
    {
        if (!$value) {
            return null;
        }
        
        // If already a full URL (starts with http/https), return as is
        if (str_starts_with($value, 'http://') || str_starts_with($value, 'https://')) {
            return $value;
        }
        
        // If already has /storage/ at the beginning, return as is
        if (str_starts_with($value, '/storage/')) {
            return $value;
        }
        
        // If starts with 'storage/' (without leading slash), add leading slash
        if (str_starts_with($value, 'storage/')) {
            return '/' . $value;
        }
        
        // If starts with 'questions/', add /storage/ prefix
        if (str_starts_with($value, 'questions/')) {
            return '/storage/' . $value;
        }
        
        // Default: assume it's a filename in questions folder
        return '/storage/questions/' . $value;
    }
}
