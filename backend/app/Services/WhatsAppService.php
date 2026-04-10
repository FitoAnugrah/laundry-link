<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    /**
     * URL Endpoint API WhatsApp Provider (e.g., Fonnte, Wablas, dll).
     * TODO: Masukkan URL endpoint yang sesungguhnya di sini atau set via config/env.
     */
    protected $apiUrl = 'https://api.fonnte.com/send'; 

    /**
     * API Key atau Token untuk otentikasi Provider WhatsApp Anda.
     * TODO: Ganti dengan token yang sesungguhnya atau tarik dari env('WA_TOKEN').
     */
    protected $token = 'YOUR_API_TOKEN_HERE';

    /**
     * Kirim notifikasi receipt/struk kasir saat transaksi baru diregistrasi.
     *
     * @param string $noWa
     * @param string $nama
     * @param string $noResi
     * @param int $grandTotal
     * @return bool
     */
    public function sendReceipt($noWa, $nama, $noResi, $grandTotal)
    {
        // 1. Format Pesan
        $pesan = "Halo *{$nama}*,\n\n"
               . "Terima kasih telah mempercayakan cucian Anda di *LaundryLink*.\n"
               . "Nomor Resi: *{$noResi}*\n"
               . "Total Tagihan: *Rp " . number_format($grandTotal, 0, ',', '.') . "*\n\n"
               . "Kami akan segera memproses pesanan Anda. Kami akan kabari jika sudah selesai!\n\n"
               . "_Pesan ini dikirim secara otomatis._";

        return $this->dispatchToProvider($noWa, $pesan);
    }

    /**
     * Kirim notifikasi saat status laundry berubah menjadi "Siap Diambil".
     *
     * @param string $noWa
     * @param string $nama
     * @param string $noResi
     * @return bool
     */
    public function sendPickupNotification($noWa, $nama, $noResi)
    {
        // 1. Format Pesan
        $pesan = "Yey! *{$nama}*,\n\n"
               . "Cucian kamu dengan Nomor Resi *{$noResi}* sudah *SELESAI* dan wangi!\n"
               . "Silakan ambil di outlet kami pada jam operasional ya.\n\n"
               . "Terima kasih,\n"
               . "*LaundryLink*";

        return $this->dispatchToProvider($noWa, $pesan);
    }

    /**
     * Fungsi sentral untuk menembak HTTP Client ke Provider.
     * 
     * @param string $noWa
     * @param string $pesan
     * @return bool
     */
    protected function dispatchToProvider($noWa, $pesan)
    {
        try {
            // TODO: Buka komentar di bawah ini saat provider asli sudah disiapkan.
            
            /*
            $response = Http::withHeaders([
                'Authorization' => $this->token, // Format otorisasi tiap provider berbeda
            ])->post($this->apiUrl, [
                'target' => $noWa,
                'message' => $pesan,
                'countryCode' => '62', // Penting untuk auto-format nomor (Fonnte/Wablas)
            ]);

            if ($response->successful()) {
                Log::info("WhatsApp berhasil dikirim ke: {$noWa}");
                return true;
            } else {
                Log::error("Gagal mengirim WhatsApp ke {$noWa}: " . $response->body());
                return false;
            }
            */

            // Dummy simulator for now
            Log::info("SIMULASI WA: Pesan '{$pesan}' terkirim ke {$noWa}");
            return true;

        } catch (\Exception $e) {
            Log::error("Error WA Service: " . $e->getMessage());
            return false;
        }
    }
}
