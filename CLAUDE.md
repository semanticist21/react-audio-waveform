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
├── index.tsx              # Public API exports (tree-shakable)
├── waveform/              # Static waveform visualization
│   ├── audio-waveform.tsx    # Main component (Suspense-enabled)
│   ├── waveform-renderer.tsx # Canvas rendering logic
│   ├── util-audio-decoder.ts # Web Audio API decoding
│   └── util-suspense.ts      # React Suspense cache
└── recorder/              # Live recording components
    ├── live-audio-visualizer.tsx  # Real-time frequency bars
    ├── recording-waveform.tsx     # Timeline waveform (grows over time)
    ├── use-audio-analyser.ts      # Shared Web Audio setup hook
    └── use-audio-recorder.ts      # MediaRecorder hook
```

- **Build:** Vite 7 library mode with `vite-plugin-dts` for type generation
- **Styling:** Tailwind CSS v4 - classes only, no CSS bundled
- **Output:** `dist/index.js` (ESM), `dist/index.cjs` (CJS), `dist/index.d.ts` (types)
- **Externals:** React/ReactDOM are peer dependencies, not bundled
- **Linting:** Biome for code quality, tsgo for type checking

## Code Conventions

- **File naming:** kebab-case (e.g., `audio-waveform.tsx`, `use-audio-recorder.ts`)
- **Commit messages:** Conventional commit format, title only

## Component API

**AudioWaveform** - Static waveform from audio blob:
- `blob`: Audio Blob to visualize
- `className`: Tailwind classes (`text-*` for bar color, `bg-*` for background)
- `style`: CSS variables for bar customization (`--bar-width`, `--bar-gap`, `--bar-radius`)

**LiveAudioVisualizer** - Real-time frequency bars during recording:
- `mediaRecorder`: MediaRecorder instance (from `useAudioRecorder` or standard API)
- `className`, `style`: Same Tailwind/CSS variable pattern as AudioWaveform

**RecordingWaveform** - Timeline waveform that grows as recording progresses (Voice Memos style):
- `mediaRecorder`: MediaRecorder instance
- `className`, `style`: Same pattern as other components
- `sampleInterval`: How often to sample amplitude (default: 50ms)

**useAudioRecorder** - Recording hook:
- Returns: `{ startRecording, stopRecording, mediaRecorder, recordingBlob, isRecording, recordingTime, error }`

**useAudioAnalyser** - Shared Web Audio setup (used internally by both visualizers):
- Creates AudioContext, AnalyserNode, connects MediaRecorder stream
- Returns refs for audioContext, analyser, dataArray, bufferLength

## Key Implementation Details

- Canvas uses `text-inherit` class to enable Tailwind color inheritance via `getComputedStyle(canvas).color`
- Bar styling via CSS custom properties: `[--bar-width:3]`, `[--bar-gap:1]`, `[--bar-radius:1.5]` or `style` prop
- Audio decoding uses Web Audio API (`AudioContext.decodeAudioData`)
- Device pixel ratio support for sharp canvas rendering
- Library consumers must include this package in their Tailwind `content` config