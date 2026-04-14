import React, { useState, useEffect } from 'react';
import { Users, Search, Plus, X, Award, MapPin, Phone, Calendar, ArrowLeft, Sparkles } from 'lucide-react';
import DashboardLayout from '../../Layouts/DashboardLayout';
import api from '../../axios';

export default function CustomersIndex({ user, setUser }) {
    const [isEditingAddress, setIsEditingAddress] = useState(false);
    const [alamatEdit, setAlamatEdit] = useState('');

    // 2. Fungsi sederhana untuk update alamat ke backend

    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Modal states
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [customerError, setCustomerError] = useState(null);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const simpanAlamat = async () => {
        try {
            await api.put(`/api/pelanggan/${selectedCustomer.id}`, {
                alamat: alamatEdit
            });

            // Perbarui data di layar (sesuaikan dengan nama statemu)
            setSelectedCustomer(prev => ({ ...prev, alamat: alamatEdit }));
            setIsEditingAddress(false);
        } catch (error) {
            alert("Gagal menyimpan alamat");
        }
    };
    const [formData, setFormData] = useState({
        nama: '',
        no_wa: '',
        alamat: ''
    });

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/pelanggan');
            setCustomers(res.data.data);
        } catch (error) {
            console.error("Error fetching customers", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/api/pelanggan', formData);
            fetchCustomers();
            setIsAddModalOpen(false);
            setFormData({ nama: '', no_wa: '', alamat: '' });
        } catch (error) {
            console.error("Error adding customer", error);
            // Tangkap pesan error dari Laravel (terutama error 422 WA Duplikat)
            if (error.response && error.response.status === 422) {
                const errMsg = error.response.data.message || error.response.data.errors?.no_wa?.[0] || "Gagal! Nomor WhatsApp sudah terdaftar.";
                setCustomerError(errMsg);
            } else {
                setCustomerError("Terjadi kesalahan sistem saat menyimpan data pelanggan.");
            }
        }
    };

    const filteredCustomers = customers.filter(c =>
        c.nama.toLowerCase().includes(search.toLowerCase()) ||
        c.no_wa.includes(search)
    );

    return (
        <DashboardLayout user={user} setUser={setUser}>
            <div className="flex-1 w-full h-full bg-zinc-50 overflow-hidden flex flex-col p-6">

                {/* Header Sub */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 shrink-0">
                    <div>
                        <h1 className="text-3xl font-black text-zinc-900 tracking-tight">CRM Pelanggan</h1>
                        <p className="text-sm text-zinc-500 mt-1 font-medium tracking-wide">Kelola database pelanggan dan loyalitas.</p>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <div className="relative w-full md:w-80 shadow-sm rounded-2xl bg-white border border-zinc-200 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
                            <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-zinc-400" />
                            <input
                                type="text"
                                placeholder="Cari nama atau No WhatsApp..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-transparent border-none text-sm focus:ring-0 text-zinc-800 font-medium placeholder:font-normal placeholder:text-zinc-400 outline-none rounded-2xl"
                            />
                        </div>
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="bg-zinc-900 hover:bg-black text-white px-5 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-sm shrink-0 transition-transform active:scale-95 whitespace-nowrap"
                        >
                            <Plus className="w-5 h-5" />
                            Pelanggan
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-hidden bg-white border border-zinc-200 rounded-[1.5rem] shadow-sm relative flex flex-col">
                    <div className="overflow-y-auto custom-scrollbar flex-1 relative">
                        {loading ? (
                            <div className="flex justify-center items-center h-48 flex-col gap-4">
                                <div className="animate-spin rounded-full h-10 w-10 border-4 border-zinc-200 border-t-blue-600"></div>
                                <span className="text-zinc-400 font-bold animate-pulse text-sm">Memuat Database...</span>
                            </div>
                        ) : filteredCustomers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-16 text-zinc-400 mt-10">
                                <div className="bg-zinc-50 w-20 h-20 rounded-full flex items-center justify-center mb-4 border border-zinc-100">
                                    <Users className="w-10 h-10 text-zinc-300" />
                                </div>
                                <h3 className="font-bold text-xl text-zinc-600 mb-1">Tidak ada prospek ditemukan</h3>
                                <p className="text-sm text-zinc-400 font-medium">Tambah pelanggan pertama Anda untuk memulai CRM.</p>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 bg-white/90 backdrop-blur-md z-10 shadow-sm border-b border-zinc-100">
                                    <tr>
                                        <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-zinc-400">Kontak</th>
                                        <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-zinc-400 hidden sm:table-cell">No WhatsApp</th>
                                        <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-zinc-400 hidden lg:table-cell">Alamat</th>
                                        <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center">Loyalitas</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredCustomers.map((c) => {
                                        const isMember = c.total_transaksi >= 5;
                                        return (
                                            <tr
                                                key={c.id}
                                                onClick={() => setSelectedCustomer(c)}
                                                className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors cursor-pointer group"
                                            >
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-black">
                                                            {c.nama.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-zinc-800 flex items-center">
                                                                {c.nama}
                                                                {isMember && <span className="ml-2 bg-yellow-100 text-yellow-700 border border-yellow-300 text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-sm mt-0.5"><Sparkles className="w-2.5 h-2.5 text-yellow-500" /> MEMBER</span>}
                                                            </span>
                                                            <span className="text-xs text-zinc-400 font-medium sm:hidden mt-0.5">{c.no_wa}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 hidden sm:table-cell">
                                                    <span className="font-medium text-zinc-600">{c.no_wa}</span>
                                                </td>
                                                <td className="py-4 px-6 text-sm text-zinc-500 hidden lg:table-cell max-w-xs truncate">
                                                    {c.alamat || '-'}
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black tracking-widest border bg-zinc-50 text-zinc-500 border-zinc-100">
                                                        {c.total_transaksi || 0} ORDER
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Tambah Pelanggan */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                            <h3 className="font-black text-xl text-zinc-800 tracking-tight">Pelanggan Baru</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-zinc-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleAddSubmit} className="p-6">
                            <div className="space-y-5 mb-8">
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Nama Lengkap</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.nama}
                                        onChange={e => setFormData({ ...formData, nama: e.target.value })}
                                        className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-medium text-zinc-800 transition-all"
                                        placeholder="Contoh: Budi Santoso"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">No. WhatsApp</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.no_wa}
                                        onChange={e => setFormData({ ...formData, no_wa: e.target.value })}
                                        className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-medium text-zinc-800 transition-all"
                                        placeholder="081234567890"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Alamat Domisili</label>
                                    <textarea
                                        rows="2"
                                        value={formData.alamat}
                                        onChange={e => setFormData({ ...formData, alamat: e.target.value })}
                                        className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-medium text-zinc-800 transition-all resize-none"
                                        placeholder="Jl. Merdeka No. 12"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-md transition-all active:scale-[0.98]"
                            >
                                Simpan Profil
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Detail Pelanggan (Force-Fixed Popup dengan Riwayat Mutasi) */}
            {selectedCustomer && (
                <div
                    style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 99999, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
                >
                    <div
                        style={{ width: '100%', maxWidth: '480px', maxHeight: '90vh' }}
                        className="bg-white rounded-3xl shadow-2xl flex flex-col relative overflow-hidden animate-in zoom-in-95 fade-in duration-200"
                    >

                        {/* Header Biru Terpusat */}
                        <div className="bg-blue-600 p-6 flex flex-col items-center relative shrink-0 pt-16">

                            {/* Tombol KEMBALI Kiri Atas (Forced with Inline Style) */}
                            <button
                                onClick={() => setSelectedCustomer(null)}
                                style={{ position: 'absolute', top: '20px', left: '20px' }}
                                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-white hover:bg-zinc-100 text-blue-700 font-bold text-xs rounded-full shadow-lg active:scale-90 transition-transform z-50 cursor-pointer border border-blue-50"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                <span>Kembali</span>
                            </button>

                            {/* Avatar Profil */}
                            <div className="w-20 h-20 rounded-full bg-white p-1 shadow-md mb-3 z-10">
                                <div className="w-full h-full rounded-full bg-blue-50 flex items-center justify-center text-3xl font-black text-blue-600 border border-blue-100">
                                    {selectedCustomer.nama.charAt(0).toUpperCase()}
                                </div>
                            </div>

                            <h3 className="font-black text-2xl text-white text-center w-full truncate px-4 z-10 flex items-center justify-center gap-2">
                                {selectedCustomer.nama}
                                {selectedCustomer.total_transaksi >= 5 && (
                                    <span className="bg-yellow-100 text-yellow-700 border border-yellow-300 text-[10px] font-black px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-md shrink-0">
                                        🌟 MEMBER
                                    </span>
                                )}
                            </h3>
                            <p className="text-blue-100 text-sm font-mono mt-1 font-semibold z-10">{selectedCustomer.no_wa}</p>
                        </div>

                        {/* Content Area dengan Scroll Khusus History */}
                        <div className="p-0 bg-zinc-50 flex flex-col flex-1 overflow-hidden">
                            <div className="p-6 flex flex-col gap-4 overflow-y-auto custom-scrollbar">

                                {/* Info Domisili & Aggregasi Uang (2 Kolom) */}
                                <div className="grid grid-cols-2 gap-3">
                                    {/* Kolom 1: Alamat */}
                                    {/* KOTAK DOMISILI (Tanpa merombak desain asli) */}
                                    <div className="bg-white border border-zinc-200 rounded-[1.25rem] p-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                                                📍 Domisili
                                            </p>

                                            {/* Tombol Edit/Simpan Super Minimalis */}
                                            {!isEditingAddress ? (
                                                <button
                                                    onClick={() => {
                                                        setAlamatEdit(selectedCustomer?.alamat || '');
                                                        setIsEditingAddress(true);
                                                    }}
                                                    className="text-[10px] text-blue-600 font-bold hover:underline"
                                                >
                                                    Edit
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={simpanAlamat}
                                                    className="text-[10px] text-emerald-600 font-bold hover:underline"
                                                >
                                                    Simpan
                                                </button>
                                            )}
                                        </div>

                                        {/* Tampilan Teks vs Tampilan Input */}
                                        {!isEditingAddress ? (
                                            <p className="text-sm font-medium text-zinc-800">
                                                {selectedCustomer?.alamat || 'Tidak ada alamat terdaftar.'}
                                            </p>
                                        ) : (
                                            <textarea
                                                value={alamatEdit}
                                                onChange={e => setAlamatEdit(e.target.value)}
                                                className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2 text-sm text-zinc-800 focus:outline-none focus:border-blue-400"
                                                placeholder="Masukkan alamat lengkap..."
                                                rows="2"
                                                autoFocus
                                            />
                                        )}
                                    </div>

                                    {/* Kolom 2: Total Uang */}
                                    <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 shadow-sm flex flex-col gap-2">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-emerald-100 rounded-md">
                                                <Award className="w-4 h-4 text-emerald-600" />
                                            </div>
                                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest shrink-0">Total Uang</p>
                                        </div>
                                        <p className="text-lg font-black text-emerald-700 truncate">
                                            Rp {(selectedCustomer.transaksis_sum_grand_total || 0).toLocaleString('id-ID')}
                                        </p>
                                    </div>
                                </div>

                                {/* Loyalitas Besar */}
                                {/* KOTAK JEJAK KUNJUNGAN LOYALITAS (FIXED LAYOUT) */}
                                <div className="bg-indigo-50 border border-indigo-100 rounded-[1.25rem] p-5 mb-6 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">
                                            Jejak Kunjungan Loyalitas
                                        </p>
                                        <p className="text-sm font-bold text-indigo-900">
                                            Total Transaksi
                                        </p>
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-black text-indigo-600 leading-none">
                                            {/* Pastikan variabel 'customer' atau 'selectedCustomer' sesuai dengan kodemu */}
                                            {selectedCustomer?.total_transaksi || 0}
                                        </span>
                                        <span className="text-xs font-bold text-indigo-400">kali</span>
                                    </div>
                                </div>

                                {/* Bagian Khusus Riwayat Belanja */}
                                <div className="mt-2 flex flex-col gap-2">
                                    <h4 className="text-[11px] font-black text-zinc-500 uppercase tracking-widest px-1">Riwayat Order (Tracking)</h4>

                                    {(!selectedCustomer.transaksis || selectedCustomer.transaksis.length === 0) ? (
                                        <div className="bg-white border border-zinc-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-sm">
                                            <Calendar className="w-8 h-8 text-zinc-300 mb-2" />
                                            <p className="text-sm font-bold text-zinc-500">Belum ada riwayat</p>
                                            <p className="text-xs text-zinc-400 font-medium mt-1">Pelanggan ini belum pernah mencuci.</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-2.5">
                                            {selectedCustomer.transaksis.map((trx) => (
                                                <div key={trx.id} className="bg-white border border-zinc-200 rounded-2xl p-4 flex flex-col gap-3 shadow-sm hover:border-blue-200 transition-colors">

                                                    {/* Row Atas: ID & Tanggal */}
                                                    <div className="flex justify-between items-center border-b border-zinc-100 pb-2">
                                                        <span className="text-xs font-black text-zinc-800 bg-zinc-100 px-2.5 py-1 rounded-md">#{trx.id.toString().padStart(4, '0')}</span>
                                                        <span className="text-[10px] font-bold text-zinc-400">
                                                            {new Date(trx.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                        </span>
                                                    </div>

                                                    {/* Row Tengah: Item Cucian */}
                                                    <div className="flex w-full items-start overflow-x-auto gap-2 pb-1 custom-scrollbar">
                                                        {trx.detail_transaksis && trx.detail_transaksis.map((dt) => (
                                                            <div key={dt.id} className="bg-blue-50/50 border border-blue-100 rounded-lg px-3 py-2 flex flex-col shrink-0 min-w-[120px]">
                                                                <span className="text-[10px] font-black text-blue-600 truncate mb-1">{dt.layanan?.nama_layanan || 'Unknown'}</span>
                                                                <span className="text-xs font-bold text-zinc-600">{dt.qty_atau_berat} {dt.layanan?.jenis === 'kiloan' ? 'Kg' : 'Pcs'}</span>
                                                            </div>
                                                        ))}
                                                        {(!trx.detail_transaksis || trx.detail_transaksis.length === 0) && (
                                                            <span className="text-xs italic text-zinc-400">Tidak ada detail item...</span>
                                                        )}
                                                    </div>

                                                    {/* Row Bawah: Status & Grand Total */}
                                                    <div className="flex justify-between items-end mt-1 pt-2 border-t border-zinc-50">
                                                        <span className={`text-[10px] uppercase tracking-widest font-black px-2 py-1 rounded ${trx.status_pembayaran === 'lunas' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                                            }`}>
                                                            {trx.status_pembayaran}
                                                        </span>
                                                        <span className="text-sm font-black text-emerald-600">Rp {trx.grand_total.toLocaleString('id-ID')}</span>
                                                    </div>

                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* POP-UP ERROR PELANGGAN */}
            {customerError && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[1.5rem] p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-center w-14 h-14 mx-auto bg-red-50 rounded-full mb-4">
                            <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                            </svg>
                        </div>
                        <h3 className="text-lg font-black text-center text-zinc-900 mb-2">Penambahan Ditolak</h3>
                        <p className="text-sm text-center text-zinc-500 font-medium mb-6 leading-relaxed">{customerError}</p>
                        <button onClick={() => setCustomerError(null)} className="w-full bg-zinc-900 text-white font-bold py-3.5 rounded-xl hover:bg-zinc-800 transition-colors">
                            Saya Mengerti
                        </button>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
