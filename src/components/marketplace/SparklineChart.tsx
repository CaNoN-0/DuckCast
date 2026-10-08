import React from 'react';

interface SparklineChartProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}

export function SparklineChart({
  data,
  color = '#10B981',
  width = 84,
  height = 28
}: SparklineChartProps) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const paddingY = 3;

  const points = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * (width - 4) + 2;
      const normalized = (val - min) / range;
      const y = height - paddingY - normalized * (height - paddingY * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const isUp = data[data.length - 1] >= data[0];
  const strokeColor = isUp ? '#10B981' : '#EF4444';

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible inline-block shrink-0"
      aria-hidden="true"
    >
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      {/* End point indicator */}
      {data.length > 0 && (() => {
        const lastVal = data[data.length - 1];
        const lastX = width - 2;
        const normalized = (lastVal - min) / range;
        const lastY = height - paddingY - normalized * (height - paddingY * 2);
        return (
          <circle
            cx={lastX}
            cy={lastY}
            r="2"
            fill={strokeColor}
          />
        );
      })()}
    </svg>
  );
}
