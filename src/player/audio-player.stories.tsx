import type { Meta, StoryObj } from "@storybook/react";
import { RecordingWaveform } from "../recorder/recording-waveform";
import { useAudioRecorder } from "../recorder/use-audio-recorder";
import rawSource from "./audio-player.stories.tsx?raw";

function AudioPlayer() {
  const {
    startRecording,
    stopRecording: _,
    pauseRecording,
    resumeRecording,
    mediaRecorder,
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

  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-100">
      <div className="flex h-24 w-[480px] items-center gap-4 rounded-2xl bg-white px-5 shadow-lg">
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
            <div className="h-3 w-3 rounded-sm bg-orange-500" />
          )}
        </button>
        <div className="h-12 flex-1 overflow-hidden rounded-lg bg-slate-100">
          <RecordingWaveform mediaRecorder={mediaRecorder} className="h-full text-slate-400 [scrollbar-width:thin]" />
        </div>
      </div>
    </div>
  );
}

const meta: Meta<typeof AudioPlayer> = {
  title: "Player/AudioPlayer",
  component: AudioPlayer,
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

type Story = StoryObj<typeof AudioPlayer>;

export const Default: Story = {};
