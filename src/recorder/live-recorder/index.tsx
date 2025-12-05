import { type ForwardedRef, forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type { BarConfig } from "../../waveform/util-canvas";
import { useAudioAnalyser } from "../use-audio-analyser";

export interface LiveRecorderProps {
  /**
   * MediaRecorder instance to visualize
   */
  mediaRecorder: MediaRecorder | null;
  /**
   * CSS class for styling. Use Tailwind classes:
   * - text-* for bar color (inherited via text-inherit)
   * - bg-* for background color
   */
  className?: string;
  /**
   * Bar styling configuration
   */
  barConfig?: BarConfig;
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
  /**
   * Show minimal bars when not recording (idle state)
   * @default true
   */
  showIdleState?: boolean;
}

export interface LiveRecorderRef {
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
export const LiveRecorder = forwardRef<LiveRecorderRef, LiveRecorderProps>(
  (
    { mediaRecorder, className = "", barConfig, fftSize = 2048, smoothingTimeConstant = 0.8, showIdleState = true },
    ref: ForwardedRef<LiveRecorderRef>
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

    // Animation loop for rendering (녹음 중)
    useEffect(() => {
      if (!mediaRecorder || !canvasRef.current) {
        return;
      }

      const canvas = canvasRef.current;

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

        // Calculate number of bars (assuming no gap after last bar)
        const totalBarWidth = barWidth + gap;
        const numBars = Math.floor((width + gap) / totalBarWidth);

        // Set bar color (Use captured value from closure)
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
    }, [mediaRecorder, barConfig, analyserRef, dataArrayRef, bufferLengthRef]);

    // Draw idle state (녹음 시작 전)
    useEffect(() => {
      if (!mediaRecorder && showIdleState && canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;

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
        const barColor = getComputedStyle(canvas).color || "#3b82f6";

        const { width, height } = canvas.getBoundingClientRect();
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        ctx.clearRect(0, 0, width, height);

        // Draw idle state (minimal bars)
        ctx.fillStyle = barColor;
        const minBarHeight = 2;
        const totalBarWidth = barWidth + gap;
        const barCount = Math.floor((width + gap) / totalBarWidth);

        for (let i = 0; i < barCount; i++) {
          const x = i * totalBarWidth;
          const y = (height - minBarHeight) / 2;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, minBarHeight, barRadius);
          ctx.fill();
        }
      }
    }, [mediaRecorder, barConfig, showIdleState]);

    return <canvas ref={canvasRef} className={`text-inherit ${className}`} aria-hidden="true" tabIndex={-1} />;
  }
);

LiveRecorder.displayName = "LiveRecorder";
