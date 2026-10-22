import React, { useState, useEffect } from 'react';
import api from '../services/api';
import RoomCard from '../components/RoomCard';
import UserProfileModal from '../components/UserProfileModal';
import { useAuth } from '../context/AuthContext';
import { Users, UserPlus, UserCheck, Search, Radio, Sparkles } from 'lucide-react';

const FollowPage = () => {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('rooms'); // 'rooms', 'friends', 'recommended'
  const [followingRooms, setFollowingRooms] = useState([]);
  const [friends, setFriends] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [roomsRes, friendsRes, recRes] = await Promise.all([
        api.get('/rooms/following'),
        currentUser ? api.get(`/users/${currentUser.id}/friends`) : Promise.resolve({ data: [] }),
        api.get('/users/recommended'),
      ]);
      setFollowingRooms(roomsRes.data);
      setFriends(friendsRes.data);
      setRecommended(recRes.data);
    } catch (err) {
      console.error('Failed to load follow page data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  const handleToggleFollow = async (targetUserId) => {
    try {
      const res = await api.post(`/users/${targetUserId}/follow`);
      const isNowFollowing = res.data.following;

      setRecommended((prev) =>
        prev.map((u) => (u.id === targetUserId ? { ...u, isFollowing: isNowFollowing } : u))
      );

      // Refresh friends list if mutual follow changed
      if (currentUser) {
        const friendsRes = await api.get(`/users/${currentUser.id}/friends`);
        setFriends(friendsRes.data);
      }
    } catch (err) {
      console.error('Failed to toggle follow:', err);
    }
  };

  return (
    <div className="pb-24 max-w-md mx-auto px-4 pt-3">
      {/* Page Title & Tabs */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-black text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-vibe-accent" />
          <span>Follow & Connections</span>
        </h1>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 bg-vibe-card p-1 rounded-2xl border border-white/5 mb-4">
        <button
          onClick={() => setActiveTab('rooms')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'rooms'
              ? 'bg-vibe-accent text-white shadow-md'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Radio className="w-3.5 h-3.5" /> Followed Rooms
        </button>

        <button
          onClick={() => setActiveTab('friends')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'friends'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" /> Friends ({friends.length})
        </button>

        <button
          onClick={() => setActiveTab('recommended')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'recommended'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <UserPlus className="w-3.5 h-3.5" /> Recommended
        </button>
      </div>

      {/* Tab 1: Rooms where followed users are */}
      {activeTab === 'rooms' && (
        <div>
          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2].map((i) => (
                <div key={i} className="aspect-[16/14] rounded-2xl bg-vibe-card animate-pulse" />
              ))}
            </div>
          ) : followingRooms.length === 0 ? (
            <div className="p-8 text-center bg-vibe-card/50 rounded-3xl border border-white/5">
              <Users className="w-10 h-10 text-gray-500 mx-auto mb-2 opacity-50" />
              <p className="text-xs text-gray-400 font-semibold mb-1">
                No followed friends are live in rooms right now.
              </p>
              <p className="text-[11px] text-gray-500 mb-3">
                Follow recommended creators below to see their active parties here!
              </p>
              <button
                onClick={() => setActiveTab('recommended')}
                className="px-3.5 py-1.5 rounded-full bg-vibe-accent text-white font-bold text-xs"
              >
                Discover People to Follow
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {followingRooms.map((room) => (
                <RoomCard key={room.id} room={room} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Mutual Friends */}
      {activeTab === 'friends' && (
        <div className="space-y-2">
          {friends.length === 0 ? (
            <div className="p-8 text-center bg-vibe-card/50 rounded-3xl border border-white/5">
              <Sparkles className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-50" />
              <p className="text-xs text-gray-300 font-bold mb-1">No mutual friends yet</p>
              <p className="text-[11px] text-gray-500">
                When you and another user follow each other, you become Friends!
              </p>
            </div>
          ) : (
            friends.map((friend) => (
              <div
                key={friend.id}
                onClick={() => setSelectedUser(friend)}
                className="flex items-center justify-between p-3 rounded-2xl bg-vibe-card border border-white/5 hover:border-emerald-500/30 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={friend.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + friend.username}
                    alt={friend.username}
                    className="w-11 h-11 rounded-full object-cover border border-emerald-500/40"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white">@{friend.username}</span>
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-extrabold px-1.5 rounded-full">
                        Mutual
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-400">VIP Level {friend.vipLevel}</span>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedUser(friend);
                  }}
                  className="px-3 py-1 rounded-full bg-white/5 text-gray-300 text-xs font-semibold hover:bg-white/10"
                >
                  View Profile
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Recommended Users */}
      {activeTab === 'recommended' && (
        <div className="space-y-2">
          {recommended.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-500">
              No new recommendations available.
            </div>
          ) : (
            recommended.map((u) => (
              <div
                key={u.id}
                onClick={() => setSelectedUser(u)}
                className="flex items-center justify-between p-3 rounded-2xl bg-vibe-card border border-white/5 hover:border-white/10 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={u.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + u.username}
                    alt={u.username}
                    className="w-11 h-11 rounded-full object-cover border border-white/10"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white">@{u.username}</span>
                      {u.vipLevel > 0 && (
                        <span className={`text-[8px] px-1 rounded font-bold vip-badge-${u.vipLevel}`}>
                          V{u.vipLevel}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400">Recommended for you</span>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleFollow(u.id);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 transition-all ${
                    u.isFollowing
                      ? 'bg-white/10 text-gray-300'
                      : 'bg-gradient-to-r from-vibe-accent to-purple-600 text-white shadow-sm'
                  }`}
                >
                  {u.isFollowing ? (
                    <>
                      <UserCheck className="w-3.5 h-3.5 text-emerald-400" /> Following
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" /> Follow
                    </>
                  )}
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* User Profile Modal */}
      {selectedUser && (
        <UserProfileModal
          user={selectedUser}
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          currentUser={currentUser}
          onFollowChanged={fetchData}
        />
      )}
    </div>
  );
};

export default FollowPage;
