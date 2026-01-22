<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\TrainingMaterial>
 */
class TrainingMaterialFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'module_id' => \App\Models\Module::factory(),
            'title' => $this->faker->sentence,
            'description' => $this->faker->paragraph,
            'file_type' => 'document',
            'file_path' => 'materials/sample.pdf',
            'file_name' => 'sample.pdf',
            'file_size' => 1024,
            'duration_minutes' => 10,
            'order' => 1,
            'uploaded_by' => \App\Models\User::factory(),
        ];
    }
}
