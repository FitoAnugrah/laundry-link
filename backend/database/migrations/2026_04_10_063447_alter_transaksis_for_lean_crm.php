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
        Schema::table('transaksis', function (Blueprint $table) {
            // Drop existing FK to rebuild it with set null
            $table->dropForeign(['pelanggan_id']);
            
            // Make it nullable
            $table->unsignedBigInteger('pelanggan_id')->nullable()->change();
            
            // Re-add FK with onDelete('set null')
            $table->foreign('pelanggan_id')->references('id')->on('pelanggans')->onDelete('set null');

            // Add Temporary Customer data trackers
            $table->string('nama_sementara')->nullable();
            $table->string('wa_sementara')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transaksis', function (Blueprint $table) {
            $table->dropColumn(['nama_sementara', 'wa_sementara']);
            $table->dropForeign(['pelanggan_id']);
        });
    }
};
