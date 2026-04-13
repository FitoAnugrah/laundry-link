<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Layanan extends Model
{
    use HasFactory;

    protected $fillable = [
        'nama_layanan',
        'jenis',
        'harga',
        'is_active'
    ];

    public function detailTransaksis()
    {
        return $this->hasMany(DetailTransaksi::class);
    }
}
