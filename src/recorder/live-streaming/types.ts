import type { HTMLAttributes, ReactNode } from "react";
import type { BarConfig } from "../../waveform/util-canvas";

// ============================================================================
// Common Hook Types
// ============================================================================

export interface UseRecordingAmplitudesOptions {
  /** MediaRecorder instance to sample from */
  mediaRecorder: MediaRecorder | null;
  /** FFT size for frequency analysis (must be power of 2) */
  fftSize?: number;
  /** Smoothing time constant for analyser (0-1) */
  smoothingTimeConstant?: number;
  /** Interval in ms for sampling amplitude data */
  sampleInterval?: number;
}

export interface UseRecordingAmplitudesReturn {
  /** Array of amplitude values (0-1 range) sampled over time */
  amplitudes: number[];
  /** Audio context instance */
  audioContext: AudioContext | null;
  /** Analyser node instance */
  analyser: AnalyserNode | null;
  /** Whether recording is active */
  isRecording: boolean;
  /** Whether recording is paused */
  isPaused: boolean;
  /** Clear all amplitude data */
  clearAmplitudes: () => void;
}

// ============================================================================
// Common Component Types
// ============================================================================

export interface BaseRecorderRootProps
  extends UseRecordingAmplitudesOptions,
    Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  children: ReactNode | ((value: UseRecordingAmplitudesReturn) => ReactNode);
}

export interface BaseRecorderCanvasProps extends HTMLAttributes<HTMLCanvasElement> {
  /** Additional className for canvas element */
  className?: string;
  /** Inline styles for canvas element */
  style?: React.CSSProperties;
  /** Bar configuration (width, gap, radius) */
  barConfig?: BarConfig;
  /**
   * Show minimal bars when not recording (idle state)
   * @default true
   */
  showIdleState?: boolean;
}
