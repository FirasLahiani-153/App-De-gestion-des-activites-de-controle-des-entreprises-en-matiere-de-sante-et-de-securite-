<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('visites', function (Blueprint $table) {
            $table->id();
            $table->foreignId('entreprise_id')->constrained('entreprises')->cascadeOnDelete();
            $table->foreignId('inspecteur_id')->constrained('users')->cascadeOnDelete();
            $table->enum('type_visite', ['initiale', 'suivi', 'inopinée'])->default('initiale');
            $table->enum('statut', ['programmée', 'en_cours', 'réalisée', 'annulée'])->default('programmée');
            $table->dateTime('date_prevue');
            $table->dateTime('date_realisation')->nullable();
            $table->text('objectif')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('visites');
    }
};
