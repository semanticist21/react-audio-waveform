import { createContext, type ReactNode, useContext } from "react";
import {
  type UseRecordingAmplitudesOptions,
  type UseRecordingAmplitudesReturn,
  useRecordingAmplitudes,
} from "../use-recording-amplitudes";

// Context type definition
type LiveStreamingStackRecorderContextValue = UseRecordingAmplitudesReturn;

// Create context
const LiveStreamingStackRecorderContext = createContext<LiveStreamingStackRecorderContextValue | null>(null);

// Provider Props
export interface LiveStreamingStackRecorderProviderProps extends UseRecordingAmplitudesOptions {
  children: ReactNode | ((value: LiveStreamingStackRecorderContextValue) => ReactNode);
}

/**
 * LiveStreamingStackRecorder Context Provider
 * Root component that provides recording amplitude data to child components
 */
export function LiveStreamingStackRecorderProvider({ children, ...options }: LiveStreamingStackRecorderProviderProps) {
  const value = useRecordingAmplitudes(options);

  // Support render props pattern
  const content = typeof children === "function" ? children(value) : children;

  return (
    <LiveStreamingStackRecorderContext.Provider value={value}>{content}</LiveStreamingStackRecorderContext.Provider>
  );
}

/**
 * LiveStreamingStackRecorder Context hook
 * Must be used within LiveStreamingStackRecorder.Root component
 */
export function useLiveStreamingStackRecorderContext(): LiveStreamingStackRecorderContextValue {
  const context = useContext(LiveStreamingStackRecorderContext);
  if (!context) {
    throw new Error("useLiveStreamingStackRecorderContext must be used within LiveStreamingStackRecorder.Root");
  }
  return context;
}
