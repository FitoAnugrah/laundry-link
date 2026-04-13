<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Layanan;
class LayananController extends Controller
{
    public function index()
    {
        return response()->json([
            'status' => 'success',
            'data' => Layanan::latest()->get()
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama_layanan' => 'required|string|max:255',
            'jenis' => 'required|in:kiloan,satuan',
            'harga' => 'required|numeric|min:0',
        ]);

        $layanan = Layanan::create($validated);

        return response()->json([
            'status' => 'success',
            'data' => $layanan
        ], 201);
    }

    public function update(Request $request, Layanan $layanan)
    {
        $validated = $request->validate([
            'nama_layanan' => 'required|string|max:255',
            'jenis' => 'required|in:kiloan,satuan',
            'harga' => 'required|numeric|min:0',
        ]);

        $layanan->update($validated);

        return response()->json([
            'status' => 'success',
            'data' => $layanan
        ]);
    }

    public function destroy(Layanan $layanan)
    {
        // 1. Cek apakah layanan ini sudah terikat dengan riwayat transaksi
        $isUsed = \Illuminate\Support\Facades\DB::table('detail_transaksis')
            ->where('layanan_id', $layanan->id)
            ->exists();

        // 2. Jika sudah dipakai, tolak penghapusan! (Kembalikan status 422 Unprocessable Entity)
        if ($isUsed) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal! Layanan ini tidak bisa dihapus karena sudah memiliki riwayat transaksi.'
            ], 422);
        }

        // 3. Jika aman (belum pernah dipakai), baru boleh dihapus
        $layanan->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Layanan berhasil dihapus dari katalog.'
        ]);
    }
    // Fungsi untuk mengubah status Aktif / Non-aktif
    public function toggleStatus(Layanan $layanan)
    {
        $layanan->update([
            'is_active' => !$layanan->is_active
        ]);

        $status = $layanan->is_active ? 'diaktifkan' : 'dinonaktifkan';

        return response()->json([
            'status' => 'success',
            'message' => "Layanan berhasil {$status}!"
        ]);
    }
}
