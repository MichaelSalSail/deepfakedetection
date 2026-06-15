import { useEffect, useRef, useState } from "react";
// material
import { Card, CardContent, Box, useTheme } from "@mui/material";

const DURATION_SECONDS = 10;
const CHART_HEIGHT = 240;
const Y_MIN = -2;
const Y_MAX = 2;
const Y_TICKS = [-2, -1, 0, 1, 2];
const X_TICKS = Array.from({ length: DURATION_SECONDS + 1 }, (_, i) => i);

const MARGIN = { top: 12, right: 20, bottom: 40, left: 52 };
const POINT_RADIUS = 4;

// missing=-2, unknown=-1, closed=1, open=2 — fixed placeholder at each whole second
const PLACEHOLDER_DATA = [
  [0, 2],
  [1, 2],
  [2, 1],
  [3, -1],
  [4, -2],
  [5, -2],
  [6, -1],
  [7, 1],
  [8, 2],
  [9, 2],
  [10, 1],
];

function buildLinePath(data, xScale, yScale) {
  return data
    .map(([x, y], index) => `${index === 0 ? "M" : "L"} ${xScale(x)} ${yScale(y)}`)
    .join(" ");
}

export default function EyeBlinkTimelineChart() {
  const theme = useTheme();
  const containerRef = useRef(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) {
      return undefined;
    }

    const updateWidth = () => setWidth(node.getBoundingClientRect().width);
    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const axisColor = theme.palette.text.primary;
  const labelColor = theme.palette.text.secondary;
  const gridColor = theme.palette.divider;
  const lineColor = theme.palette.grey[500];

  const plotWidth = Math.max(width - MARGIN.left - MARGIN.right, 0);
  const plotHeight = CHART_HEIGHT - MARGIN.top - MARGIN.bottom;

  const xScale = (value) => MARGIN.left + (value / DURATION_SECONDS) * plotWidth;
  const yScale = (value) =>
    MARGIN.top + ((Y_MAX - value) / (Y_MAX - Y_MIN)) * plotHeight;

  const zeroY = yScale(0);
  const linePath = buildLinePath(PLACEHOLDER_DATA, xScale, yScale);

  return (
    <Card sx={{ height: "100%", width: "100%", display: "flex", flexDirection: "column" }}>
      <CardContent
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          py: 1.5,
          px: 1,
          "&:last-child": { pb: 1.5 },
        }}
      >
        <Box ref={containerRef} sx={{ flex: 1, minHeight: 220, height: CHART_HEIGHT }}>
          {width > 0 && (
            <svg
              width={width}
              height={CHART_HEIGHT}
              role="img"
              aria-label="Eye blink classification over time"
            >
              {Y_TICKS.map((tick) => {
                const y = yScale(tick);
                const isZero = tick === 0;
                return (
                  <line
                    key={tick}
                    x1={MARGIN.left}
                    y1={y}
                    x2={width - MARGIN.right}
                    y2={y}
                    stroke={isZero ? axisColor : gridColor}
                    strokeWidth={isZero ? 2 : 1}
                    strokeDasharray={isZero ? undefined : "4 4"}
                  />
                );
              })}

              <path
                d={linePath}
                fill="none"
                stroke={lineColor}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {PLACEHOLDER_DATA.map(([x, y]) => (
                <circle
                  key={`point-${x}`}
                  cx={xScale(x)}
                  cy={yScale(y)}
                  r={POINT_RADIUS}
                  fill={theme.palette.background.paper}
                  stroke={lineColor}
                  strokeWidth={2}
                />
              ))}

              {Y_TICKS.map((tick) => (
                <text
                  key={`y-${tick}`}
                  x={MARGIN.left - 10}
                  y={yScale(tick)}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fill={labelColor}
                  fontSize={11}
                  fontFamily={theme.typography.fontFamily}
                >
                  {tick}
                </text>
              ))}

              <text
                x={14}
                y={MARGIN.top + plotHeight / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={labelColor}
                fontSize={12}
                fontWeight={500}
                fontFamily={theme.typography.fontFamily}
                transform={`rotate(-90, 14, ${MARGIN.top + plotHeight / 2})`}
              >
                Classification
              </text>

              {X_TICKS.map((tick) => {
                const x = xScale(tick);
                return (
                  <g key={`x-${tick}`}>
                    <line
                      x1={x}
                      y1={zeroY}
                      x2={x}
                      y2={zeroY + 5}
                      stroke={axisColor}
                      strokeWidth={1}
                    />
                    <text
                      x={x}
                      y={zeroY + 18}
                      textAnchor="middle"
                      fill={labelColor}
                      fontSize={11}
                      fontFamily={theme.typography.fontFamily}
                    >
                      {tick.toFixed(1)}
                    </text>
                  </g>
                );
              })}

              <text
                x={MARGIN.left + plotWidth / 2}
                y={CHART_HEIGHT - 8}
                textAnchor="middle"
                fill={labelColor}
                fontSize={12}
                fontWeight={500}
                fontFamily={theme.typography.fontFamily}
              >
                Time (s)
              </text>
            </svg>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
