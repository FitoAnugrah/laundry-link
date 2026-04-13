import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../axios';
import { Droplets, Eye, EyeOff } from 'lucide-react';

export default function Login({ setUser }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        
        try {
            await api.get('/sanctum/csrf-cookie');
            await api.post('/login', { email, password });
            
            const res = await api.get('/api/user');
            setUser(res.data);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Login gagal. Periksa kembali kredensial Anda.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
            {/* Background Decoration */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-50"></div>
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-60"></div>
            </div>

            <div className="relative max-w-md w-full">
                {/* Card */}
                <div className="bg-white rounded-[2rem] shadow-xl border border-zinc-200 p-8 relative overflow-hidden">
                    {/* Subtle top gradient accent */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500"></div>

                    {/* Logo */}
                    <div className="flex flex-col items-center mb-8 mt-2">
                        <div className="w-20 h-20 bg-blue-600 rounded-[1.5rem] flex items-center justify-center shadow-md shadow-blue-200 mb-5">
                            <Droplets className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-2xl font-black text-zinc-900 tracking-tight">LaundryLink</h1>
                        <p className="text-sm text-zinc-400 mt-1 font-medium">Masuk ke panel kasir</p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="bg-red-50 text-red-600 border border-red-100 p-3.5 rounded-xl mb-5 text-sm font-bold text-center">
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Email</label>
                            <input 
                                type="email" 
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-medium text-zinc-800 transition-all placeholder:text-zinc-400"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="kasir@laundrylink.id"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Password</label>
                            <div className="relative">
                                <input 
                                    type={showPassword ? 'text' : 'password'}
                                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3.5 pr-12 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-medium text-zinc-800 transition-all placeholder:text-zinc-400"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Masukkan password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors p-1"
                                >
                                    {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                                </button>
                            </div>
                        </div>
                        
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-4 rounded-2xl shadow-md shadow-blue-200 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    Memproses...
                                </span>
                            ) : 'Masuk'}
                        </button>
                    </form>

                    {/* Footer */}
                    <p className="text-center text-[11px] text-zinc-300 font-bold mt-6 uppercase tracking-widest">
                        LaundryLink POS System
                    </p>
                </div>
            </div>
        </div>
    );
}
