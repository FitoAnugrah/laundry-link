<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Pelanggan;

class PelangganController extends Controller
{
    public function index()
    {
        return response()->json([
            'status' => 'success',
            'data' => Pelanggan::withCount('transaksis')
                ->withSum('transaksis', 'grand_total')
                ->with([
                    'transaksis' => function ($q) {
                        $q->latest()->with('detailTransaksis.layanan');
                    }
                ])
                ->latest()
                ->get()
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            // Tambahkan aturan unique di baris no_wa ini:
            'no_wa' => 'required|string|max:20|unique:pelanggans,no_wa',
            'alamat' => 'nullable|string' // Sesuaikan jika ada kolom alamat
        ], [
            // Tambahkan pesan custom ini agar lebih ramah dibaca kasir
            'no_wa.unique' => 'Gagal! Nomor WhatsApp ini sudah terdaftar sebagai Member.'
        ]);

        $pelanggan = Pelanggan::create($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Pelanggan berhasil ditambahkan.',
            'data' => $pelanggan
        ]);
    }
    public function updateAlamat(Request $request, Pelanggan $pelanggan)
    {
        $request->validate([
            'alamat' => 'nullable|string'
        ]);

        $pelanggan->update([
            'alamat' => $request->alamat
        ]);

        return response()->json(['status' => 'success']);
    }
}
