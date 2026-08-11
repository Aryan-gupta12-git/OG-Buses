import React from 'react';
import { Clock } from './Clock';
import { Title } from './Title';
import { TicketMusicPlayer } from './TicketMusicPlayer';
import { YOUTUBE_PLAYLIST_ID } from '../config/playlist';

export const Hero: React.FC = () => {
  return (
    <main className="hero-container">
      {/* Desktop Background Image */}
      <img
        src="/assets/a0617161-8592-4391-93d7-38623afdcbc1.png"
        alt="Rajasthan Roadways Deluxe Bus Desktop"
        className="hero-image hero-image-desktop"
        loading="eager"
        decoding="sync"
      />
      {/* Mobile Background Image */}
      <img
        src="/assets/5b46517d-9f13-47cf-bf86-aec416946328.png"
        alt="Rajasthan Roadways Deluxe Bus Mobile"
        className="hero-image hero-image-mobile"
        loading="eager"
        decoding="sync"
      />

      <Clock />

      {/* Top-Right YT Music Badge Link */}
      <a
        href={`https://music.youtube.com/playlist?list=${YOUTUBE_PLAYLIST_ID}`}
        target="_blank"
        rel="noopener noreferrer"
        className="hero-yt-badge-link"
        title="Open Playlist on YT Music"
        aria-label="Open Playlist on YT Music"
      >
        <div className="hero-yt-circle-icon">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" style={{ transform: 'translateX(1px)' }} />
          </svg>
        </div>
        <span className="hero-yt-text">YT Music</span>
        <svg
          className="hero-yt-arrow"
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M7 17L17 7" />
          <path d="M7 7h10v10" />
        </svg>
      </a>

      <Title />
      <TicketMusicPlayer />
    </main>
  );
};
