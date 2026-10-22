import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import DirectChatModal from '../components/DirectChatModal';
import websocketService from '../services/websocket';
import {
  MessageSquare,
  Bell,
  Sparkles,
  Shield,
  Gift,
  Search,
  MessageCircle,
  Clock,
  CheckCheck,
} from 'lucide-react';

const MessagesPage = () => {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('chats'); // 'chats' | 'notifications'
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [unreadTotal, setUnreadTotal] = useState(0);

  const fetchConversations = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const [convRes, unreadRes] = await Promise.all([
        api.get('/messages/conversations'),
        api.get('/messages/unread-count'),
      ]);
      setConversations(convRes.data);
      setUnreadTotal(unreadRes.data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();

    // Listen for new incoming direct messages to update conversation preview
    let sub = null;
    if (currentUser?.id) {
      sub = websocketService.subscribe(`/topic/user.${currentUser.id}.messages`, () => {
        fetchConversations();
      });
    }

    const interval = setInterval(fetchConversations, 8000);
    return () => {
      if (sub) sub.unsubscribe();
      clearInterval(interval);
    };
  }, [currentUser]);

  const notifications = [
    {
      id: 1,
      type: 'gift',
      title: 'Gift Received!',
      desc: 'You received a Rose 🌹 from a party room listener!',
      time: '10m ago',
      icon: '🎁',
    },
    {
      id: 2,
      type: 'system',
      title: 'Welcome to PartyVibe',
      desc: 'Join any trending voice party room, grab an 8-seat stage, or chat with friends!',
      time: '1h ago',
      icon: '✨',
    },
    {
      id: 3,
      type: 'vip',
      title: 'VIP Level Up',
      desc: 'Every coin spent on gifts increases your VIP ranking and unlocks custom badges!',
      time: '2h ago',
      icon: '👑',
    },
  ];

  return (
    <div className="pb-24 max-w-md mx-auto px-4 pt-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-lg font-black text-white flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-vibe-accent" />
          <span>Messages & Notices</span>
        </h1>
        {unreadTotal > 0 && (
          <span className="text-xs bg-vibe-accent text-white px-2 py-0.5 rounded-full font-bold">
            {unreadTotal} new
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 bg-vibe-card border border-white/5 rounded-2xl mb-4">
        <button
          onClick={() => setActiveTab('chats')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'chats'
              ? 'bg-gradient-to-r from-vibe-accent to-purple-600 text-white shadow-md'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Direct Chats</span>
          {unreadTotal > 0 && (
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'notifications'
              ? 'bg-gradient-to-r from-vibe-accent to-purple-600 text-white shadow-md'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Notifications</span>
        </button>
      </div>

      {/* Direct Chats Tab */}
      {activeTab === 'chats' && (
        <div className="space-y-2">
          {loading && conversations.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 rounded-full border-2 border-vibe-accent border-t-transparent animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-12 px-4 bg-vibe-card border border-white/5 rounded-3xl">
              <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3 text-vibe-accent">
                <MessageSquare className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">No Conversations Yet</h3>
              <p className="text-xs text-gray-400 max-w-xs mx-auto mb-4">
                Click on any user's profile in a Party Room or Friends tab to send them a direct message!
              </p>
            </div>
          ) : (
            conversations.map((conv) => {
              const partner = {
                id: conv.partnerId,
                username: conv.partnerUsername,
                avatarUrl: conv.partnerAvatarUrl,
                vipLevel: conv.partnerVipLevel,
                bio: conv.partnerBio,
              };
              const timeStr = conv.lastMessageTime
                ? new Date(conv.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '';

              return (
                <div
                  key={conv.partnerId}
                  onClick={() => setActiveChatUser(partner)}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-vibe-card border border-white/5 hover:border-white/15 transition-all cursor-pointer active:scale-98"
                >
                  <div className="relative shrink-0">
                    <img
                      src={
                        conv.partnerAvatarUrl ||
                        `https://api.dicebear.com/7.x/bottts/svg?seed=${conv.partnerUsername}`
                      }
                      alt={conv.partnerUsername}
                      className="w-12 h-12 rounded-full object-cover border border-white/10"
                    />
                    {conv.partnerVipLevel > 0 && (
                      <span
                        className={`absolute -bottom-1 -right-1 text-[8px] px-1 rounded-full font-bold vip-badge-${conv.partnerVipLevel}`}
                      >
                        V{conv.partnerVipLevel}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white truncate">
                        @{conv.partnerUsername}
                      </h4>
                      <span className="text-[10px] text-gray-500 shrink-0">{timeStr}</span>
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <p className="text-[11px] text-gray-400 truncate max-w-[200px]">
                        {conv.isLastMessageFromMe ? 'You: ' : ''}
                        {conv.lastMessageContent}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className="text-[10px] font-bold bg-vibe-accent text-white px-2 py-0.2 rounded-full shrink-0">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="space-y-2.5">
          {notifications.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-3 p-3.5 rounded-2xl bg-vibe-card border border-white/5 hover:border-white/10 transition-colors"
            >
              <div className="w-10 h-10 rounded-2xl bg-vibe-bg border border-white/10 flex items-center justify-center text-xl shrink-0">
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white">{item.title}</h4>
                  <span className="text-[10px] text-gray-500">{item.time}</span>
                </div>
                <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Direct Chat Modal */}
      {activeChatUser && (
        <DirectChatModal
          isOpen={!!activeChatUser}
          targetUser={activeChatUser}
          onClose={() => {
            setActiveChatUser(null);
            fetchConversations();
          }}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

export default MessagesPage;
