import { useCallback, useEffect, useRef, useState } from "react";
import { getDefaultMimeType } from "./util-mime-type";

export interface UseAudioRecorderConfig {
  /**
   * MIME type for the recording
   * - string: 직접 MIME 타입 지정 (e.g., 'audio/webm', 'audio/mp4')
   * - function: 커스텀 로직으로 MIME 타입 선택 (브라우저 분기 등)
   * - undefined: 브라우저별 자동 선택 (Safari: audio/mp4, Others: audio/webm)
   * @default getDefaultMimeType() - 브라우저별 자동 선택
   */
  mimeType?: string | (() => string);
  /**
   * Audio constraints for getUserMedia
   * @default true
   */
  audioConstraints?: MediaTrackConstraints | boolean;
  /**
   * Callback when recording is complete
   */
  onRecordingComplete?: (blob: Blob) => void;
}

export interface UseAudioRecorderReturn {
  /** Start recording from the microphone */
  startRecording: () => Promise<void>;
  /** Stop recording and generate the audio blob */
  stopRecording: () => void;
  /** Pause the current recording */
  pauseRecording: () => void;
  /** Resume a paused recording */
  resumeRecording: () => void;
  /** Clear the recording and reset state */
  clearRecording: () => void;
  /** The MediaRecorder instance (for visualization) */
  mediaRecorder: MediaRecorder | null;
  /** The recorded audio as a Blob (available after stopRecording) */
  recordingBlob: Blob | null;
  /** Recording duration in seconds */
  recordingTime: number;
  /** Whether currently recording */
  isRecording: boolean;
  /** Whether recording is paused */
  isPaused: boolean;
  /** Any error that occurred */
  error: Error | null;
}

/**
 * Custom hook for audio recording with real-time visualization support
 * Based on react-audio-visualize patterns
 */
export const useAudioRecorder = (config: UseAudioRecorderConfig = {}): UseAudioRecorderReturn => {
  const { mimeType, audioConstraints = true, onRecordingComplete } = config;

  // mimeType 처리: 함수면 실행, 문자열이면 그대로 사용, undefined면 기본값
  const resolvedMimeType =
    typeof mimeType === "function" ? mimeType() : mimeType !== undefined ? mimeType : getDefaultMimeType();

  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // useCallback ref for stability (latest state value tracking)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const isRecordingRef = useRef(false);
  const isPausedRef = useRef(false);

  // Sync state to refs
  useEffect(() => {
    mediaRecorderRef.current = mediaRecorder;
    isRecordingRef.current = isRecording;
    isPausedRef.current = isPaused;
  }, [mediaRecorder, isRecording, isPaused]);

  // Timer for recording duration
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording, isPaused]);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      audioChunksRef.current = [];
      setRecordingBlob(null);
      setRecordingTime(0);

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints,
      });
      streamRef.current = stream;

      // Create MediaRecorder with browser-compatible MIME type
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported(resolvedMimeType) ? resolvedMimeType : getDefaultMimeType(),
      });

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        // Create final blob from chunks
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType });
        setRecordingBlob(blob);
        onRecordingComplete?.(blob);
        setIsRecording(false);
        setIsPaused(false);
        setMediaRecorder(null);

        // Clean up stream
        if (streamRef.current) {
          for (const track of streamRef.current.getTracks()) {
            track.stop();
          }
          streamRef.current = null;
        }
      };

      recorder.onerror = (event) => {
        setError(new Error(`Recording error: ${event}`));
        setIsRecording(false);
        setIsPaused(false);
      };

      setMediaRecorder(recorder);
      recorder.start(100); // Collect data every 100ms for smooth visualization
      setIsRecording(true);
      setIsPaused(false);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error("Failed to start recording:", error);
    }
  }, [resolvedMimeType, audioConstraints, onRecordingComplete]);

  const stopRecording = useCallback(() => {
    // Use ref to reference latest values (Stabilize dependency array)
    if (mediaRecorderRef.current && isRecordingRef.current) {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const pauseRecording = useCallback(() => {
    // Use ref to reference latest values (Stabilize dependency array)
    if (mediaRecorderRef.current && isRecordingRef.current && !isPausedRef.current) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  }, []);

  const resumeRecording = useCallback(() => {
    // Use ref to reference latest values (Stabilize dependency array)
    if (mediaRecorderRef.current && isRecordingRef.current && isPausedRef.current) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    }
  }, []);

  const clearRecording = useCallback(() => {
    // Use ref to reference latest values (Stabilize dependency array)
    if (mediaRecorderRef.current && isRecordingRef.current) {
      mediaRecorderRef.current.stop();
    }
    audioChunksRef.current = [];
    setRecordingBlob(null);
    setRecordingTime(0);
    setError(null);
  }, []);

  // Cleanup on unmount only (empty dependency array)
  useEffect(() => {
    return () => {
      // Use refs to get current values at cleanup time
      if (streamRef.current) {
        for (const track of streamRef.current.getTracks()) {
          track.stop();
        }
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return {
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    clearRecording,
    mediaRecorder,
    recordingBlob,
    recordingTime,
    isRecording,
    isPaused,
    error,
  };
};
