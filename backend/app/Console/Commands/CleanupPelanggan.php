<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

use App\Models\Pelanggan;

class CleanupPelanggan extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'crm:cleanup-pelanggan';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Hapus data pelanggan master (member) yang tidak memiliki transaksi dalam 60 hari terakhir';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info("Memulai proses pembersihan pelanggan tidak aktif (60 Hari)...");
        
        $cutoffDate = now()->subDays(60);
        
        $deletedCount = Pelanggan::whereDoesntHave('transaksis', function ($query) use ($cutoffDate) {
            $query->where('created_at', '>=', $cutoffDate);
        })->delete();
        
        $this->info("Proses selesai. {$deletedCount} pelanggan master telah ditertibkan.");
    }
}
