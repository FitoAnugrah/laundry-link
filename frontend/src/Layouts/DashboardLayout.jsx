import React, { useState, useEffect } from 'react';
import { 
    Menu, Bell, LogOut, Droplets, 
    LayoutDashboard, ShoppingBag, Users, FileText, Tag, BarChart 
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import api from '../axios';

export default function DashboardLayout({ user, setUser, children }) {
    const [currentTime, setCurrentTime] = useState(new Date());
    const location = useLocation();

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const handleLogout = async () => {
        await api.post('/logout');
        setUser(null);
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
                                className={`relative group flex flex-col items-center justify-center p-3 rounded-[1.5rem] transition-all w-full h-24 ${
                                    isActive 
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
                        <button className="relative text-zinc-500 hover:text-zinc-900 transition-colors">
                            <Bell className="w-6 h-6" />
                            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
                        </button>
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
