import { forwardRef, type HTMLAttributes, type ReactNode, useCallback, useEffect, useRef } from "react";
import type { BarConfig } from "../../../waveform/util-canvas";
import type { UseRecordingAmplitudesOptions } from "../use-recording-amplitudes";
import { LiveStreamingStackRecorderProvider, useLiveStreamingStackRecorderContext } from "./stack-recorder-context";

// ============================================================================
// LiveStreamingStackRecorder.Root
// ============================================================================

export interface LiveStreamingStackRecorderRootProps
  extends UseRecordingAmplitudesOptions,
    Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  children: ReactNode | ((value: ReturnType<typeof useLiveStreamingStackRecorderContext>) => ReactNode);
}

const LiveStreamingStackRecorderRoot = forwardRef<HTMLDivElement, LiveStreamingStackRecorderRootProps>(
  function LiveStreamingStackRecorderRoot(
    { children, className = "", style, mediaRecorder, fftSize, smoothingTimeConstant, sampleInterval, ...props },
    ref
  ) {
    return (
      <div ref={ref} className={className} style={style} {...props}>
        <LiveStreamingStackRecorderProvider
          mediaRecorder={mediaRecorder}
          fftSize={fftSize}
          smoothingTimeConstant={smoothingTimeConstant}
          sampleInterval={sampleInterval}
        >
          {children}
        </LiveStreamingStackRecorderProvider>
      </div>
    );
  }
);

// ============================================================================
// LiveStreamingStackRecorder.Canvas
// ============================================================================

export interface LiveStreamingStackRecorderCanvasProps extends HTMLAttributes<HTMLCanvasElement> {
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

const LiveStreamingStackRecorderCanvas = forwardRef<HTMLCanvasElement, LiveStreamingStackRecorderCanvasProps>(
  function LiveStreamingStackRecorderCanvas({ className = "", style, barConfig, showIdleState = true, ...props }, ref) {
    const { amplitudes, isRecording, isPaused } = useLiveStreamingStackRecorderContext();
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

    // Canvas rendering function (녹음 중 실시간으로 호출됨)
    const drawWaveform = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      // Container 크기를 가져옴 (고정 너비 유지)
      const rect = canvas.getBoundingClientRect();
      const containerWidth = rect.width;
      const containerHeight = rect.height;

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
        // 고정 width 유지 (container 너비에 맞춤)
        const canvasWidth = containerWidth;

        canvas.width = canvasWidth * dpr;
        canvas.height = containerHeight * dpr;
        ctx.scale(dpr, dpr);

        // Clear canvas
        ctx.clearRect(0, 0, canvasWidth, containerHeight);

        // Set bar color
        ctx.fillStyle = barColor;

        // Draw bars - amplitudes를 canvas width에 맞춰 압축
        const minBarHeight = 2;
        const barsCount = Math.floor(canvasWidth / totalBarWidth);
        const step = amplitudes.length / barsCount;

        for (let i = 0; i < barsCount; i++) {
          const amplitudeIndex = Math.min(Math.floor(i * step), amplitudes.length - 1);
          const amplitude = amplitudes[amplitudeIndex] || 0;
          const barHeight = Math.max(minBarHeight, amplitude * containerHeight * 0.9);

          const x = i * totalBarWidth;
          const y = (containerHeight - barHeight) / 2;

          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, barRadius);
          ctx.fill();
        }
      } else if (showIdleState) {
        // No data - draw idle state (minimal bars)
        canvas.width = containerWidth * dpr;
        canvas.height = containerHeight * dpr;
        ctx.scale(dpr, dpr);

        ctx.clearRect(0, 0, containerWidth, containerHeight);

        ctx.fillStyle = barColor;
        const minBarHeight = 2;
        const barCount = Math.floor((containerWidth + gap) / totalBarWidth);

        for (let i = 0; i < barCount; i++) {
          const x = i * totalBarWidth;
          const y = (containerHeight - minBarHeight) / 2;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, minBarHeight, barRadius);
          ctx.fill();
        }
      }
    }, [amplitudes, isRecording, barConfig, showIdleState]);

    // Track container size with ResizeObserver
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const resizeObserver = new ResizeObserver(() => {
        // Container 크기 변경시 다시 그리기
        if (!isRecording) {
          drawWaveform();
        }
      });

      resizeObserver.observe(canvas);
      return () => resizeObserver.disconnect();
    }, [isRecording, drawWaveform]);

    // Animation loop when recording (매 프레임마다 실행되어 실시간 업데이트)
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

    return (
      <canvas
        ref={canvasRef}
        className={`text-inherit ${className}`}
        style={{
          width: "100%",
          height: "100%",
          ...style,
        }}
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

export const LiveStreamingStackRecorder = Object.assign(LiveStreamingStackRecorderRoot, {
  Root: LiveStreamingStackRecorderRoot,
  Canvas: LiveStreamingStackRecorderCanvas,
});
