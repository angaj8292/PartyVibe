import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mic, Lock, User, Sparkles, ArrowRight } from 'lucide-react';

const DEMO_ACCOUNTS = [
  { username: 'alice', label: 'Alice (Host / VIP 2)', avatar: 'alice' },
  { username: 'bob', label: 'Bob (VIP 1)', avatar: 'bob' },
  { username: 'charlie', label: 'Charlie (VIP 1)', avatar: 'charlie' },
  { username: 'david', label: 'David (VIP 4)', avatar: 'david' },
];

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier || !password) return;

    try {
      setLoading(true);
      setError('');
      await login(identifier, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (username) => {
    try {
      setLoading(true);
      setError('');
      await login(username, 'password123');
      navigate('/');
    } catch (err) {
      setError('Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen max-w-md mx-auto flex flex-col justify-center px-5 py-8">
      {/* Brand Header */}
      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-vibe-accent via-vibe-purple to-vibe-cyan p-0.5 shadow-xl shadow-pink-500/20 mb-3 animate-bounce-soft">
          <div className="w-full h-full bg-vibe-bg rounded-[22px] flex items-center justify-center">
            <Mic className="w-8 h-8 text-vibe-accent" />
          </div>
        </div>
        <h1 className="text-3xl font-black bg-gradient-to-r from-pink-500 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
          PartyVibe
        </h1>
        <p className="text-xs text-gray-400 mt-1">Live Social Voice Party & Virtual Gifting</p>
      </div>

      {/* Main Card */}
      <div className="glass-panel rounded-3xl p-6 shadow-2xl">
        <h2 className="text-base font-extrabold text-white mb-4">Welcome Back</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Username or Email
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. alice"
                className="w-full bg-vibe-bg border border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-vibe-accent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-vibe-bg border border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-vibe-accent"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-vibe-accent to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-extrabold py-3 rounded-xl text-xs shadow-lg shadow-pink-500/25 active:scale-[0.99] transition-all disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Sign In'}
          </button>
        </form>

        {/* Quick Demo Accounts */}
        <div className="mt-6 pt-4 border-t border-white/5">
          <div className="flex items-center gap-1 text-[11px] font-bold text-gray-400 mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>1-Click Demo Login:</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.username}
                type="button"
                onClick={() => handleQuickLogin(acc.username)}
                className="flex items-center gap-2 p-2 rounded-xl bg-vibe-bg border border-white/5 hover:border-vibe-accent/40 text-left transition-all group"
              >
                <img
                  src={`https://api.dicebear.com/7.x/bottts/svg?seed=${acc.avatar}`}
                  alt={acc.username}
                  className="w-6 h-6 rounded-full object-cover"
                />
                <span className="text-[11px] font-bold text-gray-300 group-hover:text-white">
                  @{acc.username}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 text-center text-xs text-gray-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-vibe-accent font-bold hover:underline">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
