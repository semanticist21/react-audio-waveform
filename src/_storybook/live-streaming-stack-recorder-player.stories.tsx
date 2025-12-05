import type { Meta, StoryObj } from "@storybook/react";
import { useEffect, useRef } from "react";
import { LiveStreamingStackRecorder } from "../recorder/live-streaming/stack-recorder/stack-recorder-compound";
import { useAudioRecorder } from "../recorder/use-audio-recorder";

function LiveStreamingStackRecorderPlayer() {
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

        {/* Fixed width waveform (bars compress as recording grows) */}
        <LiveStreamingStackRecorder.Root mediaRecorder={mediaRecorder} className="h-12 w-72 bg-slate-100 rounded-sm">
          <LiveStreamingStackRecorder.Canvas className="text-slate-600" />
        </LiveStreamingStackRecorder.Root>

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

const meta: Meta<typeof LiveStreamingStackRecorderPlayer> = {
  title: "Recorder/LiveStreamingStackRecorder",
  component: LiveStreamingStackRecorderPlayer,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;

type Story = StoryObj<typeof LiveStreamingStackRecorderPlayer>;

export const Default: Story = {
  parameters: {
    docs: {
      source: {
        code: `function LiveStreamingStackRecorderPlayer() {
  const { startRecording, stopRecording, pauseRecording, resumeRecording, mediaRecorder, isRecording, isPaused } =
    useAudioRecorder({
      onRecordingComplete: (audioBlob) => {
        // Uncomment to play audio in new tab when recording completes
        // const audioUrl = URL.createObjectURL(audioBlob);
        // window.open(audioUrl, "_blank");
      },
    });

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
        <button type="button" onClick={handleRecordClick}>
          {/* Record/pause button UI */}
        </button>

        {/* Fixed width waveform (bars compress as recording grows) */}
        <LiveStreamingStackRecorder.Root mediaRecorder={mediaRecorder} className="h-12 w-72 bg-slate-100 rounded-sm">
          <LiveStreamingStackRecorder.Canvas className="text-slate-600" />
        </LiveStreamingStackRecorder.Root>

        <button type="button" onClick={stopRecording} disabled={!isRecording}>
          {/* Stop button UI */}
        </button>
      </div>
    </div>
  );
}`,
      },
    },
  },
};

function LiveStreamingStackRecorderPlayerWithPlay() {
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

        <LiveStreamingStackRecorder.Root mediaRecorder={mediaRecorder} className="h-12 w-72 rounded-sm bg-slate-100">
          <LiveStreamingStackRecorder.Canvas />
        </LiveStreamingStackRecorder.Root>

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

export const WithPlay: StoryObj<typeof LiveStreamingStackRecorderPlayerWithPlay> = {
  render: () => <LiveStreamingStackRecorderPlayerWithPlay />,
  parameters: {
    docs: {
      source: {
        code: `function LiveStreamingStackRecorderPlayerWithPlay() {
  const { startRecording, stopRecording, pauseRecording, resumeRecording, mediaRecorder, recordingBlob, isRecording, isPaused } =
    useAudioRecorder();

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
        <button type="button" onClick={handleRecordClick}>
          {/* Record/pause button UI */}
        </button>

        <LiveStreamingStackRecorder.Root mediaRecorder={mediaRecorder} className="h-12 w-72 rounded-sm bg-slate-100">
          <LiveStreamingStackRecorder.Canvas />
        </LiveStreamingStackRecorder.Root>

        <button type="button" onClick={stopRecording} disabled={!isRecording}>
          {/* Stop button UI */}
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

function LiveStreamingStackRecorderPlayerWithDownload() {
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

        <LiveStreamingStackRecorder.Root mediaRecorder={mediaRecorder} className="h-12 w-72 rounded-sm bg-slate-100">
          <LiveStreamingStackRecorder.Canvas className="text-slate-600" />
        </LiveStreamingStackRecorder.Root>

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

export const WithDownload: StoryObj<typeof LiveStreamingStackRecorderPlayerWithDownload> = {
  render: () => <LiveStreamingStackRecorderPlayerWithDownload />,
  parameters: {
    docs: {
      source: {
        code: `function LiveStreamingStackRecorderPlayerWithDownload() {
  const { startRecording, stopRecording, pauseRecording, resumeRecording, mediaRecorder, recordingBlob, isRecording, isPaused } =
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
        <button type="button" onClick={handleRecordClick}>
          {/* Record/pause button UI */}
        </button>

        <LiveStreamingStackRecorder.Root mediaRecorder={mediaRecorder} className="h-12 w-72 rounded-sm bg-slate-100">
          <LiveStreamingStackRecorder.Canvas className="text-slate-600" />
        </LiveStreamingStackRecorder.Root>

        <button type="button" onClick={stopRecording} disabled={!isRecording}>
          {/* Stop button UI */}
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
