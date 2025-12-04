import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { RecordingWaveform } from "./recorder/recording-waveform";
import { useAudioRecorder } from "./recorder/use-audio-recorder";
import { AudioWaveform } from "./waveform/audio-waveform";

const meta: Meta = {
  title: "Components/RecordingWaveform",
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Timeline-based waveform that grows as you record (like Voice Memos app)
 * - Waveform extends to the right as recording progresses
 * - Automatically scrolls to show latest audio
 * - Manual scroll disables auto-scroll, returns to auto when scrolled to end
 */
function RecordingWaveformDemo() {
  const [recordings, setRecordings] = useState<{ id: string; blob: Blob }[]>([]);
  const { startRecording, stopRecording, mediaRecorder, isRecording, recordingTime, error } = useAudioRecorder({
    onRecordingComplete: (blob) => {
      setRecordings((prev) => [...prev, { id: crypto.randomUUID(), blob }]);
    },
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col gap-6 p-8 w-[600px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Timeline Waveform</h2>
        <span className="text-sm text-gray-500">
          {isRecording ? `Recording: ${formatTime(recordingTime)}` : "Ready"}
        </span>
      </div>

      {/* Recording Area */}
      <div className="flex flex-col gap-4">
        {/* Control Button */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            className={`w-14 h-14 rounded-full transition-all flex items-center justify-center shadow-lg ${
              isRecording ? "bg-gray-700 hover:bg-gray-800" : "bg-red-500 hover:bg-red-600 animate-pulse"
            }`}
            aria-label={isRecording ? "Stop recording" : "Start recording"}
          >
            {isRecording ? (
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            ) : (
              <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="8" />
              </svg>
            )}
          </button>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-700">
              {isRecording ? "Recording in progress..." : "Press to start recording"}
            </span>
            <span className="text-xs text-gray-400">
              {isRecording ? "Scroll left to see history" : "Waveform grows as you speak"}
            </span>
          </div>
        </div>

        {/* Timeline Waveform - Shows during recording */}
        {isRecording && mediaRecorder && (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Live Timeline</span>
            <RecordingWaveform
              mediaRecorder={mediaRecorder}
              className="h-24 w-full rounded-xl bg-gradient-to-r from-red-50 to-orange-50 text-red-500 border border-red-100"
              style={{ "--bar-width": 3, "--bar-gap": 2, "--bar-radius": 1.5 }}
            />
          </div>
        )}

        {/* Placeholder when not recording */}
        {!mediaRecorder && recordings.length === 0 && (
          <div className="h-24 w-full rounded-xl bg-gray-50 border border-gray-200 border-dashed flex items-center justify-center">
            <span className="text-sm text-gray-400">Waveform will appear here</span>
          </div>
        )}
      </div>

      {/* Recorded Results */}
      {recordings.length > 0 && (
        <div className="flex flex-col gap-4 pt-4 border-t border-gray-100">
          <span className="text-sm font-medium text-gray-600">Recorded Audio</span>

          {recordings.map((recording, index) => (
            <div key={recording.id} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Recording {index + 1}</span>
                {/* biome-ignore lint/a11y/useMediaCaption: Demo only, no captions needed */}
                <audio src={URL.createObjectURL(recording.blob)} controls className="h-8" />
              </div>
              <AudioWaveform
                blob={recording.blob}
                className="h-16 w-full rounded-lg bg-blue-50 text-blue-500"
                style={{ "--bar-width": 2, "--bar-gap": 1, "--bar-radius": 1 }}
              />
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg p-3">Error: {error.message}</p>}
    </div>
  );
}

export const Default: Story = {
  render: () => <RecordingWaveformDemo />,
};

/**
 * Comparison between LiveAudioVisualizer (frequency) and RecordingWaveform (timeline)
 */
function ComparisonDemo() {
  const { startRecording, stopRecording, mediaRecorder, isRecording, recordingTime } = useAudioRecorder();
  const { LiveAudioVisualizer } = require("./recorder/live-audio-visualizer");

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col gap-6 p-8 w-[600px]">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Visualizer Comparison</h2>
        {isRecording && <span className="text-sm text-red-500 font-medium">{formatTime(recordingTime)}</span>}
      </div>

      <button
        type="button"
        onClick={isRecording ? stopRecording : startRecording}
        className={`px-6 py-3 rounded-lg font-medium transition-colors ${
          isRecording ? "bg-gray-700 text-white" : "bg-red-500 text-white hover:bg-red-600"
        }`}
      >
        {isRecording ? "Stop Recording" : "Start Recording"}
      </button>

      {isRecording && mediaRecorder && (
        <div className="grid gap-6">
          {/* Frequency Visualizer */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-purple-600 uppercase tracking-wide">
                Frequency (LiveAudioVisualizer)
              </span>
              <span className="text-xs text-gray-400">— real-time frequency bars</span>
            </div>
            <LiveAudioVisualizer
              mediaRecorder={mediaRecorder}
              className="h-20 w-full rounded-xl bg-purple-50 text-purple-500 border border-purple-100"
            />
          </div>

          {/* Timeline Waveform */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-orange-600 uppercase tracking-wide">
                Timeline (RecordingWaveform)
              </span>
              <span className="text-xs text-gray-400">— grows over time, scrollable</span>
            </div>
            <RecordingWaveform
              mediaRecorder={mediaRecorder}
              className="h-20 w-full rounded-xl bg-orange-50 text-orange-500 border border-orange-100"
              style={{ "--bar-width": 3, "--bar-gap": 2, "--bar-radius": 1.5 }}
            />
          </div>
        </div>
      )}

      {!isRecording && (
        <div className="text-center py-12 text-gray-400 text-sm">Press "Start Recording" to see both visualizers</div>
      )}
    </div>
  );
}

export const Comparison: Story = {
  render: () => <ComparisonDemo />,
};
