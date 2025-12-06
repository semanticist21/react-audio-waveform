import type { Meta, StoryObj } from "@storybook/react";
import { Pause, Play, RotateCcw, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AudioWaveform } from "..";

function AudioWaveformPlayer() {
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isSeeking, setIsSeeking] = useState(false);
  const wasPlayingRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioUrlRef = useRef<string>("");

  // Load 3-minute mp3 file as Blob and create URL
  useEffect(() => {
    fetch("/sample-5min.mp3")
      .then((res) => res.blob())
      .then((blob) => {
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        audioUrlRef.current = url;
        setAudioUrl(url);
      })
      .catch(console.error);

    // Cleanup: revoke URL
    return () => {
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
    };
  }, []);

  // Setup audio event listeners (runs after audioUrl is set)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

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

    // Set initial duration
    if (audio.duration) {
      setDuration(audio.duration);
    }

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("durationchange", handleDurationChange);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
    };
  }, [audioUrl]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  };

  // Drag-to-seek: pause playback while dragging
  const handleSeekStart = () => {
    const audio = audioRef.current;
    if (!audio) return;
    wasPlayingRef.current = isPlaying;
    if (isPlaying) {
      audio.pause();
    }
    setIsSeeking(true);
  };

  // Drag-to-seek: update time in real-time
  const handleSeekDrag = (time: number) => {
    setCurrentTime(time);
  };

  // Drag-to-seek: resume playback if it was playing before
  const handleSeekEnd = (time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
    setIsSeeking(false);
    if (wasPlayingRef.current) {
      audio.play();
    }
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

  return (
    <div className="flex h-screen w-full items-center justify-center bg-linear-to-br from-slate-900 to-slate-800 p-8">
      <div className="flex w-full max-w-3xl flex-col gap-6 rounded-3xl bg-linear-to-br from-slate-800 to-slate-900 p-8 shadow-2xl ring-1 ring-slate-700/50">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Audio Waveform Player</h2>
            <p className="text-sm text-slate-400">5-minute sample track</p>
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

        {/* Waveform visualization (with drag-to-seek) */}
        <AudioWaveform
          blob={audioBlob}
          className="h-40 w-full rounded-xl bg-slate-950/50 p-4 ring-1 ring-slate-700/50 transition-all hover:ring-slate-600/50"
          currentTime={currentTime}
          duration={duration}
          onSeekStart={handleSeekStart}
          onSeekDrag={handleSeekDrag}
          onSeekEnd={handleSeekEnd}
          appearance={{
            barColor: "#3b82f6",
            barWidth: 1,
            barGap: 1.5,
            barRadius: 2,
            playheadColor: "#ef4444",
            playheadWidth: 3,
          }}
        />

        {/* Seeking indicator */}
        {isSeeking && <div className="text-center text-sm text-slate-400">Seeking... {formatTime(currentTime)}</div>}

        {/* Time display */}
        <div className="flex items-center justify-between px-2 text-sm">
          <span className="font-mono text-slate-400">{formatTime(currentTime)}</span>
          <span className="font-mono text-slate-500">{formatTime(duration)}</span>
        </div>

        {/* Player controls */}
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
            {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 translate-x-0.5" />}
          </button>
          <button
            type="button"
            onClick={handleSkipForward}
            className="rounded-full p-2 text-slate-400 transition-all hover:bg-slate-700/50 hover:text-white"
          >
            <SkipForward className="h-5 w-5" />
          </button>
        </div>

        {/* Hidden audio element */}
        {audioUrl && (
          // biome-ignore lint/a11y/useMediaCaption: Demo audio does not require captions
          <audio ref={audioRef} src={audioUrl} className="hidden" />
        )}
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

// Extended type for Playground story
interface PlaygroundArgs {
  barColor: string;
  barWidth: number;
  barGap: number;
  barRadius: number;
  barRadiusFull: boolean;
  barHeightScale: number;
  playheadColor: string;
  playheadWidth: number;
}

// Playground story: Adjust appearance properties in Controls panel
export const Playground: StoryObj<PlaygroundArgs> = {
  render: (args) => {
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string>("");
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const wasPlayingRef = useRef(false);
    const audioRef = useRef<HTMLAudioElement>(null);
    const audioUrlRef = useRef<string>("");

    useEffect(() => {
      fetch("/sample-5min.mp3")
        .then((res) => res.blob())
        .then((blob) => {
          setAudioBlob(blob);
          const url = URL.createObjectURL(blob);
          audioUrlRef.current = url;
          setAudioUrl(url);
        })
        .catch(console.error);

      return () => {
        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current);
        }
      };
    }, []);

    useEffect(() => {
      const audio = audioRef.current;
      if (!audio || !audioUrl) return;

      const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
      const handleDurationChange = () => setDuration(audio.duration);
      const handlePlay = () => setIsPlaying(true);
      const handlePause = () => setIsPlaying(false);

      audio.addEventListener("timeupdate", handleTimeUpdate);
      audio.addEventListener("durationchange", handleDurationChange);
      audio.addEventListener("play", handlePlay);
      audio.addEventListener("pause", handlePause);

      if (audio.duration) setDuration(audio.duration);

      return () => {
        audio.removeEventListener("timeupdate", handleTimeUpdate);
        audio.removeEventListener("durationchange", handleDurationChange);
        audio.removeEventListener("play", handlePlay);
        audio.removeEventListener("pause", handlePause);
      };
    }, [audioUrl]);

    // Drag-to-seek handlers
    const handleSeekStart = () => {
      const audio = audioRef.current;
      if (!audio) return;
      wasPlayingRef.current = isPlaying;
      if (isPlaying) audio.pause();
    };

    const handleSeekDrag = (time: number) => {
      setCurrentTime(time);
    };

    const handleSeekEnd = (time: number) => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.currentTime = time;
      if (wasPlayingRef.current) audio.play();
    };

    if (!audioBlob) return <p className="p-4 text-slate-400">Loading...</p>;

    return (
      <div className="flex flex-col gap-4 p-8">
        <AudioWaveform
          blob={audioBlob}
          className="h-32 w-full rounded-xl bg-slate-900 p-4"
          currentTime={currentTime}
          duration={duration}
          onSeekStart={handleSeekStart}
          onSeekDrag={handleSeekDrag}
          onSeekEnd={handleSeekEnd}
          appearance={{
            barColor: args.barColor,
            barWidth: args.barWidth,
            barGap: args.barGap,
            // If barRadiusFull is true, set to half of barWidth (fully rounded)
            barRadius: args.barRadiusFull ? args.barWidth / 2 : args.barRadius,
            barHeightScale: args.barHeightScale,
            playheadColor: args.playheadColor,
            playheadWidth: args.playheadWidth,
          }}
        />
        {audioUrl && (
          // biome-ignore lint/a11y/useMediaCaption: Demo audio
          <audio ref={audioRef} src={audioUrl} controls className="w-full" />
        )}
      </div>
    );
  },
  args: {
    barColor: "#3b82f6",
    barWidth: 1,
    barGap: 1.5,
    barRadius: 2,
    barRadiusFull: false,
    barHeightScale: 0.95,
    playheadColor: "#ef4444",
    playheadWidth: 3,
  },
  argTypes: {
    barColor: { control: "color", description: "Bar color (CSS color)" },
    barWidth: { control: { type: "range", min: 1, max: 10, step: 0.5 }, description: "Bar width (px)" },
    barGap: { control: { type: "range", min: 0, max: 10, step: 0.5 }, description: "Gap between bars (px)" },
    barRadius: {
      control: { type: "range", min: 0, max: 10, step: 0.5 },
      description: "Bar corner radius (px)",
      if: { arg: "barRadiusFull", eq: false },
    },
    barRadiusFull: { control: "boolean", description: "Fully rounded bars (pill shape)" },
    barHeightScale: {
      control: { type: "range", min: 0.1, max: 1, step: 0.05 },
      description: "Bar height scale (0.0-1.0)",
    },
    playheadColor: { control: "color", description: "Playhead color (CSS color)" },
    playheadWidth: { control: { type: "range", min: 1, max: 10, step: 1 }, description: "Playhead width (px)" },
  },
  parameters: {
    layout: "fullscreen",
    docs: {
      source: {
        code: `import { AudioWaveform } from "react-audio-wavekit";

<AudioWaveform
  blob={audioBlob}
  className="h-32 w-full rounded-xl bg-slate-900 p-4"
  currentTime={currentTime}
  duration={duration}
  onSeekStart={() => audio.pause()}
  onSeekDrag={(time) => setCurrentTime(time)}
  onSeekEnd={(time) => {
    audio.currentTime = time;
    if (wasPlaying) audio.play();
  }}
  appearance={{
    barColor: "#3b82f6",
    barWidth: 1,
    barGap: 1.5,
    barRadius: 2,
    barHeightScale: 0.95,
    playheadColor: "#ef4444",
    playheadWidth: 3,
  }}
/>`,
      },
    },
  },
};

export const Simple: Story = {
  render: () => {
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

    useEffect(() => {
      fetch("/sample-5min.mp3")
        .then((res) => res.blob())
        .then(setAudioBlob)
        .catch(console.error);
    }, []);

    if (!audioBlob) return <p>Loading...</p>;

    return (
      <div className="flex h-screen w-full items-center justify-center">
        <AudioWaveform blob={audioBlob} style={{ width: 800, height: 128 }} />
      </div>
    );
  },
  parameters: {
    layout: "fullscreen",
    docs: {
      source: {
        code: `import { AudioWaveform } from "react-audio-wavekit";

<AudioWaveform blob={audioBlob} style={{ width: 800, height: 128 }} />`,
      },
    },
  },
};

export const Default: Story = {
  parameters: {
    docs: {
      source: {
        code: `import { useEffect, useRef, useState } from "react";
import { AudioWaveform } from "react-audio-wavekit";

function AudioWaveformPlayer() {
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const wasPlayingRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Load audio file as Blob and create URL
  useEffect(() => {
    fetch("/sample-5min.mp3")
      .then((res) => res.blob())
      .then((blob) => {
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
      })
      .catch(console.error);
  }, []);

  // Setup audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

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
  }, [audioUrl]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    isPlaying ? audio.pause() : audio.play();
  };

  // Drag-to-seek handlers
  const handleSeekStart = () => {
    const audio = audioRef.current;
    if (!audio) return;
    wasPlayingRef.current = isPlaying;
    if (isPlaying) audio.pause();
  };

  const handleSeekDrag = (time: number) => {
    setCurrentTime(time);
  };

  const handleSeekEnd = (time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
    if (wasPlayingRef.current) audio.play();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return \`\${mins}:\${secs.toString().padStart(2, "0")}\`;
  };

  if (!audioBlob) return <div>Loading audio...</div>;

  return (
    <div className="flex w-full max-w-3xl flex-col gap-6 rounded-3xl bg-slate-800 p-8">
      <h2 className="text-2xl font-bold text-white">Audio Waveform Player</h2>

      {/* Waveform visualization (with drag-to-seek) */}
      <AudioWaveform
        blob={audioBlob}
        className="h-40 w-full rounded-xl bg-slate-950/50 p-4"
        currentTime={currentTime}
        duration={duration}
        onSeekStart={handleSeekStart}
        onSeekDrag={handleSeekDrag}
        onSeekEnd={handleSeekEnd}
        appearance={{
          barColor: "#3b82f6",
          barWidth: 1,
          barGap: 1.5,
          barRadius: 2,
          playheadColor: "#ef4444",
          playheadWidth: 3,
        }}
      />

      {/* Time display */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-400">{formatTime(currentTime)}</span>
        <span className="text-slate-500">{formatTime(duration)}</span>
      </div>

      {/* Player controls */}
      <button
        type="button"
        onClick={togglePlay}
        className="rounded-full bg-blue-500 px-6 py-3 text-white"
      >
        {isPlaying ? "Pause" : "Play"}
      </button>

      {/* Hidden audio element */}
      <audio ref={audioRef} src={audioUrl} className="hidden" />
    </div>
  );
}`,
      },
    },
  },
};
