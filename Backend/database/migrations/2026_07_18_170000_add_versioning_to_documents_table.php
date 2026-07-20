<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            // Version history (cahier des charges 4.7: "Historique des versions").
            $table->unsignedInteger('version')->default(1)->after('taille');
            $table->foreignId('parent_document_id')->nullable()->after('version')
                ->constrained('documents')->cascadeOnDelete();
            $table->boolean('is_latest')->default(true)->after('parent_document_id');
        });

        // Audit-trail fix: deleting a user shouldn't silently wipe every document they uploaded.
        Schema::table('documents', function (Blueprint $table) {
            $table->dropForeign(['uploaded_by']);
        });
        Schema::table('documents', function (Blueprint $table) {
            $table->foreign('uploaded_by')->references('id')->on('users')->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropForeign(['uploaded_by']);
        });
        Schema::table('documents', function (Blueprint $table) {
            $table->foreign('uploaded_by')->references('id')->on('users')->cascadeOnDelete();
        });

        Schema::table('documents', function (Blueprint $table) {
            $table->dropForeign(['parent_document_id']);
            $table->dropColumn(['version', 'parent_document_id', 'is_latest']);
        });
    }
};