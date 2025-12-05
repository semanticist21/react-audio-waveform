import type { Meta, StoryObj } from "@storybook/react";
import { useEffect, useRef } from "react";
import { LiveStreamingRecorder } from "..";
import { useAudioRecorder } from "../recorder/use-audio-recorder";

function LiveStreamingRecorderPlayer() {
  const { startRecording, stopRecording, pauseRecording, resumeRecording, mediaRecorder, isRecording, isPaused } =
    useAudioRecorder({
      // Auto browser detection: Safari uses audio/mp4, Chrome/Firefox uses audio/webm
      mimeType: () => {
        if (MediaRecorder.isTypeSupported("audio/mp4")) {
          return "audio/mp4"; // Safari
        }
        return "audio/webm"; // Chrome, Firefox, Edge
      },
      // Direct string specification (when custom logic is not needed)
      // mimeType: "audio/webm",
      onRecordingComplete: (audioBlob) => {
        // When recording completes, create Blob URL and play in new tab
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

        {/* Waveform display area */}
        <LiveStreamingRecorder
          mediaRecorder={mediaRecorder}
          className="h-12 w-72 rounded-lg bg-slate-100 text-slate-600 [scrollbar-width:thin]"
        />

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
  } = useAudioRecorder({
    mimeType: () => {
      if (MediaRecorder.isTypeSupported("audio/mp4")) {
        return "audio/mp4";
      }
      return "audio/webm";
    },
  });

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

        <LiveStreamingRecorder
          mediaRecorder={mediaRecorder}
          className="h-12 w-72 rounded-lg bg-slate-100 text-slate-600 [scrollbar-width:thin]"
        />

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
  } = useAudioRecorder({
    mimeType: () => {
      if (MediaRecorder.isTypeSupported("audio/mp4")) {
        return "audio/mp4";
      }
      return "audio/webm";
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

        <LiveStreamingRecorder
          mediaRecorder={mediaRecorder}
          className="h-12 w-72 rounded-lg bg-slate-100 text-slate-600 [scrollbar-width:thin]"
        />

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

export const Default: Story = {
  parameters: {
    docs: {
      source: {
        code: `function LiveStreamingRecorderPlayer() {
  const { startRecording, stopRecording, pauseRecording, resumeRecording, mediaRecorder, isRecording, isPaused } =
    useAudioRecorder({
      mimeType: () => {
        if (MediaRecorder.isTypeSupported("audio/mp4")) {
          return "audio/mp4"; // Safari
        }
        return "audio/webm"; // Chrome, Firefox, Edge
      },
      onRecordingComplete: (audioBlob) => {
        const audioUrl = URL.createObjectURL(audioBlob);
        window.open(audioUrl, "_blank");
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
        <LiveStreamingRecorder mediaRecorder={mediaRecorder} />
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

export const WithPlay: StoryObj<typeof LiveStreamingRecorderPlayerWithPlay> = {
  render: () => <LiveStreamingRecorderPlayerWithPlay />,
  parameters: {
    docs: {
      source: {
        code: `function LiveStreamingRecorderPlayerWithPlay() {
  const {
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    mediaRecorder,
    recordingBlob,
    isRecording,
    isPaused,
  } = useAudioRecorder({
    mimeType: () => {
      if (MediaRecorder.isTypeSupported("audio/mp4")) {
        return "audio/mp4";
      }
      return "audio/webm";
    },
  });

  const audioRef = useRef<HTMLAudioElement>(null);

  // Set blob URL to audio element when recording completes
  useEffect(() => {
    if (recordingBlob && audioRef.current) {
      const url = URL.createObjectURL(recordingBlob);
      audioRef.current.src = url;
      return () => URL.revokeObjectURL(url);
    }
  }, [recordingBlob]);

  return (
    <div>
      <div>{/* Recording controls */}</div>
      {recordingBlob && (
        <div>
          <p>Recording Complete</p>
          <audio ref={audioRef} controls />
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
        code: `function LiveStreamingRecorderPlayerWithDownload() {
  const {
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    mediaRecorder,
    recordingBlob,
    isRecording,
    isPaused,
  } = useAudioRecorder({
    mimeType: () => {
      if (MediaRecorder.isTypeSupported("audio/mp4")) {
        return "audio/mp4";
      }
      return "audio/webm";
    },
  });

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
    <div>
      <div>{/* Recording controls */}</div>
      {recordingBlob && (
        <div>
          <p>Recording Complete</p>
          <button type="button" onClick={handleDownload}>
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
