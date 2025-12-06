// Components

export { LiveRecorder } from "./recorder/live-recorder/index.js";
export { LiveStreamingRecorder } from "./recorder/live-streaming/recorder/recorder-compound.js";
export { LiveStreamingStackRecorder } from "./recorder/live-streaming/stack-recorder/stack-recorder-compound.js";
// Types (for customizing appearance props and hook return type)
export type { UseAudioRecorderReturn } from "./recorder/use-audio-recorder.js";

// Hook
export { useAudioRecorder } from "./recorder/use-audio-recorder.js";
export type { AudioWaveformAppearance, ScrollbarAppearance, WaveformAppearance } from "./types.js";
export { AudioWaveform } from "./waveform/index.js";
