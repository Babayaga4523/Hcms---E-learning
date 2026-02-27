<?php

namespace App\Http\Controllers;

use App\Models\Module;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    /**
     * Get all available categories from modules
     */
    public function index()
    {
        // Get unique categories from modules table
        $categories = Module::where('is_active', true)
            ->distinct('category')
            ->pluck('category')
            ->filter(function($cat) {
                return !empty($cat);
            })
            ->values()
            ->toArray();

        // Map to frontend format
        $categoryMapping = [
            'Compliance' => ['id' => 'compliance', 'name' => 'Compliance', 'color' => 'blue'],
            'Leadership' => ['id' => 'leadership', 'name' => 'Leadership', 'color' => 'purple'],
            'Technical' => ['id' => 'technical', 'name' => 'Technical', 'color' => 'amber'],
            'Soft Skills' => ['id' => 'soft-skills', 'name' => 'Soft Skills', 'color' => 'green'],
            'Product' => ['id' => 'product', 'name' => 'Product Knowledge', 'color' => 'red'],
            'Core Business & Product' => ['id' => 'core-business', 'name' => 'Core Business', 'color' => 'indigo'],
            'Credit & Risk Management' => ['id' => 'credit-risk', 'name' => 'Credit & Risk', 'color' => 'orange'],
            'Collection & Recovery' => ['id' => 'collection', 'name' => 'Collection', 'color' => 'cyan'],
            'Sales & Marketing' => ['id' => 'sales-marketing', 'name' => 'Sales & Marketing', 'color' => 'pink'],
            'Service Excellence' => ['id' => 'service', 'name' => 'Service Excellence', 'color' => 'teal'],
            'Compliance & Regulatory' => ['id' => 'compliance-reg', 'name' => 'Compliance & Regulatory', 'color' => 'blue'],
            'Leadership & Soft Skills' => ['id' => 'leadership-soft-skills', 'name' => 'Leadership & Soft Skills', 'color' => 'purple'],
            'IT & Digital Security' => ['id' => 'it-security', 'name' => 'IT & Digital Security', 'color' => 'amber'],
        ];

        // Build response - DO NOT include "all", let frontend handle it
        $result = [];

        foreach ($categories as $category) {
            if (isset($categoryMapping[$category])) {
                $result[] = $categoryMapping[$category];
            } else {
                // For unknown categories, create a generic entry
                $result[] = [
                    'id' => strtolower(str_replace([' ', '&'], ['-', ''], $category)),
                    'name' => $category,
                    'color' => 'gray'
                ];
            }
        }

        return response()->json($result);
    }
}

