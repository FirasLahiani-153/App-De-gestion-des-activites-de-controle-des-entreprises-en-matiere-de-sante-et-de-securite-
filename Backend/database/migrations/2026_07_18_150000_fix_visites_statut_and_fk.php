<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Add the missing "reportée" status (spec names 4 statuses; only 3 existed).
        //    Enum changes need raw SQL since Laravel's change() doesn't handle enums well.
        DB::statement("ALTER TABLE visites MODIFY COLUMN statut ENUM('programmée', 'en_cours', 'réalisée', 'reportée', 'annulée') NOT NULL DEFAULT 'programmée'");

        // 2. Protect audit trail: deleting an inspecteur's user account should NOT
        //    silently wipe their entire visit history. Require reassignment/deactivation
        //    instead of allowing a cascade delete.
        Schema::table('visites', function (Blueprint $table) {
            $table->dropForeign(['inspecteur_id']);
        });

        Schema::table('visites', function (Blueprint $table) {
            $table->foreign('inspecteur_id')
                ->references('id')->on('users')
                ->restrictOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('visites', function (Blueprint $table) {
            $table->dropForeign(['inspecteur_id']);
        });

        Schema::table('visites', function (Blueprint $table) {
            $table->foreign('inspecteur_id')
                ->references('id')->on('users')
                ->cascadeOnDelete();
        });

        DB::statement("ALTER TABLE visites MODIFY COLUMN statut ENUM('programmée', 'en_cours', 'réalisée', 'annulée') NOT NULL DEFAULT 'programmée'");
    }
};
