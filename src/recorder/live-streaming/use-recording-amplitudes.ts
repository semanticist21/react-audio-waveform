import { useCallback, useEffect, useRef, useState } from "react";
import { useAudioAnalyser } from "../use-audio-analyser";
import type { UseRecordingAmplitudesOptions, UseRecordingAmplitudesReturn } from "./types";

export type { UseRecordingAmplitudesOptions, UseRecordingAmplitudesReturn };

/**
 * Headless hook for collecting amplitude timeline data from MediaRecorder
 * Samples RMS amplitude at regular intervals for timeline-based waveform visualization
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

  const [amplitudes, setAmplitudes] = useState<number[]>([]);
  const samplingIntervalRef = useRef<number | null>(null);
  const amplitudeDataRef = useRef<number[]>([]);

  const { audioContextRef, analyserRef, dataArrayRef, bufferLengthRef } = useAudioAnalyser({
    mediaRecorder,
    fftSize,
    smoothingTimeConstant,
  });

  // Clear amplitude data
  const clearAmplitudes = useCallback(() => {
    amplitudeDataRef.current = [];
    setAmplitudes([]);
  }, []);

  // Sample amplitude periodically
  useEffect(() => {
    if (!mediaRecorder) {
      clearAmplitudes();
      return;
    }

    // Reset data when starting new recording
    amplitudeDataRef.current = [];
    setAmplitudes([]);

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
      const amplitude = Math.min(1, rms * 2);
      amplitudeDataRef.current.push(amplitude);
      setAmplitudes([...amplitudeDataRef.current]);
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

    // pause/resume event handlers
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
  }, [mediaRecorder, sampleInterval, analyserRef, dataArrayRef, bufferLengthRef, clearAmplitudes]);

  return {
    amplitudes,
    audioContext: audioContextRef.current,
    analyser: analyserRef.current,
    isRecording: mediaRecorder?.state === "recording",
    isPaused: mediaRecorder?.state === "paused",
    clearAmplitudes,
  };
}
