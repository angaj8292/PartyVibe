import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Coins, Plus, Mic, Menu } from 'lucide-react';

const Navbar = ({ onOpenTopUp, onOpenDrawer }) => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full glass-nav px-3.5 py-3">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Left Side: Drawer Toggle & Brand */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenDrawer}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors active:scale-95"
            title="Open Menu"
          >
            <Menu className="w-5 h-5 text-gray-200" />
          </button>

          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-vibe-accent via-vibe-purple to-vibe-cyan p-0.5 shadow-md group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-vibe-bg rounded-[10px] flex items-center justify-center">
                <Mic className="w-4 h-4 text-vibe-accent animate-pulse" />
              </div>
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-pink-500 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                PartyVibe
              </span>
            </div>
          </Link>
        </div>

        {/* Right side items */}
        <div className="flex items-center gap-2.5">
          {user && (
            <button
              onClick={onOpenTopUp}
              className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 border border-yellow-500/40 text-yellow-400 px-2.5 py-1 rounded-full text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              <Coins className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
              <span>{user.coinsBalance?.toLocaleString() || 0}</span>
              <span className="w-4 h-4 rounded-full bg-yellow-400 text-black flex items-center justify-center font-black text-[10px] ml-0.5">
                +
              </span>
            </button>
          )}

          {user ? (
            <Link to="/profile" className="relative group">
              <img
                src={user.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + user.username}
                alt={user.username}
                className="w-8 h-8 rounded-full border border-vibe-purple/60 object-cover group-hover:border-vibe-accent transition-colors"
              />
              <span className={`absolute -bottom-1 -right-1 text-[9px] px-1 py-0.2 rounded-full font-bold vip-badge-${user.vipLevel || 0}`}>
                V{user.vipLevel || 0}
              </span>
            </Link>
          ) : (
            <Link
              to="/login"
              className="bg-vibe-accent hover:bg-pink-600 text-white text-xs font-bold px-3.5 py-1.5 rounded-full transition-all"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
