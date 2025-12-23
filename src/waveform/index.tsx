import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import type { AudioWaveformAppearance } from "../types";
import { decodeAudioBlob, getAudioData } from "./util-audio-decoder";
import { unwrapPromise } from "./util-suspense";
import { WaveformRenderer, type WaveformRendererRef } from "./waveform-renderer";

// ============================================================================
// AudioWaveform - Unified Component (with optional Suspense support)
// ============================================================================

export interface AudioWaveformProps extends React.CanvasHTMLAttributes<HTMLCanvasElement> {
  /** Audio blob to visualize (provide either blob or peaks) */
  blob?: Blob | null;
  /** Pre-computed peaks data (normalized 0-1 range, skips decoding when provided) */
  peaks?: number[];
  /** Waveform appearance configuration (barColor, barWidth, playheadColor, etc.) */
  appearance?: AudioWaveformAppearance;
  /** Enable Suspense mode (requires Suspense boundary in parent) */
  suspense?: boolean;
  /** Current playback time in seconds (shows playhead) */
  currentTime?: number;
  /** Total audio duration in seconds (required for playhead positioning) */
  duration?: number;
  /** Callback when user clicks/seeks on waveform (simple seek) */
  onSeek?: (time: number) => void;
  /** Callback when drag-to-seek starts (use to pause playback) */
  onSeekStart?: () => void;
  /** Callback during drag-to-seek with current time (real-time updates) */
  onSeekDrag?: (time: number) => void;
  /** Callback when drag-to-seek ends (use to resume playback) */
  onSeekEnd?: (time: number) => void;
}

export interface AudioWaveformRef {
  canvas: HTMLCanvasElement | null;
}

// SSR-safe: returns 500 on server, window.innerWidth on client
const getInitialSampleCount = () => {
  if (typeof window === "undefined") return 500;
  return Math.max(500, Math.ceil(window.innerWidth));
};

export const AudioWaveform = forwardRef<AudioWaveformRef, AudioWaveformProps>(function AudioWaveform(
  {
    blob,
    peaks: precomputedPeaks,
    appearance,
    suspense = false,
    currentTime,
    duration,
    onSeek,
    onSeekStart,
    onSeekDrag,
    onSeekEnd,
    ...props
  },
  ref
) {
  const [decodedPeaks, setDecodedPeaks] = useState<number[] | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const blobRef = useRef<Blob | null>(null);
  const rendererRef = useRef<WaveformRendererRef>(null);

  // Sample count based on screen width for sharp rendering on high-DPI displays
  const sampleCount = useMemo(() => getInitialSampleCount(), []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Forward ref to WaveformRenderer's canvas
  useEffect(() => {
    if (ref && typeof ref === "function") {
      ref({ canvas: rendererRef.current?.canvas || null });
    } else if (ref) {
      ref.current = { canvas: rendererRef.current?.canvas || null };
    }
  }, [ref]);

  // Skip decoding when pre-computed peaks are provided
  const shouldDecode = !precomputedPeaks && blob;

  // Suspense mode: Use React 19-style Promise unwrapping
  const suspensePeaks =
    shouldDecode && suspense && isMounted ? unwrapPromise(getAudioData(blob, sampleCount)) : null;

  // Non-suspense mode: Decode audio when blob changes
  useEffect(() => {
    if (!shouldDecode || suspense) {
      // Reset state when using peaks prop or in suspense mode
      if (!shouldDecode) {
        setDecodedPeaks(null);
        setError(null);
        blobRef.current = null;
      }
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
          setDecodedPeaks(data);
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
  }, [blob, sampleCount, suspense, shouldDecode]);

  if (!suspense && error) {
    throw error;
  }

  // Priority: precomputedPeaks > suspensePeaks > decodedPeaks
  const finalPeaks = precomputedPeaks ?? (suspense ? suspensePeaks : decodedPeaks);

  return (
    <WaveformRenderer
      ref={rendererRef}
      peaks={finalPeaks}
      appearance={appearance}
      currentTime={currentTime}
      duration={duration}
      onSeek={onSeek}
      onSeekStart={onSeekStart}
      onSeekDrag={onSeekDrag}
      onSeekEnd={onSeekEnd}
      {...props}
    />
  );
});

export default AudioWaveform;
