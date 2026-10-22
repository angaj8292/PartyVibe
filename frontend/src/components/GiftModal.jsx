import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { X, Coins, Sparkles, AlertCircle, Plus } from 'lucide-react';

const GiftModal = ({
  isOpen,
  onClose,
  roomId,
  potentialReceivers = [],
  currentUser,
  onGiftSent,
  onOpenTopUp,
}) => {
  const [gifts, setGifts] = useState([]);
  const [selectedGift, setSelectedGift] = useState(null);
  const [selectedReceiverId, setSelectedReceiverId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchGifts();
      if (potentialReceivers.length > 0) {
        setSelectedReceiverId(potentialReceivers[0].id);
      }
    }
  }, [isOpen, potentialReceivers]);

  const fetchGifts = async () => {
    try {
      const res = await api.get('/gifts');
      setGifts(res.data);
      if (res.data.length > 0) {
        setSelectedGift(res.data[0]);
      }
    } catch (err) {
      console.error('Failed to load gifts catalog:', err);
    }
  };

  if (!isOpen) return null;

  const currentCoins = currentUser?.coinsBalance || 0;
  const hasEnoughCoins = selectedGift ? currentCoins >= selectedGift.coinPrice : false;

  const handleSend = async () => {
    if (!selectedGift || !selectedReceiverId) return;

    if (!hasEnoughCoins) {
      setError(`Insufficient coins! You need ${selectedGift.coinPrice - currentCoins} more coins.`);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await api.post('/gifts/send', {
        giftId: selectedGift.id,
        receiverId: selectedReceiverId,
        roomId: roomId ? Number(roomId) : null,
      });

      if (onGiftSent) onGiftSent(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send gift');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full sm:max-w-md bg-vibe-card border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl safe-area-bottom">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎁</span>
            <h3 className="font-bold text-sm text-white">Send Virtual Gift</h3>
          </div>

          {/* User Coins Balance */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/30 px-2.5 py-1 rounded-full text-xs font-bold text-yellow-400">
              <Coins className="w-3.5 h-3.5" />
              <span>{currentCoins.toLocaleString()}</span>
            </div>
            <button
              onClick={onOpenTopUp}
              className="p-1 rounded-full bg-yellow-400 text-black hover:bg-yellow-300"
              title="Add Coins"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-white rounded-full ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-3 p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Receiver Selector */}
        <div className="mt-3">
          <label className="block text-[11px] font-semibold text-gray-400 mb-1">
            Send Gift To:
          </label>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {potentialReceivers.map((rec) => (
              <button
                key={rec.id}
                type="button"
                onClick={() => setSelectedReceiverId(rec.id)}
                className={`flex items-center gap-1.5 py-1 px-2.5 rounded-full border text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedReceiverId === rec.id
                    ? 'border-vibe-accent bg-vibe-accent/20 text-white'
                    : 'border-white/10 bg-vibe-bg text-gray-400 hover:border-white/20'
                }`}
              >
                <img
                  src={rec.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + rec.username}
                  alt={rec.username}
                  className="w-4 h-4 rounded-full object-cover"
                />
                <span>@{rec.username}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Gifts Catalog Grid */}
        <div className="mt-4 grid grid-cols-4 gap-2.5 max-h-56 overflow-y-auto pr-1">
          {gifts.map((gift) => {
            const isSelected = selectedGift?.id === gift.id;
            return (
              <button
                key={gift.id}
                onClick={() => {
                  setSelectedGift(gift);
                  setError('');
                }}
                className={`flex flex-col items-center p-2 rounded-2xl border transition-all text-center group ${
                  isSelected
                    ? 'border-vibe-accent bg-vibe-accent/20 scale-105 shadow-md shadow-pink-500/20'
                    : 'border-white/5 bg-vibe-bg/60 hover:border-white/20'
                }`}
              >
                <span className="text-3xl mb-1 group-hover:scale-110 transition-transform">
                  {gift.icon}
                </span>
                <span className="text-[10px] font-bold text-gray-200 line-clamp-1">
                  {gift.name}
                </span>
                <div className="flex items-center gap-0.5 mt-0.5 text-yellow-400 font-extrabold text-[10px]">
                  <Coins className="w-2.5 h-2.5" />
                  <span>{gift.coinPrice}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Actions Bottom Bar */}
        <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-3">
          {!hasEnoughCoins ? (
            <button
              onClick={onOpenTopUp}
              className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all"
            >
              <Coins className="w-4 h-4" /> Top Up Coins (+1000)
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={loading || !selectedGift}
              className="flex-1 bg-gradient-to-r from-pink-500 via-purple-600 to-cyan-500 text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-pink-500/25 hover:opacity-95 active:scale-[0.99] transition-all disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {loading ? 'Sending...' : `Send ${selectedGift?.name} (${selectedGift?.coinPrice} 🪙)`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GiftModal;
