import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import wsService from '../services/websocket';
import livekitService from '../services/livekit';
import { useAuth } from '../context/AuthContext';
import SeatStage from '../components/SeatStage';
import RoomChat from '../components/RoomChat';
import RoomMusicPlayer from '../components/RoomMusicPlayer';
import GiftModal from '../components/GiftModal';
import GiftAnimationOverlay from '../components/GiftAnimationOverlay';
import UserProfileModal from '../components/UserProfileModal';
import ReportModal from '../components/ReportModal';
import {
  ArrowLeft,
  Headphones,
  Mic,
  MicOff,
  Gift,
  Share2,
  ShieldAlert,
  MoreVertical,
  Volume2,
  Users,
  Lock,
} from 'lucide-react';

const RoomPage = ({ onOpenTopUp }) => {
  const { id: roomId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, refreshUser } = useAuth();

  const [roomDetails, setRoomDetails] = useState(null);
  const [seats, setSeats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [viewerCount, setViewerCount] = useState(1);
  const [activeSpeakers, setActiveSpeakers] = useState([]);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [livekitConnected, setLivekitConnected] = useState(false);
  const [socketMusicEvent, setSocketMusicEvent] = useState(null);

  // Modals
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [giftTargetUser, setGiftTargetUser] = useState(null);
  const [activeGiftEvent, setActiveGiftEvent] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [reportTarget, setReportTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 1. Initial Join and Load Room Data
  useEffect(() => {
    let stompSub = null;

    const initRoom = async () => {
      try {
        setLoading(true);
        // Call join room endpoint
        const joinRes = await api.post(`/rooms/${roomId}/join`);
        setRoomDetails(joinRes.data);
        setSeats(joinRes.data.seats || []);
        setViewerCount(joinRes.data.viewerCount || 1);

        // Fetch recent chat messages
        const msgRes = await api.get(`/rooms/${roomId}/messages`);
        setMessages(msgRes.data || []);

        // Connect STOMP WebSocket
        wsService.connect(() => {
          stompSub = wsService.subscribe(`/topic/room.${roomId}`, handleSocketEvent);
        });

        // Initialize LiveKit voice connection
        await connectVoice(roomId);
      } catch (err) {
        console.error('Failed to join room:', err);
        setError(err.response?.data?.message || 'Could not join room');
      } finally {
        setLoading(false);
      }
    };

    initRoom();

    return () => {
      // Cleanup on unmount / exit room
      if (stompSub) stompSub.unsubscribe();
      livekitService.disconnect();
      api.post(`/rooms/${roomId}/leave`).catch(() => {});
    };
  }, [roomId]);

  // Connect or Re-connect Voice with LiveKit
  const connectVoice = async (rId) => {
    try {
      const res = await api.get(`/rooms/${rId}/livekit-token`);
      const { token, livekitUrl, canPublish } = res.data;

      await livekitService.connect({
        url: livekitUrl,
        token,
        canPublish,
        onActiveSpeakers: (speakers) => {
          setActiveSpeakers(speakers);
        },
        onStatusChange: (status) => {
          setLivekitConnected(status === 'connected');
        },
      });
    } catch (err) {
      console.warn('Voice connection warning:', err.message);
    }
  };

  // Handle Incoming WebSocket STOMP Events from /topic/room.{roomId}
  const handleSocketEvent = (event) => {
    console.log('[Room Event]', event.eventType, event.payload);

    switch (event.eventType) {
      case 'SEATS_UPDATED': {
        const updatedSeats = event.payload;
        setSeats(updatedSeats);

        // Check if current user's seat status changed -> refresh LiveKit token
        if (currentUser) {
          const wasSeated = seats.some((s) => s.user?.id === currentUser.id);
          const isNowSeated = updatedSeats.some((s) => s.user?.id === currentUser.id);
          if (wasSeated !== isNowSeated) {
            connectVoice(roomId);
          }
        }
        break;
      }

      case 'MUSIC_UPDATED': {
        setSocketMusicEvent(event.payload);
        break;
      }

      case 'CHAT_MESSAGE': {
        setMessages((prev) => [...prev, event.payload]);
        break;
      }

      case 'GIFT_SENT': {
        const giftEvent = event.payload;
        setActiveGiftEvent(giftEvent);
        // Refresh currentUser profile to update balance & VIP
        refreshUser();
        break;
      }

      case 'VIEWER_COUNT': {
        setViewerCount(event.payload);
        break;
      }

      case 'USER_JOINED': {
        setMessages((prev) => [
          ...prev,
          {
            type: 'SYSTEM',
            content: `👋 @${event.payload.username} entered the room`,
          },
        ]);
        break;
      }

      case 'USER_LEFT': {
        setMessages((prev) => [
          ...prev,
          {
            type: 'SYSTEM',
            content: `🚪 @${event.payload.username} left`,
          },
        ]);
        break;
      }

      default:
        break;
    }
  };

  // Seat Action Handlers
  const handleTakeSeat = async (seatNo) => {
    try {
      const res = await api.post(`/rooms/${roomId}/seats`, {
        seatNo,
        action: 'TAKE',
      });
      setSeats(res.data);
      // Reconnect LiveKit with publish permission
      await connectVoice(roomId);
    } catch (err) {
      alert(err.response?.data?.message || 'Could not take seat');
    }
  };

  const handleLeaveSeat = async () => {
    try {
      const userSeat = seats.find((s) => s.user?.id === currentUser?.id);
      if (!userSeat) return;

      const res = await api.post(`/rooms/${roomId}/seats`, {
        seatNo: userSeat.seatNo,
        action: 'LEAVE',
      });
      setSeats(res.data);
      await connectVoice(roomId);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to leave seat');
    }
  };

  const handlePerformSeatAction = async (seatNo, action) => {
    try {
      const res = await api.post(`/rooms/${roomId}/seats`, {
        seatNo,
        action,
      });
      setSeats(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Seat action failed');
    }
  };

  // Toggle Mic (for seated users)
  const handleToggleMic = async () => {
    const success = livekitService.toggleMute();
    setIsMicMuted(!isMicMuted);
  };

  // Send Chat Message
  const handleSendMessage = async (content) => {
    try {
      await api.post(`/rooms/${roomId}/messages`, { content });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send message');
    }
  };

  const isUserSeated = currentUser && seats.some((s) => s.user?.id === currentUser.id);
  const isOwner = currentUser && roomDetails?.room?.owner?.id === currentUser.id;

  // Potential gift receivers: Host + all seated users (excluding self)
  const potentialReceivers = [];
  if (roomDetails?.room?.owner && (!currentUser || roomDetails.room.owner.id !== currentUser.id)) {
    potentialReceivers.push(roomDetails.room.owner);
  }
  seats.forEach((s) => {
    if (s.user && (!currentUser || s.user.id !== currentUser.id)) {
      if (!potentialReceivers.some((p) => p.id === s.user.id)) {
        potentialReceivers.push(s.user);
      }
    }
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <div className="w-12 h-12 rounded-full border-4 border-vibe-accent border-t-transparent animate-spin mb-4" />
        <h2 className="text-sm font-bold text-gray-300">Entering Party Room...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center max-w-sm mx-auto">
        <div className="w-14 h-14 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mb-3">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-base font-bold text-white mb-2">{error}</h2>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-6 py-2 rounded-full bg-vibe-accent text-white font-bold text-xs"
        >
          Back to Explore
        </button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen max-w-md mx-auto flex flex-col bg-vibe-bg pb-6 select-none overflow-x-hidden">
      {/* Gift Full-Screen Animation Overlay */}
      <GiftAnimationOverlay
        activeGiftEvent={activeGiftEvent}
        onAnimationEnd={() => setActiveGiftEvent(null)}
      />

      {/* Top Header */}
      <div className="glass-nav px-4 py-3 sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={() => navigate('/')}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <h2 className="text-xs font-black text-white truncate max-w-[170px]">
              {roomDetails?.room?.title}
            </h2>
            <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping" />
              <span>LIVE</span>
              <span>• Host: @{roomDetails?.room?.owner?.username}</span>
            </div>
          </div>
        </div>

        {/* Right Header Badges */}
        <div className="flex items-center gap-2">
          {/* Listener Count */}
          <div className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-full text-xs font-bold text-gray-200">
            <Headphones className="w-3.5 h-3.5 text-vibe-cyan" />
            <span>{viewerCount}</span>
          </div>

          {/* Report Button */}
          <button
            onClick={() => setReportTarget({ reportedRoomId: roomDetails?.room?.id })}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-amber-400"
            title="Report Room"
          >
            <ShieldAlert className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stage: 8 Seats */}
      <div className="px-3 pt-2">
        <SeatStage
          seats={seats}
          currentUser={currentUser}
          isOwner={isOwner}
          activeSpeakers={activeSpeakers}
          onTakeSeat={handleTakeSeat}
          onLeaveSeat={handleLeaveSeat}
          onPerformAction={handlePerformSeatAction}
          onViewProfile={(u) => setSelectedUser(u)}
        />
      </div>

      {/* Room Background Music Player */}
      <div className="px-3">
        <RoomMusicPlayer
          roomId={roomId}
          initialMusicState={roomDetails?.musicState}
          isHostOrSeated={isOwner || isUserSeated}
          socketMusicEvent={socketMusicEvent}
        />
      </div>

      {/* Live Room Chat */}
      <div className="px-3 flex-1 flex flex-col justify-end">
        <RoomChat
          messages={messages}
          onSendMessage={handleSendMessage}
          onOpenGiftModal={() => setIsGiftModalOpen(true)}
          currentUser={currentUser}
        />
      </div>

      {/* Bottom Floating Control Bar */}
      <div className="px-4 pt-3 flex items-center justify-between gap-3">
        {/* If seated: Mic Toggle */}
        {isUserSeated ? (
          <button
            onClick={handleToggleMic}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl font-bold text-xs shadow-lg transition-all ${
              isMicMuted
                ? 'bg-red-600 text-white'
                : 'bg-emerald-600 text-white shadow-emerald-500/20'
            }`}
          >
            {isMicMuted ? (
              <>
                <MicOff className="w-4 h-4" /> Unmute Mic
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" /> Mute Mic
              </>
            )}
          </button>
        ) : (
          <button
            onClick={() => {
              const emptySeat = seats.find((s) => !s.user && !s.locked);
              if (emptySeat) handleTakeSeat(emptySeat.seatNo);
              else alert('All seats are currently occupied or locked!');
            }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 font-bold text-xs text-gray-200 transition-all"
          >
            <Volume2 className="w-4 h-4 text-vibe-cyan" /> Request to Speak
          </button>
        )}

        {/* Send Gift Button */}
        <button
          onClick={() => setIsGiftModalOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-600 to-amber-500 text-white font-extrabold text-xs shadow-lg shadow-pink-500/25 active:scale-95 transition-all"
        >
          <Gift className="w-4 h-4" /> Send Gift
        </button>
      </div>

      {/* Gift Modal */}
      <GiftModal
        isOpen={isGiftModalOpen}
        onClose={() => setIsGiftModalOpen(false)}
        roomId={roomId}
        potentialReceivers={potentialReceivers}
        currentUser={currentUser}
        onGiftSent={(event) => {
          setActiveGiftEvent(event);
          refreshUser();
        }}
        onOpenTopUp={onOpenTopUp}
      />

      {/* User Profile Modal */}
      {selectedUser && (
        <UserProfileModal
          user={selectedUser}
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          currentUser={currentUser}
          onOpenGiftForUser={(u) => {
            setGiftTargetUser(u);
            setIsGiftModalOpen(true);
          }}
          onOpenReport={(t) => setReportTarget(t)}
        />
      )}

      {/* Report Modal */}
      {reportTarget && (
        <ReportModal
          isOpen={!!reportTarget}
          onClose={() => setReportTarget(null)}
          target={reportTarget}
        />
      )}
    </div>
  );
};

export default RoomPage;
