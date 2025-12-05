import { type ForwardedRef, forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type { WaveformAppearance } from "../../types.js";
import { useAudioAnalyser } from "../use-audio-analyser.js";

export interface LiveRecorderProps {
  /**
   * MediaRecorder instance to visualize
   */
  mediaRecorder: MediaRecorder | null;
  /**
   * CSS class for styling. Use Tailwind classes:
   * - text-* for bar color (inherited via currentColor)
   * - bg-* for background color
   */
  className?: string;
  /**
   * Waveform appearance configuration
   */
  appearance?: WaveformAppearance;
  /**
   * FFT size for frequency analysis (must be power of 2)
   * @default 2048
   */
  fftSize?: number;
  /**
   * Smoothing time constant for analyser (0-1)
   * @default 0.8
   */
  smoothingTimeConstant?: number;
  /**
   * Show minimal bars when not recording (idle state)
   * @default true
   */
  showIdleState?: boolean;
}

export interface LiveRecorderRef {
  /** Get the canvas element */
  getCanvas: () => HTMLCanvasElement | null;
  /** Get the audio context */
  getAudioContext: () => AudioContext | null;
  /** Get the analyser node */
  getAnalyser: () => AnalyserNode | null;
}

/**
 * 실시간 오디오 주파수 시각화 컴포넌트
 * MediaRecorder의 오디오를 Web Audio API로 분석하여 바 형태로 렌더링
 */
export const LiveRecorder = forwardRef<LiveRecorderRef, LiveRecorderProps>(
  (
    { mediaRecorder, className = "", appearance, fftSize = 2048, smoothingTimeConstant = 0.8, showIdleState = true },
    ref: ForwardedRef<LiveRecorderRef>
  ) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | null>(null);

    const { audioContextRef, analyserRef, dataArrayRef, bufferLengthRef } = useAudioAnalyser({
      mediaRecorder,
      fftSize,
      smoothingTimeConstant,
    });

    // ref를 통해 내부 요소 접근 가능하게 노출
    useImperativeHandle(ref, () => ({
      getCanvas: () => canvasRef.current,
      getAudioContext: () => audioContextRef.current,
      getAnalyser: () => analyserRef.current,
    }));

    // 녹음 중 애니메이션 루프
    useEffect(() => {
      if (!mediaRecorder || !canvasRef.current) {
        return;
      }

      const canvas = canvasRef.current;

      // appearance에서 bar 스타일 값 추출
      const barWidth = appearance?.barWidth ?? 3;
      const barGap = appearance?.barGap ?? 1;
      const barRadius = appearance?.barRadius ?? 1.5;
      const barHeightScale = appearance?.barHeightScale ?? 0.95;

      // barColor: appearance에서 지정하거나, CSS currentColor 사용
      const barColor = appearance?.barColor ?? getComputedStyle(canvas).color ?? "#3b82f6";

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      let isPaused = false;

      const draw = () => {
        if (isPaused) {
          animationRef.current = requestAnimationFrame(draw);
          return;
        }

        const analyser = analyserRef.current;
        const dataArray = dataArrayRef.current;
        const bufferLength = bufferLengthRef.current;

        if (!analyser || !dataArray || !ctx) return;

        // 현재 canvas 크기 가져오기
        const { width, height } = canvas.getBoundingClientRect();
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        // time domain data 가져오기 (waveform)
        analyser.getByteTimeDomainData(dataArray);

        // canvas 클리어
        ctx.clearRect(0, 0, width, height);

        // 바 개수 계산
        const totalBarWidth = barWidth + barGap;
        const numBars = Math.floor((width + barGap) / totalBarWidth);

        // 바 색상 설정
        ctx.fillStyle = barColor;

        // 바 그리기
        for (let i = 0; i < numBars; i++) {
          const dataIndex = Math.floor((i / numBars) * bufferLength);
          const value = dataArray[dataIndex] || 0;

          // byte 값(0-255)을 높이로 변환, 128(무음)을 중심으로
          const amplitude = Math.abs(value - 128) / 128;
          const barHeight = Math.max(2, amplitude * height * barHeightScale);

          const x = i * totalBarWidth;
          const y = (height - barHeight) / 2;

          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, barRadius);
          ctx.fill();
        }

        animationRef.current = requestAnimationFrame(draw);
      };

      // pause/resume 이벤트 핸들러
      const handlePause = () => {
        isPaused = true;
      };
      const handleResume = () => {
        isPaused = false;
      };

      mediaRecorder.addEventListener("pause", handlePause);
      mediaRecorder.addEventListener("resume", handleResume);

      // analyser가 준비된 후 애니메이션 시작
      const timeoutId = setTimeout(() => {
        draw();
      }, 50);

      return () => {
        clearTimeout(timeoutId);
        mediaRecorder.removeEventListener("pause", handlePause);
        mediaRecorder.removeEventListener("resume", handleResume);
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = null;
        }
      };
    }, [mediaRecorder, appearance, analyserRef, dataArrayRef, bufferLengthRef]);

    // idle 상태 그리기 (녹음 시작 전)
    useEffect(() => {
      if (mediaRecorder || !showIdleState || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;

      // appearance에서 bar 스타일 값 추출
      const barWidth = appearance?.barWidth ?? 3;
      const barGap = appearance?.barGap ?? 1;
      const barRadius = appearance?.barRadius ?? 1.5;
      const barColor = appearance?.barColor ?? getComputedStyle(canvas).color ?? "#3b82f6";

      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      ctx.clearRect(0, 0, width, height);

      // idle 상태: 최소 높이의 바 그리기
      ctx.fillStyle = barColor;
      const minBarHeight = 2;
      const totalBarWidth = barWidth + barGap;
      const barCount = Math.floor((width + barGap) / totalBarWidth);

      for (let i = 0; i < barCount; i++) {
        const x = i * totalBarWidth;
        const y = (height - minBarHeight) / 2;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, minBarHeight, barRadius);
        ctx.fill();
      }
    }, [mediaRecorder, appearance, showIdleState]);

    return <canvas ref={canvasRef} className={`text-inherit ${className}`} aria-hidden="true" tabIndex={-1} />;
  }
);

LiveRecorder.displayName = "LiveRecorder";
