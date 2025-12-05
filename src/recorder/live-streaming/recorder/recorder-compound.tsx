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
    // WebKit 오버레이 스크롤바 스타일 주입 (한 번만 실행)
    useEffect(() => {
      const styleId = "live-streaming-recorder-scrollbar-style";
      if (document.getElementById(styleId)) return;

      const styleElement = document.createElement("style");
      styleElement.id = styleId;
      styleElement.textContent = `
        .live-streaming-recorder-overlay-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .live-streaming-recorder-overlay-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .live-streaming-recorder-overlay-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.3);
          border-radius: 4px;
        }
        .live-streaming-recorder-overlay-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.5);
        }
      `;
      document.head.appendChild(styleElement);
    }, []);

    // 기본 스크롤바 스타일 및 overflow 적용 (LiveStreamingRecorder는 scrolling 컨셉)
    const mergedClassName = `overflow-x-auto overflow-y-hidden live-streaming-recorder-overlay-scrollbar [scrollbar-width:thin] [scrollbar-color:rgba(148,163,184,0.3)_transparent] ${className}`;

    return (
      <div ref={ref} className={mergedClassName} style={style} {...props}>
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
   * @default false
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
    { className = "", style, barConfig, showIdleState = false, growWidth = true, ...props },
    ref
  ) {
    const { amplitudes, isRecording, isPaused } = useLiveStreamingRecorderContext();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | null>(null);
    const containerSizeRef = useRef({ width: 0, height: 0 });
    const containerRef = useRef<HTMLElement | null>(null);
    // growWidth 모드에서 canvas width는 절대 줄어들지 않도록 추적
    const prevCanvasWidthRef = useRef<number>(0);

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

    // 새로운 녹음 시작 시 canvas width ref 초기화
    useEffect(() => {
      if (amplitudes.length === 0) {
        prevCanvasWidthRef.current = 0;
      }
    }, [amplitudes.length]);

    // Canvas rendering function (녹음 중 실시간으로 호출됨)
    const drawWaveform = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      // Container의 실제 크기 가져오기 (parent element의 크기 사용)
      const container = canvas.parentElement;
      const containerWidth = container?.clientWidth || canvas.clientWidth;
      const containerHeight = container?.clientHeight || canvas.clientHeight;

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
          // pause/resume 시에도 정확한 width 유지를 위해 amplitudes 길이로만 계산
          const requiredWidth = amplitudes.length * totalBarWidth;
          // containerWidth는 최소값으로만 사용 (빈 상태일 때 너무 작아지는 것 방지)
          const calculatedWidth = amplitudes.length > 0 ? requiredWidth : containerWidth;
          // growWidth 모드에서는 canvas width가 절대 줄어들지 않도록 (pause/resume 안정성)
          canvasWidth = Math.max(calculatedWidth, prevCanvasWidthRef.current);
          prevCanvasWidthRef.current = canvasWidth;
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

    // Track container size with ResizeObserver and get parent container reference
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // 스크롤 가능한 부모 컨테이너 찾기
      containerRef.current = canvas.parentElement;

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

          // 녹음 중일 때 자동으로 오른쪽 끝으로 스크롤
          if (growWidth && containerRef.current) {
            containerRef.current.scrollLeft = containerRef.current.scrollWidth;
          }

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
      // Draw once when stopped or paused (녹음 종료 후에도 파형 유지)
      drawWaveform();
    }, [isRecording, isPaused, drawWaveform, growWidth]);

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
