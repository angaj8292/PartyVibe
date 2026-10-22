import websocketService from './websocket';

// Public STUN servers for WebRTC NAT traversal
const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
  iceCandidatePoolSize: 10,
};

class WebRtcVoiceService {
  constructor() {
    this.roomId = null;
    this.currentUser = null;
    this.isSeated = false;
    this.isMuted = false;
    this.localStream = null;
    this.peerConnections = new Map(); // targetUserId -> RTCPeerConnection
    this.audioElements = new Map(); // userId -> HTMLAudioElement
    this.pendingCandidates = new Map(); // targetUserId -> RTCIceCandidate[]
    this.audioContext = null;
    this.analysers = new Map(); // userId -> AnalyserNode
    this.speakerCheckTimer = null;
    this.onActiveSpeakersChange = null;
    this.onStatusChange = null;
    this.onAudioBlocked = null;
    this.audioBlocked = false;
  }

  // Initialize and join room voice mesh
  async joinRoom({ roomId, currentUser, isSeated = false, onActiveSpeakers, onStatusChange, onAudioBlocked }) {
    this.leaveRoom();

    this.roomId = roomId;
    this.currentUser = currentUser;
    this.isSeated = isSeated;
    this.onActiveSpeakersChange = onActiveSpeakers;
    this.onStatusChange = onStatusChange;
    this.onAudioBlocked = onAudioBlocked;

    console.log('[WebRTC Voice] Joining room:', roomId, 'as user:', currentUser?.username, 'isSeated:', isSeated);

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
        if (this.audioContext.state === 'suspended') {
          this.audioBlocked = true;
          if (this.onAudioBlocked) this.onAudioBlocked(true);
        }
      }
    } catch (e) {
      console.warn('[WebRTC Voice] AudioContext init error:', e);
    }

    this.startSpeakerMonitor();

    // If already seated, start microphone immediately
    if (isSeated) {
      await this.startMicrophone();
    }

    // Broadcast USER_ENTERED so all active speakers will stream their audio to this user
    this.sendSignal({
      action: 'USER_ENTERED',
      isSpeaker: this.isSeated,
    });

    if (this.onStatusChange) this.onStatusChange('connected');
  }

  // User gesture to unlock/unmute browser audio context
  unlockAudio() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume().then(() => {
        console.log('[WebRTC Voice] AudioContext resumed successfully');
        this.audioBlocked = false;
        if (this.onAudioBlocked) this.onAudioBlocked(false);
      }).catch(err => console.warn('Could not resume audio:', err));
    } else {
      this.audioBlocked = false;
      if (this.onAudioBlocked) this.onAudioBlocked(false);
    }

    this.audioElements.forEach((el) => {
      el.play().catch(() => {});
    });
  }

  // Capture user microphone when taking a seat or unmuting
  async startMicrophone() {
    if (this.localStream) {
      this.setMicrophoneEnabled(true);
      return true;
    }

    try {
      console.log('[WebRTC Voice] Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      this.localStream = stream;
      this.isMuted = false;
      this.isSeated = true;

      // Monitor local volume for speaking wave
      if (this.audioContext && this.currentUser?.id) {
        this.attachAnalyser(this.currentUser.id, stream);
      }

      console.log('[WebRTC Voice] Microphone captured successfully');

      // For every existing peer connection, add our local track
      this.peerConnections.forEach((pc, targetId) => {
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });
        this.createOfferToPeer(targetId);
      });

      // Broadcast to room that we are ready to speak
      this.sendSignal({
        action: 'SPEAKER_READY',
        isSpeaker: true,
      });

      return true;
    } catch (err) {
      console.warn('[WebRTC Voice] Could not access microphone:', err.message);
      return false;
    }
  }

  stopMicrophone() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
    if (this.currentUser?.id) {
      this.analysers.delete(this.currentUser.id);
    }
    this.isMuted = true;
    this.isSeated = false;

    this.sendSignal({
      action: 'SPEAKER_STOPPED',
      isSpeaker: false,
    });
  }

  setMicrophoneEnabled(enabled) {
    if (!this.localStream) {
      if (enabled) {
        return this.startMicrophone();
      }
      return false;
    }

    this.localStream.getAudioTracks().forEach((track) => {
      track.enabled = enabled;
    });

    this.isMuted = !enabled;

    this.sendSignal({
      action: 'MUTE_STATUS',
      isMuted: this.isMuted,
    });

    return true;
  }

  toggleMute() {
    return this.setMicrophoneEnabled(this.isMuted);
  }

  // Handle all incoming STOMP voice signals
  async handleSignal(signal) {
    if (!signal || !this.roomId) return;

    const myId = this.currentUser?.id;
    const senderId = signal.senderId;

    // Ignore signals sent by self
    if (senderId && myId && senderId === myId) return;

    // Ignore signals directed to someone else
    if (signal.targetUserId && myId && signal.targetUserId !== myId) return;

    console.log('[WebRTC Voice] Received signal:', signal.action, 'from user:', senderId);

    switch (signal.action) {
      case 'USER_ENTERED': {
        // A new user joined. If we are currently holding a mic, send them our stream!
        if (this.localStream) {
          console.log('[WebRTC Voice] Sending audio offer to newcomer:', senderId);
          await this.createOfferToPeer(senderId);
        }
        break;
      }

      case 'SPEAKER_READY': {
        // Someone took a seat or started speaking
        // If we don't have a peer connection yet, request stream
        if (!this.peerConnections.has(senderId)) {
          this.sendSignal({
            action: 'REQUEST_STREAM',
            targetUserId: senderId,
          });
        }
        break;
      }

      case 'REQUEST_STREAM': {
        // Another peer is asking for our audio stream
        if (this.localStream) {
          await this.createOfferToPeer(senderId);
        }
        break;
      }

      case 'OFFER': {
        if (signal.sdp) {
          await this.handleRemoteOffer(senderId, signal.sdp);
        }
        break;
      }

      case 'ANSWER': {
        if (signal.sdp) {
          await this.handleRemoteAnswer(senderId, signal.sdp);
        }
        break;
      }

      case 'ICE_CANDIDATE': {
        if (signal.candidate) {
          await this.handleRemoteCandidate(senderId, signal.candidate);
        }
        break;
      }

      case 'MUTE_STATUS': {
        // Peer muted or unmuted
        break;
      }

      case 'LEAVE':
      case 'SPEAKER_STOPPED': {
        this.closePeer(senderId);
        break;
      }

      default:
        break;
    }
  }

  // Create an RTCPeerConnection for a given peer
  getOrCreatePeer(targetUserId) {
    if (this.peerConnections.has(targetUserId)) {
      return this.peerConnections.get(targetUserId);
    }

    const pc = new RTCPeerConnection(RTC_CONFIG);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal({
          action: 'ICE_CANDIDATE',
          targetUserId,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      console.log('[WebRTC Voice] Got remote audio track from user:', targetUserId);
      const remoteStream = event.streams[0] || new MediaStream([event.track]);
      this.attachRemoteAudio(targetUserId, remoteStream);
    };

    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC Voice] Peer ${targetUserId} state:`, pc.connectionState);
      if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
        this.closePeer(targetUserId);
      }
    };

    // Add local tracks if we have any
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream);
      });
    }

    this.peerConnections.set(targetUserId, pc);
    return pc;
  }

  // Offerer side: create offer and send to peer
  async createOfferToPeer(targetUserId) {
    try {
      const pc = this.getOrCreatePeer(targetUserId);
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false,
      });
      await pc.setLocalDescription(offer);

      this.sendSignal({
        action: 'OFFER',
        targetUserId,
        sdp: offer,
      });
    } catch (err) {
      console.warn('[WebRTC Voice] Error creating offer to peer:', targetUserId, err);
    }
  }

  // Receiver side: accept offer, create answer and send back
  async handleRemoteOffer(senderId, remoteSdp) {
    try {
      const pc = this.getOrCreatePeer(senderId);
      await pc.setRemoteDescription(new RTCSessionDescription(remoteSdp));

      // Flush any queued ICE candidates
      if (this.pendingCandidates.has(senderId)) {
        const queued = this.pendingCandidates.get(senderId);
        for (const c of queued) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(c));
          } catch (e) {}
        }
        this.pendingCandidates.delete(senderId);
      }

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      this.sendSignal({
        action: 'ANSWER',
        targetUserId: senderId,
        sdp: answer,
      });
    } catch (err) {
      console.warn('[WebRTC Voice] Error handling offer from peer:', senderId, err);
    }
  }

  // Offerer side: handle answer from peer
  async handleRemoteAnswer(senderId, remoteSdp) {
    try {
      const pc = this.peerConnections.get(senderId);
      if (pc && pc.signalingState !== 'closed') {
        await pc.setRemoteDescription(new RTCSessionDescription(remoteSdp));

        // Flush any queued ICE candidates
        if (this.pendingCandidates.has(senderId)) {
          const queued = this.pendingCandidates.get(senderId);
          for (const c of queued) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(c));
            } catch (e) {}
          }
          this.pendingCandidates.delete(senderId);
        }
      }
    } catch (err) {
      console.warn('[WebRTC Voice] Error handling answer from peer:', senderId, err);
    }
  }

  // Handle incoming ICE candidate
  async handleRemoteCandidate(senderId, candidateData) {
    try {
      const pc = this.peerConnections.get(senderId);
      if (pc && pc.remoteDescription && pc.remoteDescription.type) {
        await pc.addIceCandidate(new RTCIceCandidate(candidateData));
      } else {
        if (!this.pendingCandidates.has(senderId)) {
          this.pendingCandidates.set(senderId, []);
        }
        this.pendingCandidates.get(senderId).push(candidateData);
      }
    } catch (err) {
      console.warn('[WebRTC Voice] Error adding ICE candidate:', err);
    }
  }

  // Attach remote stream to an audio element in DOM and play it
  attachRemoteAudio(userId, stream) {
    let audio = document.getElementById(`webrtc-voice-${userId}`);
    if (!audio) {
      audio = document.createElement('audio');
      audio.id = `webrtc-voice-${userId}`;
      audio.autoplay = true;
      audio.playsInline = true;
      audio.style.display = 'none';
      document.body.appendChild(audio);
    }

    audio.srcObject = stream;
    audio.play().then(() => {
      console.log('[WebRTC Voice] Playing remote audio for user:', userId);
      this.audioBlocked = false;
      if (this.onAudioBlocked) this.onAudioBlocked(false);
    }).catch((err) => {
      console.warn('[WebRTC Voice] Audio autoplay blocked by browser policy:', err);
      this.audioBlocked = true;
      if (this.onAudioBlocked) this.onAudioBlocked(true);
    });

    this.audioElements.set(userId, audio);

    // Attach to WebAudio analyser to detect active speech
    if (this.audioContext) {
      this.attachAnalyser(userId, stream);
    }
  }

  attachAnalyser(userId, stream) {
    if (!this.audioContext) return;
    try {
      const source = this.audioContext.createMediaStreamSource(stream);
      const analyser = this.audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;
      source.connect(analyser);
      this.analysers.set(userId, analyser);
    } catch (e) {
      console.warn('[WebRTC Voice] Could not create analyser for user:', userId, e);
    }
  }

  // Periodic loop checking audio frequency levels to highlight speaking avatars
  startSpeakerMonitor() {
    if (this.speakerCheckTimer) clearInterval(this.speakerCheckTimer);

    this.speakerCheckTimer = setInterval(() => {
      if (this.analysers.size === 0) return;

      const activeUserIds = [];
      const dataArray = new Uint8Array(128);

      this.analysers.forEach((analyser, userId) => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        // Threshold for human speech activity
        if (average > 15) {
          activeUserIds.push(userId);
        }
      });

      if (this.onActiveSpeakersChange) {
        this.onActiveSpeakersChange(activeUserIds);
      }
    }, 150);
  }

  // Send signaling message via STOMP to /app/room/{roomId}/voice-signal
  sendSignal(payload) {
    if (!this.roomId) return;
    try {
      websocketService.send(`/app/room/${this.roomId}/voice-signal`, payload);
    } catch (err) {
      console.warn('[WebRTC Voice] Failed to send STOMP signal:', err);
    }
  }

  closePeer(userId) {
    const pc = this.peerConnections.get(userId);
    if (pc) {
      try {
        pc.close();
      } catch (e) {}
      this.peerConnections.delete(userId);
    }

    const audio = this.audioElements.get(userId);
    if (audio) {
      try {
        audio.pause();
        audio.srcObject = null;
        if (audio.parentNode) audio.parentNode.removeChild(audio);
      } catch (e) {}
      this.audioElements.delete(userId);
    }

    this.analysers.delete(userId);
    this.pendingCandidates.delete(userId);
  }

  leaveRoom() {
    console.log('[WebRTC Voice] Leaving voice mesh for room:', this.roomId);

    if (this.roomId) {
      this.sendSignal({ action: 'LEAVE' });
    }

    if (this.speakerCheckTimer) {
      clearInterval(this.speakerCheckTimer);
      this.speakerCheckTimer = null;
    }

    this.peerConnections.forEach((pc) => {
      try {
        pc.close();
      } catch (e) {}
    });
    this.peerConnections.clear();

    this.audioElements.forEach((el) => {
      try {
        el.pause();
        el.srcObject = null;
        if (el.parentNode) el.parentNode.removeChild(el);
      } catch (e) {}
    });
    this.audioElements.clear();

    if (this.localStream) {
      try {
        this.localStream.getTracks().forEach((track) => track.stop());
      } catch (e) {}
      this.localStream = null;
    }

    this.analysers.clear();
    this.pendingCandidates.clear();

    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch (e) {}
      this.audioContext = null;
    }

    this.roomId = null;
    this.isSeated = false;
    this.isMuted = false;
    this.audioBlocked = false;

    if (this.onStatusChange) this.onStatusChange('disconnected');
  }
}

export const webrtcVoiceService = new WebRtcVoiceService();
export default webrtcVoiceService;
