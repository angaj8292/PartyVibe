import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import {
  Music,
  Play,
  Pause,
  SkipForward,
  Volume2,
  VolumeX,
  ListMusic,
  Disc3,
  X,
  Plus,
  Radio,
  Music2,
  UploadCloud,
  CheckCircle,
  Trash2,
  FileAudio,
} from 'lucide-react';

// Curated high quality royalty-free background party tracks (direct audio samples)
const CURATED_PLAYLIST = [
  {
    id: 'curated-1',
    title: 'Neon Nights Dance Beat',
    category: 'Party / EDM',
    url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=electronic-future-beats-117997.mp3',
    duration: 154,
  },
  {
    id: 'curated-2',
    title: 'Lo-Fi Chill & Coffee Study',
    category: 'Chill',
    url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=lofi-study-112191.mp3',
    duration: 147,
  },
  {
    id: 'curated-3',
    title: 'Acoustic Guitar Sunset Melody',
    category: 'Karaoke / Acoustic',
    url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=acoustic-guitar-loop-f-91bpm-129654.mp3',
    duration: 120,
  },
  {
    id: 'curated-4',
    title: 'Late Night House Groove',
    category: 'Music',
    url: 'https://cdn.pixabay.com/download/audio/2022/10/14/audio_9939f77cb7.mp3?filename=tuesday-glitch-122413.mp3',
    duration: 130,
  },
];

const RoomMusicPlayer = ({
  roomId,
  initialMusicState,
  isHostOrSeated,
  socketMusicEvent,
}) => {
  const [currentTrack, setCurrentTrack] = useState(CURATED_PLAYLIST[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.6);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);
  const [playlistTab, setPlaylistTab] = useState('device'); // 'device', 'curated', 'custom'
  const [deviceSongs, setDeviceSongs] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [audioError, setAudioError] = useState(false);

  const audioRef = useRef(null);
  const fileInputRef = useRef(null);

  // Sync initial music state from room details
  useEffect(() => {
    if (initialMusicState) {
      if (initialMusicState.musicTitle && initialMusicState.musicUrl) {
        // If url is relative like /uploads/..., prefix with backend base URL if needed
        let fullUrl = initialMusicState.musicUrl;
        if (fullUrl.startsWith('/uploads/')) {
          fullUrl = `http://localhost:8080${fullUrl}`;
        }
        setCurrentTrack({
          title: initialMusicState.musicTitle,
          url: fullUrl,
        });
      }
      setIsPlaying(initialMusicState.musicPlaying || false);
    }
  }, [initialMusicState]);

  // Sync real-time updates from WebSocket STOMP
  useEffect(() => {
    if (socketMusicEvent) {
      if (socketMusicEvent.musicTitle && socketMusicEvent.musicUrl) {
        let fullUrl = socketMusicEvent.musicUrl;
        if (fullUrl.startsWith('/uploads/')) {
          fullUrl = `http://localhost:8080${fullUrl}`;
        }
        setCurrentTrack({
          title: socketMusicEvent.musicTitle,
          url: fullUrl,
        });
      }
      setIsPlaying(socketMusicEvent.musicPlaying);

      if (audioRef.current) {
        if (socketMusicEvent.musicPlaying) {
          audioRef.current.play().catch(() => {
            // Autoplay policy fallback
          });
        } else {
          audioRef.current.pause();
        }
      }
    }
  }, [socketMusicEvent]);

  // Handle play / pause toggle
  const togglePlay = async () => {
    if (!isHostOrSeated) {
      alert('Only host or seated members can control room music!');
      return;
    }

    const nextState = !isPlaying;
    setIsPlaying(nextState);

    try {
      await api.post(`/rooms/${roomId}/music`, {
        action: nextState ? 'PLAY' : 'PAUSE',
        musicTitle: currentTrack.title,
        musicUrl: currentTrack.url,
        positionMs: Math.floor(currentTime * 1000),
      });
    } catch (err) {
      console.warn('Could not sync music state with backend:', err.message);
    }

    if (audioRef.current) {
      if (nextState) {
        audioRef.current.play().catch(() => setAudioError(true));
      } else {
        audioRef.current.pause();
      }
    }
  };

  // Change to a new track
  const selectTrack = async (track) => {
    if (!isHostOrSeated) {
      alert('Only host or seated members can change music!');
      return;
    }

    setCurrentTrack(track);
    setIsPlaying(true);
    setIsPlaylistOpen(false);
    setAudioError(false);

    try {
      await api.post(`/rooms/${roomId}/music`, {
        action: 'CHANGE',
        musicTitle: track.title,
        musicUrl: track.url,
        positionMs: 0,
      });
    } catch (err) {
      console.warn('Could not sync music change:', err.message);
    }

    if (audioRef.current) {
      audioRef.current.src = track.url;
      audioRef.current.play().catch(() => setAudioError(true));
    }
  };

  // Handle user picking downloaded audio file(s) from device
  const handleDeviceSongSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (!isHostOrSeated) {
      alert('Room host ya seated speakers hi gaana play kar sakte hain!');
      return;
    }

    const newTracks = [];

    for (const file of files) {
      const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      const localBlobUrl = URL.createObjectURL(file);
      const trackObj = {
        id: `device-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        title: cleanTitle,
        category: 'Device Song',
        file: file,
        url: localBlobUrl,
        sizeMb: (file.size / (1024 * 1024)).toFixed(1),
      };
      newTracks.push(trackObj);
    }

    setDeviceSongs((prev) => [...newTracks, ...prev]);

    // Automatically play the first selected file
    const chosenTrack = newTracks[0];
    setCurrentTrack(chosenTrack);
    setIsPlaying(true);
    setAudioError(false);

    // Play locally right away
    if (audioRef.current) {
      audioRef.current.src = chosenTrack.url;
      audioRef.current.play().catch(() => setAudioError(true));
    }

    // Now upload to backend in background so everyone in the room receives it synchronized!
    try {
      setIsUploading(true);
      setUploadStatus(`Room me sync ho raha hai: ${chosenTrack.title}...`);

      const formData = new FormData();
      formData.append('file', chosenTrack.file);
      formData.append('title', chosenTrack.title);

      const res = await api.post(`/rooms/${roomId}/music/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const serverUrl = `http://localhost:8080${res.data.musicUrl}`;
      chosenTrack.url = serverUrl; // Update to permanent server URL
      setUploadStatus(`✓ "${chosenTrack.title}" live sync ho gaya!`);
      setTimeout(() => setUploadStatus(''), 4000);
    } catch (err) {
      console.warn('Syncing device song with server failed:', err);
      setUploadStatus('Local play ho raha hai (Room sync error)');
      setTimeout(() => setUploadStatus(''), 4000);
    } finally {
      setIsUploading(false);
    }
  };

  const removeDeviceSong = (id, e) => {
    e.stopPropagation();
    setDeviceSongs((prev) => prev.filter((s) => s.id !== id));
  };

  const handleNextTrack = () => {
    const list = deviceSongs.length > 0 ? deviceSongs : CURATED_PLAYLIST;
    const currentIndex = list.findIndex((t) => t.url === currentTrack.url);
    const nextIndex = (currentIndex + 1) % list.length;
    selectTrack(list[nextIndex]);
  };

  const handleAddCustomTrack = (e) => {
    e.preventDefault();
    if (!customUrl.trim()) return;
    const newTrack = {
      title: customTitle.trim() || 'Custom Party Track',
      category: 'Custom Stream',
      url: customUrl.trim(),
    };
    selectTrack(newTrack);
    setCustomUrl('');
    setCustomTitle('');
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
    if (val === 0) setIsMuted(true);
    else setIsMuted(false);
  };

  const toggleMute = () => {
    if (isMuted) {
      if (audioRef.current) audioRef.current.volume = volume || 0.6;
      setIsMuted(false);
    } else {
      if (audioRef.current) audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  return (
    <div className="w-full glass-panel rounded-2xl p-2.5 my-1.5 border border-white/10 shadow-lg relative overflow-hidden">
      {/* Hidden HTML5 Audio Element */}
      <audio
        ref={audioRef}
        src={currentTrack.url}
        onTimeUpdate={() => audioRef.current && setCurrentTime(audioRef.current.currentTime)}
        onLoadedMetadata={() => audioRef.current && setDuration(audioRef.current.duration)}
        onEnded={handleNextTrack}
        onError={() => setAudioError(true)}
      />

      {/* Main Music Control Bar */}
      <div className="flex items-center justify-between gap-2.5">
        {/* Left: Spinning Vinyl & Track Info */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="relative shrink-0">
            <div
              className={`w-9 h-9 rounded-full bg-gradient-to-tr from-pink-500 via-purple-600 to-cyan-400 p-0.5 flex items-center justify-center shadow-md ${
                isPlaying ? 'animate-spin-slow' : ''
              }`}
            >
              <div className="w-full h-full bg-black rounded-full flex items-center justify-center">
                <Disc3 className="w-5 h-5 text-pink-400" />
              </div>
            </div>
            {/* Pulsing indicator when playing */}
            {isPlaying && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border border-black animate-pulse" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-pink-400 flex items-center gap-1">
                <Music className="w-3 h-3" /> Party Vibes DJ
              </span>
              {isPlaying && (
                <div className="flex items-end gap-0.5 h-2.5">
                  <span className="w-0.5 h-full bg-cyan-400 rounded-full animate-bounce-soft" />
                  <span className="w-0.5 h-2/3 bg-pink-400 rounded-full animate-pulse" />
                  <span className="w-0.5 h-4/5 bg-yellow-400 rounded-full animate-bounce-soft" />
                </div>
              )}
            </div>
            <p className="text-xs font-bold text-white truncate" title={currentTrack.title}>
              {currentTrack.title}
            </p>
            {uploadStatus && (
              <p className="text-[10px] text-cyan-300 font-semibold animate-pulse truncate">
                {uploadStatus}
              </p>
            )}
          </div>
        </div>

        {/* Center/Right: Play / Pause / Skip / Playlist */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={togglePlay}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              isPlaying
                ? 'bg-pink-500 text-white shadow-md shadow-pink-500/30'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
            title={isPlaying ? 'Pause Music' : 'Play Music'}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
          </button>

          {isHostOrSeated && (
            <button
              onClick={handleNextTrack}
              className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              title="Next Track"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          )}

          {/* Volume Control */}
          <button
            onClick={toggleMute}
            className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          {/* Playlist & Device Music Button */}
          <button
            onClick={() => setIsPlaylistOpen(!isPlaylistOpen)}
            className={`p-1.5 rounded-full transition-colors flex items-center gap-1 ${
              isPlaylistOpen
                ? 'bg-pink-500 text-white shadow-md'
                : 'bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white'
            }`}
            title="Music Playlist & Device Songs"
          >
            <ListMusic className="w-4 h-4" />
            {deviceSongs.length > 0 && (
              <span className="text-[9px] bg-cyan-500 text-black font-extrabold px-1 rounded-full">
                {deviceSongs.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Playlist Drawer Modal */}
      {isPlaylistOpen && (
        <div className="mt-3 pt-3 border-t border-white/10 animate-fade-in space-y-2.5">
          {/* Header & Tabs */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-300 flex items-center gap-1.5">
              <Music2 className="w-3.5 h-3.5 text-pink-400" /> Room Music Library
            </span>
            <button
              onClick={() => setIsPlaylistOpen(false)}
              className="text-gray-400 hover:text-white text-xs p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Tabs: Device Songs vs Curated vs Custom */}
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5 text-[11px] font-bold">
            <button
              onClick={() => setPlaylistTab('device')}
              className={`flex-1 py-1 px-2 rounded-lg transition-all flex items-center justify-center gap-1 ${
                playlistTab === 'device'
                  ? 'bg-pink-500 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <FileAudio className="w-3 h-3" />
              <span>Device Songs ({deviceSongs.length})</span>
            </button>
            <button
              onClick={() => setPlaylistTab('curated')}
              className={`flex-1 py-1 px-2 rounded-lg transition-all flex items-center justify-center gap-1 ${
                playlistTab === 'curated'
                  ? 'bg-pink-500 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Radio className="w-3 h-3" />
              <span>Party Vibes</span>
            </button>
            <button
              onClick={() => setPlaylistTab('custom')}
              className={`py-1 px-2 rounded-lg transition-all ${
                playlistTab === 'custom'
                  ? 'bg-pink-500 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              URL
            </button>
          </div>

          {/* TAB 1: DEVICE SONGS (Local Downloaded Songs) */}
          {playlistTab === 'device' && (
            <div className="space-y-2">
              {/* Pick from Device Button */}
              {isHostOrSeated ? (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    multiple
                    onChange={handleDeviceSongSelect}
                    className="hidden"
                    id="device-audio-file-input"
                  />
                  <label
                    htmlFor="device-audio-file-input"
                    className="w-full flex items-center justify-center gap-2 p-2.5 bg-gradient-to-r from-pink-600/30 to-purple-600/30 hover:from-pink-600/50 hover:to-purple-600/50 border border-pink-500/40 rounded-xl cursor-pointer transition-all active:scale-[0.99] group shadow-md"
                  >
                    <UploadCloud className="w-4 h-4 text-pink-400 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold text-white">
                      + Device Se Downloaded Song Add / Play Karein
                    </span>
                  </label>
                  <p className="text-[10px] text-gray-400 text-center mt-1">
                    Phone/PC se MP3, WAV, M4A song chunein. Instant play hoga aur room me sync hoga.
                  </p>
                </div>
              ) : (
                <div className="p-2 text-center text-xs text-gray-400 bg-black/20 rounded-xl">
                  Host ya Speaker seat par baithkar aap apna downloaded song play kar sakte hain.
                </div>
              )}

              {/* List of Device Songs */}
              <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
                {deviceSongs.length === 0 ? (
                  <div className="py-6 text-center text-gray-400 text-xs">
                    Koi device song add nahi kiya gaya hai.
                    <br />
                    Upar wale button se apna pasandida gaana chunein!
                  </div>
                ) : (
                  deviceSongs.map((track) => {
                    const isSelected = currentTrack.url === track.url || currentTrack.title === track.title;
                    return (
                      <div
                        key={track.id}
                        onClick={() => selectTrack(track)}
                        className={`w-full flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-pink-500/20 border border-pink-500/40 text-white'
                            : 'bg-vibe-bg/60 border border-white/5 text-gray-300 hover:bg-white/5'
                        }`}
                      >
                        <div className="min-w-0 flex-1 flex items-center gap-2">
                          <FileAudio className="w-4 h-4 text-pink-400 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold truncate">{track.title}</p>
                            <span className="text-[9px] text-gray-400">{track.sizeMb} MB • Device Audio</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 ml-2">
                          {isSelected && isPlaying && (
                            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                          )}
                          <button
                            onClick={(e) => removeDeviceSong(track.id, e)}
                            className="p-1 hover:text-red-400 text-gray-500 rounded transition-colors"
                            title="Remove song"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 2: CURATED TRACKS */}
          {playlistTab === 'curated' && (
            <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
              {CURATED_PLAYLIST.map((track) => {
                const isSelected = currentTrack.url === track.url;
                return (
                  <button
                    key={track.id}
                    onClick={() => selectTrack(track)}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all ${
                      isSelected
                        ? 'bg-pink-500/20 border border-pink-500/40 text-white'
                        : 'bg-vibe-bg/60 border border-white/5 text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold truncate flex items-center gap-1.5">
                        <span>{track.title}</span>
                        {isSelected && isPlaying && (
                          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400">{track.category}</span>
                    </div>
                    <span className="text-[10px] text-gray-500 ml-2">
                      {Math.floor(track.duration / 60)}:
                      {String(track.duration % 60).padStart(2, '0')}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* TAB 3: CUSTOM URL */}
          {playlistTab === 'custom' && (
            <div>
              {isHostOrSeated ? (
                <form onSubmit={handleAddCustomTrack} className="space-y-1.5">
                  <div className="text-[10px] font-semibold text-gray-400">Play Online Audio Stream / MP3 URL:</div>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="Song Title (optional)"
                    className="w-full bg-vibe-bg border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                  <div className="flex items-center gap-1.5">
                    <input
                      type="url"
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      placeholder="https://example.com/audio.mp3"
                      className="flex-1 bg-vibe-bg border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-lg bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold shrink-0"
                    >
                      Play
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-2 text-center text-xs text-gray-400 bg-black/20 rounded-xl">
                  Host ya speaker hi custom URL play kar sakte hain.
                </div>
              )}
            </div>
          )}

          {/* Volume slider */}
          <div className="flex items-center gap-2 pt-1 text-xs text-gray-400">
            <Volume2 className="w-3.5 h-3.5" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={handleVolumeChange}
              className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
            />
            <span className="text-[10px] w-6">{Math.round(volume * 100)}%</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomMusicPlayer;
