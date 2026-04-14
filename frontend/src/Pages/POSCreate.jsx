import React, { useState, useEffect } from 'react';
import { 
    ShoppingCart, User, Shirt, Plus, Minus, Trash2, 
    CreditCard, Banknote, X, Search, Info, Package, CheckCircle2 
} from 'lucide-react';
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
    const [waLink, setWaLink] = useState(null); // wa.me link untuk notif manual kasir

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

                    // Hanya tampilkan layanan aktif (handle: undefined, null, true, 1)
                    const layananAktif = resLayanan.data.data.filter(l => l.is_active == null || l.is_active);
                    setLayanans(layananAktif);

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
            
            const txId        = resTx.data.data.id;
            const noResi      = 'TRX-' + String(txId).padStart(5, '0');
            const gTotal      = resTx.data.data.grand_total;
            const snapCart    = [...cart];   // Snapshot cart SEBELUM dikosongkan
            const snapDiskon  = diskonUntukPayload;
            const snapMetode  = metodePembayaran;
            const snapNama    = namaPelanggan;
            const snapWa      = waPelanggan;
            const snapTotal   = totalHarga;

            const fmt = (n) => 'Rp ' + Number(n).toLocaleString('id-ID');
            const tgl = new Date().toLocaleString('id-ID', {
                day: 'numeric', month: 'long', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });

            // Baris rincian per layanan
            const rincianBaris = snapCart.map(item => {
                const satuan = item.jenis === 'kiloan' ? 'kg' : 'pcs';
                return (
                    `  • ${item.nama_layanan}\n` +
                    `    ${item.qty_atau_berat} ${satuan} × ${fmt(item.harga)} = *${fmt(item.subtotal)}*`
                );
            }).join('\n');

            const metodeBadge = snapMetode === 'qris' ? '[QRIS]' : '[Tunai]';

            const pesan =
                `Halo *${snapNama}*,\n\n` +
                `Terima kasih telah mempercayakan cucian di *LaundryLink*.\n` +
                `--------------------------------\n` +
                `*DETAIL PESANAN*\n` +
                `No. Resi : *${noResi}*\n` +
                `Tanggal  : ${tgl}\n\n` +
                `*RINCIAN LAYANAN:*\n` +
                `${rincianBaris}\n` +
                `--------------------------------\n` +
                (snapDiskon > 0
                    ? `Subtotal  : ${fmt(snapTotal)}\nDiskon    : -${fmt(snapDiskon)}\n`
                    : '') +
                `*TOTAL    : ${fmt(gTotal)}*\n` +
                `Bayar     : ${metodeBadge}\n` +
                `--------------------------------\n\n` +
                `Pesanan Anda sedang kami proses. Kami akan kabari jika sudah siap diambil!\n\n` +
                `_Terima kasih - LaundryLink_`;

            // Normalisasi nomor WA
            let noWaNorm = snapWa.replace(/[\s\-\(\)]/g, '');
            if (noWaNorm.startsWith('0')) noWaNorm = '62' + noWaNorm.slice(1);
            if (noWaNorm.startsWith('+')) noWaNorm = noWaNorm.slice(1);

            setWaLink(`https://wa.me/${noWaNorm}?text=${encodeURIComponent(pesan)}`);
            setLastTransactionId(txId);
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
                                    <h4 className="flex items-center gap-2"><div className="bg-blue-100 p-1 rounded-md"><User className="w-4 h-4 text-blue-600"/></div> No. WhatsApp</h4>
                                </label>
                                <input 
                                    type="text"
                                    value={waPelanggan}
                                    onChange={handleWaChange}
                                    placeholder="Contoh: 081234567890"
                                    className="w-full mt-1.5 rounded-xl border border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-4 focus:ring-blue-500/10 bg-slate-50 text-slate-700 p-3 font-medium transition-all"
                                    required
                                />
                                <p className="text-[10px] text-slate-400 mt-2">*Ketik WA terdaftar untuk auto-fill nama.</p>
                            </div>
                            <div className="flex-1">
                                <label className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                    <h4 className="flex items-center gap-2"><div className="bg-blue-100 p-1 rounded-md"><User className="w-4 h-4 text-blue-600"/></div> Nama Pelanggan</h4>
                                </label>
                                <input 
                                    type="text"
                                    value={namaPelanggan}
                                    onChange={e => setNamaPelanggan(e.target.value)}
                                    placeholder="Masukkan Nama..."
                                    className="w-full mt-1.5 rounded-xl border border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-4 focus:ring-blue-500/10 bg-slate-50 text-slate-700 p-3 font-medium transition-all"
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
                <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
                        <div className="p-5 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
                            <h3 className="font-bold text-lg text-zinc-800">
                                Input {activeLayanan.jenis === 'kiloan' ? 'Berat' : 'Jumlah'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-700 transition bg-white rounded-full p-1 shadow-sm border border-zinc-200">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-6">
                            <h4 className="font-black text-xl text-center text-blue-700 mb-1">{activeLayanan.nama_layanan}</h4>
                            <p className="text-center text-sm font-medium text-zinc-500 mb-6">{formatCurrency(activeLayanan.harga)} / {activeLayanan.jenis === 'kiloan' ? 'kg' : 'pcs'}</p>
                            
                            <div className="flex justify-center items-center gap-4 mb-8">
                                <button 
                                    onClick={() => setQtyInput(prev => Math.max(0.5, parseFloat(prev) - 0.5).toString())}
                                    className="w-14 h-14 rounded-2xl bg-zinc-100 hover:bg-zinc-200 border-b-4 border-zinc-200 active:border-b-0 active:translate-y-1 flex flex-col justify-center items-center text-zinc-600 transition-all font-black text-2xl"
                                >
                                    <Minus className="w-6 h-6" />
                                </button>
                                
                                <div className="text-center border-b-2 border-blue-600 pb-1 w-24">
                                    <input 
                                        type="number" 
                                        step="0.1"
                                        value={qtyInput}
                                        onChange={(e) => setQtyInput(e.target.value)}
                                        className="w-full text-center text-4xl font-black text-zinc-800 border-none bg-transparent focus:ring-0 p-0 mb-1"
                                        autoFocus
                                    />
                                    <span className="text-zinc-400 font-bold text-xs uppercase tracking-widest">{activeLayanan.jenis === 'kiloan' ? 'Kg' : 'Pcs'}</span>
                                </div>

                                <button 
                                    onClick={() => setQtyInput(prev => (parseFloat(prev || 0) + 0.5).toString())}
                                    className="w-14 h-14 rounded-2xl bg-blue-100 hover:bg-blue-200 border-b-4 border-blue-200 active:border-b-0 active:translate-y-1 flex flex-col justify-center items-center text-blue-700 transition-all font-black text-2xl"
                                >
                                    <Plus className="w-6 h-6" />
                                </button>
                            </div>

                            <button 
                                onClick={addToCart}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95"
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
                        
                        <h3 className="font-black text-2xl text-zinc-800 mb-2 tracking-tight">Transaksi Sukses! 🎉</h3>
                        <p className="text-zinc-500 font-medium text-sm mb-6 leading-relaxed">
                            Pesanan telah dicatat. Kirim konfirmasi WhatsApp ke pelanggan sekarang.
                        </p>
                        
                        <div className="flex flex-col w-full gap-3 mt-2">
                            {/* Tombol WA — wa.me link manual */}
                            {waLink && (
                                <a
                                    href={waLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={() => setIsSuccessModalOpen(false)}
                                    className="w-full bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-green-500/20 active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                    </svg>
                                    Kirim WhatsApp ke Pelanggan
                                </a>
                            )}

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
