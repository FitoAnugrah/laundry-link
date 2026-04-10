<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Layanan;
use Inertia\Inertia;

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
        $layanan->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Layanan deleted successfully'
        ]);
    }
}
