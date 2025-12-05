/**
 * Automatically select the optimal MIME type supported by each browser
 * Safari: audio/mp4, Chrome/Firefox/Edge: audio/webm
 */
export function getDefaultMimeType(): string {
  // Safari prefers audio/mp4
  if (MediaRecorder.isTypeSupported("audio/mp4")) {
    return "audio/mp4";
  }
  // Chrome/Firefox/Edge use audio/webm
  if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
    return "audio/webm;codecs=opus";
  }
  if (MediaRecorder.isTypeSupported("audio/webm")) {
    return "audio/webm";
  }
  // Last fallback (rarely occurs)
  return "audio/webm";
}
