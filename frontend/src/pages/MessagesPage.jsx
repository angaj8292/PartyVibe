import React from 'react';
import { MessageSquare, Bell, Sparkles, Shield, Gift } from 'lucide-react';

const MessagesPage = () => {
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
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-black text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-vibe-accent" />
          <span>Notifications & Messages</span>
        </h1>
      </div>

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
    </div>
  );
};

export default MessagesPage;
