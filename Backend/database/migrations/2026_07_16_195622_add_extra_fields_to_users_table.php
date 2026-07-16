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
        Schema::table('users', function (Blueprint $table) {
            // Employee / agent identifier (e.g. "INS-2024-001")
            $table->string('matricule')->nullable()->unique()->after('name');

            // Contact phone number
            $table->string('phone', 20)->nullable()->after('email');

            // Soft-disable an account without deleting it
            $table->boolean('is_active')->default(true)->after('remember_token');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['matricule', 'phone', 'is_active']);
        });
    }
};
