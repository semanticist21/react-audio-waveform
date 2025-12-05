// ============================================================================
// Appearance Types - Common visualization style definitions
// ============================================================================

/**
 * Base waveform appearance configuration
 * Used by all waveform components
 */
export interface WaveformAppearance {
  /** Bar color (CSS color value). Default: "#3b82f6" (blue-500) */
  barColor?: string;
  /** Bar width (pixels). Default: 3 */
  barWidth?: number;
  /** Bar gap (pixels). Default: 1 */
  barGap?: number;
  /** Bar corner radius (pixels). Default: 1.5 */
  barRadius?: number;
  /** Bar height scale (0.0 - 1.0). Default: 0.95 (5% top/bottom margin) */
  barHeightScale?: number;
}

/**
 * AudioWaveform-specific appearance configuration
 * Extends WaveformAppearance with playhead styles
 */
export interface AudioWaveformAppearance extends WaveformAppearance {
  /** Playhead color (CSS color value). Default: "#ef4444" (red-500) */
  playheadColor?: string;
  /** Playhead width (pixels). Default: 2 */
  playheadWidth?: number;
}
