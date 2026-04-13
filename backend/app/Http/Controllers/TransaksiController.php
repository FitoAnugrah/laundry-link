<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Transaksi;
use App\Models\DetailTransaksi;
use App\Models\Pelanggan;
use App\Models\Layanan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

class TransaksiController extends Controller
{
    public function index(Request $request)
    {
        $query = Transaksi::with(['pelanggan'])->latest();

        // Jika ada request bulan dari React (contoh: 2026-04)
        if ($request->has('month') && $request->month != '') {
            $targetDate = \Carbon\Carbon::createFromFormat('Y-m', $request->query('month'));
            $query->whereMonth('created_at', $targetDate->month)
                ->whereYear('created_at', $targetDate->year);
        }

        return response()->json([
            'status' => 'success',
            'data' => $query->get()
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama_sementara' => 'required|string|max:255',
            'wa_sementara' => 'required|string|max:20',
            'metode_pembayaran' => 'required|in:tunai,qris',
            'status_pembayaran' => 'required|in:belum lunas,lunas',
            'status_pesanan' => 'required|in:masuk,dicuci,disetrika,siap diambil,selesai',
            'layanan' => 'required|array|min:1',
            'layanan.*.id' => 'required|exists:layanans,id',
            'layanan.*.qty_atau_berat' => 'required|numeric|min:0.1',
            'diskon' => 'nullable|numeric|min:0'
        ]);

        try {
            DB::beginTransaction();

            $total_harga = 0;
            $detail_inserts = [];

            foreach ($validated['layanan'] as $item) {
                $layanan = Layanan::find($item['id']);
                $subtotal = $layanan->harga * $item['qty_atau_berat'];
                $total_harga += $subtotal;

                $detail_inserts[] = [
                    'layanan_id' => $layanan->id,
                    'qty_atau_berat' => $item['qty_atau_berat'],
                    'subtotal' => $subtotal,
                ];
            }

            $diskon = isset($validated['diskon']) ? (int) $validated['diskon'] : 0;
            $grand_total = max(0, $total_harga - $diskon);

            $wa = $validated['wa_sementara'];
            $nama = $validated['nama_sementara'];
            $pelanggan_id = null;

            $existingPelanggan = Pelanggan::where('no_wa', $wa)->first();

            if ($existingPelanggan) {
                $existingPelanggan->increment('total_transaksi');
                $pelanggan_id = $existingPelanggan->id;
            } else {
                $recentCount = Transaksi::where('wa_sementara', $wa)
                    ->whereDate('created_at', '>=', now()->subDays(30))
                    ->count();

                if (($recentCount + 1) >= 5) {
                    $newPelanggan = Pelanggan::create([
                        'nama' => $nama,
                        'no_wa' => $wa,
                        'total_transaksi' => $recentCount + 1
                    ]);
                    $pelanggan_id = $newPelanggan->id;

                    // Retroactively map previous anonymous transactions
                    Transaksi::where('wa_sementara', $wa)->update(['pelanggan_id' => $pelanggan_id]);
                }
            }

            $transaksi = Transaksi::create([
                'user_id' => auth()->id() ?? 1, // Ambil ID kasir yg login, atau default ke 1
                'pelanggan_id' => $pelanggan_id,
                'nama_sementara' => $nama,
                'wa_sementara' => $wa,
                'total_harga' => $total_harga,
                'diskon' => $diskon,
                'grand_total' => $grand_total,
                'metode_pembayaran' => $validated['metode_pembayaran'],
                'status_pembayaran' => $validated['status_pembayaran'],
                'status_pesanan' => $validated['status_pesanan'],
            ]);

            foreach ($detail_inserts as $detail) {
                $transaksi->detailTransaksis()->create($detail);
            }

            DB::commit();

            // Dispatch WA Receipt Async Job
            \App\Jobs\SendWhatsAppNotification::dispatch('receipt', [
                'no_wa' => $wa,
                'nama' => $nama,
                'no_resi' => 'TRX-' . str_pad($transaksi->id, 5, '0', STR_PAD_LEFT),
                'grand_total' => $grand_total,
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Transaksi berhasil disimpan!',
                'data' => $transaksi->load('detailTransaksis')
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Terjadi kesalahan: ' . $e->getMessage()
            ], 500);
        }
    }

    public function updateStatus(Request $request, Transaksi $transaksi)
    {
        $validated = $request->validate([
            'status_pesanan' => 'required|in:masuk,dicuci,disetrika,siap diambil,selesai'
        ]);

        $transaksi->update($validated);

        if ($validated['status_pesanan'] === 'siap diambil' && $transaksi->wa_sementara) {
            \App\Jobs\SendWhatsAppNotification::dispatch('pickup', [
                'no_wa' => $transaksi->wa_sementara,
                'nama' => $transaksi->nama_sementara ?? 'Pelanggan',
                'no_resi' => 'TRX-' . str_pad($transaksi->id, 5, '0', STR_PAD_LEFT),
            ]);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Status pesanan berhasil diperbarui!',
            'data' => $transaksi
        ]);
        Notification::send($userAdmin, new \Illuminate\Notifications\Notification([
            'via' => ['database'],
            'database' => [
                'title' => 'Pesanan #' . $transaksi->id . ' Siap Diambil!',
                'message' => 'Cucian atas nama ' . $transaksi->nama_sementara . ' sudah selesai.',
                'type' => 'success'
            ]
        ]));
    }

    public function statistics(Request $request)
    {
        // Tangkap parameter bulan, default ke bulan ini jika kosong
        $monthParam = $request->query('month', now()->format('Y-m'));
        $targetDate = \Carbon\Carbon::createFromFormat('Y-m', $monthParam);

        $bulan = $targetDate->month;
        $tahun = $targetDate->year;

        $pendapatanHariIni = 0;
        $pendapatanMingguIni = 0;

        // Hitung Hari Ini & Minggu Ini HANYA jika yang dipilih adalah bulan sekarang
        if ($monthParam === now()->format('Y-m')) {
            $today = \Carbon\Carbon::today();
            $startOfWeek = \Carbon\Carbon::now()->startOfWeek();

            $pendapatanHariIni = Transaksi::where('status_pembayaran', 'lunas')
                ->whereDate('created_at', $today)
                ->sum('grand_total');

            $pendapatanMingguIni = Transaksi::where('status_pembayaran', 'lunas')
                ->where('created_at', '>=', $startOfWeek)
                ->sum('grand_total');
        }

        // Hitung akumulasi 1 bulan penuh berdasarkan kalender yang dipilih
        $pendapatanBulanIni = Transaksi::where('status_pembayaran', 'lunas')
            ->whereMonth('created_at', $bulan)
            ->whereYear('created_at', $tahun)
            ->sum('grand_total');

        return response()->json([
            'status' => 'success',
            'data' => [
                'pendapatan_hari_ini' => (int) $pendapatanHariIni,
                'pendapatan_minggu_ini' => (int) $pendapatanMingguIni,
                'pendapatan_bulan_ini' => (int) $pendapatanBulanIni,
            ]
        ]);
    }
    public function receipt(Transaksi $transaksi)
    {
        $transaksi->load(['pelanggan', 'detailTransaksis.layanan']);
        return response()->json([
            'status' => 'success',
            'data' => $transaksi
        ]);
    }
}
