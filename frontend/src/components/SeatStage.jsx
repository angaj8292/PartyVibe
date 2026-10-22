import React, { useState } from 'react';
import { Mic, MicOff, Lock, Unlock, Crown, Armchair, MoreVertical, LogOut, UserMinus, ShieldAlert } from 'lucide-react';

const SeatStage = ({
  seats = [],
  currentUser,
  isOwner,
  activeSpeakers = [],
  onTakeSeat,
  onLeaveSeat,
  onPerformAction,
  onViewProfile,
}) => {
  const [selectedSeat, setSelectedSeat] = useState(null);

  const handleSeatClick = (seat) => {
    setSelectedSeat(seat);
  };

  const closeMenu = () => setSelectedSeat(null);

  return (
    <div className="relative w-full glass-panel rounded-3xl p-4 my-2 shadow-2xl">
      {/* 8 Seats Grid: 2 rows of 4 seats */}
      <div className="grid grid-cols-4 gap-3 justify-items-center">
        {seats.map((seat) => {
          const isOccupied = !!seat.user;
          const isCurrentUserSeat = currentUser && seat.user && seat.user.id === currentUser.id;
          const isHostSeat = seat.seatNo === 1;
          const isSpeaking = isOccupied && activeSpeakers.includes(`user-${seat.user.id}`);

          return (
            <div
              key={seat.seatNo}
              onClick={() => handleSeatClick(seat)}
              className="flex flex-col items-center cursor-pointer group select-none transition-transform active:scale-95"
            >
              {/* Avatar / Seat Icon Container */}
              <div className="relative">
                {/* Speaking Animated Pulse Ring */}
                {isSpeaking && (
                  <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-vibe-accent via-vibe-cyan to-green-400 opacity-90 animate-ping" />
                )}

                {/* Main Circle */}
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center relative transition-all duration-300 ${
                    isSpeaking
                      ? 'ring-4 ring-vibe-cyan shadow-lg shadow-cyan-500/40'
                      : isCurrentUserSeat
                      ? 'ring-2 ring-vibe-accent'
                      : seat.locked
                      ? 'bg-red-950/40 border border-red-500/40'
                      : isOccupied
                      ? 'ring-1 ring-white/20'
                      : 'bg-white/5 border border-dashed border-white/20 hover:border-white/40'
                  }`}
                >
                  {isOccupied ? (
                    <img
                      src={seat.user.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + seat.user.username}
                      alt={seat.user.username}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : seat.locked ? (
                    <Lock className="w-5 h-5 text-red-400" />
                  ) : (
                    <Armchair className="w-6 h-6 text-gray-500 group-hover:text-gray-300 transition-colors" />
                  )}

                  {/* Seat Number Tag */}
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-vibe-bg border border-white/20 text-[9px] font-bold text-gray-300 flex items-center justify-center">
                    {seat.seatNo}
                  </span>

                  {/* Host Crown */}
                  {isHostSeat && (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-500 text-black p-0.5 rounded-full shadow-md animate-bounce-soft">
                      <Crown className="w-3 h-3 fill-black" />
                    </div>
                  )}

                  {/* Mic Muted Badge */}
                  {isOccupied && seat.muted && (
                    <div className="absolute -top-1 -right-1 bg-red-600 text-white p-0.5 rounded-full shadow-md">
                      <MicOff className="w-2.5 h-2.5" />
                    </div>
                  )}
                </div>
              </div>

              {/* Name Label */}
              <div className="mt-1 text-center max-w-[70px]">
                {isOccupied ? (
                  <span className="text-[11px] font-semibold text-gray-200 truncate block">
                    {seat.user.username}
                  </span>
                ) : (
                  <span className="text-[10px] text-gray-500 font-medium">
                    {seat.locked ? 'Locked' : `Seat ${seat.seatNo}`}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Seat Click Context Menu Popup */}
      {selectedSeat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-vibe-card border border-white/10 rounded-2xl p-4 w-72 shadow-2xl space-y-2">
            <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
              <span className="text-xs font-bold text-gray-300">
                Seat {selectedSeat.seatNo} {selectedSeat.user ? `· @${selectedSeat.user.username}` : ''}
              </span>
              <button onClick={closeMenu} className="text-gray-400 hover:text-white text-xs">
                ✕
              </button>
            </div>

            {/* If empty & not locked: Take Seat */}
            {!selectedSeat.user && !selectedSeat.locked && (
              <button
                onClick={() => {
                  onTakeSeat(selectedSeat.seatNo);
                  closeMenu();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-vibe-accent to-purple-600 text-white font-bold text-xs shadow-md"
              >
                <Armchair className="w-4 h-4" /> Take Seat {selectedSeat.seatNo}
              </button>
            )}

            {/* If occupied by current user: Leave Seat */}
            {selectedSeat.user && currentUser && selectedSeat.user.id === currentUser.id && (
              <button
                onClick={() => {
                  onLeaveSeat();
                  closeMenu();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-red-600/80 hover:bg-red-600 text-white font-bold text-xs"
              >
                <LogOut className="w-4 h-4" /> Leave Seat
              </button>
            )}

            {/* If occupied by someone else: View Profile */}
            {selectedSeat.user && (!currentUser || selectedSeat.user.id !== currentUser.id) && (
              <button
                onClick={() => {
                  onViewProfile(selectedSeat.user);
                  closeMenu();
                }}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 text-xs font-semibold"
              >
                View Profile
              </button>
            )}

            {/* Room Owner Host Controls */}
            {isOwner && (
              <div className="border-t border-white/10 pt-2 space-y-1.5">
                <div className="text-[10px] uppercase tracking-wider text-amber-400 font-extrabold px-1">
                  Host Controls
                </div>

                {/* Lock / Unlock */}
                <button
                  onClick={() => {
                    onPerformAction(selectedSeat.seatNo, selectedSeat.locked ? 'UNLOCK' : 'LOCK');
                    closeMenu();
                  }}
                  className="w-full flex items-center gap-2 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-200"
                >
                  {selectedSeat.locked ? (
                    <>
                      <Unlock className="w-3.5 h-3.5 text-emerald-400" /> Unlock Seat
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5 text-amber-400" /> Lock Seat
                    </>
                  )}
                </button>

                {/* Mute / Unmute Seat */}
                <button
                  onClick={() => {
                    onPerformAction(selectedSeat.seatNo, selectedSeat.muted ? 'UNMUTE' : 'MUTE');
                    closeMenu();
                  }}
                  className="w-full flex items-center gap-2 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-200"
                >
                  {selectedSeat.muted ? (
                    <>
                      <Mic className="w-3.5 h-3.5 text-emerald-400" /> Unmute Seat
                    </>
                  ) : (
                    <>
                      <MicOff className="w-3.5 h-3.5 text-red-400" /> Mute Seat
                    </>
                  )}
                </button>

                {/* Kick Occupant (if occupied and not host) */}
                {selectedSeat.user && selectedSeat.user.id !== currentUser?.id && (
                  <button
                    onClick={() => {
                      onPerformAction(selectedSeat.seatNo, 'KICK');
                      closeMenu();
                    }}
                    className="w-full flex items-center gap-2 py-2 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold"
                  >
                    <UserMinus className="w-3.5 h-3.5" /> Kick off Seat
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SeatStage;
