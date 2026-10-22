import React from 'react';
import { NavLink } from 'react-router-dom';
import { Compass, Users, Plus, MessageSquare, User } from 'lucide-react';

const BottomNav = ({ onOpenCreate }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass-nav py-1 px-4 safe-area-bottom">
      <div className="max-w-md mx-auto flex items-center justify-around relative">
        {/* 1. Follow */}
        <NavLink
          to="/follow"
          className={({ isActive }) =>
            `flex flex-col items-center py-1 px-3 text-xs transition-colors ${
              isActive ? 'text-vibe-accent font-bold' : 'text-gray-400 hover:text-gray-200'
            }`
          }
        >
          <Users className="w-5 h-5 mb-0.5" />
          <span>Follow</span>
        </NavLink>

        {/* 2. Explore */}
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex flex-col items-center py-1 px-3 text-xs transition-colors ${
              isActive ? 'text-vibe-accent font-bold' : 'text-gray-400 hover:text-gray-200'
            }`
          }
        >
          <Compass className="w-5 h-5 mb-0.5" />
          <span>Explore</span>
        </NavLink>

        {/* 3. + Create (Center Action Button) */}
        <div className="flex flex-col items-center -mt-5">
          <button
            onClick={onOpenCreate}
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-vibe-accent via-purple-600 to-vibe-cyan p-0.5 shadow-lg shadow-pink-500/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center group"
            title="Create Party Room"
          >
            <div className="w-full h-full bg-vibe-bg rounded-full flex items-center justify-center group-hover:bg-transparent transition-colors">
              <Plus className="w-6 h-6 text-white" />
            </div>
          </button>
          <span className="text-[10px] text-gray-300 font-semibold mt-0.5">Create</span>
        </div>

        {/* 4. Messages */}
        <NavLink
          to="/messages"
          className={({ isActive }) =>
            `flex flex-col items-center py-1 px-3 text-xs transition-colors ${
              isActive ? 'text-vibe-accent font-bold' : 'text-gray-400 hover:text-gray-200'
            }`
          }
        >
          <MessageSquare className="w-5 h-5 mb-0.5" />
          <span>Messages</span>
        </NavLink>

        {/* 5. Profile */}
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex flex-col items-center py-1 px-3 text-xs transition-colors ${
              isActive ? 'text-vibe-accent font-bold' : 'text-gray-400 hover:text-gray-200'
            }`
          }
        >
          <User className="w-5 h-5 mb-0.5" />
          <span>Profile</span>
        </NavLink>
      </div>
    </nav>
  );
};

export default BottomNav;
