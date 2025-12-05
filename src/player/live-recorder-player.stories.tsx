import type { Meta, StoryObj } from "@storybook/react";
import { LiveAudioVisualizer } from "..";
import { useAudioRecorder } from "../recorder/use-audio-recorder";
import rawSource from "./live-recorder-player.stories.tsx?raw";

function LiveRecorderPlayer() {
  const { startRecording, stopRecording, pauseRecording, resumeRecording, mediaRecorder, isRecording, isPaused } =
    useAudioRecorder({
      // 브라우저별 자동 분기: Safari는 audio/mp4, Chrome/Firefox는 audio/webm 사용
      mimeType: () => {
        if (MediaRecorder.isTypeSupported("audio/mp4")) {
          return "audio/mp4"; // Safari
        }
        return "audio/webm"; // Chrome, Firefox, Edge
      },
      // 문자열로 직접 지정하는 방식 (커스텀 로직 불필요한 경우)
      // mimeType: "audio/webm",
      onRecordingComplete: (audioBlob) => {
        // 녹음이 완료되면 Blob URL을 생성하여 새 탭에서 재생
        const audioUrl = URL.createObjectURL(audioBlob);
        window.open(audioUrl, "_blank");
      },
    });

  // 녹음 시작/일시정지/재개 버튼 핸들러
  const handleRecordClick = () => {
    if (!isRecording) {
      startRecording();
    } else if (isPaused) {
      resumeRecording();
    } else {
      pauseRecording();
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-100">
      <div className="flex h-24 w-fit items-center gap-4 rounded-2xl bg-white px-5 shadow-lg">
        {/* 녹음/일시정지 버튼 */}
        <button
          type="button"
          onClick={handleRecordClick}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-md"
        >
          {!isRecording ? (
            // 녹음 시작: 빨간 원
            <div className="h-4 w-4 rounded-full bg-red-500" />
          ) : isPaused ? (
            // 일시정지 상태에서 재개: 빨간 원
            <div className="h-4 w-4 rounded-full bg-red-500" />
          ) : (
            // 녹음 중 일시정지: 두 개의 세로 막대
            <div className="flex gap-0.5">
              <div className="h-4 w-1 rounded-sm bg-orange-500" />
              <div className="h-4 w-1 rounded-sm bg-orange-500" />
            </div>
          )}
        </button>

        {/* 실시간 주파수 바 표시 영역 */}
        <LiveAudioVisualizer
          mediaRecorder={mediaRecorder}
          className="h-12 w-88 rounded-lg bg-slate-100 text-green-500"
        />

        {/* 정지 버튼 */}
        <button
          type="button"
          onClick={stopRecording}
          disabled={!isRecording}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-md disabled:opacity-40"
        >
          <div className="h-3.5 w-3.5 rounded-sm bg-slate-700" />
        </button>
      </div>
    </div>
  );
}

const meta: Meta<typeof LiveRecorderPlayer> = {
  title: "Player/LiveRecorderPlayer",
  component: LiveRecorderPlayer,
  parameters: {
    layout: "fullscreen",
    docs: {
      source: {
        code: rawSource,
        language: "tsx",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof LiveRecorderPlayer>;

export const Default: Story = {};
