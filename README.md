# react-audio-waveform

React components for audio waveform visualization and live recording.

## Features

- **Waveform** - Visualize existing audio files with playhead and seek support
- **Recorder** - Real-time waveform visualization during recording
- **Headless Hooks** - Build custom UI with raw audio data
- **Tree-shakable** - Import only what you need
- **TypeScript** - Full type definitions included

## Installation

```bash
npm install react-audio-waveform
# or
pnpm add react-audio-waveform
# or
bun add react-audio-waveform
```

**Requirements:** React 18+

---

## Waveform

Visualize existing audio files (mp3, wav, etc.) with playhead and seek support.

### AudioWaveform

![AudioWaveform](https://react-audio-waveform.netlify.app/audio-wave-form.png)

Static waveform visualization with playhead and click-to-seek.

```tsx
import { AudioWaveform } from "react-audio-waveform";

function Player() {
  const [blob, setBlob] = useState<Blob | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    fetch("/audio.mp3")
      .then((res) => res.blob())
      .then(setBlob);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onDurationChange = () => setDuration(audio.duration);

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("durationchange", onDurationChange);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("durationchange", onDurationChange);
    };
  }, []);

  const handleSeek = (time: number) => {
    if (audioRef.current) audioRef.current.currentTime = time;
  };

  if (!blob) return null;

  return (
    <>
      <AudioWaveform
        blob={blob}
        currentTime={currentTime}
        duration={duration}
        onSeek={handleSeek}
        className="h-32 w-full"
        appearance={{
          barColor: "#3b82f6",
          barWidth: 2,
          barGap: 1,
          barRadius: 1,
          playheadColor: "#ef4444",
          playheadWidth: 2,
        }}
      />
      <audio ref={audioRef} src={URL.createObjectURL(blob)} />
    </>
  );
}
```

### useAudioWaveform

Headless hook to extract waveform amplitude data from audio blob.

```tsx
import { useAudioWaveform } from "react-audio-waveform";

function CustomWaveform({ blob }: { blob: Blob }) {
  const { peaks, isLoading, error } = useAudioWaveform({ blob });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="flex items-center gap-px h-20">
      {peaks?.map((peak, i) => (
        <div key={i} className="w-1 bg-blue-500" style={{ height: `${peak * 100}%` }} />
      ))}
    </div>
  );
}
```

---

## Recorder

Real-time waveform visualization during recording using MediaRecorder API.

### LiveStreamingRecorder

![LiveStreamingRecorder](https://react-audio-waveform.netlify.app/live-stream.png)

Scrolling timeline waveform (Voice Memos style). Canvas grows horizontally as recording continues.

```tsx
import { LiveStreamingRecorder, useAudioRecorder } from "react-audio-waveform";

function Recorder() {
  const { startRecording, stopRecording, pauseRecording, resumeRecording, mediaRecorder, isRecording, isPaused } =
    useAudioRecorder();

  return (
    <div className="flex items-center gap-4">
      <button onClick={isRecording ? (isPaused ? resumeRecording : pauseRecording) : startRecording}>
        {!isRecording || isPaused ? "Record" : "Pause"}
      </button>

      <LiveStreamingRecorder.Root mediaRecorder={mediaRecorder} className="h-12 w-72 bg-slate-100">
        <LiveStreamingRecorder.Canvas />
      </LiveStreamingRecorder.Root>

      <button onClick={stopRecording} disabled={!isRecording}>
        Stop
      </button>
    </div>
  );
}
```

### LiveStreamingStackRecorder

![LiveStreamingStackRecorder](https://react-audio-waveform.netlify.app/live-stream-stack.png)

Fixed-width waveform where bars compress as recording grows.

```tsx
import { LiveStreamingStackRecorder, useAudioRecorder } from "react-audio-waveform";

function StackRecorder() {
  const { startRecording, stopRecording, mediaRecorder, isRecording } = useAudioRecorder();

  return (
    <div className="flex items-center gap-4">
      <button onClick={startRecording} disabled={isRecording}>
        Record
      </button>

      <LiveStreamingStackRecorder.Root mediaRecorder={mediaRecorder} className="h-12 w-72 bg-slate-100">
        <LiveStreamingStackRecorder.Canvas className="text-slate-600" />
      </LiveStreamingStackRecorder.Root>

      <button onClick={stopRecording} disabled={!isRecording}>
        Stop
      </button>
    </div>
  );
}
```

### LiveRecorder

![LiveRecorder](https://react-audio-waveform.netlify.app/live-recorder.png)

Real-time frequency bars visualization.

```tsx
import { LiveRecorder, useAudioRecorder } from "react-audio-waveform";

function FrequencyRecorder() {
  const { startRecording, stopRecording, mediaRecorder, isRecording } = useAudioRecorder();

  return (
    <div className="flex items-center gap-4">
      <button onClick={startRecording} disabled={isRecording}>
        Record
      </button>

      <LiveRecorder mediaRecorder={mediaRecorder} className="h-12 w-72 bg-slate-100" />

      <button onClick={stopRecording} disabled={!isRecording}>
        Stop
      </button>
    </div>
  );
}
```

### useAudioRecorder

Headless hook to manage recording state with pause/resume support.

```tsx
import { useAudioRecorder } from "react-audio-waveform";

function RecorderControls() {
  const {
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    mediaRecorder,
    recordingBlob,
    isRecording,
    isPaused,
    recordingTime,
    error,
  } = useAudioRecorder();

  return (
    <div>
      <p>Recording: {isRecording ? "Yes" : "No"}</p>
      <p>Paused: {isPaused ? "Yes" : "No"}</p>
      <p>Time: {recordingTime}s</p>
      {recordingBlob && <audio src={URL.createObjectURL(recordingBlob)} controls />}
    </div>
  );
}
```

### useLiveAudioData

Headless hook to extract real-time frequency and volume data.

```tsx
import { useLiveAudioData } from "react-audio-waveform";

function CustomFrequencyBars({ mediaRecorder }: { mediaRecorder: MediaRecorder | null }) {
  const { frequencies, volumes, isRecording } = useLiveAudioData({ mediaRecorder });

  return (
    <div className="flex items-end gap-1 h-20">
      {frequencies.map((freq, i) => (
        <div key={i} className="w-2 bg-green-500" style={{ height: `${freq * 100}%` }} />
      ))}
    </div>
  );
}
```

### useRecordingAmplitudes

Headless hook to extract timeline amplitude data during recording.

```tsx
import { useRecordingAmplitudes } from "react-audio-waveform";

function CustomTimelineWaveform({ mediaRecorder }: { mediaRecorder: MediaRecorder | null }) {
  const { amplitudes, isRecording, clearAmplitudes } = useRecordingAmplitudes({ mediaRecorder });

  return (
    <div className="flex items-center gap-px h-20">
      {amplitudes.map((amp, i) => (
        <div key={i} className="w-1 bg-blue-500" style={{ height: `${amp * 100}%` }} />
      ))}
    </div>
  );
}
```

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

For Tailwind CSS users, colors can be passed via `currentColor`:

```tsx
<LiveStreamingStackRecorder.Canvas className="text-blue-500" />
```

---

## Browser Support

- Chrome 66+
- Firefox 76+
- Safari 14.1+
- Edge 79+

Requires Web Audio API and MediaRecorder API support.

## License

Public Domain - Free for any use.
