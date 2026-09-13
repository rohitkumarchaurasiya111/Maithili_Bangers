import { useState, useCallback } from 'react';
import Background from './components/Background/Background';
import TopBar from './components/TopBar/TopBar';
import Hero from './components/Hero/Hero';
import PlayerBar from './components/Player/PlayerBar';
import PlaylistPanel from './components/Playlist/PlaylistPanel';
import Toast from './components/Toast/Toast';
import { usePlayer } from './hooks/usePlayer';
import { useKeyboard } from './hooks/useKeyboard';

export default function App() {
  const player = usePlayer();
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastKey, setToastKey] = useState(0);

  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    setToastKey(k => k + 1);
  }, []);

  // Keyboard shortcuts with visual toast feedback
  useKeyboard({
    onTogglePlay: () => {
      player.togglePlay();
      showToast(player.isPlaying ? 'Paused' : 'Playing');
    },
    onNext: () => {
      player.playNext();
      showToast('Next Song');
    },
    onPrev: () => {
      player.playPrev();
      showToast('Previous Song');
    },
    onMute: () => {
      player.toggleMute();
      showToast(player.isMuted ? 'Unmuted' : 'Muted');
    },
  });

  return (
    <>
      <Background />
      <TopBar />
      <Hero />

      {/* Hidden YouTube player element */}
      <div style={{
        position: 'fixed', bottom: 0, right: 0,
        width: 200, height: 200,
        opacity: 0.001, pointerEvents: 'none', zIndex: -1,
      }}>
        <div id="yt-player-el" />
      </div>

      <PlayerBar
        isPlaying={player.isPlaying}
        isShuffled={player.isShuffled}
        isMuted={player.isMuted}
        volume={player.volume}
        getCurrentTime={player.getCurrentTime}
        getDuration={player.getDuration}
        duration={player.duration}
        trackTitle={player.trackTitle}
        trackArtist={player.trackArtist}
        thumbnailUrl={player.thumbnailUrl}
        onTogglePlay={player.togglePlay}
        onPrev={player.playPrev}
        onNext={player.playNext}
        onSeek={player.seekTo}
        onVolumeChange={player.changeVolume}
        onToggleMute={player.toggleMute}
        onToggleShuffle={player.toggleShuffle}
      />

      {/* Playlist toggle button */}
      <div className="playlist-toggle-wrap">
        <button
          className="playlist-toggle-btn"
          onClick={() => setPlaylistOpen(p => !p)}
          aria-label="Toggle playlist"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
          </svg>
          Playlist
        </button>
      </div>

      <PlaylistPanel
        isOpen={playlistOpen}
        onClose={() => setPlaylistOpen(false)}
        playlist={player.playlist}
        currentIndex={player.currentIndex}
        onPlayTrack={player.playTrackAt}
        onReorder={player.reorderPlaylist}
      />

      <Toast key={toastKey} message={toastMsg} />
    </>
  );
}
