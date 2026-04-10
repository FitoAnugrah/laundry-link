<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Transaksi extends Model
{
    use HasFactory;

    protected $fillable = [
        'pelanggan_id',
        'nama_sementara',
        'wa_sementara',
        'user_id',
        'total_harga',
        'diskon',
        'grand_total',
        'metode_pembayaran',
        'status_pembayaran',
        'status_pesanan'
    ];

    public function pelanggan()
    {
        return $this->belongsTo(Pelanggan::class);
    }

    public function kasir()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function detailTransaksis()
    {
        return $this->hasMany(DetailTransaksi::class);
    }
    public function user()
{
    return $this->belongsTo(User::class, 'user_id');
}
}
