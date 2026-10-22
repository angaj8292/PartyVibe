import React from 'react';
import { Link } from 'react-router-dom';
import { Headphones, Armchair, Lock, Sparkles } from 'lucide-react';

const RoomCard = ({ room }) => {
  const getCategoryColor = (cat) => {
    switch (cat?.toLowerCase()) {
      case 'karaoke': return 'from-pink-500 to-rose-600';
      case 'music': return 'from-purple-500 to-indigo-600';
      case 'gaming': return 'from-emerald-500 to-teal-600';
      case 'chill': return 'from-amber-500 to-orange-600';
      default: return 'from-blue-500 to-cyan-600';
    }
  };

  return (
    <Link
      to={`/room/${room.id}`}
      className="group block rounded-2xl overflow-hidden bg-vibe-card border border-white/5 hover:border-vibe-accent/40 transition-all duration-300 hover:shadow-xl hover:shadow-pink-500/10 active:scale-[0.98]"
    >
      {/* Cover Image & Badges */}
      <div className="relative aspect-[16/10] overflow-hidden bg-gray-900">
        <img
          src={room.coverUrl || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80'}
          alt={room.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-vibe-card via-transparent to-black/40" />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
          <span className={`text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full text-white bg-gradient-to-r ${getCategoryColor(room.category)} shadow-sm`}>
            {room.category}
          </span>

          <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full text-[11px] font-semibold text-gray-200">
            <Headphones className="w-3 h-3 text-vibe-cyan" />
            <span>{room.listenerCount || 0}</span>
          </div>
        </div>

        {/* Seats left indicator */}
        <div className="absolute bottom-2.5 right-2.5">
          <span className="flex items-center gap-1 bg-black/70 backdrop-blur-md text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/20">
            <Armchair className="w-3 h-3" />
            <span>{room.seatsLeft} seats left</span>
          </span>
        </div>

        {/* Lock indicator if private */}
        {room.hasPassword && (
          <div className="absolute bottom-2.5 left-2.5">
            <span className="flex items-center gap-1 bg-red-500/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              <Lock className="w-2.5 h-2.5" /> Private
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="text-sm font-bold text-gray-100 group-hover:text-vibe-accent line-clamp-1 transition-colors">
          {room.title}
        </h3>

        {/* Host Info */}
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={room.owner?.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + room.owner?.username}
              alt={room.owner?.username}
              className="w-5 h-5 rounded-full object-cover border border-white/10"
            />
            <span className="text-xs text-gray-400 font-medium">@{room.owner?.username}</span>
          </div>

          {room.owner?.vipLevel > 0 && (
            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold vip-badge-${room.owner.vipLevel}`}>
              VIP {room.owner.vipLevel}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default RoomCard;
