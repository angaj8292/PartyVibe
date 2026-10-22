import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { X, Sparkles, Lock, Globe, Image as ImageIcon } from 'lucide-react';

const CATEGORIES = [
  { name: 'Party', icon: '🎉', color: 'from-pink-500 to-purple-600' },
  { name: 'Karaoke', icon: '🎤', color: 'from-rose-500 to-pink-600' },
  { name: 'Music', icon: '🎵', color: 'from-purple-500 to-indigo-600' },
  { name: 'Chat', icon: '💬', color: 'from-blue-500 to-cyan-600' },
  { name: 'Gaming', icon: '🎮', color: 'from-emerald-500 to-teal-600' },
  { name: 'Chill', icon: '☕', color: 'from-amber-500 to-orange-600' },
];

const PRESET_COVERS = [
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1543807535-eceef0bc6599?w=600&auto=format&fit=crop&q=80',
];

const CreateRoomModal = ({ isOpen, onClose, onRoomCreated }) => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Party');
  const [isPublic, setIsPublic] = useState(true);
  const [password, setPassword] = useState('');
  const [coverUrl, setCoverUrl] = useState(PRESET_COVERS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter a room title');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await api.post('/rooms', {
        title: title.trim(),
        category,
        isPublic,
        password: isPublic ? null : password,
        coverUrl,
      });

      if (onRoomCreated) onRoomCreated(res.data);
      onClose();
      navigate(`/room/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-vibe-card border border-white/10 rounded-3xl p-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-vibe-accent to-vibe-cyan flex items-center justify-center text-white">
            <Sparkles className="w-4 h-4" />
          </div>
          <h2 className="text-lg font-bold text-white">Create Voice Party Room</h2>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Room Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 🎤 Friday Night Karaoke & Chill"
              maxLength={100}
              className="w-full bg-vibe-bg border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-vibe-accent transition-colors"
              required
            />
          </div>

          {/* Category Chips */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Category
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  type="button"
                  key={cat.name}
                  onClick={() => setCategory(cat.name)}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border text-xs font-bold transition-all ${
                    category === cat.name
                      ? 'border-vibe-accent bg-vibe-accent/20 text-white shadow-md'
                      : 'border-white/5 bg-vibe-bg text-gray-400 hover:border-white/15'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Preset Covers */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5 text-vibe-cyan" /> Room Cover
            </label>
            <div className="grid grid-cols-4 gap-2">
              {PRESET_COVERS.map((imgUrl, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setCoverUrl(imgUrl)}
                  className={`aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                    coverUrl === imgUrl ? 'border-vibe-accent scale-105' : 'border-transparent opacity-60 hover:opacity-90'
                  }`}
                >
                  <img src={imgUrl} alt="cover" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Public / Private Toggle */}
          <div className="p-3 bg-vibe-bg rounded-2xl border border-white/5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isPublic ? (
                  <Globe className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Lock className="w-4 h-4 text-amber-400" />
                )}
                <div>
                  <div className="text-xs font-bold text-white">
                    {isPublic ? 'Public Room' : 'Private (Password)'}
                  </div>
                  <div className="text-[10px] text-gray-400">
                    {isPublic ? 'Anyone can enter' : 'Requires password to enter'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPublic(!isPublic)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  isPublic ? 'bg-emerald-500' : 'bg-gray-600'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    isPublic ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {!isPublic && (
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Set 4-digit room password"
                className="w-full bg-vibe-card border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
                required={!isPublic}
              />
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-vibe-accent via-purple-600 to-vibe-cyan text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-pink-500/25 hover:opacity-95 active:scale-[0.99] transition-all disabled:opacity-50"
          >
            {loading ? 'Creating Room...' : 'Start Voice Party 🎤'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateRoomModal;
