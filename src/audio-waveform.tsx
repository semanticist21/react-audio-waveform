import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { decodeAudioBlob } from "./audio-decoder";
import { WaveformRenderer, type WaveformRendererRef } from "./waveform-renderer";

// ============================================================================
// AudioWaveform without Suspense (B)
// ============================================================================

export interface AudioWaveformProps {
  /** Audio blob to visualize */
  blob: Blob | null;
  /** Additional class name for the canvas */
  className?: string;
  /** Inline styles for the canvas (supports CSS variables for bar customization) */
  style?: React.CSSProperties & {
    "--bar-width"?: string | number;
    "--bar-gap"?: string | number;
    "--bar-radius"?: string | number;
  };
}

export interface AudioWaveformRef {
  canvas: HTMLCanvasElement | null;
}

export const AudioWaveform = forwardRef<AudioWaveformRef, AudioWaveformProps>(function AudioWaveform(
  { blob, className, style },
  ref
) {
  const [peaks, setPeaks] = useState<number[] | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const blobRef = useRef<Blob | null>(null);
  const rendererRef = useRef<WaveformRendererRef>(null);

  const sampleCount = useMemo(() => Math.max(200, Math.ceil(window.innerWidth / 4)), []);

  // Forward ref to WaveformRenderer's canvas
  useEffect(() => {
    if (ref && typeof ref === "function") {
      ref({ canvas: rendererRef.current?.canvas || null });
    } else if (ref) {
      ref.current = { canvas: rendererRef.current?.canvas || null };
    }
  }, [ref]);

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
  }, [blob, sampleCount]);

  if (error) {
    throw error;
  }

  return <WaveformRenderer ref={rendererRef} peaks={peaks} className={className} style={style} />;
});

export const AudioVisualizer = AudioWaveform;

export default AudioWaveform;
