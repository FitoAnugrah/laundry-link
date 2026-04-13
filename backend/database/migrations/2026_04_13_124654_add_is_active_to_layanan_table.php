<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::table('layanans', function (Blueprint $table) {
            // Tambahkan kolom boolean, default-nya true (aktif)
            $table->boolean('is_active')->default(true)->after('harga');
        });
    }

    public function down()
    {
        Schema::table('layanans', function (Blueprint $table) {
            $table->dropColumn('is_active');
        });
    }
};
