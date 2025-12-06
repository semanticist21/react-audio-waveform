import { type ForwardedRef, forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type { WaveformAppearance } from "../../types.js";
import { useAudioAnalyser } from "../use-audio-analyser.js";

export interface LiveRecorderProps extends React.CanvasHTMLAttributes<HTMLCanvasElement> {
  /**
   * MediaRecorder instance to visualize
   */
  mediaRecorder: MediaRecorder | null;
  /**
   * Waveform appearance configuration
   */
  appearance?: WaveformAppearance;
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
  /**
   * Amplitude multiplier - lower values produce quieter waveforms
   * @default 1.5
   */
  amplitudeScale?: number;
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
 * Real-time audio frequency visualization component
 * Analyzes MediaRecorder audio via Web Audio API and renders as bars
 */
export const LiveRecorder = forwardRef<LiveRecorderRef, LiveRecorderProps>(
  (
    {
      mediaRecorder,
      className = "",
      appearance,
      fftSize = 2048,
      smoothingTimeConstant = 0.8,
      showIdleState = true,
      amplitudeScale = 1.5,
      ...props
    },
    ref: ForwardedRef<LiveRecorderRef>
  ) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | null>(null);

    const { audioContextRef, analyserRef, dataArrayRef, bufferLengthRef } = useAudioAnalyser({
      mediaRecorder,
      fftSize,
      smoothingTimeConstant,
    });

    // Expose internal elements via ref
    useImperativeHandle(ref, () => ({
      getCanvas: () => canvasRef.current,
      getAudioContext: () => audioContextRef.current,
      getAnalyser: () => analyserRef.current,
    }));

    // Animation loop during recording
    useEffect(() => {
      if (!mediaRecorder || !canvasRef.current) {
        return;
      }

      const canvas = canvasRef.current;

      // Extract bar style values from appearance
      const barWidth = appearance?.barWidth ?? 3;
      const barGap = appearance?.barGap ?? 1;
      const barRadius = appearance?.barRadius ?? 1.5;
      const barHeightScale = appearance?.barHeightScale ?? 0.95;

      // barColor: from appearance or CSS currentColor
      const barColor = appearance?.barColor ?? getComputedStyle(canvas).color ?? "#3b82f6";

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

        // Get current canvas size
        const { width, height } = canvas.getBoundingClientRect();
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        // Get time domain data (waveform)
        analyser.getByteTimeDomainData(dataArray);

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Calculate bar count
        const totalBarWidth = barWidth + barGap;
        const numBars = Math.floor((width + barGap) / totalBarWidth);

        // Set bar color
        ctx.fillStyle = barColor;

        // Draw bars
        for (let i = 0; i < numBars; i++) {
          const dataIndex = Math.floor((i / numBars) * bufferLength);
          const value = dataArray[dataIndex] || 0;

          // Convert byte value (0-255) to height, centered at 128 (silence)
          // amplitudeScale adjusts amplitude (default 1.5, lower = quieter waveform)
          const amplitude = Math.min(1, (Math.abs(value - 128) / 128) * amplitudeScale);
          const barHeight = Math.max(2, amplitude * height * barHeightScale);

          const x = i * totalBarWidth;
          const y = (height - barHeight) / 2;

          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, barRadius);
          ctx.fill();
        }

        animationRef.current = requestAnimationFrame(draw);
      };

      // Pause/resume event handlers
      const handlePause = () => {
        isPaused = true;
      };
      const handleResume = () => {
        isPaused = false;
      };

      mediaRecorder.addEventListener("pause", handlePause);
      mediaRecorder.addEventListener("resume", handleResume);

      // Start animation after analyser is ready
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
    }, [mediaRecorder, appearance, amplitudeScale, analyserRef, dataArrayRef, bufferLengthRef]);

    // Draw idle state (before recording starts)
    useEffect(() => {
      if (mediaRecorder || !showIdleState || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;

      // Extract bar style values from appearance
      const barWidth = appearance?.barWidth ?? 3;
      const barGap = appearance?.barGap ?? 1;
      const barRadius = appearance?.barRadius ?? 1.5;
      const barColor = appearance?.barColor ?? getComputedStyle(canvas).color ?? "#3b82f6";

      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      ctx.clearRect(0, 0, width, height);

      // Idle state: draw minimum height bars
      ctx.fillStyle = barColor;
      const minBarHeight = 2;
      const totalBarWidth = barWidth + barGap;
      const barCount = Math.floor((width + barGap) / totalBarWidth);

      for (let i = 0; i < barCount; i++) {
        const x = i * totalBarWidth;
        const y = (height - minBarHeight) / 2;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, minBarHeight, barRadius);
        ctx.fill();
      }
    }, [mediaRecorder, appearance, showIdleState]);

    return (
      <canvas ref={canvasRef} className={`text-inherit ${className}`} aria-hidden="true" tabIndex={-1} {...props} />
    );
  }
);

LiveRecorder.displayName = "LiveRecorder";
