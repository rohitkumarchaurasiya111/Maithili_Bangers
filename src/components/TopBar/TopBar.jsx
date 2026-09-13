import { useClock } from '../../hooks/useClock';
import { useFirebasePresence } from '../../hooks/useFirebasePresence';
import { YOUTUBE_PLAYLIST_ID } from '../../utils/config';
import './TopBar.css';

export default function TopBar() {
  const time = useClock();
  const { listenerCount, isFirebaseConfigured } = useFirebasePresence();

  const ytMusicLink = `https://music.youtube.com/playlist?list=${YOUTUBE_PLAYLIST_ID}`;

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="clock">{time}</div>
      </div>
      <div className="topbar-center">
        <div className="online-indicator" title={isFirebaseConfigured ? "Live Listeners" : "Simulated Listeners"}>
          <span className="pulse-dot" />
          <span>{listenerCount}</span> listening
        </div>
      </div>
      <div className="topbar-right">
        <a
          className="social-btn"
          href={ytMusicLink}
          target="_blank"
          rel="noopener noreferrer"
          title="Open in YouTube Music"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.376 0 0 5.376 0 12s5.376 12 12 12 12-5.376 12-12S18.624 0 12 0zm0 19.104c-3.924 0-7.104-3.18-7.104-7.104S8.076 4.896 12 4.896s7.104 3.18 7.104 7.104-3.18 7.104-7.104 7.104zm0-13.332c-3.432 0-6.228 2.796-6.228 6.228S8.568 18.228 12 18.228s6.228-2.796 6.228-6.228S15.432 5.772 12 5.772zM9.684 15.54V8.46L15.816 12 9.684 15.54z"/>
          </svg>
          YT Music
        </a>
      </div>
    </header>
  );
}
