# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

React component library for audio waveform visualization and live recording. Outputs ESM + CJS bundles with TypeScript declarations. Tree-shakable exports for optimal bundle size.

## Commands

```bash
bun run build           # Build library to dist/ (ESM, CJS, .d.ts)
bun run dev             # Watch mode for development
bun run storybook       # Run Storybook dev server (port 6006)
bun run build-storybook # Build Storybook static site
bun run check           # Check code with Biome + TypeScript (tsgo)
bun run fix             # Fix linting issues with Biome
```

**Note:** Requires Node.js 20.19+ or 22.12+ (Vite 7 requirement).

## Architecture

```
src/
├── index.tsx              # Library entry point (exports all public APIs)
├── index.css              # Tailwind import (Storybook only)
├── types.ts               # Shared appearance types (WaveformAppearance, AudioWaveformAppearance)
├── constants.ts           # Default appearance values (DEFAULT_WAVEFORM_APPEARANCE, DEFAULT_PLAYHEAD_APPEARANCE)
├── waveform/              # Static waveform visualization
│   ├── index.tsx                  # Main AudioWaveform component
│   ├── waveform-renderer.tsx      # Canvas rendering logic
│   ├── util-audio-decoder.ts      # Audio decoding (native + WASM fallback)
│   └── util-suspense.ts           # React Suspense cache
├── recorder/              # Live recording components
│   ├── live-recorder/         # Real-time frequency bars
│   │   ├── index.tsx              # LiveRecorder component
│   │   ├── live-recorder-context.tsx # Context provider
│   │   └── use-live-audio-data.ts # Headless hook
│   ├── live-streaming/        # Both timeline recorders share this folder
│   │   ├── types.ts               # Shared recorder types
│   │   ├── use-recording-amplitudes.ts # Shared headless hook
│   │   ├── recorder/              # Scrolling timeline (Voice Memos style)
│   │   │   ├── index.tsx              # Entry point
│   │   │   ├── recorder-compound.tsx  # LiveStreamingRecorder compound API
│   │   │   └── recorder-context.tsx   # Context provider
│   │   └── stack-recorder/        # Fixed width (bars compress)
│   │       ├── index.tsx              # Entry point
│   │       └── stack-recorder-compound.tsx # LiveStreamingStackRecorder simple component
│   ├── use-audio-analyser.ts # Shared Web Audio setup hook
│   ├── use-audio-recorder.ts # MediaRecorder hook with pause/resume
│   └── util-mime-type.ts     # Audio MIME type detection
└── _storybook/            # Storybook demo stories
```

**Component Architecture Pattern:**
- **Simple Components:** Direct prop-based API for easy usage (AudioWaveform, LiveStreamingStackRecorder, LiveRecorder)
- **Compound Components:** Flexible composition API for complex use cases (LiveStreamingRecorder - has Root + Canvas)
- **Headless Hooks:** `useAudioRecorder` for recording state management (only public hook)

**Build System:**
- **Build:** Vite 7 library mode with `vite-plugin-dts` for type generation
- **Styling:** Tailwind CSS v4 - classes only, no CSS bundled
- **Output:** `dist/index.js` (ESM), `dist/index.cjs` (CJS), `dist/index.d.ts` (types)
- **Externals:** React/ReactDOM are peer dependencies, not bundled
- **Linting:** Biome (lineWidth: 120, double quotes, semicolons, ES5 trailing commas)
- **Type Checking:** tsgo (TypeScript native preview with `--noEmit`)

## Code Conventions

- **File naming:** kebab-case (e.g., `audio-waveform.tsx`, `use-audio-recorder.ts`)
- **Component organization:** Feature folders contain `use-*.ts` (headless hook) and optional compound component files (`*-compound.tsx`, `*-context.tsx`)
- **Exports:** All public APIs exported from `src/index.tsx` (auto-sorted by Biome)
- **Imports:** Use relative paths; Biome auto-organizes import order
- **Commit messages:** Conventional commit format, title only (no co-authored-by, no emoji)
- **Code quality:** Always run `bun run fix` after code changes, then `bun run check` to verify
- **Comments:** Add English comments for important code sections explaining key logic

## Component API Patterns

### Simple Components

**AudioWaveform** - Static waveform visualization with playhead support:
```tsx
import { AudioWaveform } from "react-audio-wavekit";
import { useEffect, useRef, useState } from "react";

function AudioPlayer() {
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Load audio file as Blob
  useEffect(() => {
    fetch("/audio.mp3")
      .then((res) => res.blob())
      .then((blob) => {
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
      });
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
  }, [audioUrl]);

  // Seek to position when waveform is clicked
  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  if (!audioBlob) return <div>Loading...</div>;

  return (
    <div>
      {/* Waveform with playhead */}
      <AudioWaveform
        blob={audioBlob}
        className="h-40 w-full rounded-xl bg-slate-950/50 p-4"
        currentTime={currentTime}
        duration={duration}
        onSeek={handleSeek}
        appearance={{
          barColor: "#3b82f6",
          barWidth: 1,
          barGap: 1.5,
          barRadius: 2,
          playheadColor: "#ef4444",
          playheadWidth: 3,
        }}
      />

      {/* Hidden audio element */}
      <audio ref={audioRef} src={audioUrl} />
    </div>
  );
}
```

### Compound Components

**LiveStreamingRecorder** - Timeline waveform recording (scrolling, Voice Memos style):
```tsx
import { LiveStreamingRecorder, useAudioRecorder } from "react-audio-wavekit";

function RecorderExample() {
  const { startRecording, stopRecording, pauseRecording, resumeRecording, mediaRecorder, isRecording, isPaused } =
    useAudioRecorder();

  const handleRecordClick = () => {
    if (!isRecording) {
      startRecording();
    } else if (isPaused) {
      resumeRecording();
    } else {
      pauseRecording();
    }
  };

  return (
    <div className="flex items-center gap-4">
      {/* Record/Pause button */}
      <button type="button" onClick={handleRecordClick}>
        {!isRecording || isPaused ? "Record" : "Pause"}
      </button>

      {/* Timeline waveform - grows horizontally as recording progresses */}
      <LiveStreamingRecorder.Root mediaRecorder={mediaRecorder} className="h-12 w-72 rounded-sm bg-slate-100">
        <LiveStreamingRecorder.Canvas />
      </LiveStreamingRecorder.Root>

      {/* Stop button */}
      <button type="button" onClick={stopRecording} disabled={!isRecording}>
        Stop
      </button>
    </div>
  );
}
```

**LiveStreamingStackRecorder** - Fixed width waveform (bars compress as recording grows):
```tsx
import { LiveStreamingStackRecorder, useAudioRecorder } from "react-audio-wavekit";

function StackRecorderExample() {
  const { startRecording, stopRecording, mediaRecorder, isRecording } = useAudioRecorder();

  return (
    <div className="flex items-center gap-4">
      <button type="button" onClick={startRecording} disabled={isRecording}>
        Record
      </button>

      {/* Fixed width waveform - bars compress as recording grows */}
      <LiveStreamingStackRecorder
        mediaRecorder={mediaRecorder}
        className="h-12 w-72 rounded-sm bg-slate-100"
        appearance={{ barColor: "#3b82f6", barWidth: 2, barGap: 1 }}
      />

      <button type="button" onClick={stopRecording} disabled={!isRecording}>
        Stop
      </button>
    </div>
  );
}
```

### Headless Hooks

**useAudioRecorder** - Recording state management (only public hook):
- Returns: `{ startRecording, stopRecording, pauseRecording, resumeRecording, mediaRecorder, recordingBlob, isRecording, isPaused, recordingTime, error }`

**Internal hooks (not exported):**
- `useLiveAudioData` - Real-time frequency data for LiveRecorder
- `useRecordingAmplitudes` - Timeline amplitude data for streaming recorders
- `useAudioAnalyser` - Low-level Web Audio setup (shared internally)

## Key Implementation Details

- **Appearance System:** All waveform components use `appearance` prop with `WaveformAppearance` type. Defaults exported from `constants.ts`:
  - `DEFAULT_WAVEFORM_APPEARANCE`: barColor="#3b82f6", barWidth=1, barGap=1, barRadius=0, barHeightScale=0.95
  - `DEFAULT_PLAYHEAD_APPEARANCE`: playheadColor="#ef4444", playheadWidth=2
- **Audio Decoding:** Native Web Audio API first, WASM fallback (mpg123-decoder) for mobile compatibility. Supports `peaks` prop to skip decoding entirely.
- **Device Pixel Ratio:** Automatic DPR support for sharp canvas rendering on retina displays
- **Scrolling vs Fixed Width:** `LiveStreamingRecorder` uses scrolling (Voice Memos style), `LiveStreamingStackRecorder` uses fixed width (bars compress)
- **Playhead & Seek:** `AudioWaveform` supports playhead visualization and click-to-seek - pass `currentTime`, `duration`, and `onSeek` props. Uses `AudioWaveformAppearance` which extends `WaveformAppearance` with `playheadColor` and `playheadWidth`.

## Development Workflow

1. **Making Changes:**
   ```bash
   bun run dev           # Start watch mode
   bun run storybook     # Visual testing
   # Make changes...
   bun run fix           # Auto-fix linting
   bun run check         # Verify types + lint
   ```

2. **Adding New Components:**
   - Create feature folder under `recorder/` or `waveform/`
   - Include: `use-*.ts` (headless hook, recommended pattern)
   - For compound components, add `recorder/recorder-compound.tsx` and `recorder/recorder-context.tsx`
   - Export all public APIs from `src/index.tsx` (Biome auto-sorts)
   - Add Storybook story in `src/_storybook/`

3. **Git Workflow:**
   - Commit message format: `type: description` (e.g., `feat: add pitch detection`, `fix: canvas memory leak`)
   - No co-authored-by, no emoji in commits
   - Always run checks before committing

Don't worry about backward compatibility - this library is still in early development.