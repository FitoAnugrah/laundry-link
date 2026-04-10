import React, { useState, useEffect, useMemo } from 'react';
import { Search, Clock, Check, MoreVertical, Activity, Loader2, Sparkles, Package } from 'lucide-react';
import DashboardLayout from '../Layouts/DashboardLayout';
import api from '../axios';

const STATUS_STAGES = [
    { value: 'masuk', label: 'Masuk', color: 'bg-slate-100 text-slate-600 border-slate-200 shadow-sm' },
    { value: 'dicuci', label: 'Dicuci', color: 'bg-yellow-100/80 text-yellow-700 border-yellow-200 shadow-inner' },
    { value: 'disetrika', label: 'Disetrika', color: 'bg-orange-100/80 text-orange-700 border-orange-200 shadow-inner' },
    { value: 'siap diambil', label: 'Siap Diambil', color: 'bg-cyan-100/80 text-cyan-700 border-cyan-200 shadow-[0_0_15px_rgba(34,211,238,0.4)] ring-1 ring-cyan-300' },
    { value: 'selesai', label: 'Selesai', color: 'bg-emerald-100 text-emerald-700 border-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.4)] ring-1 ring-emerald-300' },
];

export default function OrderManagement({ user, setUser }) {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/transaksi');
            setOrders(res.data.data);
        } catch (error) {
            console.error("Error fetching orders", error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id, newStatus) => {
        try {
            // Optimistic update
            setOrders(prev => prev.map(o => o.id === id ? { ...o, status_pesanan: newStatus } : o));

            await api.patch(`/api/transaksi/${id}/status`, {
                status_pesanan: newStatus
            });
        } catch (error) {
            console.error("Fail update", error);
            fetchOrders(); // rollback on fail
        }
    };

    const formatCurrency = (number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
    };

    const filteredOrders = orders.filter(o =>
        o.status_pesanan !== 'selesai' &&
        (o.pelanggan?.nama.toLowerCase().includes(search.toLowerCase()) ||
            o.id.toString().includes(search))
    );

    const metrics = useMemo(() => {
        return {
            total: orders.filter(o => o.status_pesanan !== 'selesai').length,
            processing: orders.filter(o => ['masuk', 'dicuci', 'disetrika'].includes(o.status_pesanan)).length,
            ready: orders.filter(o => o.status_pesanan === 'siap diambil').length
        };
    }, [orders]);

    return (
        <DashboardLayout user={user} setUser={setUser}>
            <div className="flex-1 w-full h-full bg-zinc-50 overflow-hidden flex flex-col p-6">

                {/* Header Sub */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 shrink-0">
                    <div>
                        <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Live Monitor</h1>
                        <p className="text-sm text-zinc-500 mt-1 font-medium tracking-wide">Beban kerja dan sinkronisasi pesanan.</p>
                    </div>
                    <div className="relative w-full md:w-96 shadow-sm rounded-2xl bg-white border border-zinc-200 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
                        <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-zinc-400" />
                        <input
                            type="text"
                            placeholder="Cari ID / Nama Pelanggan..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-transparent border-none text-sm focus:ring-0 text-zinc-800 font-medium placeholder:font-normal placeholder:text-zinc-400 outline-none rounded-2xl"
                        />
                    </div>
                </div>

                {/* Smart Metrics Widgets */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 shrink-0">
                    <div className="bg-blue-600 rounded-[1.5rem] p-5 shadow-md shadow-blue-500/20 text-white flex items-center justify-between group overflow-hidden relative">
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform"></div>
                        <div>
                            <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mb-1">Total Antrean Aktif</p>
                            <h3 className="text-4xl font-black">{metrics.total}</h3>
                        </div>
                        <Activity className="w-10 h-10 text-white/50" />
                    </div>

                    <div className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-zinc-200 flex items-center justify-between">
                        <div>
                            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                Sedang Diproses <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-500" />
                            </p>
                            <h3 className="text-4xl font-black text-zinc-800">{metrics.processing}</h3>
                        </div>
                        <div className="w-12 h-12 bg-orange-50 rounded-[14px] flex items-center justify-center text-orange-500">
                            <Clock className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-zinc-200 flex items-center justify-between">
                        <div>
                            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Siap Diambil</p>
                            <h3 className="text-4xl font-black text-emerald-600">{metrics.ready}</h3>
                        </div>
                        <div className="w-12 h-12 bg-emerald-50 rounded-[14px] flex items-center justify-center text-emerald-500 relative">
                            <span className="absolute w-full h-full bg-emerald-400 rounded-[14px] animate-ping opacity-20"></span>
                            <Sparkles className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* List Container (Fluid Cards Layout) */}
                <div className="flex-1 overflow-y-auto pr-2 pb-8 custom-scrollbar">
                    {loading && (
                        <div className="flex justify-center items-center h-48 flex-col gap-4">
                            <div className="animate-spin rounded-full h-10 w-10 border-4 border-zinc-200 border-t-blue-600"></div>
                            <span className="text-zinc-400 font-bold animate-pulse text-sm">Menyamakan data...</span>
                        </div>
                    )}

                    {!loading && filteredOrders.length === 0 && (
                        <div className="bg-zinc-50 rounded-3xl border-2 border-dashed border-zinc-200 p-16 flex flex-col items-center justify-center text-zinc-400 m-2 mt-8">
                            <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mb-4 shadow-sm border border-zinc-100">
                                <Package className="w-10 h-10 text-zinc-300" />
                            </div>
                            <h3 className="font-bold text-xl text-zinc-600 mb-1">Belum ada transaksi aktif</h3>
                            <p className="text-sm text-zinc-400 font-medium">Semua pesanan Anda akan muncul dan dapat dipantau di sini.</p>
                        </div>
                    )}

                    {!loading && filteredOrders.length > 0 && (
                        <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
                            {filteredOrders.map(order => {
                                const currentStageIndex = STATUS_STAGES.findIndex(s => s.value === order.status_pesanan);
                                const currentStage = STATUS_STAGES[currentStageIndex];
                                const nextStage = STATUS_STAGES[currentStageIndex + 1];

                                const createdAt = new Date(order.created_at);
                                const diffHours = (new Date() - createdAt) / (1000 * 60 * 60);
                                const sisaWaktu = 48 - diffHours;

                                let slaColor = 'text-emerald-700 bg-emerald-100 border-emerald-200'; // Hijau (Aman)
                                let slaPulse = false;
                                let slaText = `Sisa ${Math.max(0, Math.round(sisaWaktu))} Jam`;

                                if (order.status_pesanan === 'selesai' || order.status_pesanan === 'siap diambil') {
                                    slaColor = 'text-zinc-500 bg-zinc-100 border-zinc-200';
                                    slaText = 'Waktu Tuntas';
                                } else if (sisaWaktu <= 0) {
                                    slaColor = 'text-red-700 bg-red-100 border-red-300';
                                    slaPulse = true;
                                    slaText = `Terlambat ${Math.abs(Math.round(sisaWaktu))} Jam`;
                                } else if (sisaWaktu <= 24) {
                                    slaColor = 'text-yellow-700 bg-yellow-100 border-yellow-300';
                                    slaText = `Sisa ${Math.round(sisaWaktu)} Jam (Mendesak)`;
                                }

                                return (
                                    <div key={order.id} className="bg-white rounded-3xl shadow-sm border border-zinc-200 p-6 flex flex-col transition-all duration-300 hover:border-blue-200 hover:-translate-y-1 hover:shadow-md group">

                                        {/* Card Header */}
                                        <div className="flex justify-between items-start mb-5">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-black text-zinc-900 text-2xl tracking-tighter">#{order.id.toString().padStart(4, '0')}</span>
                                                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${currentStage.color.replace('slate', 'zinc')}`}>
                                                        {currentStage.label}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                                                        <Clock className="w-3 h-3 text-blue-400" />
                                                        {createdAt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wider border relative ${slaColor}`}>
                                                        {slaPulse && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></span>}
                                                        {slaPulse && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full"></span>}
                                                        {slaText}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Identity Data (Clean Bento Item) */}
                                        <div className="bg-zinc-50 rounded-[1.25rem] p-5 mb-6 border border-zinc-100/80">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Pelanggan</span>
                                                <span className={`uppercase text-[9px] font-black px-2.5 py-1 rounded-md tracking-widest ${order.status_pembayaran === 'lunas' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                    {order.status_pembayaran}
                                                </span>
                                            </div>
                                            <div className="font-black text-zinc-800 text-xl mb-4 truncate leading-tight">{order.nama_sementara || order.pelanggan?.nama || 'Guest'}</div>

                                            <div className="flex justify-between items-end border-t border-zinc-200/80 pt-4">
                                                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Total Order</span>
                                                <span className="font-black text-blue-600 text-2xl leading-none tracking-tighter">{formatCurrency(order.grand_total)}</span>
                                            </div>
                                        </div>

                                        {/* Stepper Interaktif */}
                                        <div className="mt-auto">
                                            <p className="text-[10px] font-bold text-zinc-400 mb-3 uppercase tracking-widest flex items-center gap-2">
                                                Timeline Update
                                            </p>
                                            <div className="flex gap-1.5 justify-between relative">
                                                {STATUS_STAGES.map((stage, idx) => {
                                                    const isPast = idx <= currentStageIndex;
                                                    const isCurrent = idx === currentStageIndex;

                                                    // Map tailwind custom colors for generic rendering
                                                    let customBg = 'bg-zinc-200 border-zinc-200';
                                                    if (isPast) {
                                                        if (stage.value === 'dicuci') customBg = 'bg-yellow-500 border-yellow-500';
                                                        else if (stage.value === 'disetrika') customBg = 'bg-orange-500 border-orange-500';
                                                        else if (stage.value === 'siap diambil') customBg = 'bg-blue-500 border-blue-500';
                                                        else if (stage.value === 'selesai') customBg = 'bg-emerald-500 border-emerald-500';
                                                        else customBg = 'bg-slate-400 border-slate-400';
                                                    }

                                                    return (
                                                        <button
                                                            key={stage.value}
                                                            onClick={() => updateStatus(order.id, stage.value)}
                                                            className={`relative group/btn flex-1 h-2 rounded-full cursor-pointer transition-all duration-300 overflow-hidden hover:opacity-80
                                                                ${isPast ? customBg : 'bg-zinc-100 border border-zinc-200/50'}
                                                            `}
                                                            title={`Set status ke ${stage.label}`}
                                                        >
                                                            {/* Highlight overlay */}
                                                            {isCurrent && <div className="absolute inset-0 bg-white/40 animate-pulse"></div>}

                                                            {/* Tooltip (Clean) */}
                                                            <span className="opacity-0 group-hover/btn:opacity-100 absolute bottom-4 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-[10px] py-1 px-2.5 rounded-lg font-bold whitespace-nowrap pointer-events-none transition-all duration-200 shadow-sm z-10 hidden md:block">
                                                                {stage.label}
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            <div className="flex justify-between items-center text-[9px] text-zinc-400 font-bold mt-2 uppercase tracking-widest font-mono">
                                                <span>Intake</span>
                                                <span>Ready</span>
                                            </div>
                                        </div>
                                        {nextStage && (
                                            <button
                                                onClick={() => updateStatus(order.id, nextStage.value)}
                                                className="w-full mt-5 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98]"
                                            >
                                                Tandai {nextStage.label}
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
