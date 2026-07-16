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
        Schema::create('rapports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('visite_id')->constrained('visites')->cascadeOnDelete();
            $table->string('reference')->unique();
            $table->dateTime('date_redaction');
            $table->enum('statut', ['brouillon', 'en_attente_validation', 'validé', 'envoyé'])->default('brouillon');
            $table->text('resume')->nullable();
            $table->string('pdf_path')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rapports');
    }
};
