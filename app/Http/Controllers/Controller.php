<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

/**
 * Base controller class providing authorization traits
 */
abstract class Controller
{
    use AuthorizesRequests;
}
