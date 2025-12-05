import { forwardRef, type HTMLAttributes, type ReactNode, useCallback, useEffect, useRef } from "react";
import type { BarConfig } from "../../waveform/util-canvas";
import { LiveStreamingRecorderProvider, useLiveStreamingRecorderContext } from "./live-streaming-recorder-context";
import type { UseRecordingAmplitudesOptions } from "./use-recording-amplitudes";

// ============================================================================
// LiveStreamingRecorder.Root
// ============================================================================

export interface LiveStreamingRecorderRootProps extends UseRecordingAmplitudesOptions {
  children: ReactNode | ((value: ReturnType<typeof useLiveStreamingRecorderContext>) => ReactNode);
}

const LiveStreamingRecorderRoot = forwardRef<HTMLDivElement, LiveStreamingRecorderRootProps>(
  function LiveStreamingRecorderRoot({ children, ...options }, ref) {
    return (
      <div ref={ref}>
        <LiveStreamingRecorderProvider {...options}>{children}</LiveStreamingRecorderProvider>
      </div>
    );
  }
);

// ============================================================================
// LiveStreamingRecorder.Container
// ============================================================================

export interface LiveStreamingRecorderContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

const LiveStreamingRecorderContainer = forwardRef<HTMLDivElement, LiveStreamingRecorderContainerProps>(
  function LiveStreamingRecorderContainer({ children, className = "", ...props }, ref) {
    return (
      <div ref={ref} className={className} {...props}>
        {children}
      </div>
    );
  }
);

// ============================================================================
// LiveStreamingRecorder.Canvas
// ============================================================================

export interface LiveStreamingRecorderCanvasProps extends HTMLAttributes<HTMLCanvasElement> {
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

const LiveStreamingRecorderCanvas = forwardRef<HTMLCanvasElement, LiveStreamingRecorderCanvasProps>(
  function LiveStreamingRecorderCanvas({ className = "", style, barConfig, showIdleState = true, ...props }, ref) {
    const { amplitudes, isRecording, isPaused } = useLiveStreamingRecorderContext();
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

    // Canvas rendering function
    const drawWaveform = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const { width, height } = canvas.getBoundingClientRect();

      // barConfig에서 bar 스타일 값 추출
      const barWidth = barConfig?.width
        ? typeof barConfig.width === "number"
          ? barConfig.width
          : Number.parseFloat(barConfig.width)
        : 3;
      const gap = barConfig?.gap
        ? typeof barConfig.gap === "number"
          ? barConfig.gap
          : Number.parseFloat(barConfig.gap)
        : 1;
      const barRadius = barConfig?.radius
        ? typeof barConfig.radius === "number"
          ? barConfig.radius
          : Number.parseFloat(barConfig.radius)
        : 1.5;

      // canvas에서 barColor 추출 (text-inherit를 통해 Tailwind color 사용)
      const barColor = getComputedStyle(canvas).color || "#3b82f6";

      const totalBarWidth = barWidth + gap;

      // 녹음 중이거나 데이터가 있을 때
      if (isRecording || amplitudes.length > 0) {
        // Calculate required canvas width based on data
        const requiredWidth = amplitudes.length * totalBarWidth;
        const canvasWidth = Math.max(requiredWidth, width);

        canvas.width = canvasWidth * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        // Clear canvas
        ctx.clearRect(0, 0, canvasWidth, height);

        // Set bar color
        ctx.fillStyle = barColor;

        // Draw bars from amplitude data
        const minBarHeight = 2;

        for (let i = 0; i < amplitudes.length; i++) {
          const amplitude = amplitudes[i];
          const barHeight = Math.max(minBarHeight, amplitude * height * 0.9);

          const x = i * totalBarWidth;
          const y = (height - barHeight) / 2;

          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, barRadius);
          ctx.fill();
        }
      } else if (showIdleState) {
        // No data - draw idle state (minimal bars)
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        ctx.clearRect(0, 0, width, height);

        ctx.fillStyle = barColor;
        const minBarHeight = 2;
        const barCount = Math.floor((width + gap) / totalBarWidth);

        for (let i = 0; i < barCount; i++) {
          const x = i * totalBarWidth;
          const y = (height - minBarHeight) / 2;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, minBarHeight, barRadius);
          ctx.fill();
        }
      }
    }, [amplitudes, isRecording, barConfig, showIdleState]);

    // Animation loop when recording
    useEffect(() => {
      if (isRecording && !isPaused) {
        const draw = () => {
          drawWaveform();
          animationRef.current = requestAnimationFrame(draw);
        };
        draw();

        return () => {
          if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
          }
        };
      }
      // Draw once when stopped or paused
      drawWaveform();
    }, [isRecording, isPaused, drawWaveform]);

    // Re-render when amplitudes change (for non-recording updates)
    useEffect(() => {
      if (!isRecording) {
        drawWaveform();
      }
    }, [isRecording, drawWaveform]);

    return (
      <canvas
        ref={canvasRef}
        className={`text-inherit ${className}`}
        style={style}
        aria-hidden="true"
        tabIndex={-1}
        {...props}
      />
    );
  }
);

// ============================================================================
// Compound Component Composition
// ============================================================================

export const LiveStreamingRecorder = Object.assign(LiveStreamingRecorderRoot, {
  Root: LiveStreamingRecorderRoot,
  Container: LiveStreamingRecorderContainer,
  Canvas: LiveStreamingRecorderCanvas,
});
