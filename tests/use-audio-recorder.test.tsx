import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAudioRecorder } from "../src/recorder/use-audio-recorder";

// Minimal MediaRecorder mock. stop() invokes onstop synchronously, which mirrors
// the real-world ordering that the clearRecording regression depends on.
class MockMediaRecorder {
  static isTypeSupported() {
    return true;
  }
  state: "inactive" | "recording" | "paused" = "inactive";
  mimeType: string;
  stream: MediaStream;
  ondataavailable: ((e: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  onerror: ((e: Event) => void) | null = null;

  constructor(stream: MediaStream, opts?: { mimeType?: string }) {
    this.stream = stream;
    this.mimeType = opts?.mimeType ?? "audio/webm";
  }
  start() {
    this.state = "recording";
  }
  stop() {
    this.state = "inactive";
    this.onstop?.();
  }
  pause() {
    this.state = "paused";
  }
  resume() {
    this.state = "recording";
  }
}

const track = { stop: vi.fn() };
const fakeStream = { getTracks: () => [track] } as unknown as MediaStream;

beforeEach(() => {
  track.stop.mockClear();
  (globalThis as { MediaRecorder?: unknown }).MediaRecorder = MockMediaRecorder;
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: { getUserMedia: vi.fn().mockResolvedValue(fakeStream) },
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useAudioRecorder", () => {
  it("finalizes a blob and fires onRecordingComplete on stopRecording", async () => {
    const onRecordingComplete = vi.fn();
    const { result } = renderHook(() => useAudioRecorder({ onRecordingComplete }));

    await act(async () => {
      await result.current.startRecording();
    });
    expect(result.current.isRecording).toBe(true);

    act(() => {
      result.current.stopRecording();
    });

    expect(onRecordingComplete).toHaveBeenCalledTimes(1);
    expect(result.current.recordingBlob).toBeInstanceOf(Blob);
    expect(result.current.isRecording).toBe(false);
  });

  it("clearRecording discards an active recording instead of finalizing it", async () => {
    const onRecordingComplete = vi.fn();
    const { result } = renderHook(() => useAudioRecorder({ onRecordingComplete }));

    await act(async () => {
      await result.current.startRecording();
    });
    expect(result.current.isRecording).toBe(true);

    act(() => {
      result.current.clearRecording();
    });

    // The async onstop handler must NOT produce a blob or call the completion
    // callback when the recording was cleared mid-flight.
    expect(onRecordingComplete).not.toHaveBeenCalled();
    expect(result.current.recordingBlob).toBeNull();
    expect(result.current.isRecording).toBe(false);
    expect(track.stop).toHaveBeenCalled();
  });
});
