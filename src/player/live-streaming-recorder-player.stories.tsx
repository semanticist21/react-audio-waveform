import type { Meta, StoryObj } from "@storybook/react";
import { RecordingWaveformLegacy } from "..";
import { useAudioRecorder } from "../recorder/use-audio-recorder";
import rawSource from "./live-streaming-recorder-player.stories.tsx?raw";

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
        <RecordingWaveformLegacy
          mediaRecorder={mediaRecorder}
          className="h-12 w-72 rounded-lg bg-slate-100 text-slate-400 [scrollbar-width:thin]"
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

const meta: Meta<typeof LiveStreamingRecorderPlayer> = {
  title: "Player/LiveStreamingRecorderPlayer",
  component: LiveStreamingRecorderPlayer,
  parameters: {
    layout: "fullscreen",
    docs: {
      source: {
        code: rawSource,
        language: "tsx",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof LiveStreamingRecorderPlayer>;

export const Default: Story = {};
