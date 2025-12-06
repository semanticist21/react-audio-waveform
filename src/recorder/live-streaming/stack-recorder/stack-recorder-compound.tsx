import { forwardRef, useCallback, useEffect, useRef } from "react";
import { DEFAULT_WAVEFORM_APPEARANCE } from "../../../constants";
import type { WaveformAppearance } from "../../../types";
import { type UseRecordingAmplitudesOptions, useRecordingAmplitudes } from "../use-recording-amplitudes";

// ============================================================================
// LiveStreamingStackRecorder - Fixed width waveform (bars compress as recording grows)
// ============================================================================

export interface LiveStreamingStackRecorderProps
  extends UseRecordingAmplitudesOptions,
    Omit<React.CanvasHTMLAttributes<HTMLCanvasElement>, "children"> {
  /** Waveform appearance configuration (barColor, barWidth, etc.) */
  appearance?: WaveformAppearance;
}

export const LiveStreamingStackRecorder = forwardRef<HTMLCanvasElement, LiveStreamingStackRecorderProps>(
  function LiveStreamingStackRecorder(
    { mediaRecorder, fftSize, smoothingTimeConstant, sampleInterval, appearance, className = "", style, ...props },
    ref
  ) {
    const { amplitudes, isRecording, isPaused } = useRecordingAmplitudes({
      mediaRecorder,
      fftSize,
      smoothingTimeConstant,
      sampleInterval,
    });

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | null>(null);
    // Cache canvas size (only update from ResizeObserver, avoid per-frame getBoundingClientRect)
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

    // Canvas rendering function (called in real-time during recording)
    const drawWaveform = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      // Use cached size (prevent layout thrashing)
      const containerWidth = sizeRef.current.width;
      const containerHeight = sizeRef.current.height;
      if (containerWidth === 0 || containerHeight === 0) return;

      // Extract styles from appearance (with defaults)
      const barColor = appearance?.barColor ?? DEFAULT_WAVEFORM_APPEARANCE.barColor;
      const barWidth = appearance?.barWidth ?? DEFAULT_WAVEFORM_APPEARANCE.barWidth;
      const barGap = appearance?.barGap ?? DEFAULT_WAVEFORM_APPEARANCE.barGap;
      const barRadius = appearance?.barRadius ?? DEFAULT_WAVEFORM_APPEARANCE.barRadius;
      const barHeightScale = appearance?.barHeightScale ?? DEFAULT_WAVEFORM_APPEARANCE.barHeightScale;

      const totalBarWidth = barWidth + barGap;

      // When recording or data exists
      if (isRecording || amplitudes.length > 0) {
        // Maintain fixed width (fit to container width)
        const canvasWidth = containerWidth;

        // canvas.width/height set only in ResizeObserver (setting here causes per-frame buffer recreation and flickering)
        // Only reapply DPR scale with setTransform
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Clear canvas
        ctx.clearRect(0, 0, canvasWidth, containerHeight);

        // Set bar color
        ctx.fillStyle = barColor;

        // Draw bars - draw each amplitude until canvas width exceeded, then downsample
        const minBarHeight = 2;
        const maxBarsCount = Math.floor(canvasWidth / totalBarWidth);

        // If amplitude count is less than maxBarsCount, use as-is; otherwise downsample
        // This way bars stack one by one until full, then compression starts
        const barsCount = Math.min(amplitudes.length, maxBarsCount);
        const needsDownsample = amplitudes.length > maxBarsCount;

        ctx.beginPath();
        for (let i = 0; i < barsCount; i++) {
          let amplitude: number;

          if (needsDownsample) {
            // Downsampling: use max value from amplitude range covered by each bar
            const startIdx = Math.floor((i * amplitudes.length) / barsCount);
            const endIdx = Math.floor(((i + 1) * amplitudes.length) / barsCount);

            let maxAmplitude = 0;
            for (let j = startIdx; j < endIdx; j++) {
              maxAmplitude = Math.max(maxAmplitude, amplitudes[j] || 0);
            }
            amplitude = maxAmplitude;
          } else {
            // No downsampling needed yet: 1:1 mapping
            amplitude = amplitudes[i] || 0;
          }

          const barHeight = Math.max(minBarHeight, amplitude * containerHeight * barHeightScale);

          // Pixel snapping: prevent flickering from subpixel rendering
          // Align to integer coordinates with Math.round to minimize antialiasing artifacts
          const x = Math.round(i * totalBarWidth);
          const y = Math.round((containerHeight - barHeight) / 2);
          const roundedBarHeight = Math.round(barHeight);

          ctx.roundRect(x, y, barWidth, roundedBarHeight, barRadius);
        }
        ctx.fill();
      }
      // Don't draw anything if not recording and no data
    }, [amplitudes, isRecording, appearance]);

    // Track container size with ResizeObserver (cache size to prevent per-frame reflow)
    // Canvas size is set here only to prevent flickering from per-frame resizing
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;

        const { width, height } = entry.contentRect;
        // Ignore if size unchanged
        if (sizeRef.current.width === width && sizeRef.current.height === height) return;

        sizeRef.current = { width, height };

        // Set canvas size only in ResizeObserver (per-frame setting causes buffer recreation and flickering)
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;

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

    return <canvas ref={canvasRef} className={className} style={style} aria-hidden="true" tabIndex={-1} {...props} />;
  }
);
