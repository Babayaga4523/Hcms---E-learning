<?php

namespace App\Http\Controllers\User\Traits;

use App\Models\Module;
use App\Models\Quiz;
use App\Models\UserTraining;
use Illuminate\Support\Facades\Auth;

/**
 * Trait ValidatesQuizAccess
 * Centralized validation logic untuk Quiz access control
 * Mencegah DRY violation dan membuat maintenance lebih mudah
 */
trait ValidatesQuizAccess
{
    /**
     * Validasi apakah program sudah berakhir
     */
    protected function validateProgramNotEnded(Module $module, $returnType = 'exception')
    {
        if ($module->end_date && now() > $module->end_date) {
            $message = 'Program ini berakhir pada ' . $module->end_date->format('d M Y H:i');
            
            if ($returnType === 'exception') {
                return [
                    'success' => false,
                    'error' => 'Program telah berakhir',
                    'message' => $message . '. Anda tidak dapat mengerjakan quiz lagi.'
                ];
            }
            return null;
        }
        return null;
    }

    /**
     * Validasi apakah program sudah dimulai
     */
    protected function validateProgramStarted(Module $module)
    {
        if ($module->start_date && now() < $module->start_date) {
            return [
                'success' => false,
                'error' => 'Program belum dimulai',
                'message' => 'Program akan dimulai pada ' . $module->start_date->format('d M Y H:i') . '.'
            ];
        }
        return null;
    }

    /**
     * Validasi user sudah di-enroll ke program
     */
    protected function validateUserEnrolled($userId, $moduleId)
    {
        $userTraining = UserTraining::where('user_id', $userId)
            ->where('module_id', $moduleId)
            ->first();

        if (!$userTraining) {
            return [
                'success' => false,
                'error' => 'You are not assigned to this training'
            ];
        }
        
        return null;
    }

    /**
     * Validasi quiz tersedia dan aktif
     */
    protected function validateQuizExists($moduleId, $type)
    {
        $quiz = Quiz::where(function($query) use ($moduleId) {
            $query->where('module_id', $moduleId)
                  ->orWhere('training_program_id', $moduleId);
        })
            ->where('type', $type)
            ->where('is_active', true)
            ->first();

        if (!$quiz) {
            return [
                'success' => false,
                'error' => 'Quiz tidak tersedia',
                'message' => ucfirst($type) . ' quiz belum tersedia untuk training ini'
            ];
        }
        
        return null;
    }

    /**
     * Batch validation untuk full quiz access check
     * Menggabungkan semua validasi di atas dalam satu method
     */
    protected function validateFullQuizAccess($moduleId, $type, $userId = null)
    {
        if (!$userId) {
            $userId = Auth::id();
        }

        $module = Module::findOrFail($moduleId);

        // Check validasi satu per satu, stop di error pertama
        $validations = [
            $this->validateProgramNotEnded($module),
            $this->validateProgramStarted($module),
            $this->validateUserEnrolled($userId, $moduleId),
            $this->validateQuizExists($moduleId, $type),
        ];

        foreach ($validations as $validation) {
            if ($validation !== null) {
                return $validation;
            }
        }

        // Jika semua validasi pass, return data yang diperlukan
        return [
            'module' => $module,
            'quiz' => Quiz::where(function($query) use ($moduleId) {
                $query->where('module_id', $moduleId)
                      ->orWhere('training_program_id', $moduleId);
            })
                ->where('type', $type)
                ->where('is_active', true)
                ->first()
        ];
    }
}
