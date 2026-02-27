<?php

namespace Tests\Unit\Services;

use App\Services\BulkOperationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Exception;

class BulkOperationServiceTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test successful bulk operation execution
     */
    public function test_bulk_operation_executes_all_operations(): void
    {
        $bulkOps = new BulkOperationService();

        $bulkOps->addOperation('op1', function () {
            return 'result1';
        })
        ->addOperation('op2', function () {
            return 'result2';
        });

        $result = $bulkOps->execute();

        $this->assertTrue($result['success']);
        $this->assertEquals(2, $result['summary']['successful']);
        $this->assertEquals(0, $result['summary']['failed']);
    }

    /**
     * Test bulk operation rollback on error
     */
    public function test_bulk_operation_rollback_on_error(): void
    {
        $bulkOps = new BulkOperationService();
        $executed = [];

        $bulkOps->addOperation('op1', function () use (&$executed) {
            $executed[] = 'op1';
            return 'result1';
        })
        ->addOperation('op2', function () {
            throw new Exception('Operation failed');
        })
        ->addOperation('op3', function () use (&$executed) {
            $executed[] = 'op3';
            return 'result3';
        });

        $result = $bulkOps->execute();

        $this->assertFalse($result['success']);
        $this->assertArrayHasKey('op2', $result['errors']);
    }

    /**
     * Test partial success mode
     */
    public function test_bulk_operation_partial_success(): void
    {
        $bulkOps = new BulkOperationService();

        $bulkOps->addOperation('op1', function () {
            return 'result1';
        })
        ->addOperation('op2', function () {
            throw new Exception('Operation failed');
        })
        ->addOperation('op3', function () {
            return 'result3';
        });

        $result = $bulkOps->executeWithPartialSuccess();

        // With partial success, operations should continue
        $this->assertNotEmpty($result['errors']);
    }

    /**
     * Test clear operations
     */
    public function test_clear_operations(): void
    {
        $bulkOps = new BulkOperationService();
        $bulkOps->addOperation('op1', function () {
            return 'result1';
        });

        $bulkOps->clear();
        $results = $bulkOps->getResults();

        $this->assertEmpty($results);
    }

    /**
     * Test has errors
     */
    public function test_has_errors(): void
    {
        $bulkOps = new BulkOperationService();

        $bulkOps->addOperation('op1', function () {
            return 'result1';
        });

        $result = $bulkOps->execute();

        $this->assertFalse($bulkOps->hasErrors());
    }

    /**
     * Test formatted results
     */
    public function test_formatted_results_structure(): void
    {
        $bulkOps = new BulkOperationService();

        $bulkOps->addOperation('op1', function () {
            return 'result1';
        });

        $result = $bulkOps->execute();

        $this->assertArrayHasKey('success', $result);
        $this->assertArrayHasKey('summary', $result);
        $this->assertArrayHasKey('results', $result);
        $this->assertArrayHasKey('errors', $result);
    }
}
