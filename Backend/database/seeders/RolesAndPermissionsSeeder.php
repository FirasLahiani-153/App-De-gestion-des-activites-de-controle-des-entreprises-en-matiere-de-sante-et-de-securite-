<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * Create roles and permissions for the GACE application.
     *
     * Roles  : admin | inspecteur | responsable
     * Guard  : web (default)
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // ---------------------------------------------------------------
        // 1. Define all permissions
        // ---------------------------------------------------------------

        $allPermissions = [
            // --- Entreprises ---
            'voir-entreprises',
            'creer-entreprises',
            'modifier-entreprises',
            'supprimer-entreprises',

            // --- Inspections / Visites de contrôle ---
            'voir-inspections',
            'creer-inspections',
            'modifier-inspections',
            'supprimer-inspections',
            'planifier-inspections',

            // --- Rapports ---
            'voir-rapports',
            'creer-rapports',
            'modifier-rapports',
            'supprimer-rapports',
            'valider-rapports',
            'exporter-rapports',

            // --- Non-conformités ---
            'voir-nonconformites',
            'creer-nonconformites',
            'modifier-nonconformites',
            'cloturer-nonconformites',

            // --- Utilisateurs ---
            'voir-utilisateurs',
            'creer-utilisateurs',
            'modifier-utilisateurs',
            'supprimer-utilisateurs',
            'assigner-roles',

            // --- Statistiques / Tableau de bord ---
            'voir-statistiques',
            'voir-tableau-de-bord',

            // --- Paramètres système ---
            'gerer-parametres',
        ];

        foreach ($allPermissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // ---------------------------------------------------------------
        // 2. Create roles and assign permissions
        // ---------------------------------------------------------------

        // ----- ADMIN -----
        // Full access to everything
        $admin = Role::firstOrCreate(['name' => 'admin']);
        $admin->syncPermissions($allPermissions);

        // ----- INSPECTEUR -----
        // Can manage inspections and write reports; cannot delete/validate/manage users
        $inspecteur = Role::firstOrCreate(['name' => 'inspecteur']);
        $inspecteur->syncPermissions([
            'voir-entreprises',

            'voir-inspections',
            'creer-inspections',
            'modifier-inspections',
            'planifier-inspections',

            'voir-rapports',
            'creer-rapports',
            'modifier-rapports',
            'exporter-rapports',

            'voir-nonconformites',
            'creer-nonconformites',
            'modifier-nonconformites',

            'voir-tableau-de-bord',
        ]);

        // ----- RESPONSABLE -----
        // Read-only on most things; can validate and export reports, close non-conformities
        $responsable = Role::firstOrCreate(['name' => 'responsable']);
        $responsable->syncPermissions([
            'voir-entreprises',

            'voir-inspections',

            'voir-rapports',
            'valider-rapports',
            'exporter-rapports',

            'voir-nonconformites',
            'cloturer-nonconformites',

            'voir-statistiques',
            'voir-tableau-de-bord',
        ]);

        $this->command->info('✅ Roles and permissions seeded successfully.');
        $this->command->table(
            ['Role', 'Permissions Count'],
            [
                ['admin',        $admin->permissions()->count()],
                ['inspecteur',   $inspecteur->permissions()->count()],
                ['responsable',  $responsable->permissions()->count()],
            ]
        );
    }
}
