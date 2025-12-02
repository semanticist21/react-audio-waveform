import { forwardRef, useEffect, useMemo, useRef } from "react";
import { getAudioData } from "./audio-decoder";
import { unwrapPromise } from "./suspense-utils";
import { WaveformRenderer, type WaveformRendererRef } from "./waveform-renderer";

// ============================================================================
// AudioWaveform with Suspense (C)
// ============================================================================

export interface AudioWaveformSuspenseProps {
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

export interface AudioWaveformSuspenseRef {
  canvas: HTMLCanvasElement | null;
}

export const AudioWaveformSuspense = forwardRef<AudioWaveformSuspenseRef, AudioWaveformSuspenseProps>(
  function AudioWaveformSuspense({ blob, className, style }, ref) {
    const rendererRef = useRef<WaveformRendererRef>(null);
    const sampleCount = useMemo(() => Math.max(200, Math.ceil(window.innerWidth / 4)), []);

    // Suspense mode: React 19-style Promise unwrapping
    // Uses unwrapPromise() which throws Promise for Suspense boundary to catch
    const peaks = blob ? unwrapPromise(getAudioData(blob, sampleCount)) : null;

    // Forward ref to WaveformRenderer's canvas
    useEffect(() => {
      if (ref && typeof ref === "function") {
        ref({ canvas: rendererRef.current?.canvas || null });
      } else if (ref) {
        ref.current = { canvas: rendererRef.current?.canvas || null };
      }
    }, [ref]);

    return <WaveformRenderer ref={rendererRef} peaks={peaks} className={className} style={style} />;
  }
);
