// ============================================================================
// Audio Decoding Utilities
// Uses native Web Audio API first, falls back to WASM decoder on failure
// ============================================================================

import { MPEGDecoder } from "mpg123-decoder";

/**
 * Extract peaks from Float32Array channel data
 */
function extractPeaksFromChannelData(channelData: Float32Array, sampleCount: number): number[] {
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

  // Normalize to 0-1 range
  const maxPeak = Math.max(...peaks);
  return maxPeak > 0 ? peaks.map((p) => p / maxPeak) : peaks;
}

/**
 * Decode using native Web Audio API (OfflineAudioContext)
 */
async function decodeWithNativeAPI(arrayBuffer: ArrayBuffer): Promise<AudioBuffer> {
  const offlineContext = new OfflineAudioContext(1, 1, 44100);
  return offlineContext.decodeAudioData(arrayBuffer);
}

/**
 * Decode MP3 using WASM decoder (mpg123)
 * Used as fallback when native API fails
 */
async function decodeWithWASM(arrayBuffer: ArrayBuffer): Promise<Float32Array> {
  const decoder = new MPEGDecoder();
  await decoder.ready;

  const result = decoder.decode(new Uint8Array(arrayBuffer));

  // Use first channel (works for both stereo and mono)
  const channelData = result.channelData[0];

  decoder.free();

  return channelData;
}

export async function decodeAudioBlob(blob: Blob, sampleCount: number): Promise<number[]> {
  const arrayBuffer = await blob.arrayBuffer();

  if (arrayBuffer.byteLength === 0) {
    throw new Error("Audio blob is empty");
  }

  // Try native Web Audio API first
  try {
    const audioBuffer = await decodeWithNativeAPI(arrayBuffer);
    const channelData = audioBuffer.getChannelData(0);
    return extractPeaksFromChannelData(channelData, sampleCount);
  } catch {
    // Fall through to WASM fallback
  }

  // WASM decoder fallback
  try {
    const channelData = await decodeWithWASM(arrayBuffer);
    return extractPeaksFromChannelData(channelData, sampleCount);
  } catch {
    throw new Error(
      `Unable to decode audio data (type: ${blob.type}, size: ${blob.size} bytes). ` +
        `Both native Web Audio API and WASM decoder failed. ` +
        `Consider providing pre-decoded 'peaks' to the AudioWaveform component to bypass decoding.`
    );
  }
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
