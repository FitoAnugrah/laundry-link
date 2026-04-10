<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Pelanggan;
use Inertia\Inertia;

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
            'no_wa' => 'required|string|max:20',
            'alamat' => 'nullable|string',
        ]);

        $pelanggan = Pelanggan::create($validated);

        return response()->json([
            'status' => 'success',
            'data' => $pelanggan
        ], 201);
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
