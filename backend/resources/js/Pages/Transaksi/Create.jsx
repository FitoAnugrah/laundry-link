import React, { useState, useEffect } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { 
    ShoppingCart, User, Shirt, Plus, Minus, Trash2, 
    CreditCard, Banknote, X, Search, Info, Package, CheckCircle2 
} from 'lucide-react';

export default function POSCreate({ auth, pelanggans, layanans }) {
    const { data, setData, post, processing, errors } = useForm({
        pelanggan_id: '',
        metode_pembayaran: 'tunai',
        status_pembayaran: 'lunas', // default lunas untuk kasir POS
        status_pesanan: 'masuk',
        layanan: []
    });

    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [cart, setCart] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeLayanan, setActiveLayanan] = useState(null);
    const [qtyInput, setQtyInput] = useState('1');

    // Sync cart to form data
    useEffect(() => {
        setData('layanan', cart);
    }, [cart]);

    const handleSelectCustomer = (e) => {
        const id = e.target.value;
        setData('pelanggan_id', id);
        const customer = pelanggans.find(p => p.id == parseInt(id));
        setSelectedCustomer(customer);
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

    // Kalkulasi Harga
    const totalHarga = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const isLoyaltyDiscount = selectedCustomer && selectedCustomer.total_transaksi > 0 && selectedCustomer.total_transaksi % 10 === 0;
    const diskon = isLoyaltyDiscount ? 10000 : 0;
    const grandTotal = Math.max(0, totalHarga - diskon);

    const formatCurrency = (number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('transaksi.store'), {
            onSuccess: () => {
                setCart([]);
                setSelectedCustomer(null);
                setData('pelanggan_id', '');
            }
        });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Point of Sale - Kasir</h2>}
        >
            <Head title="Kasir POS" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    
                    {/* Grid Kolom Utama */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        
                        {/* Kolom Kiri: Layanan & Pelanggan (70%) */}
                        <div className="lg:col-span-8 flex flex-col gap-6">
                            
                            {/* Card Pelanggan */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                        <User className="w-5 h-5 text-blue-600" />
                                        Informasi Pelanggan
                                    </h3>
                                </div>
                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Pelanggan</label>
                                        <select 
                                            value={data.pelanggan_id}
                                            onChange={handleSelectCustomer}
                                            className="w-full rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 p-3"
                                        >
                                            <option value="" disabled>-- Pilih Pelanggan (Cari by ID/Nama) --</option>
                                            {pelanggans.map(p => (
                                                <option key={p.id} value={p.id}>{p.nama} ({p.no_wa || 'No Wa'})</option>
                                            ))}
                                        </select>
                                        {errors.pelanggan_id && <span className="text-red-500 text-sm mt-1">{errors.pelanggan_id}</span>}
                                    </div>
                                    
                                    {selectedCustomer && (
                                        <div className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="text-sm text-gray-500">Pelanggan Setia</p>
                                                    <p className="font-bold text-gray-800 text-lg">{selectedCustomer.nama}</p>
                                                    <p className="text-xs text-blue-600 font-medium bg-blue-100 inline-block px-2 py-0.5 rounded-full mt-1">
                                                        Total Transaksi: {selectedCustomer.total_transaksi}
                                                    </p>
                                                </div>
                                                {isLoyaltyDiscount && (
                                                    <div className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 animate-pulse">
                                                        <CheckCircle2 className="w-4 h-4" /> CRM Discount!
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Card Pencarian Layanan */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex-1 flex flex-col">
                                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                        <Shirt className="w-5 h-5 text-indigo-600" />
                                        Katalog Layanan
                                    </h3>
                                    <div className="relative w-full md:w-64">
                                        <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                                        <input 
                                            type="text"
                                            placeholder="Cari layanan..."
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            className="w-full pl-9 pr-4 py-2 border-gray-200 rounded-full text-sm focus:border-indigo-500 focus:ring-indigo-500 bg-gray-50"
                                        />
                                    </div>
                                </div>

                                {/* Grid Layanan */}
                                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pr-2" style={{ maxHeight: '60vh' }}>
                                    {filteredLayanan.map(layanan => (
                                        <button
                                            key={layanan.id}
                                            onClick={() => openLayananModal(layanan)}
                                            className="group relative flex flex-col bg-white border border-gray-200 rounded-2xl p-4 hover:border-indigo-500 hover:shadow-md transition-all duration-200 text-left overflow-hidden"
                                        >
                                            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-indigo-50 to-transparent rounded-bl-3xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
                                            
                                            <div className="bg-indigo-100 text-indigo-700 w-10 h-10 rounded-xl flex items-center justify-center mb-3">
                                                {layanan.jenis === 'kiloan' ? <Package className="w-5 h-5" /> : <Shirt className="w-5 h-5" />}
                                            </div>
                                            
                                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                                {layanan.jenis}
                                            </span>
                                            <h4 className="font-bold text-gray-800 leading-tight mb-2 flex-1">
                                                {layanan.nama_layanan}
                                            </h4>
                                            
                                            <p className="text-indigo-600 font-bold">
                                                {formatCurrency(layanan.harga)}
                                                <span className="text-xs text-gray-400 font-normal">
                                                    {layanan.jenis === 'kiloan' ? ' /kg' : ' /pcs'}
                                                </span>
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Kolom Kanan: Keranjang (30%) */}
                        <div className="lg:col-span-4 flex flex-col h-full">
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col h-full sticky top-6">
                                <div className="flex items-center gap-2 mb-4 drop-shadow-sm">
                                    <ShoppingCart className="w-6 h-6 text-indigo-600" />
                                    <h3 className="text-xl font-extrabold text-gray-800">Keranjang Kasir</h3>
                                </div>

                                {/* List Keranjang */}
                                <div className="flex-1 overflow-y-auto mb-4 border-t border-b border-gray-50 py-4 -mx-2 px-2 min-h-[300px]">
                                    {cart.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                                            <ShoppingCart className="w-12 h-12 opacity-20" />
                                            <p className="text-sm">Belum ada layanan dipilih.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {cart.map((item, index) => (
                                                <div key={index} className="flex justify-between items-start group">
                                                    <div className="flex-1 pr-2">
                                                        <h5 className="font-semibold text-gray-800 text-sm leading-tight">{item.nama_layanan}</h5>
                                                        <p className="text-xs text-gray-500 mt-0.5">
                                                            {item.qty_atau_berat} {item.jenis === 'kiloan' ? 'kg' : 'pcs'} x {formatCurrency(item.harga)}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-gray-800 text-sm">{formatCurrency(item.subtotal)}</p>
                                                        <button 
                                                            onClick={() => removeFromCart(index)}
                                                            className="text-white bg-red-500 hover:bg-red-600 rounded-full p-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity float-right"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Summary & Action */}
                                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                                        <span>Subtotal</span>
                                        <span className="font-semibold text-gray-800">{formatCurrency(totalHarga)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-green-600 mb-3 border-b border-gray-200 pb-3">
                                        <span className="flex items-center gap-1"><Info className="w-3 h-3" /> Diskon CRM</span>
                                        <span className="font-semibold">- {formatCurrency(diskon)}</span>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <span className="text-gray-500 font-medium">Grand Total</span>
                                        <span className="text-2xl font-black text-indigo-700">{formatCurrency(grandTotal)}</span>
                                    </div>
                                </div>

                                {/* Pembayaran & Tombol submit */}
                                <form onSubmit={handleSubmit} className="mt-auto">
                                    {errors.layanan && <p className="text-red-500 text-sm text-center mb-2">Keranjang tidak boleh kosong / error input.</p>}
                                    
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Pilih Pembayaran</label>
                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <label className={`
                                            cursor-pointer flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all
                                            ${data.metode_pembayaran === 'tunai' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}
                                        `}>
                                            <input type="radio" name="metode" className="hidden" checked={data.metode_pembayaran === 'tunai'} onChange={() => setData('metode_pembayaran', 'tunai')} />
                                            <Banknote className="w-6 h-6 mb-1" />
                                            <span className="font-semibold text-sm">Tunai</span>
                                        </label>
                                        
                                        <label className={`
                                            cursor-pointer flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all
                                            ${data.metode_pembayaran === 'qris' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}
                                        `}>
                                            <input type="radio" name="metode" className="hidden" checked={data.metode_pembayaran === 'qris'} onChange={() => setData('metode_pembayaran', 'qris')} />
                                            <CreditCard className="w-6 h-6 mb-1" />
                                            <span className="font-semibold text-sm">QRIS</span>
                                        </label>
                                    </div>

                                    <button 
                                        disabled={processing || cart.length === 0 || !data.pelanggan_id}
                                        type="submit"
                                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-lg py-4 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                                    >
                                        {processing ? 'Memproses...' : 'Proses Pesanan'}
                                    </button>
                                </form>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Overlay Input Modal (Qty/Berat) */}
            {isModalOpen && activeLayanan && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-gray-800">
                                Tambah {activeLayanan.jenis === 'kiloan' ? 'Berat' : 'Jumlah'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-5">
                            <h4 className="font-semibold text-xl text-center text-indigo-700 mb-1">{activeLayanan.nama_layanan}</h4>
                            <p className="text-center text-sm text-gray-500 mb-6">{formatCurrency(activeLayanan.harga)} / {activeLayanan.jenis === 'kiloan' ? 'kg' : 'pcs'}</p>
                            
                            <div className="flex justify-center items-center gap-4 mb-6">
                                <button 
                                    onClick={() => setQtyInput(prev => Math.max(0.5, parseFloat(prev) - 0.5).toString())}
                                    className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex flex-col justify-center items-center text-gray-600 transition"
                                >
                                    <Minus className="w-5 h-5" />
                                </button>
                                
                                <div className="text-center">
                                    <input 
                                        type="number" 
                                        step="0.1"
                                        value={qtyInput}
                                        onChange={(e) => setQtyInput(e.target.value)}
                                        className="w-24 text-center text-3xl font-black text-gray-800 border-none bg-transparent focus:ring-0 p-0"
                                        autoFocus
                                    />
                                    <span className="text-gray-400 font-medium">{activeLayanan.jenis === 'kiloan' ? 'Kg' : 'Pcs'}</span>
                                </div>

                                <button 
                                    onClick={() => setQtyInput(prev => (parseFloat(prev || 0) + 0.5).toString())}
                                    className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex flex-col justify-center items-center text-gray-600 transition"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>

                            <button 
                                onClick={addToCart}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-md transition-all disabled:opacity-50"
                            >
                                Masukkan Keranjang
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
