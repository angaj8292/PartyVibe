import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import AvatarPickerModal from '../components/AvatarPickerModal';
import {
  Coins,
  Crown,
  Users,
  Gift,
  Plus,
  LogOut,
  Edit3,
  Calendar,
  Sparkles,
  Shield,
  Zap,
  CheckCircle,
  Camera,
  Menu,
} from 'lucide-react';

const ProfilePage = ({ onOpenTopUp, onOpenDrawer }) => {
  const { user, logout, refreshUser, topUpCoins } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [giftWall, setGiftWall] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [bioInput, setBioInput] = useState('');
  const [ageInput, setAgeInput] = useState('');
  const [genderInput, setGenderInput] = useState('Secret');
  const [loading, setLoading] = useState(true);
  const [topUpLoading, setTopUpLoading] = useState(false);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const [profileRes, wallRes, walletRes] = await Promise.all([
        api.get('/users/me'),
        user ? api.get(`/users/${user.id}/gift-wall`) : Promise.resolve({ data: [] }),
        api.get('/wallet'),
      ]);
      setProfile(profileRes.data);
      setGiftWall(wallRes.data);
      setWallet(walletRes.data);

      setBioInput(profileRes.data.bio || '');
      setAgeInput(profileRes.data.age || '');
      setGenderInput(profileRes.data.gender || 'Secret');
    } catch (err) {
      console.error('Failed to load profile data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfileData();
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put('/users/me', {
        bio: bioInput,
        age: ageInput ? Number(ageInput) : null,
        gender: genderInput,
      });
      setProfile(res.data);
      setIsEditing(false);
      refreshUser();
    } catch (err) {
      alert('Failed to update profile');
    }
  };

  const handleInstantTopUp = async () => {
    try {
      setTopUpLoading(true);
      await topUpCoins(1000);
      await loadProfileData();
    } catch (e) {
      alert('Top-up failed');
    } finally {
      setTopUpLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return (
      <div className="p-8 text-center max-w-md mx-auto pt-20">
        <p className="text-gray-400 mb-4">Please log in to view your profile.</p>
        <button
          onClick={() => navigate('/login')}
          className="bg-vibe-accent text-white font-bold py-2 px-6 rounded-full"
        >
          Login
        </button>
      </div>
    );
  }

  return (
    <div className="pb-28 max-w-md mx-auto px-4 pt-4 space-y-4">
      {/* Profile Header Card */}
      <div className="relative rounded-3xl p-5 bg-gradient-to-b from-vibe-card to-vibe-bg border border-white/10 shadow-2xl overflow-hidden">
        {/* Top Controls: App Side Menu / Edit / Logout */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={onOpenDrawer}
            className="flex items-center gap-1.5 text-xs text-white font-bold px-3 py-1.5 rounded-full bg-gradient-to-r from-pink-500/30 to-purple-600/30 border border-pink-500/40 hover:from-pink-500/50 shadow-sm"
            title="Open Side Menu"
          >
            <Menu className="w-3.5 h-3.5 text-pink-400" />
            <span>App Menu</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-white px-2.5 py-1 rounded-full bg-white/5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Cancel' : 'Edit Bio'}</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 px-2.5 py-1 rounded-full bg-red-500/10"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Avatar & User Details */}
        <div className="flex flex-col items-center text-center">
          <div
            onClick={() => setIsAvatarModalOpen(true)}
            className="relative cursor-pointer group"
            title="Click to Change Profile Picture"
          >
            <img
              src={profile?.avatarUrl || user.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + user.username}
              alt={user.username}
              className="w-20 h-20 rounded-full object-cover border-2 border-vibe-purple shadow-xl group-hover:opacity-85 transition-opacity"
            />
            {/* Camera Overlay Icon */}
            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Camera className="w-6 h-6 text-white" />
            </div>
            {/* VIP Level Badge */}
            <span
              className={`absolute -bottom-1 -right-1 text-[10px] px-2 py-0.5 rounded-full font-extrabold shadow-lg vip-badge-${profile?.vipLevel || user.vipLevel || 0}`}
            >
              VIP {profile?.vipLevel || user.vipLevel || 0}
            </span>
          </div>

          <button
            onClick={() => setIsAvatarModalOpen(true)}
            className="mt-1.5 text-[10px] font-bold text-pink-400 hover:text-pink-300 flex items-center gap-1"
          >
            <Camera className="w-3 h-3" /> Change Profile Picture
          </button>

          <h2 className="mt-2 text-base font-extrabold text-white flex items-center gap-1.5">
            <span>@{user.username}</span>
          </h2>

          <p className="text-xs text-gray-300 mt-1 max-w-[280px]">
            {profile?.bio || 'Hey there! Ready to party with PartyVibe 🎤'}
          </p>

          <div className="flex items-center gap-2 mt-1.5 text-[11px] text-gray-400">
            {profile?.gender && <span>{profile.gender}</span>}
            {profile?.age && <span>• {profile.age} yrs</span>}
          </div>
        </div>

        {/* Quick Edit Form */}
        {isEditing && (
          <form onSubmit={handleSaveProfile} className="mt-4 pt-3 border-t border-white/10 space-y-2">
            <input
              type="text"
              value={bioInput}
              onChange={(e) => setBioInput(e.target.value)}
              placeholder="Your bio status..."
              className="w-full bg-vibe-bg border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={ageInput}
                onChange={(e) => setAgeInput(e.target.value)}
                placeholder="Age"
                className="bg-vibe-bg border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white"
              />
              <select
                value={genderInput}
                onChange={(e) => setGenderInput(e.target.value)}
                className="bg-vibe-bg border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Secret">Secret</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full bg-vibe-accent text-white text-xs font-bold py-1.5 rounded-xl"
            >
              Save Profile
            </button>
          </form>
        )}

        {/* Social Counters */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/5 text-center">
          <div>
            <div className="text-sm font-extrabold text-white">
              {profile?.followersCount || 0}
            </div>
            <div className="text-[10px] text-gray-400 font-semibold">Followers</div>
          </div>
          <div>
            <div className="text-sm font-extrabold text-white">
              {profile?.followingCount || 0}
            </div>
            <div className="text-[10px] text-gray-400 font-semibold">Following</div>
          </div>
          <div>
            <div className="text-sm font-extrabold text-emerald-400">
              {profile?.friendsCount || 0}
            </div>
            <div className="text-[10px] text-gray-400 font-semibold">Friends</div>
          </div>
        </div>
      </div>

      {/* Wallet Card */}
      <div className="rounded-3xl p-4 bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-600/10 border border-yellow-500/20 shadow-xl">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            <h3 className="font-extrabold text-xs text-yellow-400 uppercase tracking-wider">
              Coins Wallet
            </h3>
          </div>
          <span className="text-[10px] bg-yellow-400/20 text-yellow-300 font-bold px-2 py-0.5 rounded-full border border-yellow-400/30">
            Dev Mode
          </span>
        </div>

        <div className="flex items-baseline justify-between mt-1">
          <div>
            <div className="text-2xl font-black text-white flex items-center gap-1.5">
              <span>{profile?.coinsBalance?.toLocaleString() || 0}</span>
              <span className="text-xs text-yellow-400 font-bold">coins</span>
            </div>
            <div className="text-[11px] text-gray-400">
              Total Spent: {profile?.totalCoinsSpent?.toLocaleString() || 0} coins
            </div>
          </div>

          {/* Add 1000 Test Coins Button */}
          <button
            onClick={handleInstantTopUp}
            disabled={topUpLoading}
            className="flex items-center gap-1 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-extrabold text-xs px-3 py-2 rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            <Zap className="w-3.5 h-3.5 fill-black" />
            <span>{topUpLoading ? 'Adding...' : '+1,000 Test Coins'}</span>
          </button>
        </div>
      </div>

      {/* Gift Wall */}
      <div className="rounded-3xl p-4 bg-vibe-card border border-white/5 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4 text-pink-400" />
            <h3 className="font-bold text-xs text-white">Gift Wall</h3>
          </div>
          <span className="text-[10px] text-gray-400">
            {giftWall.length} Gifts Received
          </span>
        </div>

        {giftWall.length === 0 ? (
          <div className="p-6 text-center bg-vibe-bg rounded-2xl border border-white/5 text-gray-500 text-xs">
            🎁 Your gift wall is empty. Receive gifts from room listeners to display them here!
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {giftWall.map((item) => (
              <div
                key={item.giftId}
                className="flex flex-col items-center p-2.5 rounded-2xl bg-vibe-bg border border-white/5"
              >
                <span className="text-3xl mb-1">{item.icon}</span>
                <span className="text-[11px] font-black text-amber-400">x{item.count}</span>
                <span className="text-[10px] text-gray-300 font-semibold truncate max-w-[65px]">
                  {item.giftName}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Wallet Transactions */}
      {wallet?.recentTransactions && wallet.recentTransactions.length > 0 && (
        <div className="rounded-3xl p-4 bg-vibe-card border border-white/5 shadow-xl">
          <h3 className="font-bold text-xs text-white mb-2.5">Recent Wallet Activity</h3>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {wallet.recentTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-2 rounded-xl bg-vibe-bg border border-white/5 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-semibold text-gray-200 truncate">
                    {tx.description}
                  </div>
                  <div className="text-[9px] text-gray-500">
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div
                  className={`font-black text-xs ml-2 shrink-0 ${
                    tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Change Avatar Modal */}
      <AvatarPickerModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        currentAvatarUrl={profile?.avatarUrl || user?.avatarUrl}
        onAvatarUpdated={(newAvatar) => {
          setProfile((prev) => ({ ...prev, avatarUrl: newAvatar }));
          refreshUser();
        }}
      />
    </div>
  );
};

export default ProfilePage;
