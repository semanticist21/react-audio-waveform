import type { Meta, StoryObj } from "@storybook/react";
import { Suspense } from "react";
import { AudioWaveform, AudioWaveformSuspense } from "./index";

// Shared configuration
const commonDecorator = (Story: React.ComponentType) => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="w-[600px] h-[200px]">
      <Story />
    </div>
  </div>
);

const audioLoader = [
  async () => {
    const response = await fetch("/sample-3min.mp3");
    const blob = await response.blob();
    return { audioBlob: blob };
  },
];

const meta = {
  title: "Components/AudioWaveform",
  component: AudioWaveform,
  decorators: [commonDecorator],
} satisfies Meta<typeof AudioWaveform>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Stories without Suspense
// ============================================================================

export const Dense: Story = {
  args: {
    blob: null,
  },
  loaders: audioLoader,
  render: (args, { loaded: { audioBlob } }) => {
    return (
      <AudioWaveform
        {...args}
        blob={audioBlob}
        className="text-emerald-400 size-full [--bar-width:2] [--bar-gap:0.5] [--bar-radius:1]"
      />
    );
  },
};

export const UltraDense: Story = {
  args: {
    blob: null,
  },
  loaders: audioLoader,
  decorators: [
    (Story) => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-[400px] h-20">
          <Story />
        </div>
      </div>
    ),
  ],
  render: (args, { loaded: { audioBlob } }) => {
    return (
      <AudioWaveform
        {...args}
        blob={audioBlob}
        className="text-rose-500 size-full [--bar-width:1] [--bar-gap:0.25] [--bar-radius:0.5]"
      />
    );
  },
};

export const Sparse: Story = {
  args: {
    blob: null,
  },
  loaders: audioLoader,
  render: (args, { loaded: { audioBlob } }) => {
    return (
      <AudioWaveform
        {...args}
        blob={audioBlob}
        className="text-blue-600 size-full [--bar-width:6] [--bar-gap:4] [--bar-radius:3]"
      />
    );
  },
};

// ============================================================================
// Stories with Suspense
// ============================================================================

export const WithSuspense: Story = {
  args: {
    blob: null,
  },
  loaders: audioLoader,
  render: (args, { loaded: { audioBlob } }) => {
    return (
      <Suspense
        fallback={
          <div className="flex items-center justify-center size-full bg-gray-100 rounded">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-600">Decoding audio...</p>
            </div>
          </div>
        }
      >
        <AudioWaveformSuspense
          {...args}
          blob={audioBlob}
          className="text-purple-500 size-full [--bar-width:3] [--bar-gap:1] [--bar-radius:1.5]"
        />
      </Suspense>
    );
  },
};
