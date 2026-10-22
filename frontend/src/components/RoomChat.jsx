import React, { useState, useRef, useEffect } from 'react';
import { Send, Gift, Sparkles, Smile } from 'lucide-react';

const QUICK_EMOJIS = ['🔥', '❤️', '👏', '🎉', '🚀', '✨', '🎤'];

const RoomChat = ({ messages = [], onSendMessage, onOpenGiftModal, currentUser }) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleQuickEmoji = (emoji) => {
    onSendMessage(emoji);
  };

  return (
    <div className="flex flex-col h-[280px] w-full rounded-2xl bg-vibe-bg/50 border border-white/5 overflow-hidden">
      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs">
        {messages.map((msg, index) => {
          if (msg.type === 'GIFT') {
            return (
              <div
                key={msg.id || index}
                className="bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-amber-500/20 border border-pink-500/30 rounded-xl p-2 shadow-sm animate-fade-in flex items-center gap-2"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-pink-500 to-amber-400 flex items-center justify-center text-sm shadow">
                  🎁
                </div>
                <div className="text-[11px] font-bold text-pink-300 leading-tight">
                  {msg.content}
                </div>
              </div>
            );
          }

          if (msg.type === 'SYSTEM') {
            return (
              <div
                key={msg.id || index}
                className="text-center text-[10px] text-gray-500 italic py-0.5"
              >
                {msg.content}
              </div>
            );
          }

          const isMe = currentUser && msg.sender?.id === currentUser.id;

          return (
            <div
              key={msg.id || index}
              className={`flex items-start gap-1.5 ${isMe ? 'flex-row-reverse' : ''}`}
            >
              {msg.sender?.avatarUrl && (
                <img
                  src={msg.sender.avatarUrl}
                  alt={msg.sender.username}
                  className="w-5 h-5 rounded-full object-cover mt-0.5"
                />
              )}

              <div
                className={`max-w-[78%] px-2.5 py-1.5 rounded-2xl ${
                  isMe
                    ? 'bg-gradient-to-r from-vibe-accent to-purple-600 text-white rounded-tr-none'
                    : 'bg-white/10 text-gray-200 rounded-tl-none border border-white/5'
                }`}
              >
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="font-bold text-[10px] opacity-80">
                    {msg.sender ? msg.sender.username : 'Guest'}
                  </span>
                  {msg.sender?.vipLevel > 0 && (
                    <span className={`text-[8px] px-1 rounded font-bold vip-badge-${msg.sender.vipLevel}`}>
                      V{msg.sender.vipLevel}
                    </span>
                  )}
                </div>
                <p className="break-words text-[11.5px] leading-snug">{msg.content}</p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Emojis Bar */}
      <div className="flex items-center gap-1 px-3 py-1 bg-black/20 border-t border-white/5 overflow-x-auto no-scrollbar">
        {QUICK_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => handleQuickEmoji(emoji)}
            className="text-sm px-1.5 py-0.5 hover:scale-125 transition-transform"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 p-2 bg-vibe-card border-t border-white/5">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Send a message..."
          maxLength={300}
          className="flex-1 bg-vibe-bg border border-white/10 rounded-full px-3.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-vibe-accent"
        />

        {/* Gift Button */}
        <button
          type="button"
          onClick={onOpenGiftModal}
          className="p-2 rounded-full bg-gradient-to-tr from-pink-500 to-amber-500 text-white shadow-md hover:scale-105 active:scale-95 transition-transform"
          title="Send Gift"
        >
          <Gift className="w-4 h-4" />
        </button>

        {/* Send Button */}
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2 rounded-full bg-vibe-accent disabled:opacity-30 text-white hover:bg-pink-600 transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

export default RoomChat;
