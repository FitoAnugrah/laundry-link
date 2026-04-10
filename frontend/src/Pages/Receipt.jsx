import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../axios';

export default function Receipt() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [transaksi, setTransaksi] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReceipt = async () => {
            try {
                const res = await api.get(`/api/transaksi/${id}/receipt`);
                setTransaksi(res.data.data);
                
                // Beri jeda sejenak agar DOM render sempurna sebelum dialog print dipanggil
                setTimeout(() => {
                    window.print();
                }, 500);

            } catch (error) {
                console.error("Gagal mengambil data resi:", error);
                alert("Gagal memuat struk!");
            } finally {
                setLoading(false);
            }
        };

        fetchReceipt();

        // Optional: otomatis kembali setelah dialog print ditutup (jika didukung browser)
        const handleAfterPrint = () => {
            // Bisa navigate kembali atau tutup tab jika ini dibuka di tab baru
            // window.close(); 
        };
        window.addEventListener('afterprint', handleAfterPrint);
        return () => window.removeEventListener('afterprint', handleAfterPrint);
    }, [id]);

    if (loading) return <div className="p-4 text-center">Memuat struk...</div>;
    if (!transaksi) return <div className="p-4 text-center">Struk tidak ditemukan</div>;

    const formatCurrency = (number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
    };

    const formatDate = (dateString) => {
        const d = new Date(dateString);
        return d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + 
               d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    };

    const noResi = 'TRX-' + String(transaksi.id).padStart(5, '0');

    return (
        <div className="receipt-container bg-white text-black min-h-screen">
            {/* CSS khusus untuk print disematkan secara inline injection atau mengandalkan external index.css */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap');
                
                body {
                    background-color: #f3f4f6; /* Abu-abu untuk layar, putih untuk print */
                }

                .receipt-container {
                    width: 58mm; /* Ukuran cetak thermal standar dunia */
                    margin: 0 auto;
                    padding: 4mm 2mm;
                    background: white;
                    font-family: 'Space Mono', monospace; /* Monospace wajib untuk thermal */
                    font-size: 11px; /* Skala mata ideal 58mm */
                    line-height: 1.3;
                    color: black;
                }

                @media print {
                    @page {
                        margin: 0; 
                        size: 58mm auto; /* Memaksa browser ke rasio printer */
                    }
                    body {
                        background: none;
                        margin: 0;
                        padding: 0;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .receipt-container {
                        width: 100%;
                        margin: 0;
                        padding: 0;
                        border: none;
                        box-shadow: none;
                    }
                }

                .r-header { text-align: center; margin-bottom: 2mm; }
                .r-title { font-size: 16px; font-weight: bold; margin: 0 0 1mm 0; }
                .r-subtitle { font-size: 9px; margin: 0; }
                .r-separator { border-top: 1px dashed black; margin: 2mm 0; }
                
                .r-row { display: flex; justify-content: space-between; margin-bottom: 0.5mm; }
                .r-row-bold { font-weight: bold; font-size: 12px; }
                
                .r-item-title { font-weight: bold; margin-bottom: 0.5mm; margin-top: 1mm;}
                .r-item-detail { display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 0.5mm;}
                
                .r-footer { text-align: center; margin-top: 4mm; font-size: 9px; }
                .r-footer p { margin: 1mm 0;}
            `}</style>

            {/* HEADER */}
            <div className="r-header">
                <h1 className="r-title">LAUNDRYLINK</h1>
                <p className="r-subtitle">Jl. Bersih Selalu No. 99<br/>Telp: 0812-3456-7890</p>
            </div>

            <div className="r-separator"></div>

            {/* INFO PELANGGAN */}
            <div className="r-row">
                <span>Resi:</span>
                <span>{noResi}</span>
            </div>
            <div className="r-row">
                <span>Tanggal:</span>
                <span>{formatDate(transaksi.created_at)}</span>
            </div>
            <div className="r-row">
                <span>Pelanggan:</span>
                <span>{transaksi.nama_sementara ?? 'Guest'}</span>
            </div>
            <div className="r-row">
                <span>Status:</span>
                <span style={{textTransform:'uppercase'}}>{transaksi.status_pembayaran}</span>
            </div>

            <div className="r-separator"></div>

            {/* ITEMS */}
            <div style={{marginBottom: '2mm'}}>
                {transaksi.detail_transaksis?.map((item, index) => (
                    <div key={index}>
                        <div className="r-item-title">{item.layanan?.nama_layanan || 'Unknown'}</div>
                        <div className="r-item-detail">
                            <span>{item.qty_atau_berat} x {formatCurrency(item.layanan?.harga || 0)}</span>
                            <span>{formatCurrency(item.subtotal)}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="r-separator"></div>

            {/* TOTALS */}
            <div className="r-row">
                <span>Subtotal</span>
                <span>{formatCurrency(transaksi.total_harga)}</span>
            </div>
            {transaksi.diskon > 0 && (
                <div className="r-row">
                    <span>Diskon</span>
                    <span>-{formatCurrency(transaksi.diskon)}</span>
                </div>
            )}
            <div className="r-separator"></div>
            <div className="r-row r-row-bold">
                <span>TOTAL</span>
                <span>{formatCurrency(transaksi.grand_total)}</span>
            </div>

            <div className="r-separator"></div>

            {/* FOOTER */}
            <div className="r-footer">
                <p>Terima kasih atas<br/>kepercayaan Anda!</p>
                <p>Cucian tidak diambil dalam<br/>30 hari diluar tanggung jawab kami.</p>
                <br/>
                <button 
                    onClick={() => navigate('/pos')} 
                    className="no-print" 
                    style={{padding: '5px 10px', background: '#3b82f6', color: 'white', border:'none', borderRadius:'5px', cursor:'pointer', marginTop:'10px'}}>
                    &larr; Kembali ke POS
                </button>
            </div>
        </div>
    );
}
