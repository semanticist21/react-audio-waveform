import { useOverlayScrollbars } from "overlayscrollbars-react";
import { forwardRef, type HTMLAttributes, type ReactNode, useCallback, useEffect, useId, useRef } from "react";
import { DEFAULT_SCROLLBAR_APPEARANCE, DEFAULT_WAVEFORM_APPEARANCE } from "../../../constants";
import type { LiveStreamingRecorderAppearance } from "../../../types";
import type { UseRecordingAmplitudesOptions } from "../use-recording-amplitudes";
import { LiveStreamingRecorderProvider, useLiveStreamingRecorderContext } from "./recorder-context";

// ============================================================================
// LiveStreamingRecorder.Root
// ============================================================================

export interface LiveStreamingRecorderRootProps
  extends UseRecordingAmplitudesOptions,
    Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  children: ReactNode | ((value: ReturnType<typeof useLiveStreamingRecorderContext>) => ReactNode);
  /** Appearance configuration (waveform + scrollbar styles) */
  appearance?: LiveStreamingRecorderAppearance;
}

const LiveStreamingRecorderRoot = forwardRef<HTMLDivElement, LiveStreamingRecorderRootProps>(
  function LiveStreamingRecorderRoot(
    {
      children,
      className = "",
      style,
      mediaRecorder,
      fftSize,
      smoothingTimeConstant,
      sampleInterval,
      appearance,
      ...props
    },
    ref
  ) {
    const containerRef = useRef<HTMLDivElement>(null);

    // Generate unique scrollbar theme class name (prevent style conflicts between instances)
    const uniqueId = useId().replace(/:/g, "");
    const themeClassName = `os-theme-lsr-${uniqueId}`;

    // Extract scrollbar appearance values
    const scrollbar = appearance?.scrollbar;
    const thumbColor = scrollbar?.thumbColor ?? DEFAULT_SCROLLBAR_APPEARANCE.thumbColor;
    const hidden = scrollbar?.hidden ?? DEFAULT_SCROLLBAR_APPEARANCE.hidden;

    // Initialize OverlayScrollbars hook
    const [initializeOS, osInstance] = useOverlayScrollbars({
      options: {
        overflow: { x: "scroll", y: "hidden" },
        scrollbars: {
          theme: themeClassName,
          visibility: hidden ? "hidden" : "auto",
          autoHide: "leave", // Hide when mouse leaves area (most common UX)
          autoHideDelay: 400,
          dragScroll: true,
          clickScroll: true,
        },
      },
      defer: true,
    });

    // Initialize OverlayScrollbars on container
    useEffect(() => {
      if (containerRef.current) {
        initializeOS(containerRef.current);
      }
    }, [initializeOS]);

    // Update scrollbar visibility when hidden option changes
    useEffect(() => {
      const instance = osInstance();
      if (instance) {
        instance.options({
          scrollbars: {
            visibility: hidden ? "hidden" : "auto",
          },
        });
      }
    }, [osInstance, hidden]);

    // Inject OverlayScrollbars theme CSS variables (only thumbColor is customizable)
    useEffect(() => {
      const styleId = `lsr-os-theme-${uniqueId}`;
      document.getElementById(styleId)?.remove();

      const styleElement = document.createElement("style");
      styleElement.id = styleId;
      styleElement.textContent = `
        .${themeClassName} {
          --os-size: 8px;
          --os-padding-perpendicular: 2px;
          --os-padding-axis: 2px;
          --os-track-border-radius: 4px;
          --os-track-bg: transparent;
          --os-track-bg-hover: transparent;
          --os-handle-border-radius: 4px;
          --os-handle-bg: ${thumbColor};
          --os-handle-bg-hover: ${thumbColor};
          --os-handle-bg-active: ${thumbColor};
          --os-handle-min-size: 30px;
        }
      `;
      document.head.appendChild(styleElement);

      return () => {
        document.getElementById(styleId)?.remove();
      };
    }, [uniqueId, themeClassName, thumbColor]);

    // Forward ref to container element
    useEffect(() => {
      if (ref) {
        if (typeof ref === "function") {
          ref(containerRef.current);
        } else {
          ref.current = containerRef.current;
        }
      }
    }, [ref]);

    return (
      <div ref={containerRef} className={className} style={style} {...props}>
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
  /** Waveform appearance configuration (barColor, barWidth, etc.) - scrollbar settings only apply in Root */
  appearance?: LiveStreamingRecorderAppearance;
}

const LiveStreamingRecorderCanvas = forwardRef<HTMLCanvasElement, LiveStreamingRecorderCanvasProps>(
  function LiveStreamingRecorderCanvas({ className = "", style, appearance, ...props }, ref) {
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
        // Canvas grows with data (enables scrolling, Voice Memos style)
        const requiredWidth = amplitudes.length * totalBarWidth;
        const calculatedWidth = amplitudes.length > 0 ? requiredWidth : containerWidth;
        // Canvas width never shrinks (ensures stability during pause/resume)
        const canvasWidth = Math.max(calculatedWidth, prevCanvasWidthRef.current);
        prevCanvasWidthRef.current = canvasWidth;
        canvas.style.width = `${canvasWidth}px`;

        canvas.width = canvasWidth * dpr;
        canvas.height = containerHeight * dpr;
        ctx.scale(dpr, dpr);

        // Clear canvas
        ctx.clearRect(0, 0, canvasWidth, containerHeight);

        // Set bar color
        ctx.fillStyle = barColor;

        // Draw bars - 1:1 mapping (one bar per amplitude sample)
        const minBarHeight = 2;
        ctx.beginPath();

        for (let i = 0; i < amplitudes.length; i++) {
          const amplitude = amplitudes[i];
          const barHeight = Math.max(minBarHeight, amplitude * containerHeight * barHeightScale);

          const x = i * totalBarWidth;
          const y = (containerHeight - barHeight) / 2;

          ctx.roundRect(x, y, barWidth, barHeight, barRadius);
        }

        ctx.fill();
      }
      // Don't draw anything if not recording and no data
    }, [amplitudes, isRecording, appearance]);

    // Track container size with ResizeObserver and get OverlayScrollbars viewport reference
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Find OverlayScrollbars viewport element (.os-viewport class)
      // Structure: Root > .os-viewport (actual scroll container) > .os-content > canvas
      const osContent = canvas.parentElement;
      const osViewport = osContent?.parentElement;
      if (osViewport?.classList.contains("os-viewport")) {
        containerRef.current = osViewport;
      } else {
        // Fallback: before OverlayScrollbars initialization or different structure
        containerRef.current = canvas.parentElement;
      }

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
          if (containerRef.current) {
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
    }, [isRecording, isPaused, drawWaveform]);

    return (
      <canvas
        ref={canvasRef}
        className={className}
        style={{
          display: "block",
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
