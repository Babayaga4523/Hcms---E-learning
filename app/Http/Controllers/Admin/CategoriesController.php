<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CategoriesController extends Controller
{
    /**
     * Get all training program categories
     * Used by CreateProgramWithSteps and TrainingProgramEdit
     */
    public function index()
    {
        try {
            // Fetch categories from system settings (group='categories')
            $categorySettings = DB::table('system_settings')
                ->where('group', 'categories')
                ->orderBy('key')
                ->pluck('value')
                ->toArray();

            // If no categories in settings, fetch from modules table
            if (empty($categorySettings)) {
                $categorySettings = DB::table('modules')
                    ->select('category')
                    ->distinct()
                    ->whereNotNull('category')
                    ->orderBy('category')
                    ->pluck('category')
                    ->toArray();
            }

            if (empty($categorySettings)) {
                Log::warning('⚠️ No categories found in system or database');
                return response()->json([], 200);
            }

            Log::info('✅ Categories fetched successfully', [
                'count' => count($categorySettings),
                'categories' => $categorySettings
            ]);

            return response()->json($categorySettings, 200);
        } catch (\Exception $e) {
            Log::error('❌ Error fetching categories: ' . $e->getMessage(), [
                'exception' => $e,
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to fetch categories',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get categories with additional metadata
     */
    public function indexWithMetadata()
    {
        try {
                $categories = DB::table('modules')
                ->orderBy('category')
                ->get();

            if ($categories->isEmpty()) {
                Log::warning('⚠️ No categories with metadata found');
                return response()->json([], 200);
            }

            return response()->json($categories, 200);
        } catch (\Exception $e) {
            Log::error('❌ Error fetching categories with metadata: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to fetch categories',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create new category
     */
    public function store(Request $request)
    {
        $this->authorize('manage-settings');

        try {
            $validated = $request->validate([
                'category' => 'required|string|max:255|unique:system_settings,value|unique:modules,category'
            ]);

            // Save to system_settings
            $key = 'category_' . strtolower(str_replace(' ', '_', $validated['category']));

            DB::table('system_settings')->insert([
                'key' => $key,
                'value' => $validated['category'],
                'type' => 'string',
                'group' => 'categories',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            Log::info('✅ New category created: ' . $validated['category']);

            return response()->json([
                'message' => 'Category created successfully',
                'category' => $validated['category']
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('❌ Error creating category: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to create category',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete category
     */
    public function destroy(Request $request)
    {
        $this->authorize('manage-settings');

        try {
            $validated = $request->validate([
                'category' => 'required|string'
            ]);

            // Check if category is in use
            $inUse = DB::table('modules')
                ->where('category', $validated['category'])
                ->count();

            if ($inUse > 0) {
                return response()->json([
                    'message' => "Kategori masih digunakan oleh {$inUse} program",
                    'error' => 'Category in use'
                ], 409);
            }

            // Delete from system_settings
            DB::table('system_settings')
                ->where('group', 'categories')
                ->where('value', $validated['category'])
                ->delete();

            Log::info('✅ Category deleted: ' . $validated['category']);

            return response()->json([
                'message' => 'Category deleted successfully'
            ], 200);
        } catch (\Exception $e) {
            Log::error('❌ Error deleting category: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to delete category',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
