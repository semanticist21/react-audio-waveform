import { forwardRef, type HTMLAttributes, type ReactNode, useEffect, useRef } from "react";
import { type BarStyle, getCanvasBarStyles } from "../../waveform/util-canvas";
import { LiveRecorderProvider, useLiveRecorderContext } from "./context";
import type { UseLiveAudioDataOptions } from "./use-live-audio-data";

// ============================================================================
// LiveRecorder.Root
// ============================================================================

export interface LiveRecorderRootProps extends UseLiveAudioDataOptions {
  children: ReactNode | ((value: ReturnType<typeof useLiveRecorderContext>) => ReactNode);
}

const LiveRecorderRoot = forwardRef<HTMLDivElement, LiveRecorderRootProps>(function LiveRecorderRoot(
  { children, ...options },
  ref
) {
  return (
    <div ref={ref}>
      <LiveRecorderProvider {...options}>{children}</LiveRecorderProvider>
    </div>
  );
});

// ============================================================================
// LiveRecorder.Canvas
// ============================================================================

export interface LiveRecorderCanvasProps extends HTMLAttributes<HTMLCanvasElement> {
  /** Additional className for canvas element */
  className?: string;
  /** Inline styles for canvas element */
  style?: React.CSSProperties;
  /** Bar height scale (0.0 - 1.0). Default 0.9 leaves 10% vertical padding */
  barHeightScale?: number;
  /** Bar 스타일 (width, gap, radius) */
  barStyle?: BarStyle;
}

const LiveRecorderCanvas = forwardRef<HTMLCanvasElement, LiveRecorderCanvasProps>(function LiveRecorderCanvas(
  { className = "", style, barHeightScale = 0.9, barStyle, ...props },
  ref
) {
  const { frequencies, isRecording, isPaused } = useLiveRecorderContext();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

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

  // Canvas Rendering animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || frequencies.length === 0) return;

    // Read bar styles from barStyle prop or CSS variables (once)
    const { barWidth, gap, barRadius, barColor } = getCanvasBarStyles(canvas, barStyle);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    const draw = () => {
      // In pause state, stop rendering but keep animation loop
      if (isPaused) {
        animationRef.current = requestAnimationFrame(draw);
        return;
      }

      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      const totalBarWidth = barWidth + gap;
      // Canvas width에 맞춰 표시할 bar 개수 계산
      const numBars = Math.floor(width / totalBarWidth);

      // Set bar color
      ctx.fillStyle = barColor;

      // Render bars - frequencies 배열을 numBars 개수로 리샘플링
      for (let i = 0; i < numBars; i++) {
        // 원본 frequencies 배열에서 인덱스 계산
        const sourceIndex = Math.floor((i / numBars) * frequencies.length);
        const frequency = frequencies[sourceIndex] || 0;

        // Apply height scale (default 0.9 = 90% max height)
        const barHeight = Math.max(2, (frequency / 100) * height * barHeightScale);

        const x = i * totalBarWidth;
        const y = (height - barHeight) / 2;

        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, barRadius);
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    // Start animation
    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [frequencies, isPaused, barHeightScale, barStyle]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className={`text-inherit ${className}`}
        style={style}
        aria-hidden="true"
        tabIndex={-1}
        {...props}
      />
      {/* Screen reader only text for accessibility */}
      <span
        style={{
          position: "absolute",
          width: "1px",
          height: "1px",
          padding: "0",
          margin: "-1px",
          overflow: "hidden",
          clip: "rect(0, 0, 0, 0)",
          whiteSpace: "nowrap",
          border: "0",
        }}
        aria-live="polite"
        aria-atomic="true"
      >
        {isRecording ? "Recording audio" : "Audio recording paused"}
      </span>
    </>
  );
});

// ============================================================================
// Compound Component Composition
// ============================================================================

export const LiveRecorder = Object.assign(LiveRecorderRoot, {
  Root: LiveRecorderRoot,
  Canvas: LiveRecorderCanvas,
});
