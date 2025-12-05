import { createContext, type ReactNode, useContext } from "react";
import {
  type UseRecordingAmplitudesOptions,
  type UseRecordingAmplitudesReturn,
  useRecordingAmplitudes,
} from "./use-recording-amplitudes";

// Context type definition
type LiveStreamingRecorderContextValue = UseRecordingAmplitudesReturn;

// Create context
const LiveStreamingRecorderContext = createContext<LiveStreamingRecorderContextValue | null>(null);

// Provider Props
export interface LiveStreamingRecorderProviderProps extends UseRecordingAmplitudesOptions {
  children: ReactNode | ((value: LiveStreamingRecorderContextValue) => ReactNode);
}

/**
 * LiveStreamingRecorder Context Provider
 * Root component that provides recording amplitude data to child components
 */
export function LiveStreamingRecorderProvider({ children, ...options }: LiveStreamingRecorderProviderProps) {
  const value = useRecordingAmplitudes(options);

  // Support render props pattern
  const content = typeof children === "function" ? children(value) : children;

  return <LiveStreamingRecorderContext.Provider value={value}>{content}</LiveStreamingRecorderContext.Provider>;
}

/**
 * LiveStreamingRecorder Context hook
 * Must be used within LiveStreamingRecorder.Root component
 */
export function useLiveStreamingRecorderContext(): LiveStreamingRecorderContextValue {
  const context = useContext(LiveStreamingRecorderContext);
  if (!context) {
    throw new Error("useLiveStreamingRecorderContext must be used within LiveStreamingRecorder.Root");
  }
  return context;
}
