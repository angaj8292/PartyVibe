import { Room, RoomEvent, Track } from 'livekit-client';

class LiveKitVoiceService {
  constructor() {
    this.room = null;
    this.audioElements = new Map();
    this.onActiveSpeakersChange = null;
    this.onConnectionStatusChange = null;
    this.isMuted = false;
    this.canPublish = false;
  }

  async connect({ url, token, canPublish, onActiveSpeakers, onStatusChange }) {
    this.disconnect();

    this.onActiveSpeakersChange = onActiveSpeakers;
    this.onConnectionStatusChange = onStatusChange;
    this.canPublish = canPublish;

    console.log('[LiveKit] Connecting to:', url, 'with canPublish:', canPublish);

    this.room = new Room({
      adaptiveStream: true,
      dynacast: true,
      audioCaptureDefaults: {
        autoGainControl: true,
        echoCancellation: true,
        noiseSuppression: true,
      }
    });

    // Handle Active Speakers
    this.room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
      const activeIdentities = speakers.map(s => s.identity);
      if (this.onActiveSpeakersChange) {
        this.onActiveSpeakersChange(activeIdentities);
      }
    });

    // Handle Remote Track Subscribed
    this.room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
      if (track.kind === Track.Kind.Audio) {
        console.log('[LiveKit] Subscribed to remote audio from:', participant.identity);
        const audioElement = track.attach();
        audioElement.autoplay = true;
        this.audioElements.set(participant.identity, audioElement);
      }
    });

    // Handle Remote Track Unsubscribed
    this.room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
      if (track.kind === Track.Kind.Audio) {
        track.detach();
        const el = this.audioElements.get(participant.identity);
        if (el && el.parentNode) {
          el.parentNode.removeChild(el);
        }
        this.audioElements.delete(participant.identity);
      }
    });

    this.room.on(RoomEvent.Disconnected, () => {
      console.log('[LiveKit] Disconnected from room');
      if (this.onConnectionStatusChange) {
        this.onConnectionStatusChange('disconnected');
      }
    });

    try {
      await this.room.connect(url, token);
      console.log('[LiveKit] Successfully connected to room:', this.room.name);
      if (this.onConnectionStatusChange) {
        this.onConnectionStatusChange('connected');
      }

      // If user has publish permission, attempt to enable mic
      if (canPublish) {
        await this.setMicrophoneEnabled(true);
      }
    } catch (err) {
      console.error('[LiveKit] Connection or audio error:', err);
      if (this.onConnectionStatusChange) {
        this.onConnectionStatusChange('error', err.message);
      }
    }
  }

  async setMicrophoneEnabled(enabled) {
    if (!this.room || !this.canPublish) {
      console.warn('[LiveKit] Cannot set mic: Not connected or no publish permission');
      return false;
    }

    try {
      await this.room.localParticipant.setMicrophoneEnabled(enabled);
      this.isMuted = !enabled;
      console.log('[LiveKit] Microphone enabled:', enabled);
      return true;
    } catch (err) {
      console.warn('[LiveKit] Could not access real microphone (e.g. headless/no device/permission denied):', err.message);
      this.isMuted = !enabled;
      return false;
    }
  }

  toggleMute() {
    return this.setMicrophoneEnabled(this.isMuted);
  }

  disconnect() {
    if (this.room) {
      try {
        this.audioElements.forEach((el) => {
          if (el.parentNode) el.parentNode.removeChild(el);
        });
        this.audioElements.clear();
        this.room.disconnect();
      } catch (e) {
        // ignore
      }
      this.room = null;
    }
    this.canPublish = false;
  }
}

export const livekitService = new LiveKitVoiceService();
export default livekitService;
