// ============================================================================
// Audio Decoding Utilities (Common)
// ============================================================================

import { OfflineAudioContext } from "standardized-audio-context";

export async function decodeAudioBlob(blob: Blob, sampleCount: number): Promise<number[]> {
  const arrayBuffer = await blob.arrayBuffer();

  // Check if blob has data
  if (arrayBuffer.byteLength === 0) {
    throw new Error("Audio blob is empty");
  }

  // OfflineAudioContext를 사용하면 사용자 제스처 없이도 디코딩 가능
  // AudioContext와 달리 실제 오디오 출력이 없어서 Autoplay Policy 제약을 받지 않음
  // standardized-audio-context 사용: Safari/iOS의 decodeAudioData 버그 fix
  // (Safari는 Promise 기반 문법 미지원, null로 reject하는 버그 있음)
  const offlineContext = new OfflineAudioContext({ length: 1, sampleRate: 44100 });

  let audioBuffer: AudioBuffer;
  try {
    audioBuffer = await offlineContext.decodeAudioData(arrayBuffer);
  } catch {
    throw new Error(
      `Unable to decode audio data (type: ${blob.type}, size: ${blob.size} bytes). ` +
        `This may be due to an unsupported audio format or corrupted data.`
    );
  }

  const channelData = audioBuffer.getChannelData(0);
  const blockSize = Math.floor(channelData.length / sampleCount);
  const peaks: number[] = [];

  for (let i = 0; i < sampleCount; i++) {
    const start = i * blockSize;
    let sum = 0;
    for (let j = 0; j < blockSize; j++) {
      sum += Math.abs(channelData[start + j] || 0);
    }
    peaks.push(sum / blockSize);
  }

  const maxPeak = Math.max(...peaks);
  const normalizedPeaks = maxPeak > 0 ? peaks.map((p) => p / maxPeak) : peaks;

  return normalizedPeaks;
}

// Promise cache for Suspense support (automatic garbage collection)
const audioDataCache = new WeakMap<Blob, Promise<number[]>>();

export function getAudioData(blob: Blob, sampleCount: number): Promise<number[]> {
  let promise = audioDataCache.get(blob);

  if (!promise) {
    promise = decodeAudioBlob(blob, sampleCount);
    audioDataCache.set(blob, promise);
  }

  return promise;
}
