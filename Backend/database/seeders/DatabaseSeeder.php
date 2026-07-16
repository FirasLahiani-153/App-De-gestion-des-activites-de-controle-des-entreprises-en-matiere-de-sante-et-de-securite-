<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Create all roles and permissions first
        $this->call(RolesAndPermissionsSeeder::class);

        // 2. Create a default admin user for testing
        $admin = User::firstOrCreate(
            ['email' => 'admin@gace.tn'],
            [
                'name'     => 'Admin GACE',
                'password' => Hash::make('password'),
            ]
        );
        $admin->assignRole('admin');

        // 3. Create a sample inspecteur
        $inspecteur = User::firstOrCreate(
            ['email' => 'inspecteur@gace.tn'],
            [
                'name'     => 'Inspecteur Test',
                'password' => Hash::make('password'),
            ]
        );
        $inspecteur->assignRole('inspecteur');

        // 4. Create a sample responsable
        $responsable = User::firstOrCreate(
            ['email' => 'responsable@gace.tn'],
            [
                'name'     => 'Responsable Test',
                'password' => Hash::make('password'),
            ]
        );
        $responsable->assignRole('responsable');

        $this->command->info('✅ Test users created:');
        $this->command->table(
            ['Name', 'Email', 'Role', 'Password'],
            [
                ['Admin GACE',       'admin@gace.tn',       'admin',       'password'],
                ['Inspecteur Test',  'inspecteur@gace.tn',  'inspecteur',  'password'],
                ['Responsable Test', 'responsable@gace.tn', 'responsable', 'password'],
            ]
        );
    }
}

