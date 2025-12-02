import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react";

// ============================================================================
// Common Waveform Renderer (A)
// ============================================================================

export interface WaveformRendererProps {
  /** Normalized peak data to visualize */
  peaks: number[] | null;
  /** Additional class name for the canvas */
  className?: string;
  /** Inline styles for the canvas (supports CSS variables for bar customization) */
  style?: React.CSSProperties & {
    "--bar-width"?: string | number;
    "--bar-gap"?: string | number;
    "--bar-radius"?: string | number;
  };
}

export interface WaveformRendererRef {
  canvas: HTMLCanvasElement | null;
}

export const WaveformRenderer = forwardRef<WaveformRendererRef, WaveformRendererProps>(
  function WaveformRenderer({ peaks, className = "", style }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const sizeRef = useRef({ width: 0, height: 0 });
    const rafRef = useRef<number>(0);

    useImperativeHandle(ref, () => ({
      canvas: canvasRef.current,
    }));

    const drawWaveform = useCallback(() => {
      const canvas = canvasRef.current;
      const { width, height } = sizeRef.current;
      if (!canvas || !peaks || width === 0 || height === 0) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;

      // Only resize canvas if needed
      const targetWidth = width * dpr;
      const targetHeight = height * dpr;
      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      // Read CSS variables with fallback defaults
      const styles = getComputedStyle(canvas);
      const barWidth = parseFloat(styles.getPropertyValue("--bar-width")) || 3;
      const gap = parseFloat(styles.getPropertyValue("--bar-gap")) || 1;
      const barRadius = parseFloat(styles.getPropertyValue("--bar-radius")) || 1;

      const totalBarWidth = barWidth + gap;
      const barsCount = Math.floor(width / totalBarWidth);
      const step = peaks.length / barsCount;

      ctx.fillStyle = styles.color || "#3b82f6";

      for (let i = 0; i < barsCount; i++) {
        const peakIndex = Math.min(Math.floor(i * step), peaks.length - 1);
        const peak = peaks[peakIndex];
        const barHeight = Math.max(peak * height * 0.9, 2);
        const x = i * totalBarWidth;
        const y = (height - barHeight) / 2;

        if (barRadius > 0) {
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, barRadius);
          ctx.fill();
        } else {
          ctx.fillRect(x, y, barWidth, barHeight);
        }
      }
    }, [peaks]);

    // ResizeObserver with RAF throttling
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;

        const { width, height } = entry.contentRect;
        if (sizeRef.current.width === width && sizeRef.current.height === height) return;

        sizeRef.current = { width, height };

        cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(drawWaveform);
      });

      resizeObserver.observe(canvas);
      return () => {
        resizeObserver.disconnect();
        cancelAnimationFrame(rafRef.current);
      };
    }, [drawWaveform]);

    // Draw when peaks change
    useEffect(() => {
      drawWaveform();
    }, [drawWaveform]);

    return <canvas ref={canvasRef} className={className} style={style} />;
  }
);
