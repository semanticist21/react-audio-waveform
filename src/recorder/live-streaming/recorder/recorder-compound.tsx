import { forwardRef, type HTMLAttributes, type ReactNode, useCallback, useEffect, useRef } from "react";
import { DEFAULT_WAVEFORM_APPEARANCE } from "../../../constants";
import type { WaveformAppearance } from "../../../types";
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
    // Inject WebKit overlay scrollbar styles (runs once)
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

    // Apply default scrollbar styles and overflow (LiveStreamingRecorder uses scrolling concept)
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
  /** Waveform appearance configuration (barColor, barWidth, etc.) */
  appearance?: WaveformAppearance;
  /**
   * Allow canvas width to grow beyond container (enables scrolling)
   * - true: Canvas grows horizontally as recording continues (Voice Memos style)
   * - false: Canvas stays fixed width, bars get compressed
   * @default true
   */
  growWidth?: boolean;
}

const LiveStreamingRecorderCanvas = forwardRef<HTMLCanvasElement, LiveStreamingRecorderCanvasProps>(
  function LiveStreamingRecorderCanvas({ className = "", style, appearance, growWidth = true, ...props }, ref) {
    const { amplitudes, isRecording, isPaused } = useLiveStreamingRecorderContext();

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | null>(null);
    const containerSizeRef = useRef({ width: 0, height: 0 });
    const containerRef = useRef<HTMLElement | null>(null);

    // Track canvas width in growWidth mode to ensure it never shrinks
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

    // Reset canvas width ref when new recording starts
    useEffect(() => {
      if (amplitudes.length === 0) {
        prevCanvasWidthRef.current = 0;
      }
    }, [amplitudes.length]);

    // Canvas rendering function (called in real-time during recording)
    const drawWaveform = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;

      // Get container's actual size (use parent element's size)
      const container = canvas.parentElement;
      const containerWidth = container?.clientWidth || canvas.clientWidth;
      const containerHeight = container?.clientHeight || canvas.clientHeight;

      // Extract styles from appearance (with defaults)
      const barColor = appearance?.barColor ?? DEFAULT_WAVEFORM_APPEARANCE.barColor;
      const barWidth = appearance?.barWidth ?? DEFAULT_WAVEFORM_APPEARANCE.barWidth;
      const barGap = appearance?.barGap ?? DEFAULT_WAVEFORM_APPEARANCE.barGap;
      const barRadius = appearance?.barRadius ?? DEFAULT_WAVEFORM_APPEARANCE.barRadius;
      const barHeightScale = appearance?.barHeightScale ?? DEFAULT_WAVEFORM_APPEARANCE.barHeightScale;

      const totalBarWidth = barWidth + barGap;

      // When recording or data exists
      if (isRecording || amplitudes.length > 0) {
        // Calculate canvas width: different handling based on growWidth
        let canvasWidth: number;
        if (growWidth) {
          // Canvas grows with data (enables scrolling)
          // Calculate width based on amplitudes length for accurate width during pause/resume
          const requiredWidth = amplitudes.length * totalBarWidth;
          // Use containerWidth only as minimum (prevent too small when empty)
          const calculatedWidth = amplitudes.length > 0 ? requiredWidth : containerWidth;
          // In growWidth mode, canvas width never shrinks (pause/resume stability)
          canvasWidth = Math.max(calculatedWidth, prevCanvasWidthRef.current);
          prevCanvasWidthRef.current = canvasWidth;
          // Set CSS layout size explicitly (enable scrolling)
          canvas.style.width = `${canvasWidth}px`;
        } else {
          // Maintain fixed width (bars compress)
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

        // Draw bars from amplitude data (minimize draw calls with path batching)
        const minBarHeight = 2;
        ctx.beginPath();

        if (growWidth) {
          // Scrolling mode: one bar per amplitude
          for (let i = 0; i < amplitudes.length; i++) {
            const amplitude = amplitudes[i];
            const barHeight = Math.max(minBarHeight, amplitude * containerHeight * barHeightScale);

            const x = i * totalBarWidth;
            const y = (containerHeight - barHeight) / 2;

            ctx.roundRect(x, y, barWidth, barHeight, barRadius);
          }
        } else {
          // Fixed width mode: compress amplitudes to fit canvas width
          const barsCount = Math.floor(canvasWidth / totalBarWidth);
          const step = amplitudes.length / barsCount;

          for (let i = 0; i < barsCount; i++) {
            const amplitudeIndex = Math.min(Math.floor(i * step), amplitudes.length - 1);
            const amplitude = amplitudes[amplitudeIndex] || 0;
            const barHeight = Math.max(minBarHeight, amplitude * containerHeight * barHeightScale);

            const x = i * totalBarWidth;
            const y = (containerHeight - barHeight) / 2;

            ctx.roundRect(x, y, barWidth, barHeight, barRadius);
          }
        }

        ctx.fill();
      }
      // Don't draw anything if not recording and no data
    }, [amplitudes, isRecording, appearance, growWidth]);

    // Track container size with ResizeObserver and get parent container reference
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Find scrollable parent container
      containerRef.current = canvas.parentElement;

      const resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;

        const { width, height } = entry.contentRect;
        containerSizeRef.current = { width, height };

        // Redraw when container size changes
        if (!isRecording) {
          drawWaveform();
        }
      });

      resizeObserver.observe(canvas);
      return () => resizeObserver.disconnect();
    }, [isRecording, drawWaveform]);

    // Animation loop when recording (runs every frame for real-time updates)
    useEffect(() => {
      if (isRecording && !isPaused) {
        const draw = () => {
          drawWaveform();

          // Auto-scroll to right edge while recording
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
      // Draw once when stopped or paused (preserve waveform after recording ends)
      drawWaveform();
    }, [isRecording, isPaused, drawWaveform, growWidth]);

    return (
      <canvas
        ref={canvasRef}
        className={className}
        style={{
          // Set to block in growWidth mode to allow self-determined width
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
