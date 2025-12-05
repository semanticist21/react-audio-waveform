# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

React component library for audio waveform visualization and live recording. Outputs ESM + CJS bundles with TypeScript declarations. Tree-shakable exports for optimal bundle size.

## Commands

```bash
bun run build           # Build library to dist/ (ESM, CJS, .d.ts)
bun run dev             # Watch mode for development
bun run storybook       # Run Storybook dev server (port 6006)
bun run build-storybook # Build Storybook for production
bun run check           # Check code with Biome + TypeScript (tsgo)
bun run fix             # Fix linting issues with Biome
```

**Note:** Requires Node.js 20.19+ or 22.12+ (Vite 7 requirement).

## Architecture

```
src/
├── index.tsx              # Library entry point (exports all public APIs)
├── index.css              # Tailwind import (Storybook only)
├── waveform/              # Static waveform visualization
│   ├── index.tsx                  # Main AudioWaveform component
│   ├── use-audio-waveform.ts       # Headless hook
│   ├── waveform-renderer.tsx       # Canvas rendering logic
│   ├── util-audio-decoder.ts       # Web Audio API decoding
│   ├── util-canvas.ts              # Canvas style utilities
│   └── util-suspense.ts            # React Suspense cache
├── recorder/              # Live recording components
│   ├── live-recorder/         # Real-time frequency bars
│   │   ├── index.tsx             # Legacy component (deprecated)
│   │   └── use-live-audio-data.ts # Headless hook
│   ├── live-streaming-recorder/ # Timeline waveform (scrolling, Voice Memos style)
│   │   ├── index.tsx                  # Legacy component (deprecated)
│   │   ├── live-streaming-recorder-compound.tsx # Compound component API
│   │   ├── live-streaming-recorder-context.tsx  # Context provider
│   │   └── use-recording-amplitudes.ts # Headless hook
│   ├── live-streaming-stack-recorder/ # Fixed width waveform (bars compress)
│   │   ├── index.tsx                  # Legacy component (deprecated)
│   │   ├── live-streaming-stack-recorder-compound.tsx # Compound component API
│   │   └── live-streaming-stack-recorder-context.tsx  # Context provider
│   ├── use-audio-analyser.ts # Shared Web Audio setup hook
│   └── use-audio-recorder.ts # MediaRecorder hook with pause/resume
└── _storybook/            # Storybook demo stories
    ├── audio-waveform.stories.tsx
    ├── live-recorder-player.stories.tsx
    ├── live-streaming-recorder-player.stories.tsx
    └── live-streaming-stack-recorder-player.stories.tsx
```

**Component Architecture Pattern:**
- **Simple Components:** Direct prop-based API for easy usage (AudioWaveform)
- **Compound Components:** Flexible composition API for complex use cases (LiveStreamingRecorder, LiveStreamingStackRecorder)
- **Headless Hooks (Recommended):** Extract raw data for custom UI implementations
- **Legacy Components (Deprecated):** All-in-one components for backwards compatibility

**Build System:**
- **Build:** Vite 7 library mode with `vite-plugin-dts` for type generation
- **Styling:** Tailwind CSS v4 - classes only, no CSS bundled
- **Output:** `dist/index.js` (ESM), `dist/index.cjs` (CJS), `dist/index.d.ts` (types)
- **Externals:** React/ReactDOM are peer dependencies, not bundled
- **Linting:** Biome (lineWidth: 120, double quotes, semicolons, ES5 trailing commas)
- **Type Checking:** tsgo (TypeScript native preview with `--noEmit`)

## Code Conventions

- **File naming:** kebab-case (e.g., `audio-waveform.tsx`, `use-audio-recorder.ts`)
- **Component organization:** Feature folders contain `index.tsx` (legacy), `use-*.ts` (headless hook), and optional compound component files
- **Exports:** All public APIs exported from `src/index.tsx` (auto-sorted by Biome)
- **Imports:** Use relative paths; Biome auto-organizes import order
- **Commit messages:** Conventional commit format, title only (no co-authored-by, no emoji)
- **Code quality:** Always run `bun run fix` after code changes, then `bun run check` to verify
- **Comments:** Add Korean comments for important code sections explaining key logic

## Component API Patterns

### Simple Components

**AudioWaveform** - Static waveform visualization with playhead support:
```tsx
// Basic usage
<div className="h-32 bg-gray-100">
  <AudioWaveform blob={audioBlob} className="h-full text-blue-500" />
</div>

// With playhead and seek
<div className="h-32 bg-gray-100">
  <AudioWaveform
    blob={audioBlob}
    className="h-full text-blue-500"
    currentTime={audioElement.currentTime}
    duration={audioElement.duration}
    onSeek={(time) => audioElement.currentTime = time}
    playheadColor="#ef4444"
    playheadWidth={2}
  />
</div>

// Custom bar styling
<div className="h-32 bg-gray-100">
  <AudioWaveform
    blob={audioBlob}
    className="h-full text-green-500"
    barConfig={{ width: 5, gap: 2, radius: 2 }}
  />
</div>
```

### Compound Components

**LiveStreamingRecorder** - Timeline waveform recording (scrolling):
```tsx
<LiveStreamingRecorder.Root
  mediaRecorder={mediaRecorder}
  className="w-72 overflow-x-auto"
>
  <LiveStreamingRecorder.Canvas
    className="text-blue-500"
    barConfig={{ width: 3, gap: 1, radius: 1.5 }}
    growWidth={true}
  />
</LiveStreamingRecorder.Root>
```

**LiveStreamingStackRecorder** - Fixed width waveform (bars compress):
```tsx
<LiveStreamingStackRecorder.Root
  mediaRecorder={mediaRecorder}
  className="w-72"
>
  <LiveStreamingStackRecorder.Canvas
    className="text-blue-500"
    barConfig={{ width: 3, gap: 1, radius: 1.5 }}
  />
</LiveStreamingStackRecorder.Root>
```

### Headless Hooks

**useAudioRecorder** - Recording state management:
- Returns: `{ startRecording, stopRecording, pauseRecording, resumeRecording, mediaRecorder, recordingBlob, isRecording, isPaused, recordingTime, error }`

**useAudioWaveform** - Extract waveform data from audio blob:
- Returns: `{ amplitudes, isLoading, error }`

**useLiveAudioData** - Extract real-time frequency data:
- Returns: `{ frequencies, volumes, audioContext, analyser, isRecording, isPaused }`

**useRecordingAmplitudes** - Extract timeline amplitude data:
- Returns: `{ amplitudes, audioContext, analyser, isRecording, isPaused, clearAmplitudes }`

**useAudioAnalyser** - Low-level Web Audio setup (shared internally):
- Creates AudioContext, AnalyserNode, connects MediaRecorder stream
- Returns refs for audioContext, analyser, dataArray, bufferLength

## Key Implementation Details

- **Canvas Color Inheritance:** Canvas uses `text-inherit` class to enable Tailwind color inheritance via `getComputedStyle(canvas).color`
- **Bar Styling:** CSS custom properties via className `[--bar-width:3]`, `[--bar-gap:1]`, `[--bar-radius:1.5]` or `style` prop, or direct `barConfig`/`barStyle` props
- **Audio Decoding:** Web Audio API (`AudioContext.decodeAudioData`) for blob processing
- **Device Pixel Ratio:** Automatic DPR support for sharp canvas rendering on retina displays
- **Tailwind Integration:** Library consumers must include this package in their Tailwind `content` config
- **Shared Utilities:** `getCanvasBarStyles()` in `util-canvas.ts` extracts bar styling from CSS variables for all visualizers
- **Growing Canvas Width:** `LiveStreamingRecorder.Canvas` supports `growWidth` prop - when true, canvas grows horizontally as recording continues (Voice Memos style with scrolling)
- **Playhead & Seek:** `AudioWaveform` supports playhead visualization and click-to-seek - pass `currentTime`, `duration`, and `onSeek` props. Playhead automatically calculates position and renders as a vertical line. Canvas becomes clickable when `onSeek` is provided.

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
   - Include: `index.tsx` (legacy) and `use-*.ts` (headless hook)
   - For compound components, add `*-compound.tsx` and `*-context.tsx`
   - Export all public APIs from `src/index.tsx`
   - Add Storybook story in `src/_storybook/`

3. **Git Workflow:**
   - Commit message format: `type: description` (e.g., `feat: add pitch detection`, `fix: canvas memory leak`)
   - No co-authored-by, no emoji in commits
   - Always run checks before committing