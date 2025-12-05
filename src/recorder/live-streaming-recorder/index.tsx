import { type ForwardedRef, forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type { BarConfig } from "../../waveform/util-canvas";
import { useAudioAnalyser } from "../use-audio-analyser";

export interface LiveStreamingRecorderProps {
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
   * @default 0.4
   */
  smoothingTimeConstant?: number;
  /**
   * Interval in ms for sampling amplitude data
   * @default 50
   */
  sampleInterval?: number;
  /**
   * Show minimal bars when not recording (idle state)
   * @default true
   */
  showIdleState?: boolean;
}

export interface LiveStreamingRecorderRef {
  /** Get the canvas element */
  getCanvas: () => HTMLCanvasElement | null;
  /** Get the audio context */
  getAudioContext: () => AudioContext | null;
  /** Get the analyser node */
  getAnalyser: () => AnalyserNode | null;
  /** Get the recorded amplitude data */
  getAmplitudeData: () => number[];
  /** Clear all amplitude data */
  clearAmplitudes: () => void;
}

/**
 * Timeline-based waveform visualizer for recording
 * Shows amplitude timeline that grows as recording progresses
 */
export const LiveStreamingRecorder = forwardRef<LiveStreamingRecorderRef, LiveStreamingRecorderProps>(
  (
    {
      mediaRecorder,
      className = "",
      barConfig,
      fftSize = 2048,
      smoothingTimeConstant = 0.4,
      sampleInterval = 50,
      showIdleState = true,
    },
    ref: ForwardedRef<LiveStreamingRecorderRef>
  ) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | null>(null);
    const samplingIntervalRef = useRef<number | null>(null);
    const amplitudeDataRef = useRef<number[]>([]);

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
      getAmplitudeData: () => [...amplitudeDataRef.current],
      clearAmplitudes: () => {
        amplitudeDataRef.current = [];
      },
    }));

    // Sampling and rendering loop (녹음 중)
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

      // Reset amplitude data when starting new recording
      amplitudeDataRef.current = [];

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      let isPaused = false;

      // Sample amplitude data at regular intervals
      const sampleAmplitude = () => {
        const analyser = analyserRef.current;
        const dataArray = dataArrayRef.current;
        const bufferLength = bufferLengthRef.current;

        if (!analyser || !dataArray) return;

        analyser.getByteTimeDomainData(dataArray);

        // Calculate RMS amplitude
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          const normalized = (dataArray[i] - 128) / 128;
          sum += normalized * normalized;
        }
        const rms = Math.sqrt(sum / bufferLength);

        // Store amplitude (0-1 range)
        amplitudeDataRef.current.push(Math.min(1, rms * 2));
      };

      // Animation loop for rendering
      const draw = () => {
        if (isPaused) {
          animationRef.current = requestAnimationFrame(draw);
          return;
        }

        if (!ctx) return;

        // Get current canvas dimensions
        const { width, height } = canvas.getBoundingClientRect();
        const amplitudeData = amplitudeDataRef.current;
        const totalBarWidth = barWidth + gap;

        // Calculate required canvas width based on data
        const requiredWidth = amplitudeData.length * totalBarWidth;
        const canvasWidth = Math.max(requiredWidth, width);

        canvas.width = canvasWidth * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        // Clear canvas
        ctx.clearRect(0, 0, canvasWidth, height);

        // Set bar color
        ctx.fillStyle = barColor;

        // Draw bars from amplitude data
        const minBarHeight = 2;

        for (let i = 0; i < amplitudeData.length; i++) {
          const amplitude = amplitudeData[i];
          const barHeight = Math.max(minBarHeight, amplitude * height * 0.9);

          const x = i * totalBarWidth;
          const y = (height - barHeight) / 2;

          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, barRadius);
          ctx.fill();
        }

        animationRef.current = requestAnimationFrame(draw);
      };

      const startSampling = () => {
        if (!samplingIntervalRef.current) {
          samplingIntervalRef.current = window.setInterval(sampleAmplitude, sampleInterval);
        }
      };

      const stopSampling = () => {
        if (samplingIntervalRef.current) {
          clearInterval(samplingIntervalRef.current);
          samplingIntervalRef.current = null;
        }
      };

      // Handle pause/resume events
      const handlePause = () => {
        isPaused = true;
        stopSampling();
      };
      const handleResume = () => {
        isPaused = false;
        startSampling();
      };

      mediaRecorder.addEventListener("pause", handlePause);
      mediaRecorder.addEventListener("resume", handleResume);

      // Start sampling and animation after a short delay to ensure analyser is ready
      const timeoutId = setTimeout(() => {
        startSampling();
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
        stopSampling();
      };
    }, [mediaRecorder, barConfig, sampleInterval, analyserRef, dataArrayRef, bufferLengthRef]);

    // Draw stopped state (녹음 정지 후)
    useEffect(() => {
      if (!mediaRecorder && canvasRef.current) {
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
        const amplitudeData = amplitudeDataRef.current;
        const totalBarWidth = barWidth + gap;

        // If we have recorded data, draw it (stopped state)
        if (amplitudeData.length > 0) {
          const requiredWidth = amplitudeData.length * totalBarWidth;
          const canvasWidth = Math.max(requiredWidth, width);

          canvas.width = canvasWidth * dpr;
          canvas.height = height * dpr;
          ctx.scale(dpr, dpr);

          ctx.clearRect(0, 0, canvasWidth, height);

          ctx.fillStyle = barColor;
          const minBarHeight = 2;

          for (let i = 0; i < amplitudeData.length; i++) {
            const amplitude = amplitudeData[i];
            const barHeight = Math.max(minBarHeight, amplitude * height * 0.9);
            const x = i * totalBarWidth;
            const y = (height - barHeight) / 2;
            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, barHeight, barRadius);
            ctx.fill();
          }
        } else if (showIdleState) {
          // No data - draw idle state (minimal bars)
          canvas.width = width * dpr;
          canvas.height = height * dpr;
          ctx.scale(dpr, dpr);

          ctx.clearRect(0, 0, width, height);

          ctx.fillStyle = barColor;
          const minBarHeight = 2;
          const barCount = Math.floor((width + gap) / totalBarWidth);

          for (let i = 0; i < barCount; i++) {
            const x = i * totalBarWidth;
            const y = (height - minBarHeight) / 2;
            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, minBarHeight, barRadius);
            ctx.fill();
          }
        }
      }
    }, [mediaRecorder, barConfig, showIdleState]);

    return <canvas ref={canvasRef} className={`text-inherit ${className}`} aria-hidden="true" tabIndex={-1} />;
  }
);

LiveStreamingRecorder.displayName = "LiveStreamingRecorder";
