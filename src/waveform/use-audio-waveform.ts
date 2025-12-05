import { useEffect, useRef, useState } from "react";
import { decodeAudioBlob, getAudioData } from "./util-audio-decoder";
import { unwrapPromise } from "./util-suspense";

export interface UseAudioWaveformOptions {
  /** Audio blob to decode and visualize */
  blob: Blob | null;
  /** Number of sample points to extract (default: based on window width) */
  sampleCount?: number;
  /** Enable React Suspense mode (requires Suspense boundary in parent) */
  suspense?: boolean;
}

export interface UseAudioWaveformReturn {
  /** Normalized peak data (0-1 range) for visualization */
  peaks: number[] | null;
  /** Error if audio decoding failed */
  error: Error | null;
  /** Loading state (only in non-suspense mode) */
  isLoading: boolean;
}

/**
 * Headless hook for extracting waveform peak data from audio blob
 *
 * @example
 * ```tsx
 * const { peaks, error, isLoading } = useAudioWaveform({ blob });
 *
 * if (isLoading) return <div>Loading...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 *
 * return (
 *   <div className="flex gap-1 items-center h-24">
 *     {peaks?.map((peak, i) => (
 *       <div key={i} style={{ height: `${peak * 100}%` }} />
 *     ))}
 *   </div>
 * );
 * ```
 */
export function useAudioWaveform(options: UseAudioWaveformOptions): UseAudioWaveformReturn {
  const { blob, sampleCount: userSampleCount, suspense = false } = options;

  // SSR-safe: default sample count based on window width, set once in useEffect
  const [sampleCount, setSampleCount] = useState(userSampleCount || 200);
  const sampleCountInitializedRef = useRef(!!userSampleCount);

  useEffect(() => {
    // 사용자가 sampleCount를 지정하지 않았고, 아직 초기화 안된 경우에만 설정
    if (!sampleCountInitializedRef.current) {
      setSampleCount(Math.max(200, Math.ceil(window.innerWidth / 4)));
      sampleCountInitializedRef.current = true;
    }
  }, []);

  const [peaks, setPeaks] = useState<number[] | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const blobRef = useRef<Blob | null>(null);

  // Suspense mode: Use Promise unwrapping
  const suspensePeaks = blob && suspense ? unwrapPromise(getAudioData(blob, sampleCount)) : null;

  // Non-suspense mode: State-based decoding
  useEffect(() => {
    if (suspense) return; // Skip state management in Suspense mode

    if (!blob) {
      setPeaks(null);
      setError(null);
      setIsLoading(false);
      blobRef.current = null;
      return;
    }

    // Skip if same blob
    if (blobRef.current === blob) return;
    blobRef.current = blob;

    let cancelled = false;
    setError(null);
    setIsLoading(true);

    decodeAudioBlob(blob, sampleCount)
      .then((data) => {
        if (!cancelled) {
          setPeaks(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(err?.message || "Failed to decode audio"));
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [blob, sampleCount, suspense]);

  // Throw error in Suspense mode
  if (suspense && error) {
    throw error;
  }

  return {
    peaks: suspense ? suspensePeaks : peaks,
    error,
    isLoading,
  };
}
