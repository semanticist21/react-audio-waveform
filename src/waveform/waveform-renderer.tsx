import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react";
import { DEFAULT_PLAYHEAD_APPEARANCE, DEFAULT_WAVEFORM_APPEARANCE } from "../constants";
import type { AudioWaveformAppearance } from "../types";

// ============================================================================
// Common Waveform Renderer (A)
// ============================================================================

export interface WaveformRendererProps {
  /** Normalized peak data to visualize */
  peaks: number[] | null;
  /** Additional class name for the canvas */
  className?: string;
  /** Waveform appearance configuration (barColor, barWidth, playheadColor, etc.) */
  appearance?: AudioWaveformAppearance;
  /** Current playback time in seconds */
  currentTime?: number;
  /** Total audio duration in seconds */
  duration?: number;
  /** Callback when user clicks on waveform */
  onSeek?: (time: number) => void;
}

export interface WaveformRendererRef {
  canvas: HTMLCanvasElement | null;
}

export const WaveformRenderer = forwardRef<WaveformRendererRef, WaveformRendererProps>(function WaveformRenderer(
  { peaks, className = "", appearance, currentTime, duration, onSeek },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sizeRef = useRef({ width: 0, height: 0 });
  const rafRef = useRef<number>(0);

  useImperativeHandle(ref, () => ({
    canvas: canvasRef.current,
  }));

  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    const { width, height } = sizeRef.current;
    if (!canvas || !peaks || width === 0 || height === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    // Only resize canvas if needed
    const targetWidth = width * dpr;
    const targetHeight = height * dpr;
    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    // Extract styles from appearance (with defaults)
    const barColor = appearance?.barColor ?? DEFAULT_WAVEFORM_APPEARANCE.barColor;
    const barWidth = appearance?.barWidth ?? DEFAULT_WAVEFORM_APPEARANCE.barWidth;
    const barGap = appearance?.barGap ?? DEFAULT_WAVEFORM_APPEARANCE.barGap;
    const barRadius = appearance?.barRadius ?? DEFAULT_WAVEFORM_APPEARANCE.barRadius;
    const barHeightScale = appearance?.barHeightScale ?? DEFAULT_WAVEFORM_APPEARANCE.barHeightScale;

    const totalBarWidth = barWidth + barGap;
    const barsCount = Math.floor(width / totalBarWidth);
    const step = peaks.length / barsCount;

    ctx.fillStyle = barColor;

    for (let i = 0; i < barsCount; i++) {
      const peakIndex = Math.min(Math.floor(i * step), peaks.length - 1);
      const peak = peaks[peakIndex];
      const barHeight = Math.max(peak * height * barHeightScale, 2);
      const x = i * totalBarWidth;
      const y = (height - barHeight) / 2;

      if (barRadius > 0) {
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, barRadius);
        ctx.fill();
      } else {
        ctx.fillRect(x, y, barWidth, barHeight);
      }
    }

    // Render playhead (only when currentTime and duration are available)
    if (currentTime !== undefined && duration !== undefined && duration > 0) {
      const playheadX = (currentTime / duration) * width;
      const playheadColor = appearance?.playheadColor ?? DEFAULT_PLAYHEAD_APPEARANCE.playheadColor;
      const playheadWidth = appearance?.playheadWidth ?? DEFAULT_PLAYHEAD_APPEARANCE.playheadWidth;

      ctx.fillStyle = playheadColor;
      ctx.fillRect(playheadX - playheadWidth / 2, 0, playheadWidth, height);
    }
  }, [peaks, appearance, currentTime, duration]);

  // ResizeObserver with RAF throttling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      const { width, height } = entry.contentRect;
      if (sizeRef.current.width === width && sizeRef.current.height === height) return;

      sizeRef.current = { width, height };

      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(drawWaveform);
    });

    resizeObserver.observe(canvas);
    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(rafRef.current);
    };
  }, [drawWaveform]);

  // Draw when peaks change
  useEffect(() => {
    drawWaveform();
  }, [drawWaveform]);

  // Click handler for seeking
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!onSeek || !duration || duration <= 0) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const clickRatio = x / rect.width;
      const newTime = Math.max(0, Math.min(clickRatio * duration, duration));

      onSeek(newTime);
    },
    [onSeek, duration]
  );

  return (
    <canvas
      ref={canvasRef}
      className={className}
      role="img"
      aria-label="Audio waveform"
      onClick={handleClick}
      style={{ cursor: onSeek ? "pointer" : undefined }}
    />
  );
});
