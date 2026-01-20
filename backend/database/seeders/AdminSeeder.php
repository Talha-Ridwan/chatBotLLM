<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash; // Added this to make the code cleaner

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::firstOrCreate(
            ['name' => 'root'], 
            [
                'email' => 'root@example.com',
                'password' => Hash::make('root'), 
                'role' => 'admin',   
                'is_active' => true,  
            ]
        );
    }
}