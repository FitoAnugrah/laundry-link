<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Ambil 15 notifikasi terbaru milik user login.
     */
    public function index(Request $request)
    {
        $notifications = $request->user()
            ->notifications()
            ->latest()
            ->take(15)
            ->get()
            ->map(function ($notif) {
                return [
                    'id'         => $notif->id,
                    'type'       => $notif->type,
                    'title'      => $notif->data['title'] ?? '',
                    'message'    => $notif->data['message'] ?? '',
                    'icon'       => $notif->data['icon'] ?? 'bell',
                    'color'      => $notif->data['color'] ?? 'blue',
                    'read_at'    => $notif->read_at,
                    'created_at' => $notif->created_at->diffForHumans(),
                ];
            });

        $unreadCount = $request->user()->unreadNotifications()->count();

        return response()->json([
            'status' => 'success',
            'data' => $notifications,
            'unread_count' => $unreadCount,
        ]);
    }

    /**
     * Tandai satu notifikasi sebagai telah dibaca.
     */
    public function markAsRead(Request $request, $id)
    {
        $notification = $request->user()
            ->notifications()
            ->where('id', $id)
            ->first();

        if ($notification) {
            $notification->markAsRead();
        }

        return response()->json(['status' => 'success']);
    }

    /**
     * Tandai semua notifikasi sebagai telah dibaca.
     */
    public function markAllAsRead(Request $request)
    {
        $request->user()->unreadNotifications->markAsRead();

        return response()->json(['status' => 'success']);
    }
}
