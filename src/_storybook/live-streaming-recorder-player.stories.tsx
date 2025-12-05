import type { Meta, StoryObj } from "@storybook/react";
import { useEffect, useRef } from "react";
import { LiveStreamingRecorder } from "../recorder/live-streaming/recorder/recorder-compound";
import { useAudioRecorder } from "../recorder/use-audio-recorder";

function LiveStreamingRecorderPlayer() {
  const { startRecording, stopRecording, pauseRecording, resumeRecording, mediaRecorder, isRecording, isPaused } =
    useAudioRecorder({
      onRecordingComplete: (_audioBlob) => {
        // Uncomment to play audio in new tab when recording completes
        // const audioUrl = URL.createObjectURL(audioBlob);
        // window.open(audioUrl, "_blank");
      },
    });

  // Recording start/pause/resume button handler
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
    <div className="flex h-screen w-full items-center justify-center bg-slate-100">
      <div className="flex h-24 w-fit items-center gap-4 rounded-2xl bg-white px-5 shadow-lg">
        {/* Record/pause button */}
        <button
          type="button"
          onClick={handleRecordClick}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-md"
        >
          {!isRecording ? (
            // Start recording: red circle
            <div className="h-4 w-4 rounded-full bg-red-500" />
          ) : isPaused ? (
            // Resume from pause: red circle
            <div className="h-4 w-4 rounded-full bg-red-500" />
          ) : (
            // Pause during recording: two vertical bars
            <div className="flex gap-0.5">
              <div className="h-4 w-1 rounded-sm bg-orange-500" />
              <div className="h-4 w-1 rounded-sm bg-orange-500" />
            </div>
          )}
        </button>

        {/* Waveform display area */}
        <LiveStreamingRecorder.Root mediaRecorder={mediaRecorder} className="h-12 w-72 bg-slate-100 rounded-sm">
          <LiveStreamingRecorder.Canvas />
        </LiveStreamingRecorder.Root>

        {/* Stop button */}
        <button
          type="button"
          onClick={stopRecording}
          disabled={!isRecording}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-md disabled:opacity-40"
        >
          <div className="h-3.5 w-3.5 rounded-sm bg-slate-700" />
        </button>
      </div>
    </div>
  );
}

function LiveStreamingRecorderPlayerWithPlay() {
  const {
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    mediaRecorder,
    recordingBlob,
    isRecording,
    isPaused,
  } = useAudioRecorder();

  const audioRef = useRef<HTMLAudioElement>(null);

  // Set blob URL to audio element when recording completes
  useEffect(() => {
    if (recordingBlob && audioRef.current) {
      const url = URL.createObjectURL(recordingBlob);
      audioRef.current.src = url;
      return () => URL.revokeObjectURL(url);
    }
  }, [recordingBlob]);

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
    <div className="flex h-screen w-full flex-col items-center justify-center gap-6 bg-slate-100">
      <div className="flex h-24 w-fit items-center gap-4 rounded-2xl bg-white px-5 shadow-lg">
        <button
          type="button"
          onClick={handleRecordClick}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-md"
        >
          {!isRecording ? (
            <div className="h-4 w-4 rounded-full bg-red-500" />
          ) : isPaused ? (
            <div className="h-4 w-4 rounded-full bg-red-500" />
          ) : (
            <div className="flex gap-0.5">
              <div className="h-4 w-1 rounded-sm bg-orange-500" />
              <div className="h-4 w-1 rounded-sm bg-orange-500" />
            </div>
          )}
        </button>

        <LiveStreamingRecorder.Root mediaRecorder={mediaRecorder} className="h-12 w-72 bg-slate-100 rounded-sm">
          <LiveStreamingRecorder.Canvas className="text-slate-600" />
        </LiveStreamingRecorder.Root>

        <button
          type="button"
          onClick={stopRecording}
          disabled={!isRecording}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-md disabled:opacity-40"
        >
          <div className="h-3.5 w-3.5 rounded-sm bg-slate-700" />
        </button>
      </div>

      {/* Audio playback UI after recording completes */}
      {recordingBlob && (
        <div className="flex w-fit flex-col items-center gap-3 rounded-2xl bg-white p-5 shadow-lg">
          <p className="text-sm font-medium text-slate-700">Recording Complete</p>
          {/* biome-ignore lint/a11y/useMediaCaption: Recorded audio does not require captions */}
          <audio ref={audioRef} controls className="w-80" />
        </div>
      )}
    </div>
  );
}

function LiveStreamingRecorderPlayerWithDownload() {
  const {
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    mediaRecorder,
    recordingBlob,
    isRecording,
    isPaused,
  } = useAudioRecorder();

  const handleRecordClick = () => {
    if (!isRecording) {
      startRecording();
    } else if (isPaused) {
      resumeRecording();
    } else {
      pauseRecording();
    }
  };

  // Download button click handler
  const handleDownload = () => {
    if (!recordingBlob) return;

    const url = URL.createObjectURL(recordingBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `recording-${Date.now()}.${recordingBlob.type.includes("mp4") ? "mp4" : "webm"}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-6 bg-slate-100">
      <div className="flex h-24 w-fit items-center gap-4 rounded-2xl bg-white px-5 shadow-lg">
        <button
          type="button"
          onClick={handleRecordClick}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-md"
        >
          {!isRecording ? (
            <div className="h-4 w-4 rounded-full bg-red-500" />
          ) : isPaused ? (
            <div className="h-4 w-4 rounded-full bg-red-500" />
          ) : (
            <div className="flex gap-0.5">
              <div className="h-4 w-1 rounded-sm bg-orange-500" />
              <div className="h-4 w-1 rounded-sm bg-orange-500" />
            </div>
          )}
        </button>

        <LiveStreamingRecorder.Root mediaRecorder={mediaRecorder} className="h-12 w-72 bg-slate-100 rounded-sm">
          <LiveStreamingRecorder.Canvas className="text-slate-600" />
        </LiveStreamingRecorder.Root>

        <button
          type="button"
          onClick={stopRecording}
          disabled={!isRecording}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-md disabled:opacity-40"
        >
          <div className="h-3.5 w-3.5 rounded-sm bg-slate-700" />
        </button>
      </div>

      {/* Download UI after recording completes */}
      {recordingBlob && (
        <div className="flex w-fit flex-col items-center gap-3 rounded-2xl bg-white p-5 shadow-lg">
          <p className="text-sm font-medium text-slate-700">Recording Complete</p>
          <button
            type="button"
            onClick={handleDownload}
            className="rounded-lg bg-blue-500 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-600"
          >
            Download Recording
          </button>
        </div>
      )}
    </div>
  );
}

const meta: Meta<typeof LiveStreamingRecorderPlayer> = {
  title: "Recorder/LiveStreamingRecorder",
  component: LiveStreamingRecorderPlayer,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;

type Story = StoryObj<typeof LiveStreamingRecorderPlayer>;

// Extended type for Playground story (waveform + scrollbar + analyser options)
interface PlaygroundArgs {
  // Waveform appearance
  barColor: string;
  barWidth: number;
  barGap: number;
  barRadius: number;
  barRadiusFull: boolean;
  barHeightScale: number;
  // Scrollbar appearance
  scrollbarThumbColor: string;
  scrollbarHidden: boolean;
  // Analyser options
  fftSize: number;
  smoothingTimeConstant: number;
  sampleInterval: number;
}

// Playground story: Adjust appearance properties in Controls panel
export const Playground: StoryObj<PlaygroundArgs> = {
  render: (args) => {
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
      <div className="flex h-screen w-full items-center justify-center bg-slate-100">
        <div className="flex h-24 w-fit items-center gap-4 rounded-2xl bg-white px-5 shadow-lg">
          <button
            type="button"
            onClick={handleRecordClick}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-md"
          >
            {!isRecording ? (
              <div className="h-4 w-4 rounded-full bg-red-500" />
            ) : isPaused ? (
              <div className="h-4 w-4 rounded-full bg-red-500" />
            ) : (
              <div className="flex gap-0.5">
                <div className="h-4 w-1 rounded-sm bg-orange-500" />
                <div className="h-4 w-1 rounded-sm bg-orange-500" />
              </div>
            )}
          </button>

          <LiveStreamingRecorder.Root
            mediaRecorder={mediaRecorder}
            className="h-12 w-72 rounded-sm bg-slate-100"
            fftSize={args.fftSize}
            smoothingTimeConstant={args.smoothingTimeConstant}
            sampleInterval={args.sampleInterval}
            appearance={{
              scrollbar: {
                thumbColor: args.scrollbarThumbColor,
                hidden: args.scrollbarHidden,
              },
            }}
          >
            <LiveStreamingRecorder.Canvas
              appearance={{
                barColor: args.barColor,
                barWidth: args.barWidth,
                barGap: args.barGap,
                barRadius: args.barRadiusFull ? args.barWidth / 2 : args.barRadius,
                barHeightScale: args.barHeightScale,
              }}
            />
          </LiveStreamingRecorder.Root>

          <button
            type="button"
            onClick={stopRecording}
            disabled={!isRecording}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-md disabled:opacity-40"
          >
            <div className="h-3.5 w-3.5 rounded-sm bg-slate-700" />
          </button>
        </div>
      </div>
    );
  },
  args: {
    // Waveform
    barColor: "#3b82f6",
    barWidth: 3,
    barGap: 2,
    barRadius: 1.5,
    barRadiusFull: false,
    barHeightScale: 0.95,
    // Scrollbar
    scrollbarThumbColor: "rgba(148, 163, 184, 0.5)",
    scrollbarHidden: false,
    // Analyser
    fftSize: 2048,
    smoothingTimeConstant: 0.8,
    sampleInterval: 50,
  },
  argTypes: {
    // Waveform
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
    // Scrollbar
    scrollbarThumbColor: { control: "color", description: "Scrollbar thumb color" },
    scrollbarHidden: { control: "boolean", description: "Hide scrollbar" },
    // Analyser
    fftSize: {
      control: { type: "select" },
      options: [256, 512, 1024, 2048, 4096],
      description: "FFT size (higher = more detail, more CPU)",
    },
    smoothingTimeConstant: {
      control: { type: "range", min: 0, max: 1, step: 0.05 },
      description: "Smoothing (0 = no smoothing, 1 = max)",
    },
    sampleInterval: {
      control: { type: "range", min: 10, max: 200, step: 10 },
      description: "Sample interval in ms (lower = more bars)",
    },
  },
  parameters: {
    layout: "fullscreen",
    docs: {
      source: {
        code: `import { LiveStreamingRecorder, useAudioRecorder } from "react-audio-wavekit";

const { mediaRecorder } = useAudioRecorder();

<LiveStreamingRecorder.Root
  mediaRecorder={mediaRecorder}
  className="h-12 w-72 rounded-sm bg-slate-100"
  fftSize={2048}
  smoothingTimeConstant={0.8}
  sampleInterval={50}
  appearance={{
    scrollbar: {
      thumbColor: "rgba(148, 163, 184, 0.5)",
      hidden: false,
    },
  }}
>
  <LiveStreamingRecorder.Canvas
    appearance={{
      barColor: "#3b82f6",
      barWidth: 3,
      barGap: 2,
      barRadius: 1.5,
      barHeightScale: 0.95,
    }}
  />
</LiveStreamingRecorder.Root>`,
      },
    },
  },
};

export const Default: Story = {
  parameters: {
    docs: {
      source: {
        code: `import { LiveStreamingRecorder, useAudioRecorder } from "react-audio-wavekit";

function LiveStreamingRecorderPlayer() {
  const { startRecording, stopRecording, pauseRecording, resumeRecording, mediaRecorder, isRecording, isPaused } =
    useAudioRecorder({
      onRecordingComplete: (audioBlob) => {
        // Handle recording completion
        const audioUrl = URL.createObjectURL(audioBlob);
        window.open(audioUrl, "_blank");
      },
    });

  // Recording start/pause/resume button handler
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
    <div className="flex h-screen w-full items-center justify-center bg-slate-100">
      <div className="flex h-24 w-fit items-center gap-4 rounded-2xl bg-white px-5 shadow-lg">
        {/* Record/pause button */}
        <button
          type="button"
          onClick={handleRecordClick}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-md"
        >
          {!isRecording ? (
            // Start recording: red circle
            <div className="h-4 w-4 rounded-full bg-red-500" />
          ) : isPaused ? (
            // Resume from pause: red circle
            <div className="h-4 w-4 rounded-full bg-red-500" />
          ) : (
            // Pause during recording: two vertical bars
            <div className="flex gap-0.5">
              <div className="h-4 w-1 rounded-sm bg-orange-500" />
              <div className="h-4 w-1 rounded-sm bg-orange-500" />
            </div>
          )}
        </button>

        {/* Timeline waveform (scrolls as recording progresses) */}
        <LiveStreamingRecorder.Root mediaRecorder={mediaRecorder} className="h-12 w-72 rounded-sm bg-slate-100">
          <LiveStreamingRecorder.Canvas />
        </LiveStreamingRecorder.Root>

        {/* Stop button */}
        <button
          type="button"
          onClick={stopRecording}
          disabled={!isRecording}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-md disabled:opacity-40"
        >
          <div className="h-3.5 w-3.5 rounded-sm bg-slate-700" />
        </button>
      </div>
    </div>
  );
}`,
      },
    },
  },
};

export const WithPlay: StoryObj<typeof LiveStreamingRecorderPlayerWithPlay> = {
  render: () => <LiveStreamingRecorderPlayerWithPlay />,
  parameters: {
    docs: {
      source: {
        code: `import { useEffect, useRef } from "react";
import { LiveStreamingRecorder, useAudioRecorder } from "react-audio-wavekit";

function LiveStreamingRecorderPlayerWithPlay() {
  const {
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    mediaRecorder,
    recordingBlob,
    isRecording,
    isPaused,
  } = useAudioRecorder();

  const audioRef = useRef<HTMLAudioElement>(null);

  // Set blob URL to audio element when recording completes
  useEffect(() => {
    if (recordingBlob && audioRef.current) {
      const url = URL.createObjectURL(recordingBlob);
      audioRef.current.src = url;
      return () => URL.revokeObjectURL(url);
    }
  }, [recordingBlob]);

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
    <div className="flex h-screen w-full flex-col items-center justify-center gap-6 bg-slate-100">
      <div className="flex h-24 w-fit items-center gap-4 rounded-2xl bg-white px-5 shadow-lg">
        <button
          type="button"
          onClick={handleRecordClick}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-md"
        >
          {!isRecording ? (
            <div className="h-4 w-4 rounded-full bg-red-500" />
          ) : isPaused ? (
            <div className="h-4 w-4 rounded-full bg-red-500" />
          ) : (
            <div className="flex gap-0.5">
              <div className="h-4 w-1 rounded-sm bg-orange-500" />
              <div className="h-4 w-1 rounded-sm bg-orange-500" />
            </div>
          )}
        </button>

        <LiveStreamingRecorder.Root mediaRecorder={mediaRecorder} className="h-12 w-72 rounded-sm bg-slate-100">
          <LiveStreamingRecorder.Canvas className="text-slate-600" />
        </LiveStreamingRecorder.Root>

        <button
          type="button"
          onClick={stopRecording}
          disabled={!isRecording}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-md disabled:opacity-40"
        >
          <div className="h-3.5 w-3.5 rounded-sm bg-slate-700" />
        </button>
      </div>

      {/* Audio playback UI after recording completes */}
      {recordingBlob && (
        <div className="flex w-fit flex-col items-center gap-3 rounded-2xl bg-white p-5 shadow-lg">
          <p className="text-sm font-medium text-slate-700">Recording Complete</p>
          <audio ref={audioRef} controls className="w-80" />
        </div>
      )}
    </div>
  );
}`,
      },
    },
  },
};

export const WithDownload: StoryObj<typeof LiveStreamingRecorderPlayerWithDownload> = {
  render: () => <LiveStreamingRecorderPlayerWithDownload />,
  parameters: {
    docs: {
      source: {
        code: `import { LiveStreamingRecorder, useAudioRecorder } from "react-audio-wavekit";

function LiveStreamingRecorderPlayerWithDownload() {
  const {
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    mediaRecorder,
    recordingBlob,
    isRecording,
    isPaused,
  } = useAudioRecorder();

  const handleRecordClick = () => {
    if (!isRecording) {
      startRecording();
    } else if (isPaused) {
      resumeRecording();
    } else {
      pauseRecording();
    }
  };

  // Download button click handler
  const handleDownload = () => {
    if (!recordingBlob) return;

    const url = URL.createObjectURL(recordingBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = \`recording-\${Date.now()}.\${recordingBlob.type.includes("mp4") ? "mp4" : "webm"}\`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-6 bg-slate-100">
      <div className="flex h-24 w-fit items-center gap-4 rounded-2xl bg-white px-5 shadow-lg">
        <button
          type="button"
          onClick={handleRecordClick}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-md"
        >
          {!isRecording ? (
            <div className="h-4 w-4 rounded-full bg-red-500" />
          ) : isPaused ? (
            <div className="h-4 w-4 rounded-full bg-red-500" />
          ) : (
            <div className="flex gap-0.5">
              <div className="h-4 w-1 rounded-sm bg-orange-500" />
              <div className="h-4 w-1 rounded-sm bg-orange-500" />
            </div>
          )}
        </button>

        <LiveStreamingRecorder.Root mediaRecorder={mediaRecorder} className="h-12 w-72 rounded-sm bg-slate-100">
          <LiveStreamingRecorder.Canvas className="text-slate-600" />
        </LiveStreamingRecorder.Root>

        <button
          type="button"
          onClick={stopRecording}
          disabled={!isRecording}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-md disabled:opacity-40"
        >
          <div className="h-3.5 w-3.5 rounded-sm bg-slate-700" />
        </button>
      </div>

      {/* Download UI after recording completes */}
      {recordingBlob && (
        <div className="flex w-fit flex-col items-center gap-3 rounded-2xl bg-white p-5 shadow-lg">
          <p className="text-sm font-medium text-slate-700">Recording Complete</p>
          <button
            type="button"
            onClick={handleDownload}
            className="rounded-lg bg-blue-500 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-600"
          >
            Download Recording
          </button>
        </div>
      )}
    </div>
  );
}`,
      },
    },
  },
};
