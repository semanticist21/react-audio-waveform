import { forwardRef, type HTMLAttributes, type ReactNode, useCallback, useEffect, useRef } from "react";
import { AudioWaveformProvider, useAudioWaveformContext } from "./audio-waveform-context";
import type { UseAudioWaveformOptions } from "./use-audio-waveform";
import type { BarStyle } from "./util-canvas";

// ============================================================================
// AudioWaveform.Root
// ============================================================================

export interface AudioWaveformRootProps extends UseAudioWaveformOptions {
  children: ReactNode | ((value: ReturnType<typeof useAudioWaveformContext>) => ReactNode);
}

const AudioWaveformRoot = forwardRef<HTMLDivElement, AudioWaveformRootProps>(function AudioWaveformRoot(
  { children, ...options },
  ref
) {
  return (
    <div ref={ref}>
      <AudioWaveformProvider {...options}>{children}</AudioWaveformProvider>
    </div>
  );
});

// ============================================================================
// AudioWaveform.Container
// ============================================================================

export interface AudioWaveformContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

const AudioWaveformContainer = forwardRef<HTMLDivElement, AudioWaveformContainerProps>(function AudioWaveformContainer(
  { children, className = "", ...props },
  ref
) {
  return (
    <div ref={ref} className={className} {...props}>
      {children}
    </div>
  );
});

// ============================================================================
// AudioWaveform.Canvas
// ============================================================================

export interface AudioWaveformCanvasProps extends HTMLAttributes<HTMLCanvasElement> {
  /** Additional className for canvas element */
  className?: string;
  /** Inline styles for canvas element */
  style?: React.CSSProperties;
  /** Bar height scale (0.0 - 1.0). Controls maximum bar height relative to container (default: 0.9) */
  barHeightScale?: number;
  /** Bar style (width, gap, radius) */
  barStyle?: BarStyle;
}

const AudioWaveformCanvas = forwardRef<HTMLCanvasElement, AudioWaveformCanvasProps>(function AudioWaveformCanvas(
  { className = "", style, barHeightScale = 0.9, barStyle, ...props },
  ref
) {
  const { peaks } = useAudioWaveformContext();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sizeRef = useRef({ width: 0, height: 0 });
  const rafRef = useRef<number>(0);

  // Forward ref
  useEffect(() => {
    if (ref) {
      if (typeof ref === "function") {
        ref(canvasRef.current);
      } else {
        ref.current = canvasRef.current;
      }
    }
  }, [ref]);

  // Waveform rendering function
  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    const { width, height } = sizeRef.current;
    if (!canvas || !peaks || width === 0 || height === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    // Resize canvas (only when needed)
    const targetWidth = width * dpr;
    const targetHeight = height * dpr;
    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    // Read bar styles from barStyle prop (defaults: width=3, gap=1, radius=1.5)
    const barWidth = barStyle?.width
      ? typeof barStyle.width === "number"
        ? barStyle.width
        : Number.parseFloat(barStyle.width)
      : 3;
    const gap = barStyle?.gap ? (typeof barStyle.gap === "number" ? barStyle.gap : Number.parseFloat(barStyle.gap)) : 1;
    const barRadius = barStyle?.radius
      ? typeof barStyle.radius === "number"
        ? barStyle.radius
        : Number.parseFloat(barStyle.radius)
      : 1.5;

    const totalBarWidth = barWidth + gap;
    const barsCount = Math.floor(width / totalBarWidth);
    const step = peaks.length / barsCount;

    // Bar color (text-inherit to inherit Tailwind color)
    const styles = getComputedStyle(canvas);
    ctx.fillStyle = styles.color || "#3b82f6";

    // Render bars
    for (let i = 0; i < barsCount; i++) {
      const peakIndex = Math.min(Math.floor(i * step), peaks.length - 1);
      const peak = peaks[peakIndex];
      // Apply height scale (default 0.9 = 90% max height)
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
  }, [peaks, barHeightScale, barStyle]);

  // Track canvas size with ResizeObserver
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      const { width, height } = entry.contentRect;
      if (sizeRef.current.width === width && sizeRef.current.height === height) return;

      sizeRef.current = { width, height };

      // Throttle rendering with RAF
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(drawWaveform);
    });

    resizeObserver.observe(canvas);
    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(rafRef.current);
    };
  }, [drawWaveform]);

  // Re-render when peaks change
  useEffect(() => {
    drawWaveform();
  }, [drawWaveform]);

  return (
    <canvas
      ref={canvasRef}
      className={`text-inherit ${className}`}
      style={style}
      role="img"
      aria-label="Audio waveform"
      {...props}
    />
  );
});

// ============================================================================
// Compound Component Composition
// ============================================================================

export const AudioWaveform = Object.assign(AudioWaveformRoot, {
  Root: AudioWaveformRoot,
  Container: AudioWaveformContainer,
  Canvas: AudioWaveformCanvas,
});
