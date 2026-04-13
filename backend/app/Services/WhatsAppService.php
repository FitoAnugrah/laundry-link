<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    /**
     * ═══════════════════════════════════════════════════════════════
     *  MODE SAAT INI: LOGGING ONLY
     *  wa.me link di-generate langsung di frontend (POSCreate.jsx).
     *  
     *  UNTUK MIGRASI KE META / FONNTE DI MASA DEPAN:
     *  1. Ganti .env dengan token API yang sesuai
     *  2. Uncomment blok kode "META" atau "FONNTE" di bawah
     *  3. Delete blok Log::info() dummy ini
     *  4. Tidak ada perubahan di TransaksiController atau Job!
     * ═══════════════════════════════════════════════════════════════
     */

    /**
     * Notifikasi struk — saat ini dicatat ke log saja.
     * wa.me link untuk kasir di-generate di frontend (POSCreate.jsx).
     */
    public function sendReceipt(string $noWa, string $nama, string $noResi, int $grandTotal): bool
    {
        Log::info("[WhatsApp] [MODE: wa.me] Struk untuk {$nama} ({$noWa})", [
            'resi'        => $noResi,
            'grand_total' => $grandTotal,
            'wa_link'     => $this->generateWaLink($noWa, $this->buildReceiptMessage($nama, $noResi, $grandTotal)),
        ]);

        return true;
    }

    /**
     * Notifikasi pickup — saat ini dicatat ke log saja.
     */
    public function sendPickupNotification(string $noWa, string $nama, string $noResi): bool
    {
        Log::info("[WhatsApp] [MODE: wa.me] Pickup untuk {$nama} ({$noWa})", [
            'resi'    => $noResi,
            'wa_link' => $this->generateWaLink($noWa, $this->buildPickupMessage($nama, $noResi)),
        ]);

        return true;
    }

    /* ─────────────────────────────────────────────────────────────
     |  HELPER: Generate wa.me link (digunakan juga oleh frontend
     |  via response atau bisa dipanggil langsung jika perlu)
     ───────────────────────────────────────────────────────────── */

    public function generateWaLink(string $noWa, string $pesan): string
    {
        $noWa = $this->normalizeNumber($noWa);
        return 'https://wa.me/' . $noWa . '?text=' . rawurlencode($pesan);
    }

    public function buildReceiptMessage(string $nama, string $noResi, int $grandTotal): string
    {
        $total = 'Rp ' . number_format($grandTotal, 0, ',', '.');

        return "Halo *{$nama}* 👋\n\n"
             . "Terima kasih telah mempercayakan cucian Anda di *LaundryLink* 🧺\n\n"
             . "📋 *Detail Pesanan:*\n"
             . "No. Resi : *{$noResi}*\n"
             . "Total    : *{$total}*\n\n"
             . "Pesanan Anda sedang kami proses. Kami akan kabari jika sudah siap diambil! ✨\n\n"
             . "_LaundryLink_";
    }

    public function buildPickupMessage(string $nama, string $noResi): string
    {
        return "Halo *{$nama}* 🎉\n\n"
             . "Cucian Anda (*{$noResi}*) sudah *SELESAI* dan siap diambil! ✅\n\n"
             . "Silakan ambil di outlet kami sesuai jam operasional ya 🙏\n\n"
             . "Terima kasih,\n*LaundryLink* 🧺";
    }

    /* ─────────────────────────────────────────────────────────────
     |  UPGRADE PATH — MASA DEPAN
     |  Uncomment salah satu blok di bawah dan hapus blok Log di atas
     ───────────────────────────────────────────────────────────── */

    /*
    // ── META CLOUD API ──────────────────────────────────────────
    protected function sendViaMetaAPI(string $noWa, array $payload): bool
    {
        $token  = env('META_WA_TOKEN');
        $phoneId = env('META_WA_PHONE_NUMBER_ID');
        $version = env('META_WA_API_VERSION', 'v22.0');

        $response = \Illuminate\Support\Facades\Http::timeout(15)
            ->withToken($token)
            ->acceptJson()
            ->post("https://graph.facebook.com/{$version}/{$phoneId}/messages", $payload);

        if ($response->successful() && isset($response->json()['messages'][0]['id'])) {
            \Illuminate\Support\Facades\Log::info("[WhatsApp-Meta] Terkirim ke {$noWa}");
            return true;
        }

        \Illuminate\Support\Facades\Log::error("[WhatsApp-Meta] Gagal", $response->json());
        return false;
    }
    */

    /*
    // ── FONNTE API ──────────────────────────────────────────────
    protected function sendViaFonnte(string $noWa, string $pesan): bool
    {
        $response = \Illuminate\Support\Facades\Http::timeout(15)
            ->withHeaders(['Authorization' => env('FONNTE_TOKEN')])
            ->asForm()
            ->post('https://api.fonnte.com/send', [
                'target'      => $noWa,
                'message'     => $pesan,
                'countryCode' => env('FONNTE_COUNTRY_CODE', '62'),
            ]);

        return $response->successful();
    }
    */

    /* ─────────────────────────────────────────────────────────────
     |  UTILITY
     ───────────────────────────────────────────────────────────── */

    protected function normalizeNumber(string $noWa): string
    {
        $noWa = preg_replace('/[\s\-\(\)]/', '', $noWa);

        if (str_starts_with($noWa, '+')) {
            return ltrim($noWa, '+');
        }

        if (str_starts_with($noWa, '0')) {
            return '62' . substr($noWa, 1);
        }

        return $noWa;
    }
}
