<?php

use Illuminate\Support\Facades\Route;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;

Route::get('/debug/admin-password', function() {
    $admin = User::where('email', 'admin@example.com')->first();
    
    echo "<h1>Admin Password Debug</h1>";
    
    if (!$admin) {
        echo "<p style='color: red'>❌ Admin user not found</p>";
        return;
    }
    
    echo "<p><strong>Admin Email:</strong> {$admin->email}</p>";
    echo "<p><strong>Admin Name:</strong> {$admin->name}</p>";
    echo "<p><strong>Password Hash in DB:</strong> {$admin->password}</p>";
    
    echo "<hr>";
    echo "<h2>Test Password Verification</h2>";
    
    $testPasswords = ['password', 'Password', '123456', 'admin', 'password123'];
    
    echo "<table border='1' cellpadding='10'>";
    echo "<tr><th>Password Tested</th><th>Hash Match?</th></tr>";
    
    foreach ($testPasswords as $pass) {
        $match = Hash::check($pass, $admin->password) ? '✓ YES' : '✗ NO';
        $color = Hash::check($pass, $admin->password) ? 'green' : 'red';
        echo "<tr><td>{$pass}</td><td style='color: {$color}'><strong>{$match}</strong></td></tr>";
    }
    
    echo "</table>";
    
    echo "<hr>";
    echo "<h2>Test Login Attempt</h2>";
    
    if (Auth::attempt(['email' => 'admin@example.com', 'password' => 'password'])) {
        echo "<p style='color: green'><strong>✓ Login dengan password 'password' BERHASIL!</strong></p>";
        Auth::logout();
    } else {
        echo "<p style='color: red'><strong>✗ Login dengan password 'password' GAGAL</strong></p>";
    }
});
