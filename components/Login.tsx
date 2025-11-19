
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const Login: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            setError(error.message === 'Invalid login credentials' ? 'Email atau kata sandi salah.' : error.message);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#121212] relative overflow-hidden w-full p-4">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary via-transparent to-danger opacity-10"></div>
          
          <div className="relative z-10 w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#ffffff10] to-[#ffffff05] backdrop-blur-xl border border-white/10 shadow-2xl p-8 flex flex-col items-center">
            
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-6 shadow-lg">
              <img src="https://raw.githubusercontent.com/esport-restasorkot/gmbrax/main/reskrim.png" alt="Crime Track Logo" className="h-10 w-10 object-contain"/>
            </div>
            
            <h2 className="text-2xl font-semibold text-white mb-2 text-center">
              CrimeTrack
            </h2>
             <p className="text-sm text-gray-400 mb-6">Satreskrim Polresta Sorong Kota</p>

            <form className="flex flex-col w-full gap-4" onSubmit={handleLogin}>
              <div className="w-full flex flex-col gap-3">
                <input
                  placeholder="Email"
                  type="email"
                  value={email}
                  className="w-full px-5 py-3 rounded-xl bg-white/10 text-white placeholder-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition"
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <input
                  placeholder="Password"
                  type="password"
                  value={password}
                  className="w-full px-5 py-3 rounded-xl bg-white/10 text-white placeholder-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition"
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                {error && (
                  <div className="text-sm text-red-400 text-left px-2">{error}</div>
                )}
              </div>
             
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-white font-medium px-5 py-3 rounded-full shadow-lg hover:bg-blue-600 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Memproses...' : 'Login'}
                </button>
              </div>
            </form>
          </div>
          
          <div className="relative z-10 mt-12 flex flex-col items-center text-center">
            <p className="text-gray-400 text-sm mb-2">
              Platform interinal untuk manajemen pelaporan kasus.
            </p>
            
          </div>
        </div>
    );
};

export default Login;
