<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Closure;
use Exception;

/**
 * BulkOperationService
 * Handles bulk operations with atomic transactions and rollback support
 */
class BulkOperationService
{
    protected $operations = [];
    protected $results = [];
    protected $errors = [];

    /**
     * Create a new bulk operation
     */
    public function __construct()
    {
        $this->operations = [];
        $this->results = [];
        $this->errors = [];
    }

    /**
     * Add an operation to the batch
     */
    public function addOperation(string $key, Closure $operation): self
    {
        $this->operations[$key] = $operation;
        return $this;
    }

    /**
     * Execute all operations atomically
     */
    public function execute(): array
    {
        DB::beginTransaction();

        try {
            foreach ($this->operations as $key => $operation) {
                try {
                    $result = $operation();
                    $this->results[$key] = [
                        'success' => true,
                        'data' => $result,
                    ];
                } catch (Exception $e) {
                    // Rollback entire transaction on first error
                    DB::rollBack();

                    $this->results[$key] = [
                        'success' => false,
                        'error' => $e->getMessage(),
                    ];

                    // Collect all errors
                    $this->errors[$key] = $e->getMessage();

                    return $this->formatResults();
                }
            }

            // All operations successful - commit transaction
            DB::commit();

            return $this->formatResults();
        } catch (Exception $e) {
            DB::rollBack();

            return [
                'success' => false,
                'error' => 'Batch operation failed: ' . $e->getMessage(),
                'results' => [],
            ];
        }
    }

    /**
     * Execute operations with partial success (no rollback)
     */
    public function executeWithPartialSuccess(): array
    {
        DB::beginTransaction();

        $anyError = false;

        try {
            foreach ($this->operations as $key => $operation) {
                try {
                    $result = $operation();
                    $this->results[$key] = [
                        'success' => true,
                        'data' => $result,
                    ];
                } catch (Exception $e) {
                    $anyError = true;
                    $this->results[$key] = [
                        'success' => false,
                        'error' => $e->getMessage(),
                    ];
                    $this->errors[$key] = $e->getMessage();
                }
            }

            if ($anyError) {
                DB::rollBack();
            } else {
                DB::commit();
            }

            return $this->formatResults();
        } catch (Exception $e) {
            DB::rollBack();

            return [
                'success' => false,
                'error' => 'Batch operation encountered critical error: ' . $e->getMessage(),
                'results' => [],
            ];
        }
    }

    /**
     * Format results for response
     */
    private function formatResults(): array
    {
        $successful = collect($this->results)->filter(fn($r) => $r['success'] ?? false)->count();
        $failed = collect($this->results)->filter(fn($r) => !($r['success'] ?? false))->count();

        return [
            'success' => empty($this->errors),
            'summary' => [
                'total' => count($this->operations),
                'successful' => $successful,
                'failed' => $failed,
            ],
            'results' => $this->results,
            'errors' => $this->errors,
        ];
    }

    /**
     * Clear operations
     */
    public function clear(): self
    {
        $this->operations = [];
        $this->results = [];
        $this->errors = [];
        return $this;
    }

    /**
     * Get all results
     */
    public function getResults(): array
    {
        return $this->results;
    }

    /**
     * Get all errors
     */
    public function getErrors(): array
    {
        return $this->errors;
    }

    /**
     * Check if there were any errors
     */
    public function hasErrors(): bool
    {
        return !empty($this->errors);
    }
}
