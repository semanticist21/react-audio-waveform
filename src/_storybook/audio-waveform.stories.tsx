import type { Meta, StoryObj } from "@storybook/react";
import {
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
  Volume2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AudioWaveform } from "..";

function AudioWaveformPlayer() {
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);

  // 3분 mp3 파일을 Blob으로 로드
  useEffect(() => {
    fetch("/sample-3min.mp3")
      .then((res) => res.blob())
      .then(setAudioBlob)
      .catch(console.error);
  }, []);

  // audio 이벤트 리스너 설정
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("durationchange", handleDurationChange);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("durationchange", handleDurationChange);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  };

  const handleSeek = (time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
  };

  const handleSkipBackward = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, audio.currentTime - 10);
  };

  const handleSkipForward = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.min(audio.duration, audio.currentTime + 10);
  };

  const handleRestart = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    audio.volume = newVolume;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!audioBlob) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <p className="text-slate-400">Loading audio...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="flex w-full max-w-3xl flex-col gap-6 rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 p-8 shadow-2xl ring-1 ring-slate-700/50">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Audio Waveform Player
            </h2>
            <p className="text-sm text-slate-400">3-minute sample track</p>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <Volume2 className="h-4 w-4" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="h-1 w-24 cursor-pointer appearance-none rounded-full bg-slate-700 accent-blue-500"
            />
          </div>
        </div>

        {/* Waveform 시각화 (playhead 포함) */}
        <div className="h-40 cursor-pointer rounded-xl bg-slate-950/50 p-4 ring-1 ring-slate-700/50 transition-all hover:ring-slate-600/50">
          <AudioWaveform
            blob={audioBlob}
            className="h-full text-blue-500"
            currentTime={currentTime}
            duration={duration}
            onSeek={handleSeek}
            playheadColor="#3b82f6"
            playheadWidth={2}
            barConfig={{ width: 3, gap: 1.5, radius: 2 }}
          />
        </div>

        {/* 시간 표시 */}
        <div className="flex items-center justify-between px-2 text-sm">
          <span className="font-mono text-slate-400">
            {formatTime(currentTime)}
          </span>
          <span className="font-mono text-slate-500">
            {formatTime(duration)}
          </span>
        </div>

        {/* 플레이어 컨트롤 */}
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={handleRestart}
            className="rounded-full p-2 text-slate-400 transition-all hover:bg-slate-700/50 hover:text-white"
          >
            <RotateCcw className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={handleSkipBackward}
            className="rounded-full p-2 text-slate-400 transition-all hover:bg-slate-700/50 hover:text-white"
          >
            <SkipBack className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={togglePlay}
            className="rounded-full bg-blue-500 p-4 text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-600 hover:shadow-blue-500/40"
          >
            {isPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6 translate-x-0.5" />
            )}
          </button>
          <button
            type="button"
            onClick={handleSkipForward}
            className="rounded-full p-2 text-slate-400 transition-all hover:bg-slate-700/50 hover:text-white"
          >
            <SkipForward className="h-5 w-5" />
          </button>
        </div>

        {/* 숨겨진 audio 요소 */}
        {/* biome-ignore lint/a11y/useMediaCaption: Demo audio does not require captions */}
        <audio ref={audioRef} className="hidden">
          <source src="/sample-3min.mp3" type="audio/mpeg" />
        </audio>
      </div>
    </div>
  );
}

const meta: Meta<typeof AudioWaveformPlayer> = {
  title: "Waveform/AudioWaveform",
  component: AudioWaveformPlayer,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;

type Story = StoryObj<typeof AudioWaveformPlayer>;

export const Default: Story = {
  parameters: {
    docs: {
      source: {
        code: `function AudioWaveformPlayer() {
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Load audio file as Blob
  useEffect(() => {
    fetch("/sample-3min.mp3")
      .then((res) => res.blob())
      .then(setAudioBlob)
      .catch(console.error);
  }, []);

  // Setup audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("durationchange", handleDurationChange);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("durationchange", handleDurationChange);
    };
  }, []);

  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  if (!audioBlob) return <div>Loading...</div>;

  return (
    <div>
      {/* Waveform with playhead */}
      <div className="h-32 rounded-lg bg-slate-100">
        <AudioWaveform
          blob={audioBlob}
          className="h-full text-blue-500"
          currentTime={currentTime}
          duration={duration}
          onSeek={handleSeek}
          playheadColor="#3b82f6"
          playheadWidth={2}
        />
      </div>

      {/* Audio element */}
      <audio ref={audioRef} controls>
        <source src="/sample-3min.mp3" type="audio/mpeg" />
      </audio>
    </div>
  );
}`,
      },
    },
  },
};
