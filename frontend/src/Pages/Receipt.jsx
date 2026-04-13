import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../axios';

export default function Receipt() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [transaksi, setTransaksi] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchReceipt = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get(`/api/transaksi/${id}/receipt`);
            setTransaksi(res.data.data);
        } catch (err) {
            const status = err.response?.status;
            if (status === 401 || status === 403) {
                setError('Sesi telah berakhir. Silakan login kembali.');
            } else if (status === 404) {
                setError(`Transaksi #${id} tidak ditemukan di database.`);
            } else {
                setError(`Gagal memuat struk. (${status ?? 'Network Error'})`);
            }
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchReceipt();
    }, [fetchReceipt]);

    const handlePrint = () => window.print();

    const formatCurrency = (n) =>
        new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(n ?? 0);

    const formatDate = (s) => {
        const d = new Date(s);
        return (
            d.toLocaleDateString('id-ID', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
            }) +
            ' ' +
            d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        );
    };

    /* ─── LOADING ─── */
    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 gap-4 no-print">
                <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="text-sm font-semibold text-gray-500">Memuat struk transaksi #{id}…</p>
            </div>
        );
    }

    /* ─── ERROR ─── */
    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6 gap-4 no-print">
                <div className="bg-white rounded-2xl shadow-md p-8 max-w-sm w-full text-center">
                    <div className="text-4xl mb-4">⚠️</div>
                    <h2 className="font-black text-zinc-800 text-lg mb-2">Struk Tidak Dapat Dimuat</h2>
                    <p className="text-sm text-zinc-500 mb-6 leading-relaxed">{error}</p>
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={fetchReceipt}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all active:scale-95"
                        >
                            🔄 Coba Lagi
                        </button>
                        <button
                            onClick={() => navigate('/')}
                            className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold py-3 rounded-xl transition-all active:scale-95"
                        >
                            ← Kembali ke POS
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    /* ─── STRUK ─── */
    const noResi = 'TRX-' + String(transaksi.id).padStart(5, '0');
    const items = transaksi.detail_transaksis ?? [];

    return (
        <>
            {/* ─── PRINT STYLES (injected once, scoped) ─── */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');

                * { box-sizing: border-box; margin: 0; padding: 0; }

                body {
                    background: #f3f4f6;
                    font-family: 'Space Mono', monospace;
                }

                /* ── Screen wrapper ── */
                .receipt-page {
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: flex-start;
                    padding: 24px 16px 80px;
                    gap: 16px;
                    background: #f3f4f6;
                }

                /* ── Paper card ── */
                .receipt-paper {
                    width: 58mm;
                    background: white;
                    padding: 4mm 3mm;
                    font-size: 11px;
                    line-height: 1.5;
                    color: black;
                    box-shadow: 0 4px 24px rgba(0,0,0,0.12);
                    border-radius: 4px;
                }

                /* ── Action bar (screen only) ── */
                .receipt-actions {
                    width: 58mm;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .btn-print {
                    width: 100%;
                    background: #2563eb;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    padding: 10px 0;
                    font-family: inherit;
                    font-size: 11px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: background .15s;
                }
                .btn-print:hover { background: #1d4ed8; }
                .btn-back {
                    width: 100%;
                    background: #f4f4f5;
                    color: #3f3f46;
                    border: none;
                    border-radius: 8px;
                    padding: 10px 0;
                    font-family: inherit;
                    font-size: 11px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: background .15s;
                }
                .btn-back:hover { background: #e4e4e7; }

                /* ── Receipt elements ── */
                .r-center   { text-align: center; }
                .r-bold     { font-weight: 700; }
                .r-small    { font-size: 9px; }
                .r-dash     { border-top: 1px dashed black; margin: 3mm 0; }
                .r-row      { display: flex; justify-content: space-between; margin-bottom: 1mm; }
                .r-row-lg   { display: flex; justify-content: space-between; font-weight: 700; font-size: 13px; }
                .r-item-name { font-weight: 700; margin: 1.5mm 0 0.5mm; font-size: 11px; }
                .r-item-sub  { display: flex; justify-content: space-between; font-size: 10px; color: #444; }

                /* ── Print overrides ── */
                @media print {
                    @page { size: 58mm auto; margin: 0; }

                    body { background: none; }

                    .no-print,
                    .receipt-actions { display: none !important; }

                    .receipt-page {
                        padding: 0;
                        background: none;
                        display: block;
                    }

                    .receipt-paper {
                        width: 100%;
                        box-shadow: none;
                        border-radius: 0;
                        padding: 2mm 1mm;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                }
            `}</style>

            <div className="receipt-page">

                {/* ── Paper ── */}
                <div className="receipt-paper">

                    {/* Header */}
                    <div className="r-center" style={{ marginBottom: '2mm' }}>
                        <div className="r-bold" style={{ fontSize: '15px', letterSpacing: '1px' }}>LAUNDRYLINK</div>
                        <div className="r-small" style={{ marginTop: '1mm', lineHeight: 1.4 }}>
                            Jl. Bersih Selalu No. 99<br />
                            Telp: 0812-3456-7890
                        </div>
                    </div>

                    <div className="r-dash" />

                    {/* Info Transaksi */}
                    <div className="r-row"><span>No. Resi</span><span className="r-bold">{noResi}</span></div>
                    <div className="r-row"><span>Tanggal</span><span>{formatDate(transaksi.created_at)}</span></div>
                    <div className="r-row"><span>Pelanggan</span><span className="r-bold">{transaksi.nama_sementara || 'Guest'}</span></div>
                    <div className="r-row">
                        <span>Pembayaran</span>
                        <span style={{ textTransform: 'uppercase' }}>{transaksi.status_pembayaran}</span>
                    </div>

                    <div className="r-dash" />

                    {/* Item Cucian */}
                    {items.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#888', fontSize: '10px', padding: '2mm 0' }}>
                            (Tidak ada detail item)
                        </div>
                    ) : (
                        items.map((item, i) => (
                            <div key={i}>
                                <div className="r-item-name">
                                    {item.layanan?.nama_layanan || 'Layanan'}
                                </div>
                                <div className="r-item-sub">
                                    <span>
                                        {item.qty_atau_berat}
                                        {item.layanan?.jenis === 'kiloan' ? ' kg' : ' pcs'} × {formatCurrency(item.layanan?.harga)}
                                    </span>
                                    <span>{formatCurrency(item.subtotal)}</span>
                                </div>
                            </div>
                        ))
                    )}

                    <div className="r-dash" />

                    {/* Total */}
                    <div className="r-row"><span>Subtotal</span><span>{formatCurrency(transaksi.total_harga)}</span></div>
                    {Number(transaksi.diskon) > 0 && (
                        <div className="r-row" style={{ color: '#e11d48' }}>
                            <span>Diskon</span>
                            <span>- {formatCurrency(transaksi.diskon)}</span>
                        </div>
                    )}

                    <div className="r-dash" />

                    <div className="r-row-lg">
                        <span>TOTAL</span>
                        <span>{formatCurrency(transaksi.grand_total)}</span>
                    </div>

                    <div className="r-dash" />

                    {/* Footer */}
                    <div className="r-center r-small" style={{ lineHeight: 1.6 }}>
                        <div>Terima kasih atas kepercayaan Anda!</div>
                        <div style={{ marginTop: '1mm', color: '#555' }}>
                            Cucian tidak diambil dalam 30 hari<br />
                            di luar tanggung jawab kami.
                        </div>
                    </div>

                </div>

                {/* ── Action Bar (Screen Only) ── */}
                <div className="receipt-actions no-print">
                    <button className="btn-print" onClick={handlePrint}>
                        🖨️ Cetak Struk Sekarang
                    </button>
                    <button className="btn-back" onClick={() => navigate('/')}>
                        ← Kembali ke POS
                    </button>
                </div>

            </div>
        </>
    );
}
