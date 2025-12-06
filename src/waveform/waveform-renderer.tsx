import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react";
import { DEFAULT_PLAYHEAD_APPEARANCE, DEFAULT_WAVEFORM_APPEARANCE } from "../constants";
import type { AudioWaveformAppearance } from "../types";

// ============================================================================
// Common Waveform Renderer (A)
// ============================================================================

export interface WaveformRendererProps extends React.CanvasHTMLAttributes<HTMLCanvasElement> {
  /** Normalized peak data to visualize */
  peaks: number[] | null;
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
  { peaks, appearance, currentTime, duration, onSeek, onClick, style, ...props },
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

  // 키보드 핸들러: 좌우 화살표로 5초 단위 seek, Home/End로 처음/끝 이동
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLCanvasElement>) => {
      if (!onSeek || !duration || duration <= 0) return;

      const SEEK_STEP = 5; // 5초 단위 이동
      const current = currentTime ?? 0;

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          onSeek(Math.max(0, current - SEEK_STEP));
          break;
        case "ArrowRight":
          e.preventDefault();
          onSeek(Math.min(duration, current + SEEK_STEP));
          break;
        case "Home":
          e.preventDefault();
          onSeek(0);
          break;
        case "End":
          e.preventDefault();
          onSeek(duration);
          break;
      }
    },
    [onSeek, duration, currentTime]
  );

  // 시간 포맷 (aria-valuetext용): "1분 30초" 형식
  const formatTimeForScreen = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    if (mins > 0) {
      return `${mins}분 ${secs}초`;
    }
    return `${secs}초`;
  };

  // onSeek이 있으면 interactive slider, 없으면 정적 이미지
  const isInteractive = !!onSeek && !!duration && duration > 0;

  return (
    <canvas
      ref={canvasRef}
      role={isInteractive ? "slider" : "img"}
      aria-label={isInteractive ? "오디오 탐색" : "오디오 파형"}
      aria-valuemin={isInteractive ? 0 : undefined}
      aria-valuemax={isInteractive ? Math.floor(duration) : undefined}
      aria-valuenow={isInteractive ? Math.floor(currentTime ?? 0) : undefined}
      aria-valuetext={
        isInteractive ? `${formatTimeForScreen(currentTime ?? 0)} / ${formatTimeForScreen(duration)}` : undefined
      }
      tabIndex={isInteractive ? 0 : -1}
      onClick={handleClick}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
      style={{ cursor: isInteractive ? "pointer" : undefined, ...style }}
      {...props}
    />
  );
});
