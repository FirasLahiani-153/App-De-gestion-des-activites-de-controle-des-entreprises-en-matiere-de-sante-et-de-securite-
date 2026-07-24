<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Same reasoning as type_visite: a growing location list handled poorly
        // by enums (needs a migration every change). Config file from now on.
        DB::statement("ALTER TABLE visites MODIFY COLUMN lieu VARCHAR(100) NULL");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE visites MODIFY COLUMN lieu ENUM(
            'Tunis', 'Ariana', 'Ben Arous', 'Manouba',
            'Nabeul', 'Zaghouan', 'Bizerte',
            'Béja', 'Jendouba', 'Le Kef', 'Siliana',
            'Sousse', 'Monastir', 'Mahdia',
            'Sfax', 'Kairouan', 'Kasserine', 'Sidi Bouzid',
            'Gabès', 'Médenine', 'Tataouine',
            'Gafsa', 'Tozeur', 'Kébili'
        ) NULL");
    }
};