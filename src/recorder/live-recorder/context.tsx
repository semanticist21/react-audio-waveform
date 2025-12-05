import { createContext, type ReactNode, useContext } from "react";
import { type UseLiveAudioDataOptions, type UseLiveAudioDataReturn, useLiveAudioData } from "./use-live-audio-data";

// Context type definition
type LiveRecorderContextValue = UseLiveAudioDataReturn;

// Create context
const LiveRecorderContext = createContext<LiveRecorderContextValue | null>(null);

// Provider Props
export interface LiveRecorderProviderProps extends UseLiveAudioDataOptions {
  children: ReactNode | ((value: LiveRecorderContextValue) => ReactNode);
}

/**
 * LiveRecorder Context Provider
 * Root component that provides real-time audio data to child components
 */
export function LiveRecorderProvider({ children, ...options }: LiveRecorderProviderProps) {
  const value = useLiveAudioData(options);

  // Support render props pattern
  const content = typeof children === "function" ? children(value) : children;

  return <LiveRecorderContext.Provider value={value}>{content}</LiveRecorderContext.Provider>;
}

/**
 * LiveRecorder Context hook
 * Root Must be used within component
 */
export function useLiveRecorderContext(): LiveRecorderContextValue {
  const context = useContext(LiveRecorderContext);
  if (!context) {
    throw new Error("useLiveRecorderContext must be used within LiveRecorder.Root");
  }
  return context;
}
