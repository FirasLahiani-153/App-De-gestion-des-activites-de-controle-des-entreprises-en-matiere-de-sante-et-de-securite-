<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('rapports', function (Blueprint $table) {
            // The inspector sets the entreprise's risk level when writing the report
            // for a visit — this then propagates onto entreprises.niveau_risque.
            $table->enum('niveau_risque', ['faible', 'moyen', 'eleve'])->nullable()->after('resume');
        });
    }

    public function down(): void
    {
        Schema::table('rapports', function (Blueprint $table) {
            $table->dropColumn('niveau_risque');
        });
    }
};