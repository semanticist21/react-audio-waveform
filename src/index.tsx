// ============================================================================
// Public API Exports
// ============================================================================

// Basic component without Suspense
export { AudioWaveform, AudioVisualizer } from "./audio-waveform";
export type { AudioWaveformProps, AudioWaveformRef } from "./audio-waveform";

// Component with Suspense support
export { AudioWaveformSuspense } from "./audio-waveform-suspense";
export type { AudioWaveformSuspenseProps, AudioWaveformSuspenseRef } from "./audio-waveform-suspense";

// Low-level renderer (advanced use)
export { WaveformRenderer } from "./waveform-renderer";
export type { WaveformRendererProps, WaveformRendererRef } from "./waveform-renderer";

// Utilities (advanced use)
export { decodeAudioBlob, getAudioData } from "./audio-decoder";

// Default export
export { AudioWaveform as default } from "./audio-waveform";
