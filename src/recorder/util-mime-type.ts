/**
 * 브라우저별로 지원하는 최적의 MIME 타입을 자동으로 선택
 * Safari: audio/mp4, Chrome/Firefox/Edge: audio/webm
 */
export function getDefaultMimeType(): string {
  // Safari는 audio/mp4를 선호
  if (MediaRecorder.isTypeSupported("audio/mp4")) {
    return "audio/mp4";
  }
  // Chrome/Firefox/Edge는 audio/webm 사용
  if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
    return "audio/webm;codecs=opus";
  }
  if (MediaRecorder.isTypeSupported("audio/webm")) {
    return "audio/webm";
  }
  // 최후의 fallback (거의 발생하지 않음)
  return "audio/webm";
}
