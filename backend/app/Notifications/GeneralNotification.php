<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class GeneralNotification extends Notification
{
    use Queueable;

    protected $data;

    /**
     * Create a new notification instance.
     * 
     * @param array $data ['title', 'message', 'icon', 'color']
     */
    public function __construct(array $data)
    {
        $this->data = $data;
    }

    /**
     * Get the notification's delivery channels.
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title'   => $this->data['title'] ?? 'Notifikasi Baru',
            'message' => $this->data['message'] ?? '',
            'icon'    => $this->data['icon'] ?? 'bell',
            'color'   => $this->data['color'] ?? 'blue',
        ];
    }
}
