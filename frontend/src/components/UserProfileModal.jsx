import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { X, UserPlus, UserCheck, Users, ShieldAlert, Ban, Gift, Sparkles } from 'lucide-react';

const UserProfileModal = ({
  user,
  isOpen,
  onClose,
  currentUser,
  onOpenGiftForUser,
  onOpenReport,
  onFollowChanged,
}) => {
  const [profile, setProfile] = useState(null);
  const [giftWall, setGiftWall] = useState([]);
  const [loading, setLoading] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user?.id) {
      loadProfileAndWall(user.id);
    }
  }, [isOpen, user]);

  const loadProfileAndWall = async (userId) => {
    try {
      setLoading(true);
      const [profileRes, wallRes] = await Promise.all([
        api.get(`/users/${userId}`),
        api.get(`/users/${userId}/gift-wall`),
      ]);
      setProfile(profileRes.data);
      setGiftWall(wallRes.data);
    } catch (err) {
      console.error('Failed to load profile details:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  const isMe = currentUser && currentUser.id === user.id;

  const handleToggleFollow = async () => {
    if (!profile || isMe) return;
    try {
      setFollowLoading(true);
      const res = await api.post(`/users/${profile.id}/follow`);
      const isNowFollowing = res.data.following;

      setProfile((prev) => ({
        ...prev,
        isFollowing: isNowFollowing,
        followersCount: isNowFollowing ? prev.followersCount + 1 : Math.max(0, prev.followersCount - 1),
      }));

      if (onFollowChanged) onFollowChanged(profile.id, isNowFollowing);
    } catch (err) {
      console.error('Failed to toggle follow:', err);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleBlockUser = async () => {
    if (window.confirm(`Are you sure you want to block @${user.username}?`)) {
      try {
        await api.post(`/users/${user.id}/block`);
        alert(`User @${user.username} has been blocked.`);
        onClose();
      } catch (err) {
        alert('Failed to block user');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm bg-vibe-card border border-white/10 rounded-3xl p-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-white rounded-full bg-white/5"
        >
          <X className="w-4 h-4" />
        </button>

        {/* User Header */}
        <div className="flex flex-col items-center text-center mt-2">
          <div className="relative">
            <img
              src={profile?.avatarUrl || user.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + user.username}
              alt={user.username}
              className="w-20 h-20 rounded-full object-cover border-2 border-vibe-accent/50 shadow-lg"
            />
            <span className={`absolute bottom-0 right-0 text-[10px] px-1.5 py-0.5 rounded-full font-bold shadow vip-badge-${profile?.vipLevel || user.vipLevel || 0}`}>
              VIP {profile?.vipLevel || user.vipLevel || 0}
            </span>
          </div>

          <h3 className="mt-2 text-base font-extrabold text-white flex items-center gap-1.5">
            <span>{user.username}</span>
            {profile?.isFriend && (
              <span className="text-[10px] bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold px-2 py-0.2 rounded-full">
                Friends
              </span>
            )}
          </h3>

          <p className="text-xs text-gray-400 mt-1 max-w-[240px]">
            {profile?.bio || 'Hey there! Ready to party with PartyVibe 🎤'}
          </p>

          {/* Demographic chips */}
          <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-400">
            {profile?.gender && <span>{profile.gender}</span>}
            {profile?.age && <span>• {profile.age} yrs</span>}
          </div>

          {/* Stats Counters */}
          <div className="grid grid-cols-3 gap-3 w-full my-4 py-2 bg-vibe-bg rounded-2xl border border-white/5 text-center">
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

          {/* Primary Action Buttons */}
          {!isMe && (
            <div className="flex items-center gap-2 w-full">
              <button
                onClick={handleToggleFollow}
                disabled={followLoading}
                className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  profile?.isFollowing
                    ? 'bg-white/10 text-gray-200 border border-white/10 hover:bg-white/15'
                    : 'bg-gradient-to-r from-vibe-accent to-purple-600 text-white shadow-md shadow-pink-500/20'
                }`}
              >
                {profile?.isFollowing ? (
                  <>
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" /> Following
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" /> Follow
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  onClose();
                  if (onOpenGiftForUser) onOpenGiftForUser(user);
                }}
                className="flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-md"
              >
                <Gift className="w-3.5 h-3.5" /> Send Gift
              </button>
            </div>
          )}

          {/* Received Gift Wall */}
          <div className="w-full mt-4 text-left">
            <div className="text-[11px] font-bold text-gray-300 mb-2 flex items-center gap-1.5">
              <span>🏆 Gift Wall</span>
              <span className="text-[10px] text-gray-500 font-normal">
                ({giftWall.length} gifts received)
              </span>
            </div>

            {giftWall.length === 0 ? (
              <div className="p-3 text-center bg-vibe-bg rounded-xl border border-white/5 text-[11px] text-gray-500">
                No gifts received yet. Be the first to send one!
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {giftWall.map((item) => (
                  <div
                    key={item.giftId}
                    className="flex flex-col items-center p-2 rounded-xl bg-vibe-bg border border-white/5"
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <span className="text-[10px] font-bold text-amber-400 mt-1">
                      x{item.count}
                    </span>
                    <span className="text-[9px] text-gray-400 truncate max-w-[60px]">
                      {item.giftName}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Safety Buttons (Report / Block) */}
          {!isMe && (
            <div className="flex items-center justify-center gap-4 mt-5 pt-3 border-t border-white/5 w-full text-xs">
              <button
                onClick={() => {
                  onClose();
                  if (onOpenReport) onOpenReport({ reportedUserId: user.id });
                }}
                className="flex items-center gap-1 text-gray-400 hover:text-amber-400 transition-colors"
              >
                <ShieldAlert className="w-3.5 h-3.5" /> Report
              </button>
              <button
                onClick={handleBlockUser}
                className="flex items-center gap-1 text-gray-400 hover:text-red-400 transition-colors"
              >
                <Ban className="w-3.5 h-3.5" /> Block
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;
