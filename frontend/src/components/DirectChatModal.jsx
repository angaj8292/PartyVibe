import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import websocketService from '../services/websocket';
import { X, Send, User, Check, CheckCheck, Sparkles, MessageCircle } from 'lucide-react';

const DirectChatModal = ({ isOpen, targetUser, onClose, currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && targetUser?.id) {
      loadMessages();
      markAsRead();

      // Subscribe to real-time incoming messages for current user
      let sub = null;
      if (currentUser?.id) {
        sub = websocketService.subscribe(`/topic/user.${currentUser.id}.messages`, (msg) => {
          if (msg && (msg.senderId === targetUser.id || msg.receiverId === targetUser.id)) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
            markAsRead();
          }
        });
      }

      // Fallback poll every 3.5s for seamless delivery
      const pollTimer = setInterval(() => {
        loadMessages(false);
      }, 3500);

      return () => {
        if (sub) sub.unsubscribe();
        clearInterval(pollTimer);
      };
    }
  }, [isOpen, targetUser?.id, currentUser?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async (showLoading = true) => {
    if (!targetUser?.id) return;
    try {
      if (showLoading) setLoading(true);
      const res = await api.get(`/messages/user/${targetUser.id}`);
      setMessages(res.data);
    } catch (err) {
      console.error('Failed to load direct messages:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const markAsRead = async () => {
    if (!targetUser?.id) return;
    try {
      await api.post(`/messages/user/${targetUser.id}/read`);
    } catch (e) {
      // ignore
    }
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    const content = inputText.trim();
    if (!content || !targetUser?.id || sending) return;

    try {
      setSending(true);
      setInputText('');
      const res = await api.post(`/messages/user/${targetUser.id}`, { content });
      setMessages((prev) => [...prev, res.data]);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send message');
      setInputText(content);
    } finally {
      setSending(false);
    }
  };

  if (!isOpen || !targetUser) return null;

  const targetAvatar =
    targetUser.avatarUrl ||
    `https://api.dicebear.com/7.x/bottts/svg?seed=${targetUser.username}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm h-[580px] max-h-[92vh] bg-vibe-card border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden relative">
        {/* Header */}
        <div className="px-4 py-3 bg-vibe-bg/90 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative">
              <img
                src={targetAvatar}
                alt={targetUser.username}
                className="w-10 h-10 rounded-full object-cover border border-vibe-accent"
              />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-vibe-card absolute bottom-0 right-0" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-white truncate max-w-[130px]">
                  @{targetUser.username}
                </span>
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold vip-badge-${
                    targetUser.vipLevel || 0
                  }`}
                >
                  VIP {targetUser.vipLevel || 0}
                </span>
              </div>
              <p className="text-[10px] text-gray-400 truncate max-w-[150px]">
                {targetUser.bio || 'PartyVibe user'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-3 overflow-y-auto space-y-2.5 bg-gradient-to-b from-vibe-bg/40 to-vibe-card">
          {loading && messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 rounded-full border-2 border-vibe-accent border-t-transparent animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-2 text-vibe-accent">
                <MessageCircle className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-gray-300">Start the conversation!</p>
              <p className="text-[11px] text-gray-500 mt-1 max-w-[200px]">
                Send a private direct message to @{targetUser.username}
              </p>
            </div>
          ) : (
            messages.map((m) => {
              const isMe = m.senderId === currentUser?.id;
              const timeStr = m.createdAt
                ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '';

              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[78%] px-3.5 py-2 rounded-2xl text-xs break-words shadow-md ${
                      isMe
                        ? 'bg-gradient-to-r from-vibe-accent to-purple-600 text-white rounded-tr-xs'
                        : 'bg-white/10 text-gray-100 rounded-tl-xs border border-white/5'
                    }`}
                  >
                    <p className="leading-relaxed">{m.content}</p>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5 px-1 text-[9px] text-gray-500">
                    <span>{timeStr}</span>
                    {isMe && (
                      m.isRead ? (
                        <CheckCheck className="w-3 h-3 text-cyan-400" />
                      ) : (
                        <Check className="w-3 h-3 text-gray-500" />
                      )
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Input Field */}
        <form
          onSubmit={handleSendMessage}
          className="p-2.5 bg-vibe-bg border-t border-white/10 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Message @${targetUser.username}...`}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-vibe-accent"
            maxLength={1000}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || sending}
            className="p-2 rounded-xl bg-gradient-to-r from-vibe-accent to-purple-600 text-white font-bold disabled:opacity-40 transition-all hover:scale-105 active:scale-95 shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default DirectChatModal;
