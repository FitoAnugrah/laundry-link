<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

use App\Http\Controllers\PelangganController;
use App\Http\Controllers\LayananController;
use App\Http\Controllers\TransaksiController;
use App\Http\Controllers\NotificationController;

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

Route::middleware('auth:sanctum')->group(function () {
    // Pelanggan
    Route::get('pelanggan', [PelangganController::class, 'index']);
    Route::post('pelanggan', [PelangganController::class, 'store']);

    // Layanan
    Route::get('layanan', [LayananController::class, 'index']);
    Route::post('layanan', [LayananController::class, 'store']);
    Route::put('layanan/{layanan}', [LayananController::class, 'update']);
    Route::delete('layanan/{layanan}', [LayananController::class, 'destroy']);

    // Transaksi & Laporan
    Route::get('reports/statistics', [TransaksiController::class, 'statistics']);
    Route::get('transaksi', [TransaksiController::class, 'index']);
    Route::post('transaksi', [TransaksiController::class, 'store']);
    Route::patch('transaksi/{transaksi}/status', [TransaksiController::class, 'updateStatus']);
    Route::get('transaksi/{transaksi}/receipt', [TransaksiController::class, 'receipt']);
    Route::put('/pelanggan/{pelanggan}', [PelangganController::class, 'updateAlamat']);

    // Notifications
    Route::get('notifications', [NotificationController::class, 'index']);
    Route::patch('notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::post('notifications/read-all', [NotificationController::class, 'markAllAsRead']);
});
