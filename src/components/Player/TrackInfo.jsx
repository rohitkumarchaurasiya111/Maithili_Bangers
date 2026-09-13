import { useRef, useEffect, useState } from 'react';

export default function TrackInfo({ title, artist }) {
  const nameRef = useRef(null);
  const wrapRef = useRef(null);
  const [shouldScroll, setShouldScroll] = useState(false);

  useEffect(() => {
    const checkScroll = () => {
      if (nameRef.current && wrapRef.current) {
        // Use offsetWidth for inline-block elements to get their true rendered width
        setShouldScroll(nameRef.current.offsetWidth > wrapRef.current.offsetWidth);
      }
    };

    checkScroll();

    // Use ResizeObserver to catch font-loads and responsive layout shifts automatically
    const observer = new ResizeObserver(() => {
      checkScroll();
    });

    if (wrapRef.current) observer.observe(wrapRef.current);
    if (nameRef.current) observer.observe(nameRef.current);

    return () => observer.disconnect();
  }, [title]);

  return (
    <div className="track-info">
      <div className="track-name-scroll" ref={wrapRef}>
        {/* Invisible measurement span that never doubles */}
        <span
          ref={nameRef}
          className="track-name"
          style={{ position: 'absolute', visibility: 'hidden', pointerEvents: 'none' }}
        >
          {title}
        </span>

        {/* Visible scrolling span */}
        <span className={`track-name ${shouldScroll ? 'scrolling' : ''}`}>
          {shouldScroll ? `${title}   •   ${title}` : title}
        </span>
      </div>
      <div className="track-artist">{artist}</div>
    </div>
  );
}
