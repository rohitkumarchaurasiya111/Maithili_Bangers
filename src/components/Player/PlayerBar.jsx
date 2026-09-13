import AlbumArt from './AlbumArt';
import TrackInfo from './TrackInfo';
import ProgressBar from './ProgressBar';
import VolumeControl from './VolumeControl';
import './Player.css';

export default function PlayerBar({
  isPlaying, isShuffled, isMuted, volume,
  getCurrentTime, getDuration, duration, trackTitle, trackArtist, thumbnailUrl,
  onTogglePlay, onPrev, onNext, onSeek,
  onVolumeChange, onToggleMute, onToggleShuffle,
}) {
  return (
    <div className="player-bar">
      <div className="player-seek-top">
        <ProgressBar
          getCurrentTime={getCurrentTime}
          getDuration={getDuration}
          duration={duration}
          onSeek={onSeek}
        />
      </div>

      <div className="player-inner">
        <div className="player-left">
          <AlbumArt thumbnailUrl={thumbnailUrl} isPlaying={isPlaying} />
          <TrackInfo title={trackTitle} artist={trackArtist} />
        </div>

        <div className="player-center">
          <div className="center-left">
            <button
              className={`ctrl-btn shuffle-btn ${isShuffled ? 'active' : ''}`}
              onClick={onToggleShuffle}
              title="Shuffle"
              aria-label="Toggle shuffle"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10.59 9.17 5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" />
              </svg>
            </button>
            <button className="ctrl-btn prev-btn" onClick={onPrev} title="Previous" aria-label="Previous song">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" /></svg>
            </button>
          </div>

          <button className="ctrl-btn play-btn" onClick={onTogglePlay} title="Play / Pause" aria-label="Play or pause">
            {isPlaying ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
            )}
          </button>

          <div className="center-right">
            <button className="ctrl-btn next-btn" onClick={onNext} title="Next" aria-label="Next song">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg>
            </button>
            <VolumeControl
              volume={volume}
              isMuted={isMuted}
              onVolumeChange={onVolumeChange}
              onToggleMute={onToggleMute}
            />
          </div>
        </div>

        <div className="player-right">
          <a
            className="copyright-link"
            href="https://www.linkedin.com/in/rohit-kumar-chaurasiya-0862b1272/"
            target="_blank"
            rel="noopener noreferrer"
            title="Visit print_Rohit on LinkedIn"
          >
            Ⓚ print_Rohit
          </a>
        </div>
      </div>
    </div>
  );
}
