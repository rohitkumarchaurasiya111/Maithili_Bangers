import { useState, useEffect, useRef, useCallback } from 'react';
import { YOUTUBE_PLAYLIST_ID } from '../utils/config';
import { DEFAULT_TRACKS } from '../utils/defaultTracks';

const CACHE_KEY = `mb_playlist_${YOUTUBE_PLAYLIST_ID}`;

function getCachedTracks() {
  try {
    const saved = localStorage.getItem(CACHE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_TRACKS;
}

function getSavedVolume() {
  try {
    const saved = localStorage.getItem('mb_volume');
    if (saved !== null) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) return parsed;
    }
  } catch {}
  return 50; // Balanced default volume
}

/**
 * Core YouTube IFrame API player hook.
 * Manages: playback, track info, progress, volume, shuffle, playlist data.
 * Completely dynamic: driven strictly by YOUTUBE_PLAYLIST_ID in config.js.
 * Volume state persists across reloads and is never forcibly muted.
 */
export function usePlayer() {
  const [initialData] = useState(() => {
    const tracks = getCachedTracks();
    const idx = tracks.length > 0 ? Math.floor(Math.random() * tracks.length) : 0;
    const track = tracks[idx] || null;
    return { tracks, idx, track };
  });

  const playerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShuffled, setIsShuffled] = useState(true);
  const isShuffledRef = useRef(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(getSavedVolume);
  const volumeRef = useRef(getSavedVolume());
  const [duration, setDuration] = useState(0);
  const [trackTitle, setTrackTitle] = useState(initialData.track ? initialData.track.title : 'मैथिली Banger');
  const [trackArtist, setTrackArtist] = useState(initialData.track ? initialData.track.channel : 'Loading melodies…');
  const [thumbnailUrl, setThumbnailUrl] = useState(initialData.track ? `https://i.ytimg.com/vi/${initialData.track.id}/hqdefault.jpg` : '');
  const [playlist, setPlaylist] = useState(initialData.tracks);
  const playlistRef = useRef(initialData.tracks);
  const [currentIndex, setCurrentIndex] = useState(initialData.idx);
  const currentIndexRef = useRef(initialData.idx);
  const [isReady, setIsReady] = useState(false);

  // Keep volume ref updated
  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  const setPlaylistSync = useCallback((newVal) => {
    if (typeof newVal === 'function') {
      setPlaylist(prev => {
        const next = newVal(prev);
        playlistRef.current = next;
        return next;
      });
    } else {
      playlistRef.current = newVal;
      setPlaylist(newVal);
    }
  }, []);

  const setCurrentIndexSync = useCallback((newVal) => {
    if (typeof newVal === 'function') {
      setCurrentIndex(prev => {
        const next = newVal(prev);
        currentIndexRef.current = next;
        return next;
      });
    } else {
      currentIndexRef.current = newVal;
      setCurrentIndex(newVal);
    }
  }, []);

  // ── Dynamically Fetch Playlist on Mount from YouTube via local/vercel API ──
  useEffect(() => {
    let cancelled = false;

    async function loadDynamicPlaylist() {
      try {
        const res = await fetch(`/api/playlist?id=${YOUTUBE_PLAYLIST_ID}`);
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled || !data.tracks || data.tracks.length === 0) return;

        const newTracks = data.tracks;
        setPlaylistSync(newTracks);
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(newTracks));
        } catch {}

        const p = playerRef.current;
        // If player had no cached tracks when it initialized, sync to the newly fetched tracks
        if (playlistRef.current.length === 0 || !initialData.track) {
          const randIdx = Math.floor(Math.random() * newTracks.length);
          setCurrentIndexSync(randIdx);
          setTrackTitle(newTracks[randIdx].title);
          setTrackArtist(newTracks[randIdx].channel);
          setThumbnailUrl(`https://i.ytimg.com/vi/${newTracks[randIdx].id}/hqdefault.jpg`);

          if (p && typeof p.loadVideoById === 'function') {
            p.loadVideoById(newTracks[randIdx].id);
          }
        }
      } catch (err) {
        console.warn('Failed to dynamically fetch playlist:', err);
      }
    }

    loadDynamicPlaylist();
    return () => { cancelled = true; };
  }, [setCurrentIndexSync, setPlaylistSync, initialData.track]);

  // ── Global User Interaction Handler for Unmuting and Playback ──
  useEffect(() => {
    const handleUserInteraction = () => {
      const p = playerRef.current;
      if (!p) return;

      const vol = volumeRef.current;
      if (typeof p.unMute === 'function') p.unMute();
      if (typeof p.setVolume === 'function') p.setVolume(vol);
      setIsMuted(false);

      const state = p.getPlayerState ? p.getPlayerState() : -1;
      if (state !== 1 && typeof p.playVideo === 'function') {
        p.playVideo();
      }
    };

    window.addEventListener('pointerdown', handleUserInteraction);
    window.addEventListener('keydown', handleUserInteraction);
    window.addEventListener('touchstart', handleUserInteraction);
    window.addEventListener('click', handleUserInteraction);

    return () => {
      window.removeEventListener('pointerdown', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
      window.removeEventListener('click', handleUserInteraction);
    };
  }, []);

  // ── Track info ──
  const updateTrackInfo = useCallback((p) => {
    if (!p || typeof p.getVideoData !== 'function') return;
    const data = p.getVideoData();
    if (data.title) setTrackTitle(data.title);
    if (data.author) setTrackArtist(data.author);
    if (data.video_id) {
      setThumbnailUrl(`https://i.ytimg.com/vi/${data.video_id}/hqdefault.jpg`);
    }
    if (data.title && data.video_id) {
      setPlaylistSync(prev => {
        const idx = prev.findIndex(t => t.id === data.video_id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], title: data.title, channel: data.author || 'मैथिली Banger' };
          return next;
        }
        return prev;
      });
    }
    setDuration(p.getDuration() || 0);
  }, [setPlaylistSync]);

  const playNext = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    const pl = playlistRef.current;
    if (pl && pl.length > 0) {
      let nextIdx;
      if (isShuffledRef.current) {
        nextIdx = Math.floor(Math.random() * pl.length);
      } else {
        nextIdx = (currentIndexRef.current + 1) % pl.length;
      }
      setCurrentIndexSync(nextIdx);
      p.loadVideoById(pl[nextIdx].id);
      setTrackTitle(pl[nextIdx].title);
      setTrackArtist(pl[nextIdx].channel);
      setThumbnailUrl(`https://i.ytimg.com/vi/${pl[nextIdx].id}/hqdefault.jpg`);
    }
  }, [setCurrentIndexSync]);

  const playNextRef = useRef(playNext);
  useEffect(() => {
    playNextRef.current = playNext;
  }, [playNext]);

  const onPlayerReady = useCallback((event) => {
    const p = playerRef.current || event.target;
    window.testPlayer = p;
    setIsReady(true);

    try {
      const iframe = p.getIframe ? p.getIframe() : document.getElementById('yt-player-el');
      if (iframe) {
        iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
      }
    } catch {}

    const vol = volumeRef.current;
    if (typeof p.unMute === 'function') p.unMute();
    if (typeof p.setVolume === 'function') p.setVolume(vol);
    setIsMuted(false);

    // Immediately trigger playback with sound
    if (typeof p.playVideo === 'function') {
      p.playVideo();
    }
  }, []);

  const onPlayerStateChange = useCallback((event) => {
    const p = playerRef.current;
    const state = event.data;

    if (state === window.YT.PlayerState.PLAYING) {
      setIsPlaying(true);
      updateTrackInfo(event.target);
      setDuration(event.target.getDuration() || 0);
    } else if (state === window.YT.PlayerState.PAUSED) {
      setIsPlaying(false);
    } else if (state === window.YT.PlayerState.ENDED) {
      playNextRef.current();
    } else if (state === window.YT.PlayerState.CUED) {
      if (p && typeof p.playVideo === 'function') {
        p.playVideo();
      }
    } else if (state === -1) { // UNSTARTED
      updateTrackInfo(p);
      if (p && typeof p.playVideo === 'function') {
        p.playVideo();
      }
    }
  }, [updateTrackInfo]);

  const onPlayerError = useCallback((event) => {
    console.warn('YouTube player error:', event.data);
    setTimeout(() => playNextRef.current(), 1200);
  }, []);

  const initPlayer = useCallback(() => {
    if (playerRef.current && typeof playerRef.current.destroy === 'function') {
      try { playerRef.current.destroy(); } catch {}
    }

    const curTrack = playlistRef.current[currentIndexRef.current];

    const playerConfig = {
      height: '200',
      width: '200',
      playerVars: {
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        rel: 0,
        iv_load_policy: 3,
        modestbranding: 1,
        enablejsapi: 1,
        playsinline: 1,
        origin: window.location.origin,
      },
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange,
        onError: onPlayerError,
      },
    };

    if (curTrack && curTrack.id) {
      playerConfig.videoId = curTrack.id;
    } else {
      playerConfig.playerVars.listType = 'playlist';
      playerConfig.playerVars.list = YOUTUBE_PLAYLIST_ID;
    }

    playerRef.current = new window.YT.Player('yt-player-el', playerConfig);
  }, [onPlayerReady, onPlayerStateChange, onPlayerError]);

  // ── Load YouTube IFrame API ──
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      initPlayer();
      return;
    }

    if (!document.getElementById('yt-api-script')) {
      const tag = document.createElement('script');
      tag.id = 'yt-api-script';
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }

    window.onYouTubeIframeAPIReady = () => {
      initPlayer();
    };

    return () => {
      if (playerRef.current && playerRef.current.destroy) {
        try { playerRef.current.destroy(); } catch {}
      }
    };
  }, [initPlayer]);

  const togglePlay = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    if (isPlaying) {
      p.pauseVideo();
    } else {
      if (typeof p.unMute === 'function' && !isMuted) p.unMute();
      if (typeof p.setVolume === 'function') p.setVolume(volumeRef.current);

      const pl = playlistRef.current;
      const curIdx = currentIndexRef.current;
      const state = p.getPlayerState ? p.getPlayerState() : -1;

      if (state === window.YT?.PlayerState?.CUED || state === -1 || state === 5) {
        if (pl && pl[curIdx]) {
          p.loadVideoById(pl[curIdx].id);
          setTrackTitle(pl[curIdx].title);
          setTrackArtist(pl[curIdx].channel);
          setThumbnailUrl(`https://i.ytimg.com/vi/${pl[curIdx].id}/hqdefault.jpg`);
        } else {
          p.playVideo();
        }
      } else {
        p.playVideo();
      }
    }
  }, [isPlaying, isMuted]);

  const playPrev = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    if (p.getCurrentTime && p.getCurrentTime() > 3) {
      p.seekTo(0);
    } else {
      const pl = playlistRef.current;
      if (pl && pl.length > 0) {
        let prevIdx = currentIndexRef.current - 1;
        if (prevIdx < 0) prevIdx = pl.length - 1;
        setCurrentIndexSync(prevIdx);
        p.loadVideoById(pl[prevIdx].id);
        setTrackTitle(pl[prevIdx].title);
        setTrackArtist(pl[prevIdx].channel);
        setThumbnailUrl(`https://i.ytimg.com/vi/${pl[prevIdx].id}/hqdefault.jpg`);
      }
    }
  }, [setCurrentIndexSync]);

  // Keep duration state synced during playback
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      const p = playerRef.current;
      if (p && typeof p.getDuration === 'function') {
        const d = p.getDuration();
        if (d && d > 0 && d !== duration) {
          setDuration(d);
        }
      }
    }, 500);
    return () => clearInterval(interval);
  }, [isPlaying, duration]);

  const getCurrentTime = useCallback(() => {
    const p = playerRef.current;
    if (p && typeof p.getCurrentTime === 'function') {
      return p.getCurrentTime() || 0;
    }
    return 0;
  }, []);

  const getDuration = useCallback(() => {
    const p = playerRef.current;
    if (p && typeof p.getDuration === 'function') {
      const d = p.getDuration();
      if (d && d > 0) return d;
    }
    return duration || 0;
  }, [duration]);

  const seekTo = useCallback((fraction) => {
    const p = playerRef.current;
    if (!p) return;
    const curDur = (p.getDuration && p.getDuration() > 0) ? p.getDuration() : duration;
    if (!curDur || curDur === 0) return;
    const target = fraction * curDur;
    p.seekTo(target, true);
  }, [duration]);

  const changeVolume = useCallback((v) => {
    const p = playerRef.current;
    setVolume(v);
    volumeRef.current = v;
    try {
      localStorage.setItem('mb_volume', v.toString());
    } catch {}
    if (p && typeof p.setVolume === 'function') p.setVolume(v);
    if (v === 0) {
      setIsMuted(true);
      if (p && typeof p.mute === 'function') p.mute();
    } else {
      setIsMuted(false);
      if (p && typeof p.unMute === 'function') p.unMute();
    }
  }, []);

  const toggleMute = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    if (isMuted) {
      if (typeof p.unMute === 'function') p.unMute();
      const targetVol = volumeRef.current || 50;
      if (typeof p.setVolume === 'function') p.setVolume(targetVol);
      setIsMuted(false);
    } else {
      if (typeof p.mute === 'function') p.mute();
      setIsMuted(true);
    }
  }, [isMuted]);

  const toggleShuffle = useCallback(() => {
    setIsShuffled(prev => {
      const next = !prev;
      isShuffledRef.current = next;
      return next;
    });
  }, []);

  const playTrackAt = useCallback((idx) => {
    const p = playerRef.current;
    if (!p) return;
    const pl = playlistRef.current;
    if (pl && pl[idx]) {
      setCurrentIndexSync(idx);
      p.loadVideoById(pl[idx].id);
      setTrackTitle(pl[idx].title);
      setTrackArtist(pl[idx].channel);
      setThumbnailUrl(`https://i.ytimg.com/vi/${pl[idx].id}/hqdefault.jpg`);
    }
  }, [setCurrentIndexSync]);

  const reorderPlaylist = useCallback((newOrder) => {
    const currentTrackId = playlistRef.current[currentIndexRef.current]?.id;
    setPlaylistSync(newOrder);

    if (currentTrackId) {
      const newActiveIdx = newOrder.findIndex(t => t.id === currentTrackId);
      if (newActiveIdx !== -1) {
        setCurrentIndexSync(newActiveIdx);
      }
    }
  }, [setPlaylistSync, setCurrentIndexSync]);

  return {
    isPlaying,
    isShuffled,
    isMuted,
    volume,
    duration,
    trackTitle,
    trackArtist,
    thumbnailUrl,
    playlist,
    currentIndex,
    isReady,
    getCurrentTime,
    getDuration,
    togglePlay,
    playNext,
    playPrev,
    seekTo,
    changeVolume,
    toggleMute,
    toggleShuffle,
    playTrackAt,
    reorderPlaylist,
  };
}
