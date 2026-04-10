<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendWhatsAppNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $type;
    public $payload;

    /**
     * Create a new job instance.
     * 
     * @param string $type Tipe notifikasi ('receipt' atau 'pickup')
     * @param array $payload Data transaksi
     */
    public function __construct($type, $payload)
    {
        $this->type = $type;
        $this->payload = $payload;
    }

    public function handle(\App\Services\WhatsAppService $waService): void
    {
        if ($this->type === 'receipt') {
            $waService->sendReceipt(
                $this->payload['no_wa'],
                $this->payload['nama'],
                $this->payload['no_resi'],
                $this->payload['grand_total']
            );
        } elseif ($this->type === 'pickup') {
            $waService->sendPickupNotification(
                $this->payload['no_wa'],
                $this->payload['nama'],
                $this->payload['no_resi']
            );
        }
    }
}
