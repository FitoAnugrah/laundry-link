<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Pelanggan extends Model
{
    use HasFactory;

    protected $fillable = [
        'nama',
        'no_wa',
        'alamat',
        'total_transaksi'
    ];

    public function transaksis()
    {
        return $this->hasMany(Transaksi::class);
    }
}
