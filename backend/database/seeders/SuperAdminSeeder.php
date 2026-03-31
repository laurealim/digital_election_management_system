<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::firstOrCreate(
            ['email' => 'admin@dems.app'],
            [
                'name'            => 'Super Admin',
                'password'        => Hash::make('Admin@1234'),
                'password_set_at' => now(),
                'is_active'       => true,
            ]
        );

        $admin->assignRole('super_admin');
    }
}
