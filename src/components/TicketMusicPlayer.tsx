import React, { useRef, useEffect } from 'react';
import { YOUTUBE_PLAYLIST_ID } from '../config/playlist';
import { useYouTubePlayer } from '../hooks/useYouTubePlayer';

export const TicketMusicPlayer: React.FC = () => {
  const progressRef = useRef<HTMLDivElement>(null);

  const {
    containerRef,
    isPlaying,
    isBuffering,
    isLoadingTrack,
    isUnavailable,
    currentTime,
    duration,
    trackTitle,
    trackArtist,
    togglePlay,
    nextTrack,
    prevTrack,
    seekTo,
  } = useYouTubePlayer(YOUTUBE_PLAYLIST_ID);

  const totalDuration = duration > 0 ? duration : 1;
  const progressPercent = Math.min(100, Math.max(0, (currentTime / totalDuration) * 100));

  // Global Keyboard Shortcuts (Space / K for Play-Pause, Right Arrow / L for Next, Left Arrow / J for Prev)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.code === 'Space' || e.code === 'KeyK') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowRight' || e.code === 'KeyL') {
        e.preventDefault();
        nextTrack();
      } else if (e.code === 'ArrowLeft' || e.code === 'KeyJ') {
        e.preventDefault();
        prevTrack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, nextTrack, prevTrack]);

  const formatTime = (seconds: number): string => {
    if (!seconds || isNaN(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const paddedMins = String(mins).padStart(2, '0');
    const paddedSecs = String(secs).padStart(2, '0');
    return `${paddedMins}:${paddedSecs}`;
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || duration <= 0) return;
    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = Math.max(0, Math.min(1, clickX / width));
    const targetSeconds = Math.floor(percentage * duration);
    seekTo(targetSeconds);
  };

  const showSkeleton = isLoadingTrack || !trackTitle;

  return (
    <div className="busfi-wrapper">
      {/* Hidden YouTube IFrame API Target Element */}
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          opacity: 0,
          pointerEvents: 'none',
          width: 1,
          height: 1,
          left: -9999,
          top: -9999,
        }}
      />

      {/* Bus-Fi Ticket Container */}
      <div className="busfi-ticket">
        <div className="busfi-main">
          {/* Header Title & Aligned Subheader */}
          <div className="busfi-header">
            <div className="busfi-title-row">
              <h2 className="busfi-title">BUS TRACKS</h2>
              <span className="busfi-valid-text">VALID TILL LIFE</span>
            </div>
            <div className="busfi-journey-row">
              <span>JOURNEY NO. 76737069</span>
            </div>
            <div className="busfi-header-line" />
          </div>

          {/* Song Metadata Rows */}
          <div className="busfi-meta">
            <div className="busfi-meta-row">
              <span className="busfi-meta-label">TRACK:</span>
              {showSkeleton ? (
                <div className="busfi-skeleton-line busfi-skeleton-title" />
              ) : (
                <span className="busfi-meta-value">
                  {isUnavailable ? 'TRACK UNAVAILABLE' : trackTitle}
                </span>
              )}
            </div>
            <div className="busfi-meta-row">
              <span className="busfi-meta-label">ARTIST:</span>
              {showSkeleton ? (
                <div className="busfi-skeleton-line busfi-skeleton-artist" />
              ) : (
                <span className="busfi-meta-value">
                  {trackArtist || 'VARIOUS ARTISTS'}
                </span>
              )}
            </div>
          </div>

          {/* Seek Bar & Timestamp Row */}
          <div className="busfi-seek-row">
            <div
              className="busfi-seek-track"
              ref={progressRef}
              onClick={handleSeek}
              role="slider"
              aria-valuenow={currentTime}
              aria-valuemin={0}
              aria-valuemax={duration}
              tabIndex={0}
            >
              <div className="busfi-seek-dashed" />
              <div
                className="busfi-seek-handle"
                style={{ left: `${progressPercent}%` }}
              />
            </div>
            <div className="busfi-timestamp">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          {/* Clean Text Controls: PREV, PLAY / PAUSE, NEXT */}
          <div className="busfi-controls">
            <button
              onClick={prevTrack}
              className="busfi-text-btn"
              type="button"
              title="Previous (Left Arrow)"
            >
              PREV
            </button>
            <button
              onClick={togglePlay}
              className="busfi-text-btn busfi-btn-play"
              type="button"
              title="Play/Pause (Space)"
            >
              {isLoadingTrack && !trackTitle
                ? 'LOADING...'
                : isPlaying || isBuffering
                ? 'PAUSE'
                : 'PLAY'}
            </button>
            <button
              onClick={nextTrack}
              className="busfi-text-btn"
              type="button"
              title="Next (Right Arrow)"
            >
              NEXT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
