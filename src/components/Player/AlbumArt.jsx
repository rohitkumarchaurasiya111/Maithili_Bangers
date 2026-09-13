import { useState } from 'react';

export default function AlbumArt({ thumbnailUrl, isPlaying }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="album-art-wrap">
      <div className={`album-art ${isPlaying ? 'playing' : ''}`}>
        {thumbnailUrl && (
          <img
            src={thumbnailUrl}
            alt="Now playing"
            className={loaded ? 'loaded' : ''}
            onLoad={() => setLoaded(true)}
            onError={() => setLoaded(false)}
          />
        )}
        {!loaded && (
          <div className="album-art-placeholder">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" opacity="0.4">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
            </svg>
          </div>
        )}
        <div className="album-spin-ring" />
      </div>
    </div>
  );
}
