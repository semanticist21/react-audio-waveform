import { useEffect, useRef } from "react";

export interface UseAudioAnalyserConfig {
  /** MediaRecorder instance to analyze */
  mediaRecorder: MediaRecorder | null;
  /** FFT size for frequency analysis (must be power of 2) */
  fftSize?: number;
  /** Smoothing time constant for analyser (0-1) */
  smoothingTimeConstant?: number;
}

export interface UseAudioAnalyserReturn {
  /** Audio context reference */
  audioContextRef: React.MutableRefObject<AudioContext | null>;
  /** Analyser node reference */
  analyserRef: React.MutableRefObject<AnalyserNode | null>;
  /** Data array for time domain data */
  dataArrayRef: React.MutableRefObject<Uint8Array<ArrayBuffer> | null>;
  /** Buffer length (frequencyBinCount) */
  bufferLengthRef: React.MutableRefObject<number>;
}

/**
 * Hook to setup Web Audio API analyser for a MediaRecorder stream
 * Shared between LiveAudioVisualizer and RecordingWaveform
 */
export function useAudioAnalyser({
  mediaRecorder,
  fftSize = 2048,
  smoothingTimeConstant = 0.8,
}: UseAudioAnalyserConfig): UseAudioAnalyserReturn {
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const bufferLengthRef = useRef<number>(0);

  useEffect(() => {
    if (!mediaRecorder) {
      return;
    }

    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let source: MediaStreamAudioSourceNode | null = null;

    try {
      // Create audio context and analyser
      audioContext = new AudioContext();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = fftSize;
      analyser.smoothingTimeConstant = smoothingTimeConstant;

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // Get the MediaRecorder's stream and connect to analyser
      const stream = mediaRecorder.stream;
      source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      sourceRef.current = source;

      // Create buffer for time domain data
      const bufferLength = analyser.frequencyBinCount;
      bufferLengthRef.current = bufferLength;
      dataArrayRef.current = new Uint8Array(bufferLength);
    } catch (error) {
      console.error("Failed to setup audio analyser:", error);
    }

    // Cleanup
    return () => {
      if (sourceRef.current) {
        sourceRef.current.disconnect();
        sourceRef.current = null;
      }

      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close();
      }

      audioContextRef.current = null;
      analyserRef.current = null;
      dataArrayRef.current = null;
      bufferLengthRef.current = 0;
    };
  }, [mediaRecorder, fftSize, smoothingTimeConstant]);

  return {
    audioContextRef,
    analyserRef,
    dataArrayRef,
    bufferLengthRef,
  };
}
