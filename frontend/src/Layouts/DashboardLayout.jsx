import React, { useState, useEffect, useRef } from 'react';
import {
    Bell, LogOut, Droplets,
    LayoutDashboard, ShoppingBag, Users, Tag, BarChart,
    Check, CheckCheck, AlertTriangle, Star, TrendingUp, X
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import api from '../axios';

export default function DashboardLayout({ user, setUser, children }) {
    const [currentTime, setCurrentTime] = useState(new Date());
    const location = useLocation();

    // Notification State
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotif, setShowNotif] = useState(false);
    const [loadingNotifs, setLoadingNotifs] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Fetch notifications on mount & every 30 seconds
    useEffect(() => {
        // Tarik data pertama kali saat halaman dibuka
        fetchNotifications();

        // Buat robot kecil yang menarik data berulang kali setiap 10 detik (10.000 milidetik)
        const intervalId = setInterval(() => {
            fetchNotifications();
        }, 10000);

        // Bersihkan robotnya jika user pindah halaman (Mencegah memory leak)
        return () => clearInterval(intervalId);
    }, []);

    // Click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowNotif(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/api/notifications');
            setNotifications(res.data.data);
            setUnreadCount(res.data.unread_count);
        } catch (err) {
            console.error("Gagal fetch notifikasi:", err);
        }
    };

    const handleMarkAsRead = async (id) => {
        try {
            await api.patch(`/api/notifications/${id}/read`);
            setNotifications(prev => prev.map(n =>
                n.id === id ? { ...n, read_at: new Date().toISOString() } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error("Gagal tandai dibaca:", err);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            setLoadingNotifs(true);
            await api.post('/api/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
            setUnreadCount(0);
        } catch (err) {
            console.error("Gagal tandai semua dibaca:", err);
        } finally {
            setLoadingNotifs(false);
        }
    };

    const handleLogout = async () => {
        await api.post('/logout');
        setUser(null);
    };

    const getNotifIcon = (icon, color) => {
        const colorMap = {
            red: 'text-red-500 bg-red-50',
            yellow: 'text-yellow-600 bg-yellow-50',
            green: 'text-emerald-600 bg-emerald-50',
            blue: 'text-blue-600 bg-blue-50',
        };
        const cls = colorMap[color] || colorMap.blue;
        const iconMap = {
            alert: <AlertTriangle className="w-4 h-4" />,
            star: <Star className="w-4 h-4" />,
            check: <Check className="w-4 h-4" />,
            trending: <TrendingUp className="w-4 h-4" />,
            bell: <Bell className="w-4 h-4" />,
        };
        return (
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cls}`}>
                {iconMap[icon] || iconMap.bell}
            </div>
        );
    };

    const navItems = [
        { path: '/', icon: LayoutDashboard, label: 'Kasir POS' },
        { path: '/orders', icon: ShoppingBag, label: 'Pesanan' },
        { path: '/services', icon: Tag, label: 'Layanan' },
        { path: '/customers', icon: Users, label: 'Pelanggan' },
        { path: '/reports', icon: BarChart, label: 'Laporan' },
    ];

    return (
        <div className="flex h-screen bg-zinc-50 overflow-hidden font-sans text-zinc-800">

            {/* Strict Full-Height Sidebar (MASSIVE iPad Touch Targets) */}
            <aside className="w-36 bg-white border-r border-zinc-200 flex flex-col items-center py-8 z-30 shrink-0 relative">
                {/* Logo Area */}
                <div className="w-20 h-20 bg-blue-600 rounded-[1.5rem] flex items-center justify-center shadow-md shadow-blue-200 mb-10 cursor-pointer transition-transform hover:scale-105 shrink-0">
                    <Droplets className="w-10 h-10 text-white" />
                </div>

                {/* Nav Icons */}
                <div className="flex-1 flex flex-col gap-6 w-full px-5 items-center">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                title={item.label}
                                className={`relative group flex flex-col items-center justify-center p-3 rounded-[1.5rem] transition-all w-full h-24 ${isActive
                                        ? 'bg-blue-50 text-blue-600 shadow-sm ring-1 ring-blue-100'
                                        : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 font-medium'
                                    }`}
                            >
                                <item.icon className={`w-9 h-9 shrink-0 mb-2 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                                <span className={`text-xs w-full text-center whitespace-nowrap overflow-hidden text-ellipsis ${isActive ? 'font-black' : 'font-bold'}`}>{item.label}</span>

                                {isActive && (
                                    <div className="absolute left-[-20px] top-1/2 -translate-y-1/2 w-2 h-12 bg-blue-600 rounded-r-full"></div>
                                )}
                            </Link>
                        )
                    })}
                </div>

                {/* Bottom Profile action */}
                <div className="mt-auto flex flex-col items-center gap-6 pb-4 w-full">
                    <button onClick={handleLogout} className="text-zinc-400 hover:text-red-500 transition-colors p-4 rounded-2xl hover:bg-red-50 active:scale-95" title="Logout">
                        <LogOut className="w-9 h-9" />
                    </button>

                    <div className="w-16 h-16 rounded-[1.5rem] bg-zinc-100 border-2 border-zinc-200 flex items-center justify-center text-zinc-600 font-black text-2xl cursor-help shadow-sm active:scale-95 transition-transform" title={user?.name}>
                        {user?.name?.charAt(0).toUpperCase() || 'K'}
                    </div>
                </div>
            </aside>

            {/* Main Content Space */}
            <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-zinc-50">

                {/* Edge-to-Edge Static Header */}
                <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-6 shrink-0 z-20">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-xs font-bold tracking-wide uppercase">Kasir Online</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="text-right flex flex-col justify-center">
                            <p className="text-sm font-bold text-zinc-800 leading-none mb-1">
                                {currentTime.toLocaleTimeString('id-ID', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </p>
                            <p className="text-[10px] font-semibold text-zinc-500 leading-none uppercase tracking-widest">
                                {currentTime.toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'long' })}
                            </p>
                        </div>
                        <div className="w-px h-8 bg-zinc-200"></div>

                        {/* ========== NOTIFICATION BELL ========== */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setShowNotif(!showNotif)}
                                className="relative text-zinc-500 hover:text-zinc-900 transition-all p-2 rounded-xl hover:bg-zinc-50 active:scale-90"
                            >
                                <Bell className="w-6 h-6" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-0.5 right-0.5 flex h-4 w-4">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex items-center justify-center rounded-full h-4 w-4 bg-red-500 text-white text-[8px] font-black border-2 border-white">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    </span>
                                )}
                            </button>

                            {/* Dropdown Panel */}
                            {showNotif && (
                                <div className="absolute right-0 top-full mt-3 w-[400px] bg-white rounded-2xl shadow-2xl border border-zinc-200 z-[99999] overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200">

                                    {/* Dropdown Header */}
                                    <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/80">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-black text-sm text-zinc-800 tracking-tight">Notifikasi</h3>
                                            {unreadCount > 0 && (
                                                <span className="bg-red-100 text-red-600 text-[10px] font-black px-2 py-0.5 rounded-md">
                                                    {unreadCount} baru
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {unreadCount > 0 && (
                                                <button
                                                    onClick={handleMarkAllAsRead}
                                                    disabled={loadingNotifs}
                                                    className="text-[10px] font-bold text-blue-600 hover:text-blue-800 px-2.5 py-1 rounded-lg hover:bg-blue-50 transition-colors uppercase tracking-wider flex items-center gap-1 disabled:opacity-50"
                                                >
                                                    <CheckCheck className="w-3 h-3" />
                                                    Baca Semua
                                                </button>
                                            )}
                                            <button
                                                onClick={() => setShowNotif(false)}
                                                className="text-zinc-400 hover:text-zinc-700 p-1 rounded-lg hover:bg-zinc-100 transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Notification Items */}
                                    <div className="max-h-[360px] overflow-y-auto custom-scrollbar divide-y divide-zinc-100/80">
                                        {notifications.length === 0 ? (
                                            <div className="py-12 flex flex-col items-center text-center">
                                                <div className="w-14 h-14 bg-zinc-100 rounded-2xl flex items-center justify-center mb-3">
                                                    <Bell className="w-6 h-6 text-zinc-300" />
                                                </div>
                                                <p className="text-sm font-bold text-zinc-400">Belum ada notifikasi</p>
                                                <p className="text-xs text-zinc-300 mt-1">Aktivitas terbaru akan tampil di sini</p>
                                            </div>
                                        ) : (
                                            notifications.map(notif => (
                                                <button
                                                    key={notif.id}
                                                    onClick={() => !notif.read_at && handleMarkAsRead(notif.id)}
                                                    className={`w-full text-left px-5 py-4 flex items-start gap-3 transition-all duration-200 hover:bg-zinc-50 group ${notif.read_at
                                                            ? 'bg-white'
                                                            : 'bg-blue-50/60'
                                                        }`}
                                                >
                                                    {getNotifIcon(notif.icon, notif.color)}
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-[13px] leading-snug mb-0.5 ${notif.read_at
                                                                ? 'text-zinc-600 font-medium'
                                                                : 'text-zinc-900 font-bold'
                                                            }`}>
                                                            {notif.title}
                                                        </p>
                                                        <p className="text-[11px] text-zinc-400 leading-snug line-clamp-2 font-medium">
                                                            {notif.message}
                                                        </p>
                                                        <p className="text-[10px] text-zinc-300 mt-1.5 font-bold uppercase tracking-wider">
                                                            {notif.created_at}
                                                        </p>
                                                    </div>
                                                    {!notif.read_at && (
                                                        <span className="w-2.5 h-2.5 bg-blue-500 rounded-full shrink-0 mt-1.5 ring-4 ring-blue-100"></span>
                                                    )}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        {/* ========== END NOTIFICATION BELL ========== */}
                    </div>
                </header>

                {/* Content Outlet (Fullscreen / Flex-1 Box) */}
                <div className="flex-1 overflow-auto bg-zinc-50 custom-scrollbar">
                    {children}
                </div>
            </main>
        </div>
    );
}
