import type { Meta, StoryObj } from "@storybook/react";

function AudioPlayer() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-200">
      <div className="flex h-24 w-96 items-center gap-4 rounded-2xl bg-slate-200 px-5 shadow-[8px_8px_16px_#b8b9be,-8px_-8px_16px_#ffffff]">
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 shadow-[4px_4px_8px_#b8b9be,-4px_-4px_8px_#ffffff] active:shadow-[inset_4px_4px_8px_#b8b9be,inset_-4px_-4px_8px_#ffffff]"
        >
          <div className="h-4 w-4 rounded-full bg-red-500" />
        </button>
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
