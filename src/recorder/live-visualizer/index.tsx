import { type ForwardedRef, forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { useAudioAnalyser } from "../use-audio-analyser";

export interface LiveAudioVisualizerProps {
  /**
   * MediaRecorder instance to visualize
   */
  mediaRecorder: MediaRecorder | null;
  /**
   * CSS class for styling. Use Tailwind classes:
   * - text-* for bar color (inherited via text-inherit)
   * - bg-* for background color
   * - [--bar-width:N] for bar width in pixels
   * - [--bar-gap:N] for gap between bars in pixels
   * - [--bar-radius:N] for bar border radius in pixels
   */
  className?: string;
  /**
   * Inline styles including CSS custom properties for bar styling
   */
  style?: React.CSSProperties & {
    "--bar-width"?: number;
    "--bar-gap"?: number;
    "--bar-radius"?: number;
  };
  /**
   * FFT size for frequency analysis (must be power of 2)
   * @default 2048
   */
  fftSize?: number;
  /**
   * Smoothing time constant for analyser (0-1)
   * @default 0.8
   */
  smoothingTimeConstant?: number;
}

export interface LiveAudioVisualizerRef {
  /** Get the canvas element */
  getCanvas: () => HTMLCanvasElement | null;
  /** Get the audio context */
  getAudioContext: () => AudioContext | null;
  /** Get the analyser node */
  getAnalyser: () => AnalyserNode | null;
}

/**
 * Real-time audio visualizer for live recording
 * Visualizes audio from MediaRecorder using Web Audio API
 */
export const LiveAudioVisualizer = forwardRef<LiveAudioVisualizerRef, LiveAudioVisualizerProps>(
  (
    { mediaRecorder, className = "", style, fftSize = 2048, smoothingTimeConstant = 0.8 },
    ref: ForwardedRef<LiveAudioVisualizerRef>
  ) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | null>(null);

    const { audioContextRef, analyserRef, dataArrayRef, bufferLengthRef } = useAudioAnalyser({
      mediaRecorder,
      fftSize,
      smoothingTimeConstant,
    });

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      getCanvas: () => canvasRef.current,
      getAudioContext: () => audioContextRef.current,
      getAnalyser: () => analyserRef.current,
    }));

    // Animation loop for rendering
    useEffect(() => {
      if (!mediaRecorder || !canvasRef.current) {
        return;
      }

      const canvas = canvasRef.current;

      // Get CSS variables for bar styling
      const barWidth = Number.parseInt(getComputedStyle(canvas).getPropertyValue("--bar-width") || "3", 10);
      const gap = Number.parseInt(getComputedStyle(canvas).getPropertyValue("--bar-gap") || "1", 10);
      const barRadius = Number.parseInt(getComputedStyle(canvas).getPropertyValue("--bar-radius") || "1.5", 10);

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      let isPaused = false;

      const draw = () => {
        if (isPaused) {
          animationRef.current = requestAnimationFrame(draw);
          return;
        }

        const analyser = analyserRef.current;
        const dataArray = dataArrayRef.current;
        const bufferLength = bufferLengthRef.current;

        if (!analyser || !dataArray || !ctx) return;

        // Get current canvas dimensions
        const { width, height } = canvas.getBoundingClientRect();
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        // Get time domain data (waveform)
        analyser.getByteTimeDomainData(dataArray);

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Calculate number of bars that fit
        const totalBarWidth = barWidth + gap;
        const numBars = Math.floor(width / totalBarWidth);

        // Get bar color from text-inherit
        const barColor = getComputedStyle(canvas).color;
        ctx.fillStyle = barColor;

        // Draw bars
        for (let i = 0; i < numBars; i++) {
          const dataIndex = Math.floor((i / numBars) * bufferLength);
          const value = dataArray[dataIndex] || 0;

          // Convert byte value (0-255) to height, center around 128 (silence)
          const amplitude = Math.abs(value - 128) / 128;
          const barHeight = Math.max(2, amplitude * height);

          const x = i * totalBarWidth;
          const y = (height - barHeight) / 2;

          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, barRadius);
          ctx.fill();
        }

        animationRef.current = requestAnimationFrame(draw);
      };

      // Handle pause/resume events
      const handlePause = () => {
        isPaused = true;
      };
      const handleResume = () => {
        isPaused = false;
      };

      mediaRecorder.addEventListener("pause", handlePause);
      mediaRecorder.addEventListener("resume", handleResume);

      // Start animation after a short delay to ensure analyser is ready
      const timeoutId = setTimeout(() => {
        draw();
      }, 50);

      return () => {
        clearTimeout(timeoutId);
        mediaRecorder.removeEventListener("pause", handlePause);
        mediaRecorder.removeEventListener("resume", handleResume);
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = null;
        }
      };
    }, [mediaRecorder, analyserRef, dataArrayRef, bufferLengthRef]);

    return <canvas ref={canvasRef} className={`text-inherit ${className}`} style={style} />;
  }
);

LiveAudioVisualizer.displayName = "LiveAudioVisualizer";
