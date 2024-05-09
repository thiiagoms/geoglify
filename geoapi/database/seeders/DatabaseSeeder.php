<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Only creates the user if it isn't already in the database
        if (User::where('name', 'root')->doesntExist()) {
            User::create([
                'name' => 'root',
                'email' => 'hi@geoglify.com',
                'password' => Hash::make('geoglify2024'),
                'email_verified_at' => now(),
                'remember_token' => Str::random(10),
            ]);
        }
    }
}