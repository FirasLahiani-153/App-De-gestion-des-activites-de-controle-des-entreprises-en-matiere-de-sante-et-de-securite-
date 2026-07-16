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
        Schema::create('infractions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rapport_id')->constrained('rapports')->cascadeOnDelete();
            $table->foreignId('entreprise_id')->constrained('entreprises')->cascadeOnDelete();
            $table->text('description');
            $table->text('recommandation')->nullable();
            $table->enum('gravite', ['mineure', 'majeure', 'critique']);
            $table->date('date_limite_correction');
            $table->enum('statut_correction', ['non_resolue', 'en_cours', 'resolue'])->default('non_resolue');
            $table->date('date_resolution')->nullable();
            $table->date('mise_en_demeure_date')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('infractions');
    }
};
