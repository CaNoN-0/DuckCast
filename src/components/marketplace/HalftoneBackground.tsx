import React from 'react';

interface HalftoneBackgroundProps {
  className?: string;
  fill?: string;
  opacity?: number;
  animateOnHover?: boolean;
}

// Pre-computed halftone dots matching the corner dot matrix pattern
const DOTS = (() => {
  const cols = 28;
  const rows = 18;
  const width = 336;
  const height = 216;
  const spacingX = width / cols;
  const spacingY = height / rows;
  const maxRadius = 5.4;
  const list: { cx: number; cy: number; r: number }[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const u = c / (cols - 1); // 0 (left) to 1 (right)
      const v = r / (rows - 1); // 0 (top) to 1 (bottom)

      // Diagonal gradient expanding from top-left to bottom-right
      const factor = u * 0.55 + v * 0.55;
      if (factor > 0.34) {
        const normalized = Math.min(1, (factor - 0.34) / 0.76);
        const radius = Math.min(maxRadius, Math.max(0.35, maxRadius * Math.pow(normalized, 1.25)));
        list.push({
          cx: Number((c * spacingX + spacingX / 2).toFixed(1)),
          cy: Number((r * spacingY + spacingY / 2).toFixed(1)),
          r: Number(radius.toFixed(2))
        });
      }
    }
  }
  return list;
})();

export function HalftoneBackground({
  className = '',
  fill = '#09090B',
  opacity = 0.14,
  animateOnHover = true,
}: HalftoneBackgroundProps) {
  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden select-none z-0 transition-opacity duration-300 ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 336 216"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className={`w-full h-full object-cover block transition-all duration-500 ease-out ${
          animateOnHover ? 'group-hover:scale-105 group-hover:translate-x-1 group-hover:translate-y-0.5' : ''
        }`}
        style={{ opacity }}
      >
        {DOTS.map((dot, idx) => (
          <circle key={idx} cx={dot.cx} cy={dot.cy} r={dot.r} fill={fill} />
        ))}
      </svg>
    </div>
  );
}

