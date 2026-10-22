import React, { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Upload,
  Camera,
  Image as ImageIcon,
  Sparkles,
  Check,
  Link as LinkIcon,
  RefreshCw,
  Trash2,
} from 'lucide-react';

const PRESET_AVATARS = [
  { id: 'bot1', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=alice', label: 'Neon Singer' },
  { id: 'bot2', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=bob', label: 'DJ Party' },
  { id: 'bot3', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=charlie', label: 'Retro Gamer' },
  { id: 'bot4', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=david', label: 'Guitarist' },
  { id: 'lorelei1', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Sophie', label: 'Vibe Star' },
  { id: 'lorelei2', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Zoe', label: 'Pop Idol' },
  { id: 'adventurer1', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Leo', label: 'Cosmic Ace' },
  { id: 'adventurer2', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Mia', label: 'Party Queen' },
  { id: 'micah1', url: 'https://api.dicebear.com/7.x/micah/svg?seed=Felix', label: 'Chill Dude' },
  { id: 'micah2', url: 'https://api.dicebear.com/7.x/micah/svg?seed=Luna', label: 'Neon Girl' },
  { id: 'pixel1', url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=VIP', label: 'Pixel King' },
  { id: 'pixel2', url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=PartyVibe', label: 'Gold Crown' },
];

const AvatarPickerModal = ({ isOpen, onClose, currentAvatarUrl, onAvatarUpdated }) => {
  const { refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('presets'); // 'presets', 'upload', 'url'
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatarUrl || PRESET_AVATARS[0].url);
  const [selectedFile, setSelectedFile] = useState(null);
  const [customUrl, setCustomUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  // Handle local image file upload from user device (mobile/pc)
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Kripya valid image file chunein (JPG, PNG, WebP)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Photo size 10MB se chhota hona chahiye');
      return;
    }

    setError('');
    setSelectedFile(file);

    // Instant local preview
    const previewUrl = URL.createObjectURL(file);
    setSelectedAvatar(previewUrl);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      let updatedAvatarUrl = selectedAvatar;

      if (selectedFile) {
        // Direct multipart file upload to backend
        const formData = new FormData();
        formData.append('file', selectedFile);

        const res = await api.post('/users/avatar/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        updatedAvatarUrl = res.data.avatarUrl;
      } else {
        // Preset avatar or custom URL link
        const res = await api.put('/users/me', {
          avatarUrl: selectedAvatar,
        });
        updatedAvatarUrl = res.data.avatarUrl;
      }

      setSuccess('Profile picture updated successfully!');
      if (onAvatarUpdated) onAvatarUpdated(updatedAvatarUrl);
      await refreshUser();
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err) {
      console.error('Avatar update failed:', err);
      setError(err.response?.data?.message || err.message || 'Avatar save karne me error aya');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm bg-vibe-card border border-white/10 rounded-3xl p-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-vibe-accent" />
            <h3 className="font-extrabold text-sm text-white">Change Profile Picture</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-full bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Preview Avatar */}
        <div className="flex flex-col items-center my-4">
          <div className="relative">
            <img
              src={selectedAvatar}
              alt="Preview"
              className="w-24 h-24 rounded-full object-cover border-4 border-vibe-accent shadow-xl shadow-pink-500/25 bg-black/40"
              onError={(e) => {
                e.target.src = PRESET_AVATARS[0].url;
              }}
            />
            <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white p-1.5 rounded-full shadow-lg">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <span className="text-[11px] text-gray-300 font-bold mt-2">
            {selectedFile ? `Selected: ${selectedFile.name}` : 'Live Avatar Preview'}
          </span>
          {selectedFile && (
            <button
              onClick={() => {
                setSelectedFile(null);
                setSelectedAvatar(currentAvatarUrl || PRESET_AVATARS[0].url);
              }}
              className="mt-1 text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1 font-semibold"
            >
              <Trash2 className="w-3 h-3" /> Remove selected photo
            </button>
          )}
        </div>

        {error && (
          <div className="mb-3 p-2 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs text-center font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-3 p-2 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-xs text-center font-bold">
            ✓ {success}
          </div>
        )}

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-1 bg-vibe-bg p-1 rounded-2xl border border-white/5 mb-3 text-xs font-bold">
          <button
            onClick={() => setActiveTab('presets')}
            className={`flex-1 py-1.5 rounded-xl transition-all ${
              activeTab === 'presets' ? 'bg-vibe-accent text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            Presets
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-1.5 rounded-xl transition-all ${
              activeTab === 'upload' ? 'bg-vibe-accent text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            Upload Photo
          </button>
          <button
            onClick={() => setActiveTab('url')}
            className={`flex-1 py-1.5 rounded-xl transition-all ${
              activeTab === 'url' ? 'bg-vibe-accent text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            Image Link
          </button>
        </div>

        {/* Tab 1: Presets Gallery */}
        {activeTab === 'presets' && (
          <div className="grid grid-cols-4 gap-2.5 max-h-52 overflow-y-auto pr-1">
            {PRESET_AVATARS.map((item) => {
              const isSelected = !selectedFile && selectedAvatar === item.url;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setSelectedAvatar(item.url);
                  }}
                  className={`relative flex flex-col items-center p-1.5 rounded-2xl border transition-all ${
                    isSelected
                      ? 'border-vibe-accent bg-vibe-accent/20 scale-105 shadow-md shadow-pink-500/20'
                      : 'border-white/5 bg-vibe-bg hover:border-white/20'
                  }`}
                >
                  <img src={item.url} alt={item.label} className="w-12 h-12 rounded-full object-cover" />
                  <span className="text-[9px] text-gray-300 font-bold truncate max-w-[55px] mt-1">
                    {item.label}
                  </span>
                  {isSelected && (
                    <div className="absolute top-1 right-1 bg-vibe-accent text-white rounded-full p-0.5">
                      <Check className="w-2.5 h-2.5" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Tab 2: Upload from Device */}
        {activeTab === 'upload' && (
          <div className="py-2 space-y-2">
            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-white/20 hover:border-vibe-accent/50 rounded-2xl cursor-pointer bg-vibe-bg/60 transition-colors group">
              <Upload className="w-8 h-8 text-gray-400 group-hover:text-vibe-accent mb-2 transition-colors" />
              <span className="text-xs font-bold text-gray-200">
                {selectedFile ? 'Change Selected Photo' : 'Device Se Photo Chunein'}
              </span>
              <span className="text-[10px] text-gray-400 mt-1">
                Gallery, Downloads ya Camera se upload karein (PNG, JPG, WebP)
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            {selectedFile && (
              <p className="text-[11px] text-cyan-400 text-center font-medium">
                Photo selected! Click "Save As Profile Picture" neeche dabayein.
              </p>
            )}
          </div>
        )}

        {/* Tab 3: Custom URL */}
        {activeTab === 'url' && (
          <div className="py-3 space-y-2">
            <label className="block text-xs font-semibold text-gray-400">
              Paste Direct Image Link:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="flex-1 bg-vibe-bg border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-vibe-accent"
              />
              <button
                type="button"
                onClick={() => {
                  if (customUrl.trim()) {
                    setSelectedFile(null);
                    setSelectedAvatar(customUrl.trim());
                  }
                }}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white shrink-0"
              >
                Apply
              </button>
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full mt-4 bg-gradient-to-r from-vibe-accent via-purple-600 to-cyan-500 text-white font-extrabold py-3 rounded-xl text-xs shadow-lg shadow-pink-500/25 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Uploading & Saving...</span>
            </>
          ) : (
            'Save As Profile Picture'
          )}
        </button>
      </div>
    </div>
  );
};

export default AvatarPickerModal;
