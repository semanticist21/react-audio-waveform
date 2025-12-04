import type { Meta, StoryObj } from "@storybook/react";
import { RecordingWaveform } from "../recorder/recording-waveform";

function AudioPlayer() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-100">
      <div className="flex h-24 w-96 items-center gap-4 rounded-2xl bg-white px-5 shadow-lg">
        <button
          type="button"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-md"
        >
          <div className="h-4 w-4 rounded-full bg-red-500" />
        </button>
        <div className="h-12 flex-1 overflow-hidden rounded-lg bg-slate-100">
          <RecordingWaveform mediaRecorder={null} className="h-full text-slate-400" />
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
  },
};

export default meta;

type Story = StoryObj<typeof AudioPlayer>;

export const Default: Story = {};
