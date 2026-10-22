import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Globe,
  ShoppingBag,
  Store,
  Heart,
  Award,
  Share2,
  Clock,
  Settings,
  HelpCircle,
  BookOpen,
  X,
  ChevronRight,
  Sparkles,
  Check,
  Copy,
  Coins,
  Shield,
  Volume2,
  Mic,
  Moon,
  LogOut,
  Send,
  MessageCircle,
  ThumbsUp,
  Flame,
} from 'lucide-react';

const AppSideDrawer = ({ isOpen, onClose, onOpenTopUp }) => {
  const { user, logout } = useAuth();
  const [activeModal, setActiveModal] = useState(null); // 'square', 'privilege_pack', 'privilege_shop', 'fan_club', 'level_center', 'share', 'gift_record', 'settings', 'help', 'rules'

  // Special Gift Record state
  const [giftRecords, setGiftRecords] = useState([]);
  const [recordFilter, setRecordFilter] = useState('all'); // 'all', 'received', 'sent'
  const [loadingRecords, setLoadingRecords] = useState(false);

  // Share state
  const [copied, setCopied] = useState(false);

  // Settings toggles
  const [micNoiseCancel, setMicNoiseCancel] = useState(true);
  const [highQualityAudio, setHighQualityAudio] = useState(true);
  const [privateInvites, setPrivateInvites] = useState(true);

  // Square dummy posts & composer
  const [posts, setPosts] = useState([
    {
      id: 1,
      author: 'DJ_Alex',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=bob',
      time: '10m ago',
      content: 'Late night EDM party room is live! Come join the stage 🎧🔥 #PartyVibe #EDM',
      likes: 24,
      liked: false,
    },
    {
      id: 2,
      author: 'SingWithMia',
      avatar: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Mia',
      time: '35m ago',
      content: 'Acoustic Bollywood session starting in 5 minutes! Mic 1 is open for duets 🎸✨',
      likes: 42,
      liked: true,
    },
    {
      id: 3,
      author: 'RoyalKing',
      avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=VIP',
      time: '1h ago',
      content: 'Just unlocked VIP Level 4! Sending 100 Roses to the next room I join 🌹👑',
      likes: 89,
      liked: false,
    },
  ]);
  const [newPostText, setNewPostText] = useState('');

  // Fetch gift records when opening modal
  useEffect(() => {
    if (activeModal === 'gift_record') {
      fetchGiftRecords();
    }
  }, [activeModal, recordFilter]);

  const fetchGiftRecords = async () => {
    try {
      setLoadingRecords(true);
      const res = await api.get(`/gifts/records?type=${recordFilter}&limit=25`);
      setGiftRecords(res.data);
    } catch (err) {
      console.warn('Could not fetch gift records, fallback to wallet transactions:', err);
      try {
        const walletRes = await api.get('/wallet');
        const transactions = walletRes.data.recentTransactions || [];
        setGiftRecords(
          transactions.map((t, idx) => ({
            id: t.id || idx,
            gift: { name: 'Gift Transaction', icon: '🎁' },
            coins: t.amount,
            createdAt: t.createdAt,
            sender: { username: t.type === 'GIFT_SENT' ? user?.username : 'Party Member' },
            receiver: { username: t.type === 'GIFT_RECEIVED' ? user?.username : 'Party Host' },
          }))
        );
      } catch (e) {
        setGiftRecords([]);
      }
    } finally {
      setLoadingRecords(false);
    }
  };

  if (!isOpen) return null;

  const userLevel = user ? (user.vipLevel || 0) * 6 + 15 : 12;

  const handleCopyLink = () => {
    const inviteLink = `https://partyvibe.app/join?ref=${user?.username || 'vip'}`;
    navigator.clipboard?.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCreatePost = (e) => {
    e.preventDefault();
    if (!newPostText.trim()) return;
    const postObj = {
      id: Date.now(),
      author: user?.username || 'You',
      avatar: user?.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + (user?.username || 'user'),
      time: 'Just now',
      content: newPostText.trim(),
      likes: 1,
      liked: true,
    };
    setPosts([postObj, ...posts]);
    setNewPostText('');
  };

  const toggleLike = (id) => {
    setPosts(
      posts.map((p) =>
        p.id === id ? { ...p, likes: p.liked ? p.likes - 1 : p.likes + 1, liked: !p.liked } : p
      )
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm transition-opacity animate-fade-in"
      />

      {/* Slide-over Drawer (Styled exactly like the user's mobile screenshot) */}
      <div className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white text-gray-900 shadow-2xl flex flex-col justify-between animate-slide-right select-none">
        <div className="flex-1 overflow-y-auto py-5 px-3">
          {/* Top user summary card */}
          {user && (
            <div className="flex items-center gap-3 px-3 pb-4 mb-3 border-b border-gray-100">
              <img
                src={user.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
                alt={user.username}
                className="w-12 h-12 rounded-full object-cover border-2 border-pink-500 shadow-sm"
              />
              <div className="min-w-0 flex-1">
                <h4 className="font-extrabold text-sm text-gray-900 truncate">{user.username}</h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] bg-pink-100 text-pink-700 font-extrabold px-1.5 py-0.5 rounded-full">
                    VIP {user.vipLevel || 0}
                  </span>
                  <span className="text-[10px] text-gray-500 font-bold flex items-center gap-0.5">
                    <Coins className="w-3 h-3 text-amber-500 fill-amber-500" />
                    {user.coinsBalance?.toLocaleString() || 0}
                  </span>
                </div>
              </div>
              <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Group 1: Features & Privileges */}
          <div className="space-y-1">
            {/* 1. Square */}
            <button
              onClick={() => setActiveModal('square')}
              className="w-full flex items-center justify-between px-3 py-3 rounded-2xl hover:bg-gray-100 transition-colors group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-7 h-7 flex items-center justify-center text-gray-800 group-hover:scale-110 transition-transform">
                  <Globe className="w-5 h-5 text-gray-800 stroke-[1.8]" />
                </div>
                <span className="text-sm font-semibold text-gray-800">Square</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </button>

            {/* 2. Privilege Pack */}
            <button
              onClick={() => setActiveModal('privilege_pack')}
              className="w-full flex items-center justify-between px-3 py-3 rounded-2xl hover:bg-gray-100 transition-colors group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-7 h-7 flex items-center justify-center text-gray-800 group-hover:scale-110 transition-transform">
                  <ShoppingBag className="w-5 h-5 text-gray-800 stroke-[1.8]" />
                </div>
                <span className="text-sm font-semibold text-gray-800">Privilege Pack</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </button>

            {/* 3. Privilege Shop */}
            <button
              onClick={() => setActiveModal('privilege_shop')}
              className="w-full flex items-center justify-between px-3 py-3 rounded-2xl hover:bg-gray-100 transition-colors group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-7 h-7 flex items-center justify-center text-gray-800 group-hover:scale-110 transition-transform">
                  <Store className="w-5 h-5 text-gray-800 stroke-[1.8]" />
                </div>
                <span className="text-sm font-semibold text-gray-800">Privilege Shop</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </button>

            {/* 4. Fan club */}
            <button
              onClick={() => setActiveModal('fan_club')}
              className="w-full flex items-center justify-between px-3 py-3 rounded-2xl hover:bg-gray-100 transition-colors group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-7 h-7 flex items-center justify-center text-gray-800 group-hover:scale-110 transition-transform">
                  <Heart className="w-5 h-5 text-gray-800 stroke-[1.8]" />
                </div>
                <span className="text-sm font-semibold text-gray-800">Fan club</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </button>

            {/* 5. User Level Center */}
            <button
              onClick={() => setActiveModal('level_center')}
              className="w-full flex items-center justify-between px-3 py-3 rounded-2xl hover:bg-gray-100 transition-colors group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-7 h-7 flex items-center justify-center text-gray-800 group-hover:scale-110 transition-transform">
                  <Award className="w-5 h-5 text-gray-800 stroke-[1.8]" />
                </div>
                <span className="text-sm font-semibold text-gray-800">User Level Center</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-gray-400">Lv. {userLevel}</span>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </div>
            </button>
          </div>

          {/* Divider */}
          <div className="my-3 border-t border-gray-100" />

          {/* Group 2: Utilities, Settings & Help */}
          <div className="space-y-1">
            {/* 6. Share with Your Friends */}
            <button
              onClick={() => setActiveModal('share')}
              className="w-full flex items-center justify-between px-3 py-3 rounded-2xl hover:bg-gray-100 transition-colors group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-7 h-7 flex items-center justify-center text-gray-800 group-hover:scale-110 transition-transform">
                  <Share2 className="w-5 h-5 text-gray-800 stroke-[1.8]" />
                </div>
                <span className="text-sm font-semibold text-gray-800">Share with Your Friends</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </button>

            {/* 7. Special Gift Record */}
            <button
              onClick={() => setActiveModal('gift_record')}
              className="w-full flex items-center justify-between px-3 py-3 rounded-2xl hover:bg-gray-100 transition-colors group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-7 h-7 flex items-center justify-center text-gray-800 group-hover:scale-110 transition-transform">
                  <Clock className="w-5 h-5 text-gray-800 stroke-[1.8]" />
                </div>
                <span className="text-sm font-semibold text-gray-800">Special Gift Record</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </button>

            {/* 8. Settings */}
            <button
              onClick={() => setActiveModal('settings')}
              className="w-full flex items-center justify-between px-3 py-3 rounded-2xl hover:bg-gray-100 transition-colors group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-7 h-7 flex items-center justify-center text-gray-800 group-hover:scale-110 transition-transform">
                  <Settings className="w-5 h-5 text-gray-800 stroke-[1.8]" />
                </div>
                <span className="text-sm font-semibold text-gray-800">Settings</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </button>

            {/* 9. Help Center */}
            <button
              onClick={() => setActiveModal('help')}
              className="w-full flex items-center justify-between px-3 py-3 rounded-2xl hover:bg-gray-100 transition-colors group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-7 h-7 flex items-center justify-center text-gray-800 group-hover:scale-110 transition-transform">
                  <HelpCircle className="w-5 h-5 text-gray-800 stroke-[1.8]" />
                </div>
                <span className="text-sm font-semibold text-gray-800">Help Center</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </button>

            {/* 10. Rules and Policies */}
            <button
              onClick={() => setActiveModal('rules')}
              className="w-full flex items-center justify-between px-3 py-3 rounded-2xl hover:bg-gray-100 transition-colors group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-7 h-7 flex items-center justify-center text-gray-800 group-hover:scale-110 transition-transform">
                  <BookOpen className="w-5 h-5 text-gray-800 stroke-[1.8]" />
                </div>
                <span className="text-sm font-semibold text-gray-800">Rules and Policies</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-400 font-semibold">
          <span>PartyVibe v1.2.0</span>
          <span>© 2026 PartyVibe</span>
        </div>
      </div>

      {/* ================= MODALS FOR EACH OF THE 10 ITEMS ================= */}

      {/* 1. SQUARE MODAL */}
      {activeModal === 'square' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-vibe-card border border-white/10 rounded-3xl p-5 shadow-2xl text-white max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-pink-400" />
                <h3 className="font-extrabold text-base">Community Square</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-1 rounded-full bg-white/5">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Post composer */}
            <form onSubmit={handleCreatePost} className="my-3 space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPostText}
                  onChange={(e) => setNewPostText(e.target.value)}
                  placeholder="Share a vibe or invite to your room..."
                  className="flex-1 bg-vibe-bg border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-pink-500"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-pink-500 hover:bg-pink-600 rounded-xl text-xs font-bold flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" /> Post
                </button>
              </div>
            </form>

            {/* Feed */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {posts.map((post) => (
                <div key={post.id} className="p-3 bg-vibe-bg/70 border border-white/5 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img src={post.avatar} alt={post.author} className="w-7 h-7 rounded-full object-cover" />
                      <div>
                        <p className="text-xs font-bold text-white">{post.author}</p>
                        <span className="text-[10px] text-gray-500">{post.time}</span>
                      </div>
                    </div>
                    <span className="text-[10px] bg-pink-500/10 text-pink-400 px-2 py-0.5 rounded-full font-semibold">
                      #Party
                    </span>
                  </div>
                  <p className="text-xs text-gray-200 leading-relaxed">{post.content}</p>
                  <div className="flex items-center gap-4 pt-1 border-t border-white/5 text-xs text-gray-400">
                    <button
                      onClick={() => toggleLike(post.id)}
                      className={`flex items-center gap-1 font-bold ${
                        post.liked ? 'text-pink-400' : 'hover:text-white'
                      }`}
                    >
                      <ThumbsUp className={`w-3.5 h-3.5 ${post.liked ? 'fill-pink-400' : ''}`} />
                      <span>{post.likes}</span>
                    </button>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-3.5 h-3.5" /> Comment
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. PRIVILEGE PACK MODAL */}
      {activeModal === 'privilege_pack' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-vibe-card border border-white/10 rounded-3xl p-5 shadow-2xl text-white max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-400" />
                <h3 className="font-extrabold text-base">VIP Privilege Packs</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-1 rounded-full bg-white/5">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              {/* Bronze Pass */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-900/30 to-amber-700/20 border border-amber-500/30 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black uppercase text-amber-400 tracking-wider">
                    🥉 Bronze Starter Pack
                  </span>
                  <span className="text-xs font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full">
                    VIP 1+
                  </span>
                </div>
                <p className="text-xs text-gray-300">
                  Daily 50 Coins + Special Bronze Speaker Seat Frame + 1.2x EXP Boost.
                </p>
                <button
                  onClick={() => {
                    setActiveModal(null);
                    if (onOpenTopUp) onOpenTopUp();
                  }}
                  className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-black font-extrabold rounded-xl text-xs"
                >
                  Claim / Upgrade VIP
                </button>
              </div>

              {/* Silver Pass */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-700/30 to-purple-800/20 border border-purple-400/30 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black uppercase text-cyan-400 tracking-wider">
                    🥈 Silver Party Pass
                  </span>
                  <span className="text-xs font-bold bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">
                    VIP 3+
                  </span>
                </div>
                <p className="text-xs text-gray-300">
                  Daily 200 Coins + Cyber Room Entrance Banner + Custom Nickname Glow.
                </p>
                <button
                  onClick={() => {
                    setActiveModal(null);
                    if (onOpenTopUp) onOpenTopUp();
                  }}
                  className="w-full py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-extrabold rounded-xl text-xs"
                >
                  Unlock with Coins
                </button>
              </div>

              {/* Royal Diamond Pass */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-pink-900/40 via-purple-900/30 to-yellow-900/30 border border-yellow-400/40 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black uppercase text-yellow-300 tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-yellow-300" /> 👑 Royal Diamond Pass
                  </span>
                  <span className="text-xs font-bold bg-yellow-400 text-black px-2 py-0.5 rounded-full">
                    VIP 5+
                  </span>
                </div>
                <p className="text-xs text-gray-300">
                  Daily 1000 Coins + Flying Dragon Entrance + Exclusive Animated Avatar Ring + Seat Priority.
                </p>
                <button
                  onClick={() => {
                    setActiveModal(null);
                    if (onOpenTopUp) onOpenTopUp();
                  }}
                  className="w-full py-2 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 text-white font-extrabold rounded-xl text-xs shadow-lg shadow-pink-500/20"
                >
                  Get Royal Pass
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. PRIVILEGE SHOP MODAL */}
      {activeModal === 'privilege_shop' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-vibe-card border border-white/10 rounded-3xl p-5 shadow-2xl text-white max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-cyan-400" />
                <h3 className="font-extrabold text-base">Privilege Shop</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-1 rounded-full bg-white/5">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-3 space-y-3">
              <p className="text-xs text-gray-400">Exclusive Avatar Frames & Entrance Vehicles</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: 'Neon Cyber Ring', icon: '💫', price: '500 Coins', type: 'Avatar Frame' },
                  { name: 'Golden Dragon Aura', icon: '🐉', price: '1,500 Coins', type: 'Avatar Frame' },
                  { name: 'Sports Car Entrance', icon: '🏎️', price: '3,000 Coins', type: 'Vehicle' },
                  { name: 'Space Rocket Ride', icon: '🚀', price: '5,000 Coins', type: 'Vehicle' },
                  { name: 'Pink Cloud Bubble', icon: '💭', price: '300 Coins', type: 'Chat Bubble' },
                  { name: 'Fire Crown Badge', icon: '👑', price: '2,000 Coins', type: 'VIP Badge' },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-vibe-bg border border-white/5 rounded-2xl flex flex-col items-center text-center space-y-1.5 hover:border-pink-500/50 transition-colors"
                  >
                    <span className="text-3xl my-1">{item.icon}</span>
                    <p className="text-xs font-bold text-white">{item.name}</p>
                    <span className="text-[10px] text-gray-400">{item.type}</span>
                    <button
                      onClick={() => alert(`Purchased ${item.name} with ${item.price}!`)}
                      className="w-full mt-1 py-1.5 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1"
                    >
                      <Coins className="w-3 h-3 text-yellow-300 fill-yellow-300" /> {item.price}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. FAN CLUB MODAL */}
      {activeModal === 'fan_club' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-vibe-card border border-white/10 rounded-3xl p-5 shadow-2xl text-white max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />
                <h3 className="font-extrabold text-base">Creator Fan Club</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-1 rounded-full bg-white/5">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 p-1 flex items-center justify-center shadow-lg">
                <Heart className="w-8 h-8 text-white fill-white animate-pulse" />
              </div>

              <div>
                <h4 className="font-extrabold text-base text-white">
                  {user?.username ? `${user.username}'s Fan Club` : 'PartyVibe Fan Club'}
                </h4>
                <p className="text-xs text-gray-400 mt-1">
                  Active Club Level: <span className="text-pink-400 font-bold">Gold Star Lv. 8</span>
                </p>
              </div>

              <div className="p-3 bg-vibe-bg border border-white/5 rounded-2xl text-left space-y-1.5 text-xs">
                <p className="font-bold text-gray-200">Fan Club Perks:</p>
                <p className="text-gray-400">✓ Exclusive club badge in chat: [💖 {user?.username || 'Star'}]</p>
                <p className="text-gray-400">✓ Free daily gifts to support your favorite host</p>
                <p className="text-gray-400">✓ Priority room seat requests</p>
              </div>

              <button
                onClick={() => alert('Fan club membership active!')}
                className="w-full py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl text-xs font-bold"
              >
                Join / Renew Fan Club
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. USER LEVEL CENTER MODAL */}
      {activeModal === 'level_center' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-vibe-card border border-white/10 rounded-3xl p-5 shadow-2xl text-white max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <h3 className="font-extrabold text-base">User Level Center</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-1 rounded-full bg-white/5">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div className="p-4 bg-gradient-to-r from-purple-900/40 to-pink-900/40 border border-white/10 rounded-2xl text-center space-y-2">
                <span className="inline-block px-3 py-1 bg-amber-400 text-black font-black text-sm rounded-full shadow">
                  Level {userLevel}
                </span>
                <p className="text-xs text-gray-300">
                  {user?.totalCoinsSpent ? `${user.totalCoinsSpent.toLocaleString()} EXP earned` : '3,450 EXP earned'}
                </p>
                <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-pink-500 to-amber-400 h-full w-[65%]" />
                </div>
                <p className="text-[10px] text-gray-400">1,550 EXP required to reach Level {userLevel + 1}</p>
              </div>

              <div className="space-y-2">
                <h5 className="text-xs font-bold text-gray-300">How to Level Up Faster:</h5>
                <div className="p-2.5 bg-vibe-bg rounded-xl text-xs space-y-1 text-gray-400">
                  <p>• Send gifts in party rooms (+1 EXP per coin)</p>
                  <p>• Host or talk on voice seats (+50 EXP per hour)</p>
                  <p>• Daily login and invite friends (+100 EXP)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. SHARE WITH YOUR FRIENDS MODAL */}
      {activeModal === 'share' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-vibe-card border border-white/10 rounded-3xl p-5 shadow-2xl text-white max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-cyan-400" />
                <h3 className="font-extrabold text-base">Share with Friends</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-1 rounded-full bg-white/5">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-center">
              <div className="p-4 bg-gradient-to-r from-pink-500/20 to-cyan-500/20 border border-white/10 rounded-2xl">
                <p className="text-xs text-yellow-300 font-extrabold mb-1">🎁 Invite Friends & Earn Free Coins!</p>
                <p className="text-xs text-gray-300">
                  Every friend who joins using your link gets 500 Coins, and you get 500 Coins + 2 Days VIP Pass!
                </p>
              </div>

              <div className="space-y-2 text-left">
                <label className="text-xs font-bold text-gray-400">Your Personal Invite Link:</label>
                <div className="flex items-center gap-2 bg-vibe-bg border border-white/10 p-2 rounded-xl">
                  <input
                    type="text"
                    readOnly
                    value={`https://partyvibe.app/join?ref=${user?.username || 'vibe'}`}
                    className="flex-1 bg-transparent text-xs text-white outline-none"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-3 py-1 bg-pink-500 hover:bg-pink-600 rounded-lg text-xs font-bold flex items-center gap-1 shrink-0"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => {
                    const text = encodeURIComponent(
                      `Join my voice party room on PartyVibe! https://partyvibe.app/join?ref=${user?.username || 'party'}`
                    );
                    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
                  }}
                  className="py-2.5 bg-green-600 hover:bg-green-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
                >
                  WhatsApp
                </button>
                <button
                  onClick={() => {
                    const text = encodeURIComponent(
                      `Party with me on PartyVibe! https://partyvibe.app/join?ref=${user?.username || 'party'}`
                    );
                    window.open(`https://t.me/share/url?url=${text}`, '_blank');
                  }}
                  className="py-2.5 bg-sky-500 hover:bg-sky-600 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
                >
                  Telegram
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. SPECIAL GIFT RECORD MODAL */}
      {activeModal === 'gift_record' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-vibe-card border border-white/10 rounded-3xl p-5 shadow-2xl text-white max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                <h3 className="font-extrabold text-base">Special Gift Record</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-1 rounded-full bg-white/5">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filter tabs */}
            <div className="flex items-center gap-1 bg-vibe-bg p-1 rounded-xl border border-white/5 my-3 text-xs font-bold">
              {['all', 'received', 'sent'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setRecordFilter(tab)}
                  className={`flex-1 py-1.5 rounded-lg capitalize transition-all ${
                    recordFilter === tab ? 'bg-pink-500 text-white shadow' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Records List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {loadingRecords ? (
                <div className="py-8 text-center text-xs text-gray-400">Loading records...</div>
              ) : giftRecords.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-400">No gift records found for this filter.</div>
              ) : (
                giftRecords.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-3 bg-vibe-bg border border-white/5 rounded-2xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{item.gift?.icon || '🎁'}</span>
                      <div>
                        <p className="text-xs font-bold text-white">{item.gift?.name || 'Party Gift'}</p>
                        <p className="text-[10px] text-gray-400">
                          {item.sender?.username || 'Sender'} ➔ {item.receiver?.username || 'Receiver'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-extrabold text-yellow-400 flex items-center justify-end gap-1">
                        <Coins className="w-3 h-3 fill-yellow-400" /> {item.coins?.toLocaleString() || 0}
                      </span>
                      <span className="text-[9px] text-gray-500">
                        {item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 8. SETTINGS MODAL */}
      {activeModal === 'settings' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-vibe-card border border-white/10 rounded-3xl p-5 shadow-2xl text-white max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-gray-400" />
                <h3 className="font-extrabold text-base">App & Audio Settings</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-1 rounded-full bg-white/5">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div className="space-y-3">
                <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Voice & Audio</h5>

                <div className="flex items-center justify-between p-3 bg-vibe-bg rounded-2xl">
                  <div>
                    <p className="text-xs font-bold text-white">Mic Noise Suppression</p>
                    <p className="text-[10px] text-gray-400">Reduce background fan and room noise</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={micNoiseCancel}
                    onChange={(e) => setMicNoiseCancel(e.target.checked)}
                    className="w-4 h-4 accent-pink-500"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-vibe-bg rounded-2xl">
                  <div>
                    <p className="text-xs font-bold text-white">High Quality Stereo Music</p>
                    <p className="text-[10px] text-gray-400">Crisp voice audio stream for party rooms</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={highQualityAudio}
                    onChange={(e) => setHighQualityAudio(e.target.checked)}
                    className="w-4 h-4 accent-pink-500"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Privacy</h5>

                <div className="flex items-center justify-between p-3 bg-vibe-bg rounded-2xl">
                  <div>
                    <p className="text-xs font-bold text-white">Allow Room Invites</p>
                    <p className="text-[10px] text-gray-400">Friends can invite you to their stages</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={privateInvites}
                    onChange={(e) => setPrivateInvites(e.target.checked)}
                    className="w-4 h-4 accent-pink-500"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-white/5">
                <button
                  onClick={() => {
                    setActiveModal(null);
                    onClose();
                    logout();
                  }}
                  className="w-full py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 border border-red-500/30"
                >
                  <LogOut className="w-4 h-4" /> Log Out of PartyVibe
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9. HELP CENTER MODAL */}
      {activeModal === 'help' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-vibe-card border border-white/10 rounded-3xl p-5 shadow-2xl text-white max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-cyan-400" />
                <h3 className="font-extrabold text-base">Help Center & FAQ</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-1 rounded-full bg-white/5">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              {[
                {
                  q: 'Room me song kaise play karein?',
                  a: 'Room ke top bar me Music (🎵) icon dabayein. Wahan se aap curated party tracks choose kar sakte hain ya "Device Se Song Add Karein" dabakar apne phone ke downloaded songs play kar sakte hain.',
                },
                {
                  q: 'Coins recharge kaise karein?',
                  a: 'Coins wallet badge ya Profile me "Recharge" par click karein. Aap UPI (GPay, PhonePe, Paytm), Cards, ya Net Banking se instantly recharge kar sakte hain.',
                },
                {
                  q: 'Profile photo kaise change karein?',
                  a: 'Profile tab me jayein, avatar ke camera icon par click karein. Aap 8 cool preset avatars me se choose kar sakte hain ya "Device Se Photo Chunein" dabakar apni photo upload kar sakte hain.',
                },
                {
                  q: 'Voice seat par kaise baithein?',
                  a: 'Kisi bhi empty seat (Seat 1 se 8) par click karke "Take Seat" dabayein. Mic instantly activate ho jayega!',
                },
              ].map((faq, i) => (
                <div key={i} className="p-3 bg-vibe-bg border border-white/5 rounded-2xl space-y-1">
                  <p className="text-xs font-bold text-pink-400">❓ {faq.q}</p>
                  <p className="text-xs text-gray-300 leading-relaxed">{faq.a}</p>
                </div>
              ))}

              <div className="p-3 bg-pink-500/10 border border-pink-500/20 rounded-2xl text-center">
                <p className="text-xs font-bold text-white">Need 24/7 Human Support?</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Email us anytime at support@partyvibe.app</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 10. RULES AND POLICIES MODAL */}
      {activeModal === 'rules' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-vibe-card border border-white/10 rounded-3xl p-5 shadow-2xl text-white max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-400" />
                <h3 className="font-extrabold text-base">Rules and Policies</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-1 rounded-full bg-white/5">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs text-gray-300 leading-relaxed">
              <div className="p-3 bg-vibe-bg rounded-2xl border border-white/5 space-y-1">
                <h5 className="font-bold text-white text-xs">1. Safe Community Guidelines</h5>
                <p className="text-[11px] text-gray-400">
                  PartyVibe enforces strict zero tolerance for hate speech, harassment, vulgarity, or unauthorized audio streaming.
                </p>
              </div>

              <div className="p-3 bg-vibe-bg rounded-2xl border border-white/5 space-y-1">
                <h5 className="font-bold text-white text-xs">2. Voice Party Seat Etiquette</h5>
                <p className="text-[11px] text-gray-400">
                  When on a voice seat, respect the host and fellow speakers. Do not interrupt or blast excessively loud distorted audio.
                </p>
              </div>

              <div className="p-3 bg-vibe-bg rounded-2xl border border-white/5 space-y-1">
                <h5 className="font-bold text-white text-xs">3. Coins and Virtual Gifts</h5>
                <p className="text-[11px] text-gray-400">
                  All coin purchases and gifts are final. Coins are non-refundable and strictly for in-app entertainment and virtual gifts.
                </p>
              </div>

              <div className="p-3 bg-vibe-bg rounded-2xl border border-white/5 space-y-1">
                <h5 className="font-bold text-white text-xs">4. Privacy Policy</h5>
                <p className="text-[11px] text-gray-400">
                  Your password is encrypted with BCrypt and voice streams are end-to-end encrypted through secure WebRTC channels.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AppSideDrawer;
