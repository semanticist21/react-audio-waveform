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
│   ├── index.tsx                  # Legacy component (deprecated)
│   ├── audio-waveform-compound.tsx # Compound component API
│   ├── audio-waveform-context.tsx  # Context provider
│   ├── use-audio-waveform.ts       # Headless hook
│   ├── waveform-renderer.tsx       # Canvas rendering logic
│   ├── util-audio-decoder.ts       # Web Audio API decoding
│   ├── util-canvas.ts              # Canvas style utilities
│   └── util-suspense.ts            # React Suspense cache
├── recorder/              # Live recording components
│   ├── live-recorder/         # Real-time frequency bars
│   │   ├── index.tsx             # Legacy component (deprecated)
│   │   └── use-live-audio-data.ts # Headless hook
│   ├── live-streaming-recorder/ # Timeline waveform (Voice Memos style)
│   │   ├── index.tsx                  # Legacy component (deprecated)
│   │   └── use-recording-amplitudes.ts # Headless hook
│   ├── use-audio-analyser.ts # Shared Web Audio setup hook
│   └── use-audio-recorder.ts # MediaRecorder hook with pause/resume
└── player/                # Storybook demo stories
    └── audio-player.stories.tsx
```

**Component Architecture Pattern:**
- **Compound Components (waveform only):** Flexible composition API with `AudioWaveform.Root`, `AudioWaveform.Canvas`, etc.
- **Headless Hooks (Recommended):** Extract raw data for custom UI implementations
- **Legacy Components (Deprecated):** All-in-one components for backwards compatibility

- **Build:** Vite 7 library mode with `vite-plugin-dts` for type generation
- **Styling:** Tailwind CSS v4 - classes only, no CSS bundled
- **Output:** `dist/index.js` (ESM), `dist/index.cjs` (CJS), `dist/index.d.ts` (types)
- **Externals:** React/ReactDOM are peer dependencies, not bundled
- **Linting:** Biome (lineWidth: 120, double quotes, semicolons, ES5 trailing commas)
- **Type Checking:** tsgo (TypeScript native preview with `--noEmit`)

## Code Conventions

- **File naming:** kebab-case (e.g., `audio-waveform.tsx`, `use-audio-recorder.ts`)
- **Component organization:** Feature folders contain `index.tsx` (legacy) and `use-*.ts` (headless hook). Waveform has additional compound component files.
- **Exports:** All public APIs exported from `src/index.tsx` (auto-sorted by Biome)
- **Imports:** Use relative paths; Biome auto-organizes import order
- **Commit messages:** Conventional commit format, title only (no co-authored-by, no emoji)
- **Code quality:** Always run `bun run fix` after code changes, then `bun run check` to verify
- **Comments:** Add Korean comments for important code sections explaining key logic

## Component API

### Compound Components (waveform only)

**AudioWaveform** - Static waveform visualization:
```tsx
<AudioWaveform.Root blob={audioBlob}>
  <AudioWaveform.Container className="h-32 bg-gray-100">
    <AudioWaveform.Canvas className="text-blue-500" />
  </AudioWaveform.Container>
</AudioWaveform.Root>
```

### Headless Hooks (Recommended for recorder components)

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
- **Bar Styling:** CSS custom properties via className `[--bar-width:3]`, `[--bar-gap:1]`, `[--bar-radius:1.5]` or `style` prop
- **Audio Decoding:** Web Audio API (`AudioContext.decodeAudioData`) for blob processing
- **Device Pixel Ratio:** Automatic DPR support for sharp canvas rendering on retina displays
- **Tailwind Integration:** Library consumers must include this package in their Tailwind `content` config
- **Shared Utilities:** `getCanvasBarStyles()` in `util-canvas.ts` extracts bar styling from CSS variables for all visualizers

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
   - For waveform components, optionally add compound component files
   - Export all public APIs from `src/index.tsx`
   - Add Storybook story in `src/player/`

3. **Git Workflow:**
   - Commit message format: `type: description` (e.g., `feat: add pitch detection`, `fix: canvas memory leak`)
   - No co-authored-by, no emoji in commits
   - Always run checks before committing