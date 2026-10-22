import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';

const GiftAnimationOverlay = ({ activeGiftEvent, onAnimationEnd }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (activeGiftEvent) {
      setVisible(true);

      // Trigger confetti explosion
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#FF3366', '#7928CA', '#00F2FE', '#FFD700'],
        });
      } catch (e) {
        // Confetti fallback
      }

      const timer = setTimeout(() => {
        setVisible(false);
        if (onAnimationEnd) onAnimationEnd();
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [activeGiftEvent]);

  if (!visible || !activeGiftEvent) return null;

  const { sender, receiver, gift } = activeGiftEvent;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex flex-col items-center justify-center p-4">
      {/* Big Animated Icon */}
      <div className="animate-float-up text-8xl sm:text-9xl filter drop-shadow-2xl">
        {gift?.icon || '🎁'}
      </div>

      {/* Glowing Banner */}
      <div className="mt-4 px-6 py-2.5 rounded-full bg-black/80 backdrop-blur-xl border border-pink-500/50 shadow-2xl shadow-pink-500/30 flex items-center gap-3 animate-bounce-soft">
        <div className="flex items-center gap-1.5 font-bold text-xs text-white">
          <span className="text-pink-400">@{sender?.username}</span>
          <span className="text-gray-400">sent</span>
          <span className="text-yellow-400 font-extrabold">{gift?.name}</span>
          <span className="text-gray-400">to</span>
          <span className="text-cyan-400">@{receiver?.username}</span>
        </div>
      </div>
    </div>
  );
};

export default GiftAnimationOverlay;
