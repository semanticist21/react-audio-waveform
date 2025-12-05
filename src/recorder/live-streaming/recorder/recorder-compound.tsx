import { forwardRef, type HTMLAttributes, type ReactNode, useCallback, useEffect, useRef } from "react";
import type { BarConfig } from "../../../waveform/util-canvas";
import type { UseRecordingAmplitudesOptions } from "../use-recording-amplitudes";
import { LiveStreamingRecorderProvider, useLiveStreamingRecorderContext } from "./recorder-context";

// ============================================================================
// LiveStreamingRecorder.Root
// ============================================================================

export interface LiveStreamingRecorderRootProps
  extends UseRecordingAmplitudesOptions,
    Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  children: ReactNode | ((value: ReturnType<typeof useLiveStreamingRecorderContext>) => ReactNode);
}

const LiveStreamingRecorderRoot = forwardRef<HTMLDivElement, LiveStreamingRecorderRootProps>(
  function LiveStreamingRecorderRoot(
    { children, className = "", style, mediaRecorder, fftSize, smoothingTimeConstant, sampleInterval, ...props },
    ref
  ) {
    return (
      <div ref={ref} className={className} style={style} {...props}>
        <LiveStreamingRecorderProvider
          mediaRecorder={mediaRecorder}
          fftSize={fftSize}
          smoothingTimeConstant={smoothingTimeConstant}
          sampleInterval={sampleInterval}
        >
          {children}
        </LiveStreamingRecorderProvider>
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
  /**
   * Allow canvas width to grow beyond container (enables scrolling)
   * - true: Canvas grows horizontally as recording continues (Voice Memos style)
   * - false: Canvas stays fixed width, bars get compressed
   * @default true
   */
  growWidth?: boolean;
}

const LiveStreamingRecorderCanvas = forwardRef<HTMLCanvasElement, LiveStreamingRecorderCanvasProps>(
  function LiveStreamingRecorderCanvas(
    { className = "", style, barConfig, showIdleState = true, growWidth = true, ...props },
    ref
  ) {
    const { amplitudes, isRecording, isPaused } = useLiveStreamingRecorderContext();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | null>(null);
    const containerSizeRef = useRef({ width: 0, height: 0 });

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
      // 매번 최신 container 크기를 가져옴 (scrolling을 위해 중요)
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
        // Canvas width 계산: growWidth에 따라 다르게 처리
        let canvasWidth: number;
        if (growWidth) {
          // 데이터에 맞춰 canvas가 늘어남 (scrolling 가능)
          const requiredWidth = amplitudes.length * totalBarWidth;
          canvasWidth = Math.max(requiredWidth, containerWidth);
          // CSS 레이아웃 크기도 명시적으로 설정 (스크롤 가능하게)
          canvas.style.width = `${canvasWidth}px`;
        } else {
          // 고정 width 유지 (bar가 압축됨)
          canvasWidth = containerWidth;
          canvas.style.width = "100%";
        }

        canvas.width = canvasWidth * dpr;
        canvas.height = containerHeight * dpr;
        ctx.scale(dpr, dpr);

        // Clear canvas
        ctx.clearRect(0, 0, canvasWidth, containerHeight);

        // Set bar color
        ctx.fillStyle = barColor;

        // Draw bars from amplitude data
        const minBarHeight = 2;

        if (growWidth) {
          // Scrolling mode: 각 amplitude마다 bar 하나씩
          for (let i = 0; i < amplitudes.length; i++) {
            const amplitude = amplitudes[i];
            const barHeight = Math.max(minBarHeight, amplitude * containerHeight * 0.9);

            const x = i * totalBarWidth;
            const y = (containerHeight - barHeight) / 2;

            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, barHeight, barRadius);
            ctx.fill();
          }
        } else {
          // Fixed width mode: amplitudes를 canvas width에 맞춰 압축
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
        }
      } else if (showIdleState) {
        // No data - draw idle state (minimal bars)
        canvas.style.width = "100%";
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
    }, [amplitudes, isRecording, barConfig, showIdleState, growWidth]);

    // Track container size with ResizeObserver
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;

        const { width, height } = entry.contentRect;
        containerSizeRef.current = { width, height };

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
          // growWidth일 때 inline-block으로 설정하여 자체 너비를 가질 수 있게 함
          display: growWidth ? "block" : undefined,
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

export const LiveStreamingRecorder = Object.assign(LiveStreamingRecorderRoot, {
  Root: LiveStreamingRecorderRoot,
  Canvas: LiveStreamingRecorderCanvas,
});
