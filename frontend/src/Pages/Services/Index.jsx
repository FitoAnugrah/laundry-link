import React, { useState, useEffect } from 'react';
import { Tag, Search, Plus, Edit2, Trash2, X, Package, Shirt, AlertCircle } from 'lucide-react';
import DashboardLayout from '../../Layouts/DashboardLayout';
import api from '../../axios';

export default function ServicesIndex({ user, setUser }) {
    const [layanan, setLayanan] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    
    // Form State
    const [formData, setFormData] = useState({
        nama_layanan: '',
        jenis: 'kiloan',
        harga: ''
    });

    useEffect(() => {
        fetchLayanan();
    }, []);

    const fetchLayanan = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/layanan');
            setLayanan(res.data.data);
        } catch (error) {
            console.error("Error fetching layanan", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (layananToEdit = null) => {
        if (layananToEdit) {
            setEditingId(layananToEdit.id);
            setFormData({
                nama_layanan: layananToEdit.nama_layanan,
                jenis: layananToEdit.jenis,
                harga: layananToEdit.harga
            });
        } else {
            setEditingId(null);
            setFormData({ nama_layanan: '', jenis: 'kiloan', harga: '' });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setFormData({ nama_layanan: '', jenis: 'kiloan', harga: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/api/layanan/${editingId}`, formData);
            } else {
                await api.post('/api/layanan', formData);
            }
            fetchLayanan();
            handleCloseModal();
        } catch (error) {
            console.error("Error saving layanan", error);
            alert("Terjadi kesalahan saat menyimpan data.");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Apakah Anda yakin ingin menghapus layanan ini?")) return;
        try {
            await api.delete(`/api/layanan/${id}`);
            fetchLayanan();
        } catch (error) {
            console.error("Error deleting layanan", error);
            alert("Gagal menghapus layanan.");
        }
    };

    const filteredLayanan = layanan.filter(l => 
        l.nama_layanan.toLowerCase().includes(search.toLowerCase())
    );

    const formatCurrency = (number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
    };

    return (
        <DashboardLayout user={user} setUser={setUser}>
            <div className="flex-1 w-full h-full bg-zinc-50 overflow-hidden flex flex-col p-6">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 shrink-0">
                    <div>
                        <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Katalog Layanan</h1>
                        <p className="text-sm text-zinc-500 mt-1 font-medium tracking-wide">Kelola master data harga dan jenis layanan cuci.</p>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <div className="relative w-full md:w-80 shadow-sm rounded-2xl bg-white border border-zinc-200 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
                            <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-zinc-400" />
                            <input 
                                type="text"
                                placeholder="Cari layanan..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-transparent border-none text-sm focus:ring-0 text-zinc-800 font-medium placeholder:font-normal placeholder:text-zinc-400 outline-none rounded-2xl"
                            />
                        </div>
                        <button 
                            onClick={() => handleOpenModal()}
                            className="bg-zinc-900 hover:bg-black text-white px-5 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-sm shrink-0 transition-transform active:scale-95 whitespace-nowrap"
                        >
                            <Plus className="w-5 h-5" />
                            Tambah
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-hidden bg-white border border-zinc-200 rounded-[1.5rem] shadow-sm relative flex flex-col">
                    <div className="overflow-y-auto custom-scrollbar flex-1 relative">
                        {loading ? (
                            <div className="flex justify-center items-center h-48 flex-col gap-4">
                                <div className="animate-spin rounded-full h-10 w-10 border-4 border-zinc-200 border-t-blue-600"></div>
                                <span className="text-zinc-400 font-bold animate-pulse text-sm">Memuat Data...</span>
                            </div>
                        ) : filteredLayanan.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-16 text-zinc-400 mt-10">
                                <div className="bg-zinc-50 w-20 h-20 rounded-full flex items-center justify-center mb-4 border border-zinc-100">
                                    <Tag className="w-10 h-10 text-zinc-300" />
                                </div>
                                <h3 className="font-bold text-xl text-zinc-600 mb-1">Katalog layanan kosong</h3>
                                <p className="text-sm text-zinc-400 font-medium">Buat layanan pencucian pertama Anda.</p>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 bg-white/90 backdrop-blur-md z-10 shadow-sm">
                                    <tr>
                                        <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-zinc-400">Layanan</th>
                                        <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-zinc-400">Jenis Tarif</th>
                                        <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-zinc-400">Harga</th>
                                        <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-transparent w-24">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredLayanan.map((l) => (
                                        <tr key={l.id} className="border-b border-zinc-100 hover:bg-zinc-50/50 transition-colors group">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                                        {l.jenis === 'kiloan' ? <Package className="w-5 h-5" /> : <Shirt className="w-5 h-5" />}
                                                    </div>
                                                    <span className="font-bold text-zinc-800">{l.nama_layanan}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${l.jenis === 'kiloan' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-cyan-50 text-cyan-600 border-cyan-100'}`}>
                                                    {l.jenis}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="font-black text-zinc-800">{formatCurrency(l.harga)}</span>
                                                <span className="text-zinc-400 text-xs font-semibold ml-1">
                                                    {l.jenis === 'kiloan' ? '/ kg' : '/ pcs'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleOpenModal(l)} className="p-2 rounded-xl text-zinc-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDelete(l.id)} className="p-2 rounded-xl text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-all">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal CRUD */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                            <h3 className="font-black text-xl text-zinc-800 tracking-tight">
                                {editingId ? 'Edit Layanan' : 'Tambah Layanan Baru'}
                            </h3>
                            <button onClick={handleCloseModal} className="text-zinc-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="space-y-5 mb-8">
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Nama Layanan</label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={formData.nama_layanan}
                                        onChange={e => setFormData({...formData, nama_layanan: e.target.value})}
                                        className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-medium text-zinc-800 transition-all"
                                        placeholder="Contoh: Cuci Komplit Kilat"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Jenis Tarif</label>
                                        <select 
                                            value={formData.jenis}
                                            onChange={e => setFormData({...formData, jenis: e.target.value})}
                                            className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-medium text-zinc-800 transition-all appearance-none"
                                        >
                                            <option value="kiloan">Kiloan (/Kg)</option>
                                            <option value="satuan">Satuan (/Pcs)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Harga (Rp)</label>
                                        <input 
                                            type="number" 
                                            required 
                                            min="0"
                                            value={formData.harga}
                                            onChange={e => setFormData({...formData, harga: e.target.value})}
                                            className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-medium text-zinc-800 transition-all"
                                            placeholder="8000"
                                        />
                                    </div>
                                </div>
                            </div>
                            <button 
                                type="submit" 
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-md transition-all active:scale-[0.98]"
                            >
                                Simpan Data
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
