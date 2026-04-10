import React, { useState, useEffect } from 'react';
import { BarChart, Clock, CheckCircle2, TrendingUp, Filter, Receipt, ChevronDown } from 'lucide-react';
import DashboardLayout from '../../Layouts/DashboardLayout';
import api from '../../axios';

export default function ReportsIndex({ user, setUser }) {
    const [transactions, setTransactions] = useState([]);
    const [stats, setStats] = useState({
        pendapatan_hari_ini: 0,
        pendapatan_minggu_ini: 0,
        pendapatan_bulan_ini: 0
    });
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('semua');
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [activeCard, setActiveCard] = useState('bulan_ini');
    useEffect(() => {
        fetchReports();
    }, [selectedMonth]);

    const fetchReports = async () => {
        setLoading(true);
        try {
            // Selipkan parameter ?month=YYYY-MM ke URL Axios
            const statsRes = await api.get(`/api/reports/statistics?month=${selectedMonth}`);
            setStats(statsRes.data.data);

            const transRes = await api.get(`/api/transaksi?month=${selectedMonth}`);

            const lunasTrans = transRes.data.data.filter(t => t.status_pembayaran === 'lunas');
            setTransactions(lunasTrans);

        } catch (error) {
            console.error("Error fetching report data", error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
    };
    const filteredTransactions = transactions.filter(t => {
        // 1. Cek Filter Metode Pembayaran (Tunai/QRIS)
        if (activeFilter !== 'semua' && t.metode_pembayaran?.toLowerCase() !== activeFilter.toLowerCase()) {
            return false;
        }

        // 2. Cek Filter Waktu berdasarkan Kartu yang diklik
        const txDate = new Date(t.created_at);
        const today = new Date();

        if (activeCard === 'hari_ini') {
            // Hanya tampilkan jika tanggal, bulan, dan tahunnya persis hari ini
            return txDate.toDateString() === today.toDateString();

        } else if (activeCard === 'minggu_ini') {
            // Cari tanggal hari Senin minggu ini
            const day = today.getDay() || 7;
            const startOfWeek = new Date(today);
            startOfWeek.setHours(0, 0, 0, 0);
            startOfWeek.setDate(today.getDate() - day + 1);

            // Tampilkan jika transaksi terjadi setelah atau pada hari Senin tersebut
            return txDate >= startOfWeek;
        }

        // Jika activeCard === 'bulan_ini', loloskan semua (karena data dari API sudah difilter per bulan)
        return true;
    });

    return (
        <DashboardLayout user={user} setUser={setUser}>
            <div className="flex-1 w-full h-full bg-zinc-50 overflow-hidden flex flex-col p-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 shrink-0">
                    <div>
                        <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Financial Reports</h1>
                        <p className="text-sm text-zinc-500 mt-1 font-medium tracking-wide">Pantau metrik pendapatan secara real-time dari database.</p>
                    </div>
                    <div className="relative flex items-center bg-white border border-zinc-200 rounded-xl shadow-sm hover:border-zinc-300 transition-colors px-4 py-2.5 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 cursor-pointer">
                        <CalendarIcon className="w-4 h-4 text-indigo-500 mr-2" />
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="bg-transparent text-sm font-black text-zinc-700 uppercase tracking-widest outline-none cursor-pointer"
                        />
                    </div>
                </div>

                {/* Dashboard Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 shrink-0">

                    {/* Hari Ini */}
                    <div
                        onClick={() => setActiveCard('hari_ini')}
                        className={`rounded-[1.5rem] p-6 shadow-sm flex flex-col relative overflow-hidden group cursor-pointer transition-all ${activeCard === 'hari_ini' ? 'bg-indigo-50/50 ring-2 ring-indigo-500 border-transparent' : 'bg-white border border-zinc-200 hover:border-indigo-200'}`}
                    >
                        <div className="absolute -right-6 -top-6 w-32 h-32 bg-indigo-50 rounded-full blur-2xl group-hover:bg-indigo-100 transition-colors"></div>
                        <div className="flex justify-between items-start mb-6 relative z-10">
                            <div>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Pendapatan Hari Ini</p>
                                {/* We inject stats natively returned from backend */}
                                <h3 className="text-3xl font-black text-zinc-900 flex items-end gap-1">
                                    <span className="text-lg text-indigo-500 mb-1 leading-none">Rp</span>
                                    {loading ? '...' : (stats.pendapatan_hari_ini / 1000).toLocaleString('id-ID')}
                                    <span className="text-sm text-zinc-400 mb-1 leading-none">k</span>
                                </h3>
                            </div>
                            <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm shadow-indigo-100">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden mt-auto">
                            <div className="h-full bg-indigo-500 w-1/4 rounded-full"></div>
                        </div>
                    </div>

                    {/* Minggu Ini */}
                    <div
                        onClick={() => setActiveCard('minggu_ini')}
                        className={`rounded-[1.5rem] p-6 shadow-sm flex flex-col relative overflow-hidden group cursor-pointer transition-all ${activeCard === 'minggu_ini' ? 'bg-blue-50/50 ring-2 ring-blue-500 border-transparent' : 'bg-white border border-zinc-200 hover:border-blue-200'}`}
                    >
                        <div className="absolute -right-6 -top-6 w-32 h-32 bg-blue-50 rounded-full blur-2xl group-hover:bg-blue-100 transition-colors"></div>
                        <div className="flex justify-between items-start mb-6 relative z-10">
                            <div>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Pendapatan Minggu Ini</p>
                                <h3 className="text-3xl font-black text-zinc-900 flex items-end gap-1">
                                    <span className="text-lg text-blue-500 mb-1 leading-none">Rp</span>
                                    {loading ? '...' : (stats.pendapatan_minggu_ini / 1000).toLocaleString('id-ID')}
                                    <span className="text-sm text-zinc-400 mb-1 leading-none">k</span>
                                </h3>
                            </div>
                            <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center text-blue-600 shadow-sm shadow-blue-100">
                                <BarChart className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden mt-auto">
                            <div className="h-full bg-blue-500 w-2/4 rounded-full"></div>
                        </div>
                    </div>

                    {/* Bulan Ini */}
                    <div
                        onClick={() => setActiveCard('bulan_ini')}
                        className={`rounded-[1.5rem] p-6 shadow-md flex flex-col relative overflow-hidden group cursor-pointer transition-all ${activeCard === 'bulan_ini' ? 'bg-zinc-900 ring-2 ring-emerald-400 ring-offset-2 ring-offset-zinc-100' : 'bg-zinc-800 hover:bg-zinc-900'}`}
                    >
                        <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors"></div>
                        <div className="flex justify-between items-start mb-6 relative z-10">
                            <div>
                                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mb-1">Akumulasi Bulan Ini</p>
                                <h3 className="text-3xl font-black text-white flex items-end gap-1">
                                    <span className="text-lg text-emerald-400 mb-1 leading-none">Rp</span>
                                    {loading ? '...' : (stats.pendapatan_bulan_ini / 1000).toLocaleString('id-ID')}
                                    <span className="text-sm text-zinc-500 mb-1 leading-none">k</span>
                                </h3>
                            </div>
                            <div className="w-10 h-10 bg-white/10 border border-white/5 rounded-xl flex items-center justify-center text-emerald-400 shadow-sm backdrop-blur-md">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden mt-auto">
                            <div className="h-full bg-emerald-400 w-3/4 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.5)]"></div>
                        </div>
                    </div>

                </div>

                {/* Content Area - Report History Table */}
                <div className="flex-1 overflow-hidden bg-white border border-zinc-200 rounded-[1.5rem] shadow-sm relative flex flex-col">

                    {/* Toolbar inside table card */}
                    <div className="p-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                        <h3 className="font-bold text-zinc-800 text-sm flex items-center gap-2">
                            <Receipt className="w-4 h-4 text-emerald-500" /> Histori Transaksi Tervalidasi
                        </h3>
                        <div className="relative">
                            <button
                                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm font-black text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300 transition-all shadow-sm active:scale-95"
                            >
                                <Filter className="w-4 h-4 text-emerald-500" />
                                {activeFilter === 'semua' ? 'Filter Transaksi' : `Metode: ${activeFilter.toUpperCase()}`}
                            </button>

                            {showFilterDropdown && (
                                <div className="absolute right-0 mt-2 w-56 bg-white border border-zinc-200 rounded-2xl shadow-xl z-50 overflow-hidden transform origin-top-right transition-all">
                                    <div className="p-2 flex flex-col gap-1">
                                        <button
                                            onClick={() => { setActiveFilter('semua'); setShowFilterDropdown(false); }}
                                            className={`w-full text-left px-4 py-3 text-sm font-bold rounded-xl transition-all ${activeFilter === 'semua' ? 'bg-zinc-100 text-zinc-900 border border-zinc-200' : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700 border border-transparent'}`}
                                        >
                                            Semua Metode
                                        </button>
                                        <button
                                            onClick={() => { setActiveFilter('tunai'); setShowFilterDropdown(false); }}
                                            className={`w-full text-left px-4 py-3 text-sm font-bold rounded-xl transition-all ${activeFilter === 'tunai' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700 border border-transparent'}`}
                                        >
                                            💵 Hanya Tunai
                                        </button>
                                        <button
                                            onClick={() => { setActiveFilter('qris'); setShowFilterDropdown(false); }}
                                            className={`w-full text-left px-4 py-3 text-sm font-bold rounded-xl transition-all ${activeFilter === 'qris' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700 border border-transparent'}`}
                                        >
                                            📱 Hanya QRIS
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="overflow-y-auto custom-scrollbar flex-1 relative">
                        {loading ? (
                            <div className="flex justify-center items-center h-48 flex-col gap-4">
                                <div className="animate-spin rounded-full h-10 w-10 border-4 border-zinc-200 border-t-emerald-600"></div>
                                <span className="text-zinc-400 font-bold animate-pulse text-sm">Menarik Laporan...</span>
                            </div>
                        ) : transactions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-16 text-zinc-400 mt-6">
                                <div className="bg-zinc-50 w-20 h-20 rounded-full flex items-center justify-center mb-4 border border-zinc-100">
                                    <Receipt className="w-10 h-10 text-zinc-300" />
                                </div>
                                <h3 className="font-bold text-xl text-zinc-600 mb-1">Tidak ada data transaksi</h3>
                                <p className="text-sm text-zinc-400 font-medium">Belum ada transaksi 'Lunas' yang tercatat di database.</p>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 bg-white/90 backdrop-blur-md z-10 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                                    <tr>
                                        <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-zinc-400">Order ID</th>
                                        <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-zinc-400">Waktu Pembayaran</th>
                                        <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-zinc-400">Pelanggan</th>
                                        <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-zinc-400">Metode</th>
                                        <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-right">Nominal (Rp)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTransactions.map((t) => (
                                        <tr key={t.id} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                                            <td className="py-4 px-6 font-black text-zinc-700">#{t.id.toString().padStart(4, '0')}</td>
                                            <td className="py-4 px-6 text-sm text-zinc-500 font-medium whitespace-nowrap">
                                                {new Date(t.created_at).toLocaleString('id-ID', {
                                                    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                                })}
                                            </td>
                                            <td className="py-4 px-6 font-bold text-zinc-800">{t.nama_sementara || t.pelanggan?.nama || 'Pelanggan Baru'}</td>
                                            <td className="py-4 px-6">
                                                <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${t.metode_pembayaran === 'qris'
                                                    ? 'bg-blue-50 text-blue-600 border-blue-100'
                                                    : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                    }`}>
                                                    {t.metode_pembayaran}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-right font-black text-emerald-600">
                                                {formatCurrency(t.grand_total)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

// Inline Icon to keep dependencies standalone
const CalendarIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
        <line x1="16" x2="16" y1="2" y2="6" />
        <line x1="8" x2="8" y1="2" y2="6" />
        <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
)
