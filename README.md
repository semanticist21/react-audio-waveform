# react-audio-wavekit

React components for audio waveform visualization and live recording.

## Features

- **Full TypeScript** - Complete type safety with detailed type definitions
- **Easy to Use** - Simple API with sensible defaults, works out of the box
- **Headless Hooks** - Full control with raw audio data for custom implementations
- **SSR Safe** - Compatible with Next.js and other SSR frameworks

## Installation

```bash
npm install react-audio-wavekit
# or
pnpm add react-audio-wavekit
# or
bun add react-audio-wavekit
```

**Requirements:** React 18+, Web Audio API, MediaRecorder API

---

## Waveform

Visualize existing audio files (mp3, wav, etc.) with playhead and seek support.

### AudioWaveform

![AudioWaveform](https://react-audio-wavekit.netlify.app/audio-wave-form.png)

Static waveform visualization with playhead and click-to-seek.

[▶ Demo](https://react-audio-wavekit.netlify.app/?path=/story/waveform-audiowaveform--default)

```tsx
<AudioWaveform
  blob={audioBlob}
  currentTime={currentTime}
  duration={duration}
  onSeek={(time) => (audioRef.current.currentTime = time)}
/>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `blob` | `Blob \| null` | - | Audio blob to visualize (required) |
| `currentTime` | `number` | - | Current playback time in seconds |
| `duration` | `number` | - | Total audio duration in seconds |
| `onSeek` | `(time: number) => void` | - | Callback when user clicks on waveform |
| `suspense` | `boolean` | `false` | Enable React Suspense mode |
| `appearance` | `AudioWaveformAppearance` | - | See [Appearance Options](#appearance-options) |

---

## Recorder

Real-time waveform visualization during recording using MediaRecorder API.

### useAudioRecorder

Headless hook to manage recording state. Use with recorder components below.

**Config:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `mimeType` | `string \| (() => string)` | auto | MIME type for recording |
| `audioConstraints` | `MediaTrackConstraints \| boolean` | `true` | Audio constraints for getUserMedia |
| `onRecordingComplete` | `(blob: Blob) => void` | - | Callback when recording is complete |

**Returns:**

| Property | Type | Description |
|----------|------|-------------|
| `startRecording` | `() => Promise<void>` | Start recording from microphone |
| `stopRecording` | `() => void` | Stop recording and generate blob |
| `pauseRecording` | `() => void` | Pause current recording |
| `resumeRecording` | `() => void` | Resume paused recording |
| `clearRecording` | `() => void` | Clear recording and reset state |
| `mediaRecorder` | `MediaRecorder \| null` | MediaRecorder instance |
| `recordingBlob` | `Blob \| null` | Recorded audio blob |
| `recordingTime` | `number` | Recording duration in seconds |
| `isRecording` | `boolean` | Whether currently recording |
| `isPaused` | `boolean` | Whether recording is paused |
| `error` | `Error \| null` | Any error that occurred |

### LiveStreamingRecorder

![LiveStreamingRecorder](https://react-audio-wavekit.netlify.app/live-stream.png)

Scrolling timeline waveform (Voice Memos style). Canvas grows horizontally as recording continues.

[▶ Demo](https://react-audio-wavekit.netlify.app/?path=/story/recorder-livestreamingrecorder--default)

```tsx
<LiveStreamingRecorder.Root
  mediaRecorder={mediaRecorder}
  className="h-12 w-80 rounded bg-slate-100"
  appearance={{ scrollbar: { thumbColor: "#94a3b8" } }}
>
  <LiveStreamingRecorder.Canvas
    appearance={{ barColor: "#3b82f6", barWidth: 2, barGap: 1 }}
    growWidth={true}
  />
</LiveStreamingRecorder.Root>
```

**Root Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `mediaRecorder` | `MediaRecorder \| null` | - | MediaRecorder instance (required) |
| `fftSize` | `number` | `2048` | FFT size for frequency analysis |
| `smoothingTimeConstant` | `number` | `0.8` | Smoothing constant (0-1) |
| `sampleInterval` | `number` | `50` | Sample interval in ms |
| `appearance` | `LiveStreamingRecorderAppearance` | - | See [Appearance Options](#appearance-options) |

**Canvas Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `growWidth` | `boolean` | `true` | Canvas grows horizontally (enables scrolling) |
| `appearance` | `WaveformAppearance` | - | See [Appearance Options](#appearance-options) |

### LiveStreamingStackRecorder

![LiveStreamingStackRecorder](https://react-audio-wavekit.netlify.app/live-stream-stack.png)

Fixed-width waveform where bars compress as recording grows.

[▶ Demo](https://react-audio-wavekit.netlify.app/?path=/story/recorder-livestreamingstackrecorder--default)

```tsx
<LiveStreamingStackRecorder
  mediaRecorder={mediaRecorder}
  className="h-12 w-80 rounded bg-slate-100"
  appearance={{ barColor: "#3b82f6", barWidth: 2, barGap: 1 }}
/>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `mediaRecorder` | `MediaRecorder \| null` | - | MediaRecorder instance (required) |
| `fftSize` | `number` | `2048` | FFT size for frequency analysis |
| `smoothingTimeConstant` | `number` | `0.8` | Smoothing constant (0-1) |
| `sampleInterval` | `number` | `50` | Sample interval in ms |
| `appearance` | `WaveformAppearance` | - | See [Appearance Options](#appearance-options) |

### LiveRecorder

![LiveRecorder](https://react-audio-wavekit.netlify.app/live-recorder.png)

Real-time frequency bars visualization.

[▶ Demo](https://react-audio-wavekit.netlify.app/?path=/story/recorder-liverecorder--default)

```tsx
<LiveRecorder mediaRecorder={mediaRecorder} />
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `mediaRecorder` | `MediaRecorder \| null` | - | MediaRecorder instance (required) |
| `fftSize` | `number` | `2048` | FFT size for frequency analysis |
| `smoothingTimeConstant` | `number` | `0.8` | Smoothing constant (0-1) |
| `showIdleState` | `boolean` | `true` | Show minimal bars when not recording |
| `appearance` | `WaveformAppearance` | - | See [Appearance Options](#appearance-options) |

---

## Appearance Options

### WaveformAppearance

Common appearance options for all waveform components.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `barColor` | `string` | `"#3b82f6"` | Color of waveform bars |
| `barWidth` | `number` | `1` | Width of each bar in pixels |
| `barGap` | `number` | `1` | Gap between bars in pixels |
| `barRadius` | `number` | `0` | Border radius of bars |
| `barHeightScale` | `number` | `0.95` | Scale factor for bar height (0-1) |

### AudioWaveformAppearance

Extends `WaveformAppearance` with playhead options.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `playheadColor` | `string` | `"#ef4444"` | Color of the playhead line |
| `playheadWidth` | `number` | `2` | Width of the playhead line |

### ScrollbarAppearance

Options for scrollbar in `LiveStreamingRecorder`.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `thumbColor` | `string` | `"rgba(148, 163, 184, 0.5)"` | Scrollbar thumb color |
| `hidden` | `boolean` | `false` | Hide scrollbar completely |

---

## Styling

Components accept `className`, `style`, and all standard canvas HTML attributes.

```tsx
<AudioWaveform
  blob={blob}
  className="h-32 w-full rounded-lg bg-slate-900 p-4"
  appearance={{
    barColor: "#3b82f6",
    barWidth: 2,
    barGap: 1,
    barRadius: 1,
    playheadColor: "#ef4444",
    playheadWidth: 2,
  }}
/>
```

---

## License

[CC0 1.0](./LICENSE) - Public Domain
