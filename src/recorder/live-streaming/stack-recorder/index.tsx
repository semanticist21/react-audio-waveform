/**
 * @deprecated Legacy index maintained for backwards compatibility.
 * Use compound component API instead: LiveStreamingStackRecorder.Root, LiveStreamingStackRecorder.Canvas
 */

export type {
  LiveStreamingStackRecorderCanvasProps,
  LiveStreamingStackRecorderRootProps,
} from "./stack-recorder-compound";
export { LiveStreamingStackRecorder } from "./stack-recorder-compound";
export { useLiveStreamingStackRecorderContext } from "./stack-recorder-context";
