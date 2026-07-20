<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('infractions', function (Blueprint $table) {
            // Auto-computed at creation time: true if this entreprise already had
            // at least one prior infraction before this one (cahier des charges 4.5:
            // "Gestion des récidives").
            $table->boolean('is_recidive')->default(false)->after('gravite');
        });
    }

    public function down(): void
    {
        Schema::table('infractions', function (Blueprint $table) {
            $table->dropColumn('is_recidive');
        });
    }
};