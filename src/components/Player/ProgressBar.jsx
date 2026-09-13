import { useRef, useCallback, useEffect } from 'react';
import { formatTime } from '../../utils/formatTime';

export default function ProgressBar({ getCurrentTime, getDuration, duration: propDuration, onSeek }) {
  const wrapRef = useRef(null);
  const fillRef = useRef(null);
  const thumbRef = useRef(null);
  const timeCurrentRef = useRef(null);
  const timeTotalRef = useRef(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    let animId;

    const tick = () => {
      if (!isDraggingRef.current) {
        const cur = getCurrentTime ? getCurrentTime() : 0;
        const dur = (getDuration ? getDuration() : 0) || propDuration || 0;

        if (timeCurrentRef.current) {
          timeCurrentRef.current.textContent = formatTime(cur);
        }
        if (timeTotalRef.current) {
          timeTotalRef.current.textContent = formatTime(dur);
        }

        const pct = dur > 0 ? Math.min(100, (cur / dur) * 100) : 0;
        if (fillRef.current) {
          fillRef.current.style.width = `${pct}%`;
        }
        if (thumbRef.current) {
          thumbRef.current.style.left = `${pct}%`;
        }
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [getCurrentTime, getDuration, propDuration]);

  const handleInteraction = useCallback((clientX) => {
    if (!wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));

    // Update visuals immediately on drag/seek
    if (fillRef.current) fillRef.current.style.width = `${pct * 100}%`;
    if (thumbRef.current) thumbRef.current.style.left = `${pct * 100}%`;

    const dur = (getDuration ? getDuration() : 0) || propDuration || 0;
    if (timeCurrentRef.current) {
      timeCurrentRef.current.textContent = formatTime(pct * dur);
    }

    onSeek(pct);
  }, [onSeek, getDuration, propDuration]);

  const handleMouseDown = (e) => {
    isDraggingRef.current = true;
    handleInteraction(e.clientX);
    const onMove = (ev) => handleInteraction(ev.clientX);
    const onUp = () => {
      isDraggingRef.current = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  return (
    <>
      <div className="progress-area">
        <div className="progress-bar-wrap" ref={wrapRef} onMouseDown={handleMouseDown}>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" ref={fillRef} style={{ width: '0%' }} />
            <div className="progress-bar-thumb" ref={thumbRef} style={{ left: '0%' }} />
          </div>
        </div>
      </div>
      <div className="time-display">
        <span ref={timeCurrentRef}>0:00</span>
        <span className="time-sep">/</span>
        <span ref={timeTotalRef}>{formatTime(propDuration || 0)}</span>
      </div>
    </>
  );
}
