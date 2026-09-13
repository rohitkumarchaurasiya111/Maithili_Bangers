import { useEffect, useRef, useState } from 'react';
import './Playlist.css';

export default function PlaylistPanel({ isOpen, onClose, playlist, currentIndex, onPlayTrack, onReorder }) {
  const panelRef = useRef(null);
  const activeRef = useRef(null);
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    function handler(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, onClose]);

  // Scroll active into view
  useEffect(() => {
    if (isOpen && activeRef.current) {
      activeRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [isOpen, currentIndex]);

  const handleDragStart = (e, idx) => {
    setDraggedIdx(idx);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, idx) => {
    e.preventDefault(); // allow dropping
    e.dataTransfer.dropEffect = "move";
    if (idx !== dragOverIdx) setDragOverIdx(idx);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  const handleDrop = (e, idx) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === idx) {
      handleDragEnd();
      return;
    }

    const newPlaylist = [...playlist];
    const [movedItem] = newPlaylist.splice(draggedIdx, 1);
    newPlaylist.splice(idx, 0, movedItem);

    if (onReorder) onReorder(newPlaylist);
    handleDragEnd();
  };

  return (
    <div className={`playlist-panel ${isOpen ? 'open' : ''}`} ref={panelRef}>
      <div className="playlist-header">
        <h2>🎵 Playlist</h2>
        <button className="close-playlist-btn" onClick={onClose} aria-label="Close playlist">✕</button>
      </div>
      <ul className="playlist-list">
        {playlist.map((track, idx) => (
          <li
            key={track.id + idx}
            className={`playlist-item ${idx === currentIndex ? 'active' : ''} ${draggedIdx === idx ? 'dragging' : ''} ${dragOverIdx === idx ? 'drag-over' : ''}`}
            ref={idx === currentIndex ? activeRef : null}
            onClick={() => { onPlayTrack(idx); onClose(); }}
            draggable
            onDragStart={(e) => handleDragStart(e, idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDragEnd={handleDragEnd}
            onDrop={(e) => handleDrop(e, idx)}
          >
            <span className="playlist-item-num">{idx + 1}</span>
            <img
              className="playlist-item-thumb"
              src={`https://i.ytimg.com/vi/${track.id}/default.jpg`}
              alt=""
              loading="lazy"
              onError={(e) => { e.target.src = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 40 40%22><rect width=%2240%22 height=%2240%22 fill=%22%23132240%22/><text x=%2220%22 y=%2225%22 font-size=%2216%22 text-anchor=%22middle%22 fill=%22%238BA4C7%22>♫</text></svg>'; }}
            />
            <div className="playlist-item-info">
              <div className="playlist-item-title">{track.title}</div>
              <div className="playlist-item-channel">{track.channel}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
