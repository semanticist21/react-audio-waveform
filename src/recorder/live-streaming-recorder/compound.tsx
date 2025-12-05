import { forwardRef, type HTMLAttributes, type ReactNode, useEffect, useRef } from "react";
import { type BarConfig, type BarStyle, getCanvasBarStyles } from "../../waveform/util-canvas";
import { LiveStreamingRecorderProvider, useLiveStreamingRecorderContext } from "./context";
import type { UseRecordingAmplitudesOptions } from "./use-recording-amplitudes";

// ============================================================================
// LiveStreamingRecorder.Root
// ============================================================================

export interface LiveStreamingRecorderRootProps
  extends UseRecordingAmplitudesOptions,
    Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  children: ReactNode | ((value: ReturnType<typeof useLiveStreamingRecorderContext>) => ReactNode);
  /** Enable auto-scroll behavior (default: true) */
  autoScroll?: boolean;
}

const LiveStreamingRecorderRoot = forwardRef<HTMLDivElement, LiveStreamingRecorderRootProps>(
  function LiveStreamingRecorderRoot(
    { children, className = "", autoScroll = true, mediaRecorder, sampleInterval, ...props },
    ref
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const isAutoScrollingRef = useRef(autoScroll);

    // Forward ref
    useEffect(() => {
      if (ref) {
        if (typeof ref === "function") {
          ref(containerRef.current);
        } else {
          ref.current = containerRef.current;
        }
      }
    }, [ref]);

    // Detect manual scrolling to disable auto-scroll
    useEffect(() => {
      const container = containerRef.current;
      if (!container || !autoScroll) return;

      const handleScroll = () => {
        const { scrollLeft, scrollWidth, clientWidth } = container;
        // Re-enable auto-scroll if scrolled within 10px of the end
        isAutoScrollingRef.current = scrollLeft + clientWidth >= scrollWidth - 10;
      };

      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }, [autoScroll]);

    return (
      <div ref={containerRef} className={`overflow-x-auto overflow-y-hidden ${className}`} {...props}>
        <LiveStreamingRecorderProvider mediaRecorder={mediaRecorder} sampleInterval={sampleInterval}>
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
  /** Bar 렌더링 설정 (heightScale, width, gap, radius) */
  barConfig?: BarConfig;
}

const LiveStreamingRecorderCanvas = forwardRef<HTMLCanvasElement, LiveStreamingRecorderCanvasProps>(
  function LiveStreamingRecorderCanvas({ className = "", style, barConfig, ...props }, ref) {
    const { amplitudes, isRecording } = useLiveStreamingRecorderContext();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const animationRef = useRef<number | null>(null);

    // barConfig에서 값 추출 (기본값 적용)
    const barHeightScale = barConfig?.heightScale ?? 0.9;
    const barStyle: BarStyle | undefined = barConfig
      ? {
          width: barConfig.width,
          gap: barConfig.gap,
          radius: barConfig.radius,
        }
      : undefined;

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

    // Find parent Root element (overflow container)
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Find parent element with overflow-x scrolling
      let parent = canvas.parentElement;
      while (parent) {
        const overflow = getComputedStyle(parent).overflowX;
        if (overflow === "auto" || overflow === "scroll") {
          containerRef.current = parent as HTMLDivElement;
          break;
        }
        parent = parent.parentElement;
      }
    }, []);

    // Render canvas during recording
    useEffect(() => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container || !isRecording) return;

      // Read bar styles from barConfig or CSS variables (once)
      const { barWidth, gap, barRadius, barColor } = getCanvasBarStyles(canvas, barStyle);

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;

      const draw = () => {
        if (!ctx) return;

        const totalBarWidth = barWidth + gap;
        const requiredWidth = amplitudes.length * totalBarWidth;
        const containerHeight = container.clientHeight;
        const containerWidth = container.clientWidth;

        // Update canvas dimensions
        canvas.style.width = `${Math.max(requiredWidth, containerWidth)}px`;
        canvas.style.height = `${containerHeight}px`;
        canvas.width = Math.max(requiredWidth, containerWidth) * dpr;
        canvas.height = containerHeight * dpr;
        ctx.scale(dpr, dpr);

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Set bar color
        ctx.fillStyle = barColor;

        // Render bars
        const height = containerHeight;
        const minBarHeight = 2;

        for (let i = 0; i < amplitudes.length; i++) {
          const amplitude = amplitudes[i];
          // Apply height scale (default 0.9 = 90% max height)
          const barHeight = Math.max(minBarHeight, amplitude * height * barHeightScale);

          const x = i * totalBarWidth;
          const y = (height - barHeight) / 2;

          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, barRadius);
          ctx.fill();
        }

        // Auto-scroll to end
        if (requiredWidth > containerWidth) {
          container.scrollLeft = requiredWidth - containerWidth;
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
    }, [amplitudes, isRecording, barHeightScale, barStyle]);

    // Render stopped state (when not recording)
    useEffect(() => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container || isRecording) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const containerHeight = container.clientHeight;
      const containerWidth = container.clientWidth;

      // Read bar styles from barConfig or CSS variables
      const { barWidth, gap, barRadius, barColor } = getCanvasBarStyles(canvas, barStyle);
      const totalBarWidth = barWidth + gap;

      // Render recorded data if available
      if (amplitudes.length > 0) {
        const requiredWidth = amplitudes.length * totalBarWidth;

        canvas.style.width = `${Math.max(requiredWidth, containerWidth)}px`;
        canvas.style.height = `${containerHeight}px`;
        canvas.width = Math.max(requiredWidth, containerWidth) * dpr;
        canvas.height = containerHeight * dpr;
        ctx.scale(dpr, dpr);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = barColor;

        const minBarHeight = 2;
        const height = containerHeight;

        for (let i = 0; i < amplitudes.length; i++) {
          const amplitude = amplitudes[i];
          // Apply height scale (default 0.9 = 90% max height)
          const barHeight = Math.max(minBarHeight, amplitude * height * barHeightScale);
          const x = i * totalBarWidth;
          const y = (height - barHeight) / 2;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, barRadius);
          ctx.fill();
        }
      } else {
        // No data - render idle state (minimal bars)
        canvas.style.width = `${containerWidth}px`;
        canvas.style.height = `${containerHeight}px`;
        canvas.width = containerWidth * dpr;
        canvas.height = containerHeight * dpr;
        ctx.scale(dpr, dpr);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = barColor;

        const minBarHeight = 2;
        const barCount = Math.floor(containerWidth / totalBarWidth);

        for (let i = 0; i < barCount; i++) {
          const x = i * totalBarWidth;
          const y = (containerHeight - minBarHeight) / 2;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, minBarHeight, barRadius);
          ctx.fill();
        }
      }
    }, [amplitudes, isRecording, barHeightScale, barStyle]);

    return (
      <>
        <canvas
          ref={canvasRef}
          className={`text-inherit h-full min-w-full ${className}`}
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
          {isRecording ? "Recording in progress" : "Recording stopped"}
        </span>
      </>
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
