<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Quiz Configuration
    |--------------------------------------------------------------------------
    |
    | Konfigurasi untuk quiz system di LMS
    |
    */

    // Maksimum jumlah attempt untuk setiap kuis
    // Bisa di-override per-quiz di database column max_attempts
    'max_attempts' => env('QUIZ_MAX_ATTEMPTS', 3),

    // Passing score default (dalam persen)
    'default_passing_score' => env('QUIZ_PASSING_SCORE', 70),

    // Default time limit untuk quiz (dalam menit)
    'default_time_limit' => env('QUIZ_TIME_LIMIT', 60),

    // Apakah tampilkan jawaban benar setelah submit
    'show_answers_after_submit' => env('QUIZ_SHOW_ANSWERS', true),

    // Enable question shuffling untuk security
    'shuffle_questions' => env('QUIZ_SHUFFLE_QUESTIONS', true),

    // Enable option shuffling untuk setiap question
    'shuffle_options' => env('QUIZ_SHUFFLE_OPTIONS', false),

    // Cache quiz untuk performance (dalam menit)
    'cache_duration' => env('QUIZ_CACHE_DURATION', 60),

    // Enable pre-test requirement sebelum post-test
    'require_pretest' => env('QUIZ_REQUIRE_PRETEST', true),

    // Enable material completion requirement sebelum post-test
    'require_all_materials' => env('QUIZ_REQUIRE_MATERIALS', true),

];
