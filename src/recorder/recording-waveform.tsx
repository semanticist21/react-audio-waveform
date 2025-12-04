import { type ForwardedRef, forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { useAudioAnalyser } from "./use-audio-analyser";

export interface RecordingWaveformProps {
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
   * Inline styles including CSS custom properties
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
   * @default 0.4
   */
  smoothingTimeConstant?: number;
  /**
   * Interval in ms for sampling amplitude data
   * @default 50
   */
  sampleInterval?: number;
}

export interface RecordingWaveformRef {
  /** Get the canvas element */
  getCanvas: () => HTMLCanvasElement | null;
  /** Get the scroll container element */
  getScrollContainer: () => HTMLDivElement | null;
  /** Get the audio context */
  getAudioContext: () => AudioContext | null;
  /** Get the analyser node */
  getAnalyser: () => AnalyserNode | null;
  /** Get the recorded amplitude data */
  getAmplitudeData: () => number[];
  /** Scroll to the end (latest recording) */
  scrollToEnd: () => void;
}

/**
 * Timeline-based waveform visualizer for recording
 * Shows a scrollable waveform that grows as recording progresses (like Voice Memos)
 */
export const RecordingWaveform = forwardRef<RecordingWaveformRef, RecordingWaveformProps>(
  (
    { mediaRecorder, className = "", style, fftSize = 2048, smoothingTimeConstant = 0.4, sampleInterval = 50 },
    ref: ForwardedRef<RecordingWaveformRef>
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | null>(null);
    const samplingIntervalRef = useRef<number | null>(null);
    const amplitudeDataRef = useRef<number[]>([]);
    const isAutoScrollingRef = useRef(true);

    const { audioContextRef, analyserRef, dataArrayRef, bufferLengthRef } = useAudioAnalyser({
      mediaRecorder,
      fftSize,
      smoothingTimeConstant,
    });

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      getCanvas: () => canvasRef.current,
      getScrollContainer: () => containerRef.current,
      getAudioContext: () => audioContextRef.current,
      getAnalyser: () => analyserRef.current,
      getAmplitudeData: () => [...amplitudeDataRef.current],
      scrollToEnd: () => {
        if (containerRef.current) {
          containerRef.current.scrollLeft = containerRef.current.scrollWidth;
        }
      },
    }));

    // Handle scroll events to detect manual scrolling
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const handleScroll = () => {
        const { scrollLeft, scrollWidth, clientWidth } = container;
        // If user scrolled away from the end, disable auto-scrolling
        isAutoScrollingRef.current = scrollLeft + clientWidth >= scrollWidth - 10;
      };

      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }, []);

    // Sampling and rendering loop
    useEffect(() => {
      if (!mediaRecorder || !canvasRef.current || !containerRef.current) {
        return;
      }

      const canvas = canvasRef.current;
      const container = containerRef.current;

      // Get CSS variables for bar styling
      const computedStyle = getComputedStyle(canvas);
      const barWidth = Number.parseInt(computedStyle.getPropertyValue("--bar-width") || "3", 10);
      const gap = Number.parseInt(computedStyle.getPropertyValue("--bar-gap") || "1", 10);
      const barRadius = Number.parseFloat(computedStyle.getPropertyValue("--bar-radius") || "1.5");

      // Reset amplitude data when starting new recording
      amplitudeDataRef.current = [];
      isAutoScrollingRef.current = true;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;

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
        if (!ctx) return;

        const amplitudeData = amplitudeDataRef.current;
        const totalBarWidth = barWidth + gap;

        // Calculate required canvas width based on data
        const requiredWidth = amplitudeData.length * totalBarWidth;
        const containerHeight = container.clientHeight;

        // Update canvas size
        canvas.style.width = `${Math.max(requiredWidth, container.clientWidth)}px`;
        canvas.style.height = `${containerHeight}px`;
        canvas.width = Math.max(requiredWidth, container.clientWidth) * dpr;
        canvas.height = containerHeight * dpr;
        ctx.scale(dpr, dpr);

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Get bar color from text-inherit
        const barColor = getComputedStyle(canvas).color;
        ctx.fillStyle = barColor;

        // Draw bars from amplitude data
        const height = containerHeight;
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

        // Auto-scroll to end if enabled
        if (isAutoScrollingRef.current && requiredWidth > container.clientWidth) {
          container.scrollLeft = requiredWidth - container.clientWidth;
        }

        animationRef.current = requestAnimationFrame(draw);
      };

      // Start sampling and animation after a short delay to ensure analyser is ready
      const timeoutId = setTimeout(() => {
        samplingIntervalRef.current = window.setInterval(sampleAmplitude, sampleInterval);
        draw();
      }, 50);

      return () => {
        clearTimeout(timeoutId);
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = null;
        }
        if (samplingIntervalRef.current) {
          clearInterval(samplingIntervalRef.current);
          samplingIntervalRef.current = null;
        }
      };
    }, [mediaRecorder, sampleInterval, analyserRef, dataArrayRef, bufferLengthRef]);

    // Reset canvas when mediaRecorder is null
    useEffect(() => {
      if (!mediaRecorder && canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        amplitudeDataRef.current = [];
      }
    }, [mediaRecorder]);

    return (
      <div ref={containerRef} className={`overflow-x-auto overflow-y-hidden ${className}`} style={style}>
        <canvas ref={canvasRef} className="text-inherit h-full min-w-full" />
      </div>
    );
  }
);

RecordingWaveform.displayName = "RecordingWaveform";
