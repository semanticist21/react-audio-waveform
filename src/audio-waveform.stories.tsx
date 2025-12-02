import type { Meta, StoryObj } from "@storybook/react";
import { AudioWaveform } from "./index";

const meta = {
  title: "Components/AudioWaveform",
  component: AudioWaveform,
  decorators: [
    (Story) => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-[600px] h-[200px]">
          <Story />
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof AudioWaveform>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    blob: null,
  },
};
