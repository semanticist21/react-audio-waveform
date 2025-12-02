import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from "react";

export interface AudioWaveformProps {
  /** Audio blob to visualize */
  blob: Blob | null;
  /** Width of each bar in pixels */
  barWidth?: number;
  /** Gap between bars in pixels */
  gap?: number;
  /** Border radius of bars */
  barRadius?: number;
  /** Additional class name for the canvas */
  className?: string;
}

export interface AudioWaveformRef {
  canvas: HTMLCanvasElement | null;
}

async function decodeAudioBlob(blob: Blob, sampleCount: number): Promise<number[]> {
  const audioContext = new AudioContext();
  const arrayBuffer = await blob.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  const channelData = audioBuffer.getChannelData(0);
  const blockSize = Math.floor(channelData.length / sampleCount);
  const peaks: number[] = [];

  for (let i = 0; i < sampleCount; i++) {
    const start = i * blockSize;
    let sum = 0;
    for (let j = 0; j < blockSize; j++) {
      sum += Math.abs(channelData[start + j] || 0);
    }
    peaks.push(sum / blockSize);
  }

  const maxPeak = Math.max(...peaks);
  const normalizedPeaks = maxPeak > 0 ? peaks.map((p) => p / maxPeak) : peaks;

  await audioContext.close();

  return normalizedPeaks;
}

export const AudioWaveform = forwardRef<AudioWaveformRef, AudioWaveformProps>(function AudioWaveform(
  { blob, barWidth = 3, gap = 1, barRadius = 1, className = "" },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [peaks, setPeaks] = useState<number[] | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const sizeRef = useRef({ width: 0, height: 0 });
  const rafRef = useRef<number>(0);
  const blobRef = useRef<Blob | null>(null);

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

    const totalBarWidth = barWidth + gap;
    const barsCount = Math.floor(width / totalBarWidth);
    const step = peaks.length / barsCount;

    ctx.fillStyle = getComputedStyle(canvas).color || "#3b82f6";

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
  }, [peaks, barWidth, gap, barRadius]);

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

  // Decode audio when blob changes
  useEffect(() => {
    if (!blob) {
      setPeaks(null);
      setError(null);
      blobRef.current = null;
      return;
    }

    // Skip if same blob
    if (blobRef.current === blob) return;
    blobRef.current = blob;

    let cancelled = false;
    setError(null);

    // Calculate sample count based on expected canvas width (estimate)
    const sampleCount = Math.max(200, Math.ceil(window.innerWidth / (barWidth + gap)));

    decodeAudioBlob(blob, sampleCount)
      .then((data) => {
        if (!cancelled) {
          setPeaks(data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(err?.message || "Failed to decode audio"));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [blob, barWidth, gap]);

  // Draw when peaks change
  useEffect(() => {
    drawWaveform();
  }, [drawWaveform]);

  if (error) {
    throw error;
  }

  return <canvas ref={canvasRef} className={`size-full ${className}`} />;
});

export const AudioVisualizer = AudioWaveform;

export default AudioWaveform;
