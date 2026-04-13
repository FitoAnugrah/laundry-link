<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Notifications\GeneralNotification;
use Illuminate\Console\Command;

class SendTestNotification extends Command
{
    protected $signature = 'notif:test {--user=1 : ID user penerima} {--clear : Hapus semua notifikasi tanpa mengirim baru}';

    protected $description = 'Kirim notifikasi percobaan ke user tertentu. Gunakan --clear untuk menghapus semua.';

    public function handle()
    {
        $userId = $this->option('user');
        $user = User::find($userId);

        if (!$user) {
            $this->error("User dengan ID {$userId} tidak ditemukan.");
            return 1;
        }

        // --clear: hapus semua notifikasi user ini tanpa kirim yang baru
        if ($this->option('clear')) {
            $deleted = \DB::table('notifications')
                ->where('notifiable_id', $user->id)
                ->where('notifiable_type', \App\Models\User::class)
                ->delete();
            $this->info("🗑️  {$deleted} notifikasi milik {$user->name} berhasil dihapus.");
            return 0;
        }

        $samples = [
            [
                'title' => '⚠️ Pesanan #0005 Hampir Terlambat!',
                'message' => 'SLA 48 jam tersisa kurang dari 6 jam. Segera selesaikan pesanan ini.',
                'icon' => 'alert',
                'color' => 'red',
            ],
            [
                'title' => '🌟 Member Baru Otomatis!',
                'message' => 'Pelanggan "Budi Santoso" (0812xxx) telah mencapai 5 transaksi dan dipromosikan menjadi Member.',
                'icon' => 'star',
                'color' => 'yellow',
            ],
            [
                'title' => '✅ Pesanan #0012 Selesai',
                'message' => 'Pesanan telah ditandai "Siap Diambil". Notifikasi WhatsApp sudah dikirim.',
                'icon' => 'check',
                'color' => 'green',
            ],
            [
                'title' => '💰 Target Harian Tercapai!',
                'message' => 'Pendapatan hari ini telah melampaui Rp 500.000. Kerja bagus!',
                'icon' => 'trending',
                'color' => 'blue',
            ],
        ];

        foreach ($samples as $data) {
            $user->notify(new GeneralNotification($data));
        }

        $this->info("✅ Berhasil mengirim " . count($samples) . " notifikasi test ke {$user->name} (ID: {$userId})");
        return 0;
    }
}
