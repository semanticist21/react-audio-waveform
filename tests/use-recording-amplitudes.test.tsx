import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useRecordingAmplitudes } from "../src/recorder/live-streaming/use-recording-amplitudes";

class MockAnalyser {
  fftSize = 2048;
  smoothingTimeConstant = 0;
  frequencyBinCount = 8;
  getByteTimeDomainData(arr: Uint8Array) {
    // Non-128 values produce a non-zero RMS amplitude.
    for (let i = 0; i < arr.length; i++) arr[i] = 200;
  }
}

class MockAudioContext {
  state = "running";
  createAnalyser() {
    return new MockAnalyser();
  }
  createMediaStreamSource() {
    return { connect() {}, disconnect() {} };
  }
  resume() {
    return Promise.resolve();
  }
  close() {}
}

const mediaRecorder = {
  stream: {},
  state: "recording",
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
} as unknown as MediaRecorder;

beforeEach(() => {
  (globalThis as { AudioContext?: unknown }).AudioContext = MockAudioContext;
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("useRecordingAmplitudes", () => {
  it("re-renders subscribers as new amplitude samples arrive", () => {
    let renders = 0;
    const { result } = renderHook(() => {
      renders++;
      return useRecordingAmplitudes({ mediaRecorder, sampleInterval: 50 });
    });

    expect(result.current.amplitudes).toEqual([]);

    const before = renders;
    act(() => {
      vi.advanceTimersByTime(50); // fire the startSampling timeout
      vi.advanceTimersByTime(50); // first sample
      vi.advanceTimersByTime(50); // second sample
    });

    // Samples were collected...
    expect(result.current.amplitudes.length).toBeGreaterThan(0);
    // ...and the store actually triggered re-renders. With the previous bug
    // (snapshot returned the same mutated array reference) Object.is would
    // suppress these re-renders and `renders` would not advance.
    expect(renders).toBeGreaterThan(before);
  });
});
