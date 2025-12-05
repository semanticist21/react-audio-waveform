import { forwardRef, type HTMLAttributes, type ReactNode, useCallback, useEffect, useRef } from "react";
import { DEFAULT_WAVEFORM_APPEARANCE } from "../../../constants";
import type { WaveformAppearance } from "../../../types";
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
  /** Waveform appearance configuration (barColor, barWidth 등) */
  appearance?: WaveformAppearance;
}

const LiveStreamingStackRecorderCanvas = forwardRef<HTMLCanvasElement, LiveStreamingStackRecorderCanvasProps>(
  function LiveStreamingStackRecorderCanvas({ className = "", style, appearance, ...props }, ref) {
    const { amplitudes, isRecording, isPaused } = useLiveStreamingStackRecorderContext();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | null>(null);
    // Canvas 크기 캐싱 (ResizeObserver에서만 업데이트, 매 프레임 getBoundingClientRect 방지)
    const sizeRef = useRef({ width: 0, height: 0 });

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
      // 캐싱된 크기 사용 (layout thrashing 방지)
      const containerWidth = sizeRef.current.width;
      const containerHeight = sizeRef.current.height;
      if (containerWidth === 0 || containerHeight === 0) return;

      // appearance에서 스타일 추출 (기본값 적용)
      const barColor = appearance?.barColor ?? DEFAULT_WAVEFORM_APPEARANCE.barColor;
      const barWidth = appearance?.barWidth ?? DEFAULT_WAVEFORM_APPEARANCE.barWidth;
      const barGap = appearance?.barGap ?? DEFAULT_WAVEFORM_APPEARANCE.barGap;
      const barRadius = appearance?.barRadius ?? DEFAULT_WAVEFORM_APPEARANCE.barRadius;
      const barHeightScale = appearance?.barHeightScale ?? DEFAULT_WAVEFORM_APPEARANCE.barHeightScale;

      const totalBarWidth = barWidth + barGap;

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

        // Draw bars - 실제 amplitude 개수만큼 그리다가 canvas 너비 초과시 다운샘플링
        const minBarHeight = 2;
        const maxBarsCount = Math.floor(canvasWidth / totalBarWidth);

        // amplitude 개수가 maxBarsCount보다 적으면 그대로, 많으면 다운샘플링
        // 이렇게 하면 처음엔 bar가 하나씩 쌓이다가 꽉 차면 압축 시작
        const barsCount = Math.min(amplitudes.length, maxBarsCount);
        const needsDownsample = amplitudes.length > maxBarsCount;

        ctx.beginPath();
        for (let i = 0; i < barsCount; i++) {
          let amplitude: number;

          if (needsDownsample) {
            // 다운샘플링: 각 bar가 담당하는 amplitude 범위의 최대값 사용
            const startIdx = Math.floor((i * amplitudes.length) / barsCount);
            const endIdx = Math.floor(((i + 1) * amplitudes.length) / barsCount);

            let maxAmplitude = 0;
            for (let j = startIdx; j < endIdx; j++) {
              maxAmplitude = Math.max(maxAmplitude, amplitudes[j] || 0);
            }
            amplitude = maxAmplitude;
          } else {
            // 아직 다운샘플링 불필요: 1:1 매핑
            amplitude = amplitudes[i] || 0;
          }

          const barHeight = Math.max(minBarHeight, amplitude * containerHeight * barHeightScale);

          // 픽셀 스냅핑: subpixel 렌더링으로 인한 일렁거림 방지
          // Math.round로 정수 좌표에 정렬하여 antialiasing 아티팩트 최소화
          const x = Math.round(i * totalBarWidth);
          const y = Math.round((containerHeight - barHeight) / 2);
          const roundedBarHeight = Math.round(barHeight);

          ctx.roundRect(x, y, barWidth, roundedBarHeight, barRadius);
        }
        ctx.fill();
      }
      // 녹음 중이 아니고 데이터도 없으면 아무것도 그리지 않음
    }, [amplitudes, isRecording, appearance]);

    // Track container size with ResizeObserver (크기를 캐싱하여 매 프레임 reflow 방지)
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;

        const { width, height } = entry.contentRect;
        // 크기 변경 없으면 무시
        if (sizeRef.current.width === width && sizeRef.current.height === height) return;

        sizeRef.current = { width, height };

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
        className={className}
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
