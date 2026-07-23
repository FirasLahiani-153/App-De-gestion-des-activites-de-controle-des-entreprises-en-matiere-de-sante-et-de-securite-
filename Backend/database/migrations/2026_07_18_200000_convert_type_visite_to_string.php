<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Switching from a hardcoded enum(3 values) to a plain string validated
        // against config/visit_types.php — the type list has 70 entries and will
        // keep evolving, which enums handle poorly (needs a migration every change).
        DB::statement("ALTER TABLE visites MODIFY COLUMN type_visite VARCHAR(100) NOT NULL");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE visites MODIFY COLUMN type_visite ENUM('initiale', 'suivi', 'inopinée') NOT NULL");
    }
};