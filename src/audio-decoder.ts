// ============================================================================
// Audio Decoding Utilities (Common)
// ============================================================================

export async function decodeAudioBlob(blob: Blob, sampleCount: number): Promise<number[]> {
  const audioContext = new AudioContext();
  const arrayBuffer = await blob.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

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

  await audioContext.close();

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
