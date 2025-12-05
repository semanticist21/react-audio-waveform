import { forwardRef, useEffect, useRef, useState } from "react";
import type { AudioWaveformAppearance } from "../types";
import { decodeAudioBlob, getAudioData } from "./util-audio-decoder";
import { unwrapPromise } from "./util-suspense";
import { WaveformRenderer, type WaveformRendererRef } from "./waveform-renderer";

// ============================================================================
// AudioWaveform - Unified Component (with optional Suspense support)
// ============================================================================

export interface AudioWaveformProps extends React.CanvasHTMLAttributes<HTMLCanvasElement> {
  /** Audio blob to visualize */
  blob: Blob | null;
  /** Waveform appearance configuration (barColor, barWidth, playheadColor, etc.) */
  appearance?: AudioWaveformAppearance;
  /** Enable Suspense mode (requires Suspense boundary in parent) */
  suspense?: boolean;
  /** Current playback time in seconds (shows playhead) */
  currentTime?: number;
  /** Total audio duration in seconds (required for playhead positioning) */
  duration?: number;
  /** Callback when user clicks/seeks on waveform */
  onSeek?: (time: number) => void;
}

export interface AudioWaveformRef {
  canvas: HTMLCanvasElement | null;
}

// SSR-safe 기본값 (서버에서는 500, 클라이언트에서 window.innerWidth로 업데이트)
const DEFAULT_SAMPLE_COUNT = 500;

export const AudioWaveform = forwardRef<AudioWaveformRef, AudioWaveformProps>(function AudioWaveform(
  { blob, appearance, suspense = false, currentTime, duration, onSeek, ...props },
  ref
) {
  const [peaks, setPeaks] = useState<number[] | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [sampleCount, setSampleCount] = useState(DEFAULT_SAMPLE_COUNT);
  const sampleCountInitializedRef = useRef(false);
  const blobRef = useRef<Blob | null>(null);
  const rendererRef = useRef<WaveformRendererRef>(null);

  // SSR-safe: 클라이언트에서만 window.innerWidth 사용
  useEffect(() => {
    if (!sampleCountInitializedRef.current) {
      setSampleCount(Math.max(500, Math.ceil(window.innerWidth)));
      sampleCountInitializedRef.current = true;
    }
  }, []);

  // Forward ref to WaveformRenderer's canvas
  useEffect(() => {
    if (ref && typeof ref === "function") {
      ref({ canvas: rendererRef.current?.canvas || null });
    } else if (ref) {
      ref.current = { canvas: rendererRef.current?.canvas || null };
    }
  }, [ref]);

  // Suspense mode: Use React 19-style Promise unwrapping
  const suspensePeaks = blob && suspense ? unwrapPromise(getAudioData(blob, sampleCount)) : null;

  // Non-suspense mode: Decode audio when blob changes
  useEffect(() => {
    if (suspense) return; // Skip state management in suspense mode

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
  }, [blob, sampleCount, suspense]);

  if (!suspense && error) {
    throw error;
  }

  const finalPeaks = suspense ? suspensePeaks : peaks;

  return (
    <WaveformRenderer
      ref={rendererRef}
      peaks={finalPeaks}
      appearance={appearance}
      currentTime={currentTime}
      duration={duration}
      onSeek={onSeek}
      {...props}
    />
  );
});

export default AudioWaveform;
