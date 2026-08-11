/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState, useCallback } from 'react';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export interface UseYouTubePlayerReturn {
  containerRef: React.RefObject<HTMLDivElement | null>;
  isPlaying: boolean;
  isBuffering: boolean;
  isLoadingTrack: boolean;
  isUnavailable: boolean;
  currentTime: number;
  duration: number;
  trackTitle: string;
  trackArtist: string;
  trackCover: string;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seekTo: (seconds: number) => void;
}

const DEFAULT_COVER = "/assets/96aac586-fd97-4c9c-a08a-f92bf32637ef.png";

function cleanArtistName(author: string, title: string): string {
  if (!author) return '';

  let cleaned = author.replace(/\s*-\s*Topic$/i, '').trim();

  if (/^release$/i.test(cleaned) || /^various artists$/i.test(cleaned)) {
    if (title.includes('|')) {
      const parts = title.split('|');
      if (parts.length > 1) return parts[1].trim();
    } else if (title.includes(' - ')) {
      const parts = title.split(' - ');
      if (parts.length > 1) return parts[1].trim();
    } else if (title.includes('(') && title.includes(')')) {
      const match = title.match(/\(([^)]+)\)/);
      if (match && match[1]) return match[1].trim();
    }
    return '';
  }

  return cleaned;
}

export function useYouTubePlayer(playlistId: string): UseYouTubePlayerReturn {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<any>(null);
  const [isApiReady, setIsApiReady] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [isLoadingTrack, setIsLoadingTrack] = useState<boolean>(true);
  const [isUnavailable, setIsUnavailable] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [trackTitle, setTrackTitle] = useState<string>('');
  const [trackArtist, setTrackArtist] = useState<string>('');
  const [trackCover, setTrackCover] = useState<string>(DEFAULT_COVER);

  const updateTrackInfo = useCallback(() => {
    if (!playerRef.current) return;
    try {
      if (playerRef.current.getVideoData) {
        const data = playerRef.current.getVideoData();
        if (data && data.title) {
          const rawTitle = data.title || '';
          const rawAuthor = data.author || '';

          let cleanTitle = rawTitle
            .replace(/\s*\([^)]*(official|video|audio|full song|lyric|hd|4k)[^)]*\)/gi, '')
            .replace(/\s*\[[^\]]*(official|video|audio|full song|lyric|hd|4k)[^\]]*\]/gi, '')
            .trim();

          if (!cleanTitle) cleanTitle = rawTitle;
          setTrackTitle(cleanTitle);

          const artist = cleanArtistName(rawAuthor, rawTitle);
          setTrackArtist(artist);

          if (data.video_id) {
            setTrackCover(`https://i.ytimg.com/vi/${data.video_id}/hqdefault.jpg`);
          }
        }
      }
      if (playerRef.current.getDuration) {
        const d = playerRef.current.getDuration();
        if (typeof d === 'number' && d > 0) setDuration(Math.floor(d));
      }
    } catch (e) {
      console.warn('Error reading video data:', e);
    }
  }, []);

  // 1. Load YouTube IFrame API Script Once
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setIsApiReady(true);
      return;
    }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    if (firstScriptTag && firstScriptTag.parentNode) {
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    } else {
      document.head.appendChild(tag);
    }

    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (previousCallback) previousCallback();
      setIsApiReady(true);
    };
  }, []);

  // 2. Initialize Single YT.Player Instance with Playlist & Instant Shuffle
  useEffect(() => {
    if (!isApiReady || !containerRef.current || playerRef.current) return;

    playerRef.current = new window.YT.Player(containerRef.current, {
      height: '1',
      width: '1',
      playerVars: {
        listType: 'playlist',
        list: playlistId,
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        rel: 0,
        origin: window.location.origin,
      },
      events: {
        onReady: (event: any) => {
          setIsLoadingTrack(true);
          try {
            // Enable official YouTube playlist shuffle and loop
            event.target.setShuffle(true);
            event.target.setLoop(true);

            // Immediately pick a random track index on load
            const playlist = event.target.getPlaylist();
            if (playlist && playlist.length > 0) {
              const randomIndex = Math.floor(Math.random() * playlist.length);
              event.target.playVideoAt(randomIndex);
            }
          } catch (e) {
            console.warn('Shuffle error:', e);
          }
        },
        onStateChange: (event: any) => {
          const state = event.data;
          const YTState = window.YT.PlayerState;

          updateTrackInfo();

          if (state === YTState.PLAYING) {
            setIsPlaying(true);
            setIsBuffering(false);
            setIsLoadingTrack(false);
            setIsUnavailable(false);
          } else if (state === YTState.PAUSED) {
            setIsPlaying(false);
            setIsBuffering(false);
            setIsLoadingTrack(false);
          } else if (state === YTState.BUFFERING) {
            setIsBuffering(true);
          } else if (state === YTState.ENDED) {
            setIsBuffering(false);
          }
        },
        onError: (event: any) => {
          console.warn('YouTube Playlist error code:', event.data);
          setIsUnavailable(true);
          setIsPlaying(false);
          setIsBuffering(false);
          setIsLoadingTrack(false);
          setTimeout(() => {
            if (playerRef.current && playerRef.current.nextVideo) {
              playerRef.current.nextVideo();
            }
          }, 1500);
        },
      },
    });

    return () => {
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [isApiReady, playlistId, updateTrackInfo]);

  // 3. Time Update Interval (500ms) while playing
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isPlaying) {
      interval = setInterval(() => {
        if (playerRef.current && playerRef.current.getCurrentTime) {
          const t = playerRef.current.getCurrentTime();
          const d = playerRef.current.getDuration();
          if (typeof t === 'number') setCurrentTime(Math.floor(t));
          if (typeof d === 'number' && d > 0) setDuration(Math.floor(d));
        }
      }, 500);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying]);

  const play = useCallback(() => {
    if (playerRef.current && playerRef.current.playVideo) {
      playerRef.current.playVideo();
    }
  }, []);

  const pause = useCallback(() => {
    if (playerRef.current && playerRef.current.pauseVideo) {
      playerRef.current.pauseVideo();
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const nextTrack = useCallback(() => {
    if (playerRef.current && playerRef.current.nextVideo) {
      setIsLoadingTrack(true);
      setTrackTitle('');
      setCurrentTime(0);
      playerRef.current.nextVideo();
    }
  }, []);

  const prevTrack = useCallback(() => {
    if (playerRef.current && playerRef.current.previousVideo) {
      setIsLoadingTrack(true);
      setTrackTitle('');
      setCurrentTime(0);
      playerRef.current.previousVideo();
    }
  }, []);

  const seekTo = useCallback((seconds: number) => {
    if (playerRef.current && playerRef.current.seekTo) {
      playerRef.current.seekTo(seconds, true);
      setCurrentTime(seconds);
    }
  }, []);

  return {
    containerRef,
    isPlaying,
    isBuffering,
    isLoadingTrack,
    isUnavailable,
    currentTime,
    duration,
    trackTitle,
    trackArtist,
    trackCover,
    play,
    pause,
    togglePlay,
    nextTrack,
    prevTrack,
    seekTo,
  };
}
