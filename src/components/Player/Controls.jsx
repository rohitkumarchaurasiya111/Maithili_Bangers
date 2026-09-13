export default function Controls({ isPlaying, onTogglePlay, onPrev, onNext }) {
  return (
    <>
      <button className="ctrl-btn prev-btn" onClick={onPrev} title="Previous" aria-label="Previous song">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
      </button>
      <button className="ctrl-btn play-btn" onClick={onTogglePlay} title="Play / Pause" aria-label="Play or pause">
        {isPlaying ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        )}
      </button>
      <button className="ctrl-btn next-btn" onClick={onNext} title="Next" aria-label="Next song">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
      </button>
    </>
  );
}
