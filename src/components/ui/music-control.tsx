"use client";

import { Music2, Pause } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { siteConfig } from "@/config/site";
import { subscribeExperienceScroll } from "@/lib/experience-scroll";

type MusicControlProps = {
  src: string | null;
  title: string;
};

export function MusicControl({ src, title }: MusicControlProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const contextRef = useRef<AudioContext>(null);
  const gainRef = useRef<GainNode>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    const unsubscribe = subscribeExperienceScroll((scroll) => {
      const gain = gainRef.current;
      const context = contextRef.current;
      if (!gain || !context) return;
      const configuredVolume =
        siteConfig.music.chapterVolumes[scroll.activeIndex] ?? 0.25;
      const volume = scroll.visible ? configuredVolume : 0.025;
      gain.gain.cancelScheduledValues(context.currentTime);
      gain.gain.setTargetAtTime(volume, context.currentTime, 0.45);
    });

    return () => {
      unsubscribe();
      audio?.pause();
      void contextRef.current?.close();
    };
  }, []);

  function prepareAudioGraph() {
    const audio = audioRef.current;
    if (!audio || contextRef.current) return;
    const context = new AudioContext();
    const source = context.createMediaElementSource(audio);
    const gain = context.createGain();
    gain.gain.value = siteConfig.music.chapterVolumes[0];
    source.connect(gain).connect(context.destination);
    contextRef.current = context;
    gainRef.current = gain;
  }

  async function togglePlayback() {
    const audio = audioRef.current;
    if (!audio || !src) return;

    prepareAudioGraph();

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    try {
      await contextRef.current?.resume();
      await audio.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  }

  return (
    <>
      {src ? <audio loop preload="none" ref={audioRef} src={src} /> : null}
      <button
        aria-label={
          src
            ? `${isPlaying ? "Pause" : "Play"} ${title}`
            : "Music ready to configure"
        }
        className="music-control"
        data-configured={Boolean(src)}
        disabled={!src}
        onClick={togglePlayback}
        title={src ? title : "Add a track in src/config/site.ts"}
        type="button"
      >
        {isPlaying ? <Pause size={18} /> : <Music2 size={18} />}
        <span className="music-pulse" />
      </button>
    </>
  );
}
