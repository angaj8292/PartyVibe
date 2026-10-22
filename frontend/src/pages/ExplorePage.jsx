import React, { useState, useEffect } from 'react';
import api from '../services/api';
import TopTabs from '../components/TopTabs';
import RoomCard from '../components/RoomCard';
import { Search, Flame, Sparkles, Filter, RefreshCw } from 'lucide-react';

const CATEGORIES = ['All', 'Party', 'Karaoke', 'Music', 'Chat', 'Gaming', 'Chill'];

const ExplorePage = ({ onOpenCreate }) => {
  const [activeTab, setActiveTab] = useState('party');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [rooms, setRooms] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const categoryParam = selectedCategory !== 'All' ? selectedCategory : '';
      const res = await api.get('/rooms', {
        params: { category: categoryParam, size: 20 },
      });
      setRooms(res.data);
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [selectedCategory, activeTab]);

  const filteredRooms = rooms.filter((r) =>
    searchQuery ? r.title.toLowerCase().includes(searchQuery.toLowerCase()) : true
  );

  return (
    <div className="pb-24 max-w-md mx-auto px-4 pt-2">
      {/* Top Tabs (Follow | Live | Party) */}
      <TopTabs activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Search Bar */}
      <div className="relative mt-3 mb-4">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search party rooms, hosts..."
          className="w-full bg-vibe-card border border-white/10 rounded-2xl pl-10 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-vibe-accent transition-colors"
        />
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 no-scrollbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-gradient-to-r from-vibe-accent to-purple-600 text-white shadow-md shadow-pink-500/20'
                : 'bg-vibe-card border border-white/5 text-gray-400 hover:text-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Header Banner */}
      <div className="relative rounded-3xl p-4 bg-gradient-to-r from-purple-900/60 via-pink-900/40 to-vibe-card border border-white/10 shadow-xl overflow-hidden mb-4">
        <div className="relative z-10">
          <div className="flex items-center gap-1.5 text-vibe-cyan text-xs font-bold mb-1">
            <Sparkles className="w-3.5 h-3.5" /> LIVE VOICE STAGES
          </div>
          <h2 className="text-lg font-black text-white leading-tight">
            Jump in & Vibing with Voice
          </h2>
          <p className="text-[11px] text-gray-300 mt-1">
            Up to 8 seats on stage, real-time voice, sound effects & virtual gifts!
          </p>
          <button
            onClick={onOpenCreate}
            className="mt-3 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-vibe-accent to-purple-600 text-white font-extrabold text-xs shadow-md hover:scale-105 active:scale-95 transition-all"
          >
            + Create Voice Room
          </button>
        </div>
      </div>

      {/* Section Title */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Flame className="w-4 h-4 text-vibe-accent fill-vibe-accent" />
          <h2 className="text-sm font-extrabold text-white">Trending Rooms</h2>
        </div>
        <button
          onClick={fetchRooms}
          className="text-gray-400 hover:text-white p-1 rounded-full text-xs flex items-center gap-1"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Rooms Grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-[16/14] rounded-2xl bg-vibe-card/50 animate-pulse" />
          ))}
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="p-8 text-center bg-vibe-card/40 rounded-3xl border border-white/5">
          <p className="text-sm text-gray-400 mb-2">No rooms found in this category.</p>
          <button
            onClick={onOpenCreate}
            className="px-4 py-2 rounded-xl bg-vibe-accent text-white font-bold text-xs"
          >
            Start the first party! 🎤
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filteredRooms.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ExplorePage;
