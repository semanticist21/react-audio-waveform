# react-audio-waveform

React components for audio waveform visualization and live recording.

## Features

- **Full TypeScript** - Complete type safety with detailed type definitions
- **Easy to Use** - Simple API with sensible defaults, works out of the box
- **Headless Hooks** - Full control with raw audio data for custom implementations
- **SSR Safe** - Compatible with Next.js and other SSR frameworks

## Installation

```bash
npm install react-audio-waveform
# or
pnpm add react-audio-waveform
# or
bun add react-audio-waveform
```

**Requirements:** React 18+, Web Audio API, MediaRecorder API

---

## Waveform

Visualize existing audio files (mp3, wav, etc.) with playhead and seek support.

### AudioWaveform

![AudioWaveform](https://react-audio-waveform.netlify.app/audio-wave-form.png)

Static waveform visualization with playhead and click-to-seek.

[▶ Demo](https://react-audio-waveform.netlify.app/?path=/story/waveform-audiowaveform--default)

---

## Recorder

Real-time waveform visualization during recording using MediaRecorder API.

### LiveStreamingRecorder

![LiveStreamingRecorder](https://react-audio-waveform.netlify.app/live-stream.png)

Scrolling timeline waveform (Voice Memos style). Canvas grows horizontally as recording continues.

[▶ Demo](https://react-audio-waveform.netlify.app/?path=/story/recorder-livestreamingrecorder--default)

### LiveStreamingStackRecorder

![LiveStreamingStackRecorder](https://react-audio-waveform.netlify.app/live-stream-stack.png)

Fixed-width waveform where bars compress as recording grows.

[▶ Demo](https://react-audio-waveform.netlify.app/?path=/story/recorder-livestreamingstackrecorder--default)

### LiveRecorder

![LiveRecorder](https://react-audio-waveform.netlify.app/live-recorder.png)

Real-time frequency bars visualization.

[▶ Demo](https://react-audio-waveform.netlify.app/?path=/story/recorder-liverecorder--default)

### useAudioRecorder

Headless hook to manage recording state with pause/resume support.

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
| `thumbColor` | `string` | `"#94a3b8"` | Scrollbar thumb color |
| `trackColor` | `string` | `"transparent"` | Scrollbar track color |
| `thumbHoverColor` | `string` | `"#64748b"` | Thumb color on hover |
| `thickness` | `number` | `6` | Scrollbar thickness in pixels |

---

## Styling

Components accept `className` and `style` props. They render canvas elements that can be styled with CSS.

```tsx
<AudioWaveform
  blob={blob}
  className="h-32 w-full rounded-lg bg-slate-900 p-4"
/>
```

---

## License

[CC0 1.0](./LICENSE) - Public Domain
