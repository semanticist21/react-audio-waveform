// ============================================================================
// Compound Components (New Headless API)
// ============================================================================

export type {
  LiveRecorderCanvasProps,
  LiveRecorderRootProps,
} from "./recorder/live-recorder/compound.js";
// LiveRecorder - Real-time audio visualization
export { LiveRecorder } from "./recorder/live-recorder/compound.js";
export type {
  LiveStreamingRecorderCanvasProps,
  LiveStreamingRecorderRootProps,
} from "./recorder/live-streaming-recorder/compound.js";
// LiveStreamingRecorder - Timeline-based waveform
export { LiveStreamingRecorder } from "./recorder/live-streaming-recorder/compound.js";
export type {
  AudioWaveformCanvasProps,
  AudioWaveformContainerProps,
  AudioWaveformRootProps,
} from "./waveform/audio-waveform-compound.js";
// AudioWaveform - Static waveform visualization
export { AudioWaveform } from "./waveform/audio-waveform-compound.js";
export type { BarConfig, BarStyle } from "./waveform/util-canvas.js";

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
} from "./recorder/live-streaming-recorder/use-recording-amplitudes.js";
// Recording amplitudes extraction
export { useRecordingAmplitudes } from "./recorder/live-streaming-recorder/use-recording-amplitudes.js";
export type { UseAudioAnalyserConfig, UseAudioAnalyserReturn } from "./recorder/use-audio-analyser.js";
// Audio analyser hook (advanced usage)
export { useAudioAnalyser } from "./recorder/use-audio-analyser.js";
export type { UseAudioRecorderConfig, UseAudioRecorderReturn } from "./recorder/use-audio-recorder.js";
// Audio recorder hook
export { useAudioRecorder } from "./recorder/use-audio-recorder.js";
export type { UseAudioWaveformOptions, UseAudioWaveformReturn } from "./waveform/use-audio-waveform.js";
// Waveform data extraction
export { useAudioWaveform } from "./waveform/use-audio-waveform.js";

// ============================================================================
// Legacy Components (Deprecated - use Compound Components instead)
// ============================================================================

export type { LiveAudioVisualizerProps, LiveAudioVisualizerRef } from "./recorder/live-recorder/index.js";
// @deprecated Use LiveRecorder compound components instead
export { LiveAudioVisualizer } from "./recorder/live-recorder/index.js";
export type { RecordingWaveformProps, RecordingWaveformRef } from "./recorder/live-streaming-recorder/index.js";
// @deprecated Use LiveStreamingRecorder compound components instead
export { RecordingWaveform as RecordingWaveformLegacy } from "./recorder/live-streaming-recorder/index.js";
export type { AudioWaveformProps, AudioWaveformRef } from "./waveform/index.js";
// @deprecated Use AudioWaveform compound components instead
export { AudioVisualizer, AudioWaveform as AudioWaveformLegacy } from "./waveform/index.js";
