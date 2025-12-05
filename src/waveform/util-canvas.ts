/**
 * Utility to read canvas bar styles from CSS variables
 */
export interface CanvasBarStyles {
  /** Bar width (pixels) */
  barWidth: number;
  /** Gap between bars (pixels) */
  gap: number;
  /** Bar border radius (pixels) */
  barRadius: number;
  /** Bar color (CSS color value) */
  barColor: string;
}

/**
 * Type used when passing bar styles directly as props
 */
export interface BarStyle {
  /** Bar width (pixels or CSS value) */
  width?: string | number;
  /** Gap between bars (pixels or CSS value) */
  gap?: string | number;
  /** Bar border radius (pixels or CSS value) */
  radius?: string | number;
}

/**
 * Bar rendering configuration (style + height scale)
 */
export interface BarConfig extends BarStyle {
  /** Bar height scale (0.0 - 1.0). Default 0.9 leaves 10% vertical padding */
  heightScale?: number;
}

/**
 * CSS custom properties for bar styling (used in style prop)
 */
export interface BarStyleVars {
  "--bar-width"?: string | number;
  "--bar-gap"?: string | number;
  "--bar-radius"?: string | number;
}

/**
 * Read bar style settings from canvas element
 * @param canvas - Canvas element to read styles from (for color extraction)
 * @param barStyle - Directly passed bar style (optional, uses defaults)
 * @returns Style settings needed for bar rendering
 */
export function getCanvasBarStyles(canvas: HTMLCanvasElement, barStyle?: BarStyle): CanvasBarStyles {
  const style = getComputedStyle(canvas);

  // Extract values from barStyle prop, use defaults if not present
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
