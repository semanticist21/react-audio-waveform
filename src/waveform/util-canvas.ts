/**
 * Canvas bar 스타일을 CSS 변수에서 읽어오는 유틸리티
 */
export interface CanvasBarStyles {
  /** Bar의 너비 (픽셀) */
  barWidth: number;
  /** Bar 사이의 간격 (픽셀) */
  gap: number;
  /** Bar의 border radius (픽셀) */
  barRadius: number;
  /** Bar의 color (CSS color 값) */
  barColor: string;
}

/**
 * Bar 스타일을 직접 prop으로 전달할 때 사용하는 타입
 */
export interface BarStyle {
  /** Bar의 너비 (픽셀 또는 CSS 값) */
  width?: string | number;
  /** Bar 사이의 간격 (픽셀 또는 CSS 값) */
  gap?: string | number;
  /** Bar의 border radius (픽셀 또는 CSS 값) */
  radius?: string | number;
}

/**
 * Bar 렌더링 설정 (스타일 + 높이 스케일)
 */
export interface BarConfig extends BarStyle {
  /** Bar height scale (0.0 - 1.0). Default 0.9 leaves 10% vertical padding */
  heightScale?: number;
}

/**
 * Canvas 요소로부터 bar 스타일 설정을 읽어옴
 * @param canvas - 스타일을 읽을 canvas 요소 (color 추출용)
 * @param barStyle - 직접 전달된 bar 스타일 (optional, 기본값 사용)
 * @returns bar 렌더링에 필요한 스타일 설정
 */
export function getCanvasBarStyles(canvas: HTMLCanvasElement, barStyle?: BarStyle): CanvasBarStyles {
  const style = getComputedStyle(canvas);

  // barStyle prop에서 값 추출, 없으면 기본값 사용
  const barWidth = barStyle?.width
    ? typeof barStyle.width === "number"
      ? barStyle.width
      : Number.parseFloat(barStyle.width)
    : 3;

  const gap = barStyle?.gap ? (typeof barStyle.gap === "number" ? barStyle.gap : Number.parseFloat(barStyle.gap)) : 1;

  const barRadius = barStyle?.radius
    ? typeof barStyle.radius === "number"
      ? barStyle.radius
      : Number.parseFloat(barStyle.radius)
    : 1.5;

  return {
    barWidth,
    gap,
    barRadius,
    barColor: style.color,
  };
}
