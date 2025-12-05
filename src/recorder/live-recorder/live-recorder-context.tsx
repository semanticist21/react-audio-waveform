import { createContext, type ReactNode, useContext } from "react";
import { type UseLiveAudioDataOptions, type UseLiveAudioDataReturn, useLiveAudioData } from "./use-live-audio-data.js";

// Context 타입 정의
type LiveRecorderContextValue = UseLiveAudioDataReturn;

// Context 생성
const LiveRecorderContext = createContext<LiveRecorderContextValue | null>(null);

// Provider Props
export interface LiveRecorderProviderProps extends UseLiveAudioDataOptions {
  children: ReactNode | ((value: LiveRecorderContextValue) => ReactNode);
}

/**
 * LiveRecorder Context Provider
 * 자식 컴포넌트에 실시간 오디오 데이터를 제공하는 루트 컴포넌트
 */
export function LiveRecorderProvider({ children, ...options }: LiveRecorderProviderProps) {
  const value = useLiveAudioData(options);

  // render props 패턴 지원
  const content = typeof children === "function" ? children(value) : children;

  return <LiveRecorderContext.Provider value={value}>{content}</LiveRecorderContext.Provider>;
}

/**
 * LiveRecorder Context hook
 * LiveRecorder.Root 내부에서만 사용 가능
 */
export function useLiveRecorderContext(): LiveRecorderContextValue {
  const context = useContext(LiveRecorderContext);
  if (!context) {
    throw new Error("useLiveRecorderContext must be used within LiveRecorder.Root");
  }
  return context;
}
