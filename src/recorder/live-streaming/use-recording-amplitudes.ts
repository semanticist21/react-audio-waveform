import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { useAudioAnalyser } from "../use-audio-analyser";
import type { UseRecordingAmplitudesOptions, UseRecordingAmplitudesReturn } from "./types";

export type { UseRecordingAmplitudesOptions, UseRecordingAmplitudesReturn };

/**
 * Headless hook for collecting amplitude timeline data from MediaRecorder
 * Samples RMS amplitude at regular intervals for timeline-based waveform visualization
 *
 * Performance optimization: Uses useSyncExternalStore to avoid unnecessary array copies
 * - During sampling, push directly to amplitudeDataRef (no array copy)
 * - Return array reference only when providing snapshot to subscribers
 *
 * @example
 * ```tsx
 * const { amplitudes, isRecording } = useRecordingAmplitudes({
 *   mediaRecorder,
 *   sampleInterval: 50
 * });
 *
 * return (
 *   <div className="flex gap-px items-center h-32">
 *     {amplitudes.map((amp, i) => (
 *       <div
 *         key={i}
 *         className="bg-orange-500 w-0.5 rounded-full"
 *         style={{ height: `${amp * 100}%` }}
 *       />
 *     ))}
 *   </div>
 * );
 * ```
 */
export function useRecordingAmplitudes(options: UseRecordingAmplitudesOptions): UseRecordingAmplitudesReturn {
  const { mediaRecorder, fftSize = 2048, smoothingTimeConstant = 0.4, sampleInterval = 50 } = options;

  // External store pattern: Efficient updates without array copying
  const amplitudeDataRef = useRef<number[]>([]);
  const listenersRef = useRef<Set<() => void>>(new Set());
  const samplingIntervalRef = useRef<number | null>(null);

  // subscribe/getSnapshot for useSyncExternalStore
  const subscribe = useCallback((onStoreChange: () => void) => {
    listenersRef.current.add(onStoreChange);
    return () => listenersRef.current.delete(onStoreChange);
  }, []);

  const getSnapshot = useCallback(() => amplitudeDataRef.current, []);

  // Notify subscribers of changes (no array copy)
  const notifyListeners = useCallback(() => {
    for (const listener of listenersRef.current) {
      listener();
    }
  }, []);

  const amplitudes = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const { audioContextRef, analyserRef, dataArrayRef, bufferLengthRef } = useAudioAnalyser({
    mediaRecorder,
    fftSize,
    smoothingTimeConstant,
  });

  // Clear amplitude data
  const clearAmplitudes = useCallback(() => {
    amplitudeDataRef.current = [];
    notifyListeners();
  }, [notifyListeners]);

  // Initialize amplitudes only when MediaRecorder instance changes (new recording starts)
  const prevMediaRecorderRef = useRef<MediaRecorder | null>(null);
  useEffect(() => {
    if (mediaRecorder !== prevMediaRecorderRef.current) {
      // MediaRecorder instance changed = new recording starts → reset amplitudes
      amplitudeDataRef.current = [];
      notifyListeners();
      prevMediaRecorderRef.current = mediaRecorder;
    }
  }, [mediaRecorder, notifyListeners]);

  // Sample amplitude periodically (preserves amplitudes during pause/resume)
  useEffect(() => {
    if (!mediaRecorder) {
      return;
    }

    const sampleAmplitude = () => {
      const analyser = analyserRef.current;
      const dataArray = dataArrayRef.current;
      const bufferLength = bufferLengthRef.current;

      if (!analyser || !dataArray) return;

      // Get time domain data
      analyser.getByteTimeDomainData(dataArray);

      // Calculate RMS amplitude
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        const normalized = (dataArray[i] - 128) / 128;
        sum += normalized * normalized;
      }
      const rms = Math.sqrt(sum / bufferLength);

      // Store amplitude (0-1 range, slightly amplified)
      // Push directly without array copy, then notify subscribers
      const amplitude = Math.min(1, rms * 2);
      amplitudeDataRef.current.push(amplitude);
      notifyListeners();
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

    // pause/resume event handlers (only stop/resume sampling, preserve amplitudes)
    const handlePause = () => stopSampling();
    const handleResume = () => startSampling();

    mediaRecorder.addEventListener("pause", handlePause);
    mediaRecorder.addEventListener("resume", handleResume);

    // Start sampling (wait for analyser to be ready)
    const timeoutId = setTimeout(() => {
      startSampling();
    }, 50);

    return () => {
      clearTimeout(timeoutId);
      mediaRecorder.removeEventListener("pause", handlePause);
      mediaRecorder.removeEventListener("resume", handleResume);
      stopSampling();
    };
  }, [mediaRecorder, sampleInterval, analyserRef, dataArrayRef, bufferLengthRef, notifyListeners]);

  return {
    amplitudes,
    audioContext: audioContextRef.current,
    analyser: analyserRef.current,
    isRecording: mediaRecorder?.state === "recording",
    isPaused: mediaRecorder?.state === "paused",
    clearAmplitudes,
  };
}
