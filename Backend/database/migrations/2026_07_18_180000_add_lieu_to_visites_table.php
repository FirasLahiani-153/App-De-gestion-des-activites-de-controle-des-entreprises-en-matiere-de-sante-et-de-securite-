<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('visites', function (Blueprint $table) {
            $table->enum('lieu', [
                'Tunis', 'Ariana', 'Ben Arous', 'Manouba',
                'Nabeul', 'Zaghouan', 'Bizerte',
                'Béja', 'Jendouba', 'Le Kef', 'Siliana',
                'Sousse', 'Monastir', 'Mahdia',
                'Sfax', 'Kairouan', 'Kasserine', 'Sidi Bouzid',
                'Gabès', 'Médenine', 'Tataouine',
                'Gafsa', 'Tozeur', 'Kébili',
            ])->nullable()->after('type_visite');
        });
    }

    public function down(): void
    {
        Schema::table('visites', function (Blueprint $table) {
            $table->dropColumn('lieu');
        });
    }
};