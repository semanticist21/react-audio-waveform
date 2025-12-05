// ============================================================================
// Headless Hooks
// ============================================================================

export type {
  UseLiveAudioDataOptions,
  UseLiveAudioDataReturn,
} from "./recorder/live-recorder/use-live-audio-data.js";
// Live audio data extraction
export { useLiveAudioData } from "./recorder/live-recorder/use-live-audio-data.js";
export type {
  UseRecordingAmplitudesOptions,
  UseRecordingAmplitudesReturn,
} from "./recorder/live-streaming/use-recording-amplitudes.js";
// Recording amplitudes extraction
export { useRecordingAmplitudes } from "./recorder/live-streaming/use-recording-amplitudes.js";
export type { UseAudioAnalyserConfig, UseAudioAnalyserReturn } from "./recorder/use-audio-analyser.js";
// Audio analyser hook (advanced usage)
export { useAudioAnalyser } from "./recorder/use-audio-analyser.js";
export type { UseAudioRecorderConfig, UseAudioRecorderReturn } from "./recorder/use-audio-recorder.js";
// Audio recorder hook
export { useAudioRecorder } from "./recorder/use-audio-recorder.js";
export type { UseAudioWaveformOptions, UseAudioWaveformReturn } from "./waveform/use-audio-waveform.js";
// Waveform data extraction
export { useAudioWaveform } from "./waveform/use-audio-waveform.js";
export type { BarConfig, BarStyle } from "./waveform/util-canvas.js";

// ============================================================================
// Components
// ============================================================================

export type { LiveRecorderProps, LiveRecorderRef } from "./recorder/live-recorder/index.js";
export { LiveRecorder } from "./recorder/live-recorder/index.js";

// ============================================================================
// Compound Components
// ============================================================================

export type {
  LiveStreamingRecorderCanvasProps,
  LiveStreamingRecorderRootProps,
} from "./recorder/live-streaming/recorder/recorder-compound.js";
// LiveStreamingRecorder compound component (scrolling timeline)
export { LiveStreamingRecorder } from "./recorder/live-streaming/recorder/recorder-compound.js";
export type {
  LiveStreamingStackRecorderCanvasProps,
  LiveStreamingStackRecorderRootProps,
} from "./recorder/live-streaming/stack-recorder/stack-recorder-compound.js";
// LiveStreamingStackRecorder compound component (fixed width, bars compress)
export { LiveStreamingStackRecorder } from "./recorder/live-streaming/stack-recorder/stack-recorder-compound.js";

// ============================================================================
// Static Waveform
// ============================================================================

export type { AudioWaveformProps, AudioWaveformRef } from "./waveform/index.js";
// AudioWaveform component
export { AudioWaveform } from "./waveform/index.js";
