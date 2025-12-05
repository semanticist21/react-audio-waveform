/**
 * SSR 호환성 테스트
 * 서버 환경(window/document 없음)에서 컴포넌트가 에러 없이 렌더링되는지 확인
 */
import { renderToString } from "react-dom/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { LiveRecorder } from "../src/recorder/live-recorder";
import { LiveStreamingRecorder } from "../src/recorder/live-streaming/recorder";
import { LiveStreamingStackRecorder } from "../src/recorder/live-streaming/stack-recorder";
import { AudioWaveform } from "../src/waveform";

describe("SSR Compatibility", () => {
  // 서버 환경 시뮬레이션: window 객체 제거
  const originalWindow = global.window;

  beforeAll(() => {
    // @ts-expect-error - 서버 환경 시뮬레이션
    delete global.window;
  });

  afterAll(() => {
    global.window = originalWindow;
  });

  it("AudioWaveform renders without window access errors", () => {
    expect(() => {
      renderToString(<AudioWaveform blob={null} />);
    }).not.toThrow();
  });

  it("LiveRecorder renders without window access errors", () => {
    expect(() => {
      renderToString(<LiveRecorder mediaRecorder={null} />);
    }).not.toThrow();
  });

  it("LiveStreamingRecorder renders without window access errors", () => {
    expect(() => {
      renderToString(
        <LiveStreamingRecorder.Root mediaRecorder={null}>
          <LiveStreamingRecorder.Canvas />
        </LiveStreamingRecorder.Root>
      );
    }).not.toThrow();
  });

  it("LiveStreamingStackRecorder renders without window access errors", () => {
    expect(() => {
      renderToString(
        <LiveStreamingStackRecorder.Root mediaRecorder={null}>
          <LiveStreamingStackRecorder.Canvas />
        </LiveStreamingStackRecorder.Root>
      );
    }).not.toThrow();
  });
});
