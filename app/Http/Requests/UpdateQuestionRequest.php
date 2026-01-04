<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class UpdateQuestionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = Auth::user();
        return $user && $user->role === 'admin';
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'quiz_id' => 'nullable|exists:quizzes,id',
            'module_id' => 'nullable|exists:modules,id',
            'category' => 'nullable|string|max:100',
            'question_text' => 'required|string|min:5|max:2000',
            'image_url' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120', // 5MB max
            'question_type' => 'required|in:multiple_choice,true_false,fill_blank,essay,short_answer,pretest,posttest',
            'difficulty' => 'required|in:easy,medium,hard',
            'points' => 'nullable|integer|min:1|max:100',
            'explanation' => 'nullable|string|max:5000',
            'option_a' => 'nullable|string|max:500',
            'option_b' => 'nullable|string|max:500',
            'option_c' => 'nullable|string|max:500',
            'option_d' => 'nullable|string|max:500',
            'correct_answer' => 'nullable|string|max:10',
        ];
    }

    /**
     * Get custom messages for validation errors.
     */
    public function messages(): array
    {
        return [
            'question_text.required' => 'Teks pertanyaan harus diisi',
            'question_text.min' => 'Teks pertanyaan minimal 5 karakter',
            'question_text.max' => 'Teks pertanyaan maksimal 1000 karakter',
            'question_type.required' => 'Tipe pertanyaan harus dipilih',
            'question_type.in' => 'Tipe pertanyaan tidak valid',
            'difficulty.required' => 'Tingkat kesulitan harus dipilih',
            'difficulty.in' => 'Tingkat kesulitan tidak valid',
            'points.integer' => 'Poin harus berupa angka',
            'points.min' => 'Poin minimal 1',
            'points.max' => 'Poin maksimal 10',
            'correct_answer.required' => 'Jawaban yang benar harus diisi',
            'correct_answer.max' => 'Jawaban maksimal 1000 karakter',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Ensure options is array for multiple choice
        if ($this->question_type === 'multiple_choice' && is_array($this->options)) {
            $this->merge([
                'options' => array_filter($this->options, fn($opt) => !empty($opt)),
            ]);
        }

        // Ensure points defaults based on difficulty
        if (empty($this->points)) {
            $difficultyPoints = [
                'easy' => 3,
                'medium' => 5,
                'hard' => 7,
            ];
            $this->merge([
                'points' => $difficultyPoints[$this->difficulty] ?? 5,
            ]);
        }
    }
}
