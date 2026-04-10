import React, { useState, useEffect } from 'react';
import { 
    ShoppingCart, User, Shirt, Plus, Minus, Trash2, 
    CreditCard, Banknote, X, Search, Info, Package, CheckCircle2, LogOut 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../axios';
import DashboardLayout from '../Layouts/DashboardLayout';

export default function POSCreate({ user, setUser }) {
    const [pelanggans, setPelanggans] = useState([]);
    const [layanans, setLayanans] = useState([]);
    
    // Form State
    const [namaPelanggan, setNamaPelanggan] = useState('');
    const [waPelanggan, setWaPelanggan] = useState('');
    
    const [metodePembayaran, setMetodePembayaran] = useState('tunai');
    const [statusPesanan, setStatusPesanan] = useState('masuk');
    const [statusPembayaran, setStatusPembayaran] = useState('lunas');
    const [manualDiskon, setManualDiskon] = useState('');

    const [cart, setCart] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Status State
    const [processing, setProcessing] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    
    // Receipt Modal State
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [lastTransactionId, setLastTransactionId] = useState(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeLayanan, setActiveLayanan] = useState(null);
    const [qtyInput, setQtyInput] = useState('1');



    useEffect(() => {
        // Fetch Master Data
        const fetchData = async () => {
            try {
                const [resPelanggan, resLayanan] = await Promise.all([
                    api.get('/api/pelanggan'),
                    api.get('/api/layanan')
                ]);
                setPelanggans(resPelanggan.data.data);
                setLayanans(resLayanan.data.data);
            } catch (err) {
                console.error("Failed to load data", err);
            }
        };
        fetchData();
    }, []);

    const handleWaChange = (e) => {
        const val = e.target.value;
        setWaPelanggan(val);
        
        // Auto-fill nama logic
        const found = pelanggans.find(p => p.no_wa === val);
        if (found) {
            setNamaPelanggan(found.nama);
        }
    };

    const handleLogout = async () => {
        await api.post('/logout');
        setUser(null);
    }

    const filteredLayanan = layanans.filter(l => 
        l.nama_layanan.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const openLayananModal = (layanan) => {
        setActiveLayanan(layanan);
        setQtyInput(layanan.jenis === 'kiloan' ? '1.5' : '1');
        setIsModalOpen(true);
    };

    const addToCart = () => {
        if (!activeLayanan || !qtyInput || isNaN(qtyInput) || qtyInput <= 0) return;
        
        const qty = parseFloat(qtyInput);
        const subtotal = activeLayanan.harga * qty;

        setCart(prev => {
            const newCart = [...prev];
            const existingItemIndex = newCart.findIndex(item => item.id === activeLayanan.id);
            if (existingItemIndex >= 0) {
                newCart[existingItemIndex].qty_atau_berat += qty;
                newCart[existingItemIndex].subtotal += subtotal;
            } else {
                newCart.push({
                    id: activeLayanan.id,
                    nama_layanan: activeLayanan.nama_layanan,
                    jenis: activeLayanan.jenis,
                    harga: activeLayanan.harga,
                    qty_atau_berat: qty,
                    subtotal: subtotal
                });
            }
            return newCart;
        });
        
        setIsModalOpen(false);
    };

    const removeFromCart = (indexToRemove) => {
        setCart(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const totalHarga = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const diskonInput = parseInt(manualDiskon) || 0;
    const grandTotal = Math.max(0, totalHarga - diskonInput);

    const formatCurrency = (number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');
        setProcessing(true);

        try {
            const diskonUntukPayload = parseInt(manualDiskon) || 0;
            const resTx = await api.post('/api/transaksi', {
                nama_sementara: namaPelanggan,
                wa_sementara: waPelanggan,
                metode_pembayaran: metodePembayaran,
                status_pembayaran: statusPembayaran,
                status_pesanan: statusPesanan,
                layanan: cart,
                diskon: diskonUntukPayload
            });
            
            setLastTransactionId(resTx.data.data.id);
            setIsSuccessModalOpen(true);

            setCart([]);
            setNamaPelanggan('');
            setWaPelanggan('');
            setManualDiskon('');
            
            // Reload pelanggan to sync loyalty if they got promoted
            const res = await api.get('/api/pelanggan');
            setPelanggans(res.data.data);
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Error occurred while saving transaction');
        } finally {
            setProcessing(false);
        }
    };



    return (
        <DashboardLayout user={user} setUser={setUser}>
            {/* Fullscreen Flex Layout */}
            <div className="flex w-full h-full bg-zinc-50 overflow-hidden">
                
                {/* Left Area (Pelanggan & Layanan) -> W-[60%] */}
                <div className="w-[60%] flex flex-col p-6 gap-6 overflow-y-auto custom-scrollbar shrink-0">
                    
                    {successMsg && <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl font-bold shadow-sm">{successMsg}</div>}
                    {errorMsg && <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl font-bold shadow-sm">{errorMsg}</div>}
                            
                    {/* Card Input Pelanggan (Lean CRM) */}
                    <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm flex-shrink-0">
                        <div className="flex flex-col xl:flex-row gap-4">
                            <div className="flex-1">
                                <label className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                    <h4 className="flex items-center gap-2"><div className="bg-indigo-100 p-1 rounded-md"><User className="w-4 h-4 text-indigo-600"/></div> No. WhatsApp</h4>
                                </label>
                                <input 
                                    type="text"
                                    value={waPelanggan}
                                    onChange={handleWaChange}
                                    placeholder="Contoh: 081234567890"
                                    className="w-full mt-1.5 rounded-xl border border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:ring-4 focus:ring-indigo-500/10 bg-slate-50 text-slate-700 p-3 font-medium transition-all"
                                    required
                                />
                                <p className="text-[10px] text-slate-400 mt-2">*Ketik WA terdaftar untuk auto-fill nama.</p>
                            </div>
                            <div className="flex-1">
                                <label className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                    <h4 className="flex items-center gap-2"><div className="bg-indigo-100 p-1 rounded-md"><User className="w-4 h-4 text-indigo-600"/></div> Nama Pelanggan</h4>
                                </label>
                                <input 
                                    type="text"
                                    value={namaPelanggan}
                                    onChange={e => setNamaPelanggan(e.target.value)}
                                    placeholder="Masukkan Nama..."
                                    className="w-full mt-1.5 rounded-xl border border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:ring-4 focus:ring-indigo-500/10 bg-slate-50 text-slate-700 p-3 font-medium transition-all"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Card Pencarian Layanan (Full Height Flex Focus) */}
                    <div className="bg-transparent flex-1 flex flex-col relative z-0">
                        <div className="flex justify-between items-center mb-4 gap-4 sticky top-0 bg-zinc-50 z-10 py-2">
                            <h3 className="text-xl font-black text-zinc-800 tracking-tight">Katalog Layanan</h3>
                            <div className="relative w-80 shadow-sm rounded-2xl">
                                <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-zinc-400" />
                                <input 
                                    type="text"
                                    placeholder="Cari layanan..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl text-sm focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-zinc-700"
                                />
                            </div>
                        </div>

                        {/* Grid Layanan */}
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 pb-10">
                                    {filteredLayanan.length === 0 && (
                                        <div className="col-span-full group relative flex flex-col bg-white border border-dashed border-zinc-200 rounded-[1.5rem] p-10 items-center justify-center text-center mt-4">
                                            <div className="bg-zinc-50 text-zinc-300 w-16 h-16 rounded-full flex items-center justify-center mb-4 border border-zinc-100">
                                                <Search className="w-6 h-6" />
                                            </div>
                                            <h4 className="font-bold text-lg text-zinc-500 mb-1">Katalog layanan kosong</h4>
                                            <p className="text-sm text-zinc-400 font-medium">Ubah kata kunci pencarian atau data mungkin belum tersedia.</p>
                                        </div>
                                    )}

                                    {filteredLayanan.map(layanan => (
                                        <button
                                            key={layanan.id}
                                            onClick={() => openLayananModal(layanan)}
                                            className="group relative flex flex-col bg-white border border-zinc-200 rounded-[1.5rem] p-5 hover:border-blue-300 hover:shadow-lg focus:outline-none transition-all duration-300 text-left overflow-hidden active:scale-95 shadow-sm min-h-[180px]"
                                        >
                                            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-blue-50 to-transparent rounded-bl-3xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
                                            
                                            <div className="bg-blue-50 text-blue-600 w-10 h-10 rounded-xl flex items-center justify-center mb-3">
                                                {layanan.jenis === 'kiloan' ? <Package className="w-5 h-5" /> : <Shirt className="w-5 h-5" />}
                                            </div>
                                            
                                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">
                                                {layanan.jenis}
                                            </span>
                                            <h4 className="font-bold text-zinc-800 leading-tight mb-2 flex-1">
                                                {layanan.nama_layanan}
                                            </h4>
                                            
                                            <p className="text-blue-600 font-black mt-auto">
                                                {formatCurrency(layanan.harga)}
                                                <span className="text-xs text-zinc-400 font-semibold ml-1">
                                                    {layanan.jenis === 'kiloan' ? '/ kg' : '/ pcs'}
                                                </span>
                                            </p>
                                        </button>
                                    ))}
                            </div>
                        </div>
                    </div>

                {/* Right Area (Cart - W-[40%]) */}
                <div className="flex-1 w-full bg-white border-l border-zinc-200 flex flex-col h-full z-10 relative shadow-[-4px_0_24px_rgba(0,0,0,0.02)]">
                    <div className="p-6 flex flex-col h-full">
                        <div className="flex items-center justify-between gap-3 mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-50 rounded-[14px] flex items-center justify-center border border-blue-100">
                                    <ShoppingCart className="w-5 h-5 text-blue-600" />
                                </div>
                                <h3 className="text-xl font-black text-zinc-900 tracking-tight">Checkout</h3>
                            </div>
                            <span className="text-sm font-bold text-zinc-400 bg-zinc-100 px-3 py-1 rounded-full">{cart.length} Item</span>
                        </div>

                        {/* List Keranjang */}
                        <div className={`flex-1 overflow-y-auto mb-4 custom-scrollbar min-h-[250px] bg-zinc-50 rounded-2xl border border-zinc-100 relative ${cart.length === 0 ? 'flex flex-col items-center justify-center p-6 mx-1' : 'p-3'}`}>
                            {cart.length === 0 ? (
                                <div className="text-center w-full relative z-10 flex flex-col items-center">
                                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-zinc-200">
                                        <ShoppingCart className="w-8 h-8 text-zinc-300" />
                                    </div>
                                    <p className="text-sm font-semibold text-zinc-500 mb-1">POS Siap Digunakan</p>
                                    <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-widest leading-relaxed">Silakan cari pelanggan <br/> lalu tap layanan</p>
                                    
                                    {/* Decoration grid behind to not make it look empty */}
                                    <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-40 mix-blend-multiply pointer-events-none z-[-1] rounded-2xl"></div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {cart.map((item, index) => (
                                        <div key={index} className="flex group p-4 border border-zinc-200 rounded-2xl hover:border-blue-300 hover:shadow-md transition-all duration-300 bg-white items-center gap-3">
                                            
                                            {/* Bagian Kiri (80%) */}
                                            <div className="w-[75%] flex flex-col pr-2">
                                                <h5 className="font-black text-zinc-800 text-[15px] mb-1.5">{item.nama_layanan}</h5>
                                                <div className="flex items-center gap-2">
                                                    <span className="bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-md text-[11px] font-bold">
                                                        {item.qty_atau_berat} {item.jenis === 'kiloan' ? 'kg' : 'pcs'}
                                                    </span> 
                                                    <span className="text-zinc-300 text-xs">&bull;</span>
                                                    <span className="text-zinc-500 text-[11px] font-semibold">
                                                        {formatCurrency(item.harga)} {item.jenis === 'kiloan' ? '/ kg' : '/ pcs'}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            {/* Bagian Kanan (20%) */}
                                            <div className="w-[25%] flex flex-col justify-center items-end border-l border-zinc-100 pl-3">
                                                <p className="font-black text-blue-600 text-sm xl:text-base leading-none mb-3 text-right">
                                                    {formatCurrency(item.subtotal)}
                                                </p>
                                                <button 
                                                    onClick={() => removeFromCart(index)}
                                                    className="text-red-400 hover:text-white bg-red-50 hover:bg-red-500 p-1.5 rounded-xl transition-all active:scale-95 border border-red-100 hover:border-red-500"
                                                    title="Hapus item"
                                                >
                                                    <Trash2 className="w-4 h-4 mx-auto" />
                                                </button>
                                            </div>
                                            
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Summary & Action */}
                        <div className="bg-zinc-50 rounded-3xl p-5 mb-5 border border-zinc-200">
                            <div className="flex justify-between text-sm text-zinc-500 mb-3 font-medium">
                                <span>Subtotal</span>
                                <span className="font-bold text-zinc-800">{formatCurrency(totalHarga)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm text-zinc-600 mb-4 border-b border-zinc-200 pb-4 gap-4">
                                <span className="flex items-center font-bold">Diskon Manual (Rp)</span>
                                <input 
                                    type="number" 
                                    min="0"
                                    value={manualDiskon} 
                                    onChange={(e) => setManualDiskon(e.target.value)} 
                                    placeholder="0"
                                    className="w-32 text-right bg-white border border-zinc-300 rounded-lg px-3 py-1.5 text-sm font-bold focus:outline-none focus:border-blue-500 transition-colors" 
                                />
                            </div>
                            <div className="flex justify-between items-end">
                                <span className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Total Dibayar</span>
                                <span className="text-3xl font-black text-blue-600 tracking-tighter leading-none">
                                    {formatCurrency(grandTotal)}
                                </span>
                            </div>
                        </div>

                        {/* Pembayaran & Tombol submit */}
                        <form onSubmit={handleSubmit} className="mt-auto shrink-0">
                            
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <label className={`
                                    cursor-pointer flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-300
                                    ${metodePembayaran === 'tunai' ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:bg-zinc-50'}
                                `}>
                                            <input type="radio" name="metode" className="hidden" checked={metodePembayaran === 'tunai'} onChange={() => setMetodePembayaran('tunai')} />
                                            <Banknote className="w-5 h-5 mb-1" />
                                            <span className="font-bold text-sm">Tunai</span>
                                        </label>
                                
                                <label className={`
                                    cursor-pointer flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-300
                                    ${metodePembayaran === 'qris' ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:bg-zinc-50'}
                                `}>
                                    <input type="radio" name="metode" className="hidden" checked={metodePembayaran === 'qris'} onChange={() => setMetodePembayaran('qris')} />
                                    <CreditCard className="w-5 h-5 mb-1 opacity-80" />
                                    <span className="font-bold text-sm">QRIS</span>
                                </label>
                            </div>

                            <button 
                                disabled={processing || cart.length === 0 || !waPelanggan || !namaPelanggan}
                                type="submit"
                                className="w-full bg-zinc-900 hover:bg-black text-white font-black text-xl py-5 rounded-[1.5rem] shadow-lg transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                            >
                                {processing ? 'Memproses...' : 'Proses Order'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Overlay Input Modal (Qty/Berat) */}
            {isModalOpen && activeLayanan && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-lg text-gray-800">
                                Input {activeLayanan.jenis === 'kiloan' ? 'Berat' : 'Jumlah'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-700 transition bg-white rounded-full p-1 shadow-sm border border-gray-200">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-6">
                            <h4 className="font-black text-xl text-center text-indigo-700 mb-1">{activeLayanan.nama_layanan}</h4>
                            <p className="text-center text-sm font-medium text-gray-500 mb-6">{formatCurrency(activeLayanan.harga)} / {activeLayanan.jenis === 'kiloan' ? 'kg' : 'pcs'}</p>
                            
                            <div className="flex justify-center items-center gap-4 mb-8">
                                <button 
                                    onClick={() => setQtyInput(prev => Math.max(0.5, parseFloat(prev) - 0.5).toString())}
                                    className="w-14 h-14 rounded-2xl bg-gray-100 hover:bg-gray-200 border-b-4 border-gray-200 active:border-b-0 active:translate-y-1 flex flex-col justify-center items-center text-gray-600 transition-all font-black text-2xl"
                                >
                                    <Minus className="w-6 h-6" />
                                </button>
                                
                                <div className="text-center border-b-2 border-indigo-600 pb-1 w-24">
                                    <input 
                                        type="number" 
                                        step="0.1"
                                        value={qtyInput}
                                        onChange={(e) => setQtyInput(e.target.value)}
                                        className="w-full text-center text-4xl font-black text-gray-800 border-none bg-transparent focus:ring-0 p-0 mb-1"
                                        autoFocus
                                    />
                                    <span className="text-gray-400 font-bold text-xs uppercase tracking-widest">{activeLayanan.jenis === 'kiloan' ? 'Kg' : 'Pcs'}</span>
                                </div>

                                <button 
                                    onClick={() => setQtyInput(prev => (parseFloat(prev || 0) + 0.5).toString())}
                                    className="w-14 h-14 rounded-2xl bg-indigo-100 hover:bg-indigo-200 border-b-4 border-indigo-200 active:border-b-0 active:translate-y-1 flex flex-col justify-center items-center text-indigo-700 transition-all font-black text-2xl"
                                >
                                    <Plus className="w-6 h-6" />
                                </button>
                            </div>

                            <button 
                                onClick={addToCart}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95"
                            >
                                Konfirmasi & Tambah
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Receipt Modal */}
            {isSuccessModalOpen && (
                <div className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl flex flex-col p-8 items-center text-center animate-in zoom-in-95 fade-in duration-300 relative">
                        <button 
                            onClick={() => setIsSuccessModalOpen(false)} 
                            className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-800 bg-zinc-50 p-2 rounded-full transition-colors active:scale-95"
                        >
                            <X className="w-5 h-5"/>
                        </button>
                        
                        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-5 animate-bounce shadow-inner">
                            <CheckCircle2 className="w-10 h-10" />
                        </div>
                        
                        <h3 className="font-black text-2xl text-zinc-800 mb-2 tracking-tight">Transaksi Sukses!</h3>
                        <p className="text-zinc-500 font-medium text-sm mb-6 leading-relaxed">Pesanan telah dicatat dan WhatsApp notifikasi sedang dikirim.</p>
                        
                        <div className="flex flex-col w-full gap-3 mt-2">
                            <button 
                                onClick={() => {
                                    window.open(`/receipt/${lastTransactionId}`, '_blank');
                                    setIsSuccessModalOpen(false);
                                }}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                                Cetak Struk (58mm)
                            </button>
                            <button 
                                onClick={() => setIsSuccessModalOpen(false)}
                                className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold py-3.5 rounded-xl transition-all active:scale-95"
                            >
                                Tutup & Lanjut POS
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </DashboardLayout>
    );
}
