"use client";

import { Music2, Pause } from "lucide-react";

type MusicControlProps = {
  configured: boolean;
  isPlaying: boolean;
  onToggle: () => void;
  title: string;
};

export function MusicControl({
  configured,
  isPlaying,
  onToggle,
  title,
}: MusicControlProps) {
  return (
    <button
      aria-label={
        configured
          ? `${isPlaying ? "Pause" : "Play"} ${title}`
          : "Music unavailable"
      }
      aria-pressed={isPlaying}
      className="music-control"
      data-configured={configured}
      data-playing={isPlaying}
      disabled={!configured}
      onClick={onToggle}
      title={configured ? title : "Music unavailable"}
      type="button"
    >
      {isPlaying ? (
        <Pause aria-hidden="true" size={18} />
      ) : (
        <Music2 aria-hidden="true" size={18} />
      )}
      <span aria-hidden="true" className="music-pulse" />
    </button>
  );
}
