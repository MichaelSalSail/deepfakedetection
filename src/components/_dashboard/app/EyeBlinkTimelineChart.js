import { useEffect, useRef, useState } from "react";
// material
import { Card, CardContent, Box, Tooltip, useTheme } from "@mui/material";
import { BLINK_TIMELINE_ROW_HEIGHT } from "./Eyeblinks.js";

const DURATION_SECONDS = 10;
const CHART_CONTENT_PADDING_Y = 24;
const CHART_HEIGHT = BLINK_TIMELINE_ROW_HEIGHT - CHART_CONTENT_PADDING_Y;
const Y_MIN = -2;
const Y_MAX = 2;
const Y_TICKS = [-2, -1, 0, 1, 2];
const X_TICKS = Array.from({ length: DURATION_SECONDS + 1 }, (_, i) => i);

const MARGIN = { top: 12, right: 20, bottom: 40, left: 52 };
const POINT_RADIUS = 4;
const POINT_RADIUS_SELECTED = 6;
const POINT_HIT_SIZE = 20;

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

function buildLinePath(points, xScale, yScale) {
  return points
    .map(([x, y], index) => `${index === 0 ? "M" : "L"} ${xScale(x)} ${yScale(y)}`)
    .join(" ");
}

function getZeroCrossing([x1, y1], [x2, y2]) {
  if (y1 === 0 || y2 === 0 || y1 * y2 > 0) {
    return null;
  }

  const t = (0 - y1) / (y2 - y1);
  return [x1 + t * (x2 - x1), 0];
}

function sideForEdge(y1, y2) {
  const midpoint = (y1 + y2) / 2;
  return midpoint > 0 ? "positive" : "negative";
}

function buildColoredSegments(data) {
  const expanded = [data[0]];
  for (let i = 1; i < data.length; i += 1) {
    const crossing = getZeroCrossing(data[i - 1], data[i]);
    if (crossing) {
      expanded.push(crossing);
    }
    expanded.push(data[i]);
  }

  if (expanded.length < 2) {
    return [];
  }

  const segments = [];
  let currentSide = sideForEdge(expanded[0][1], expanded[1][1]);
  let currentPoints = [expanded[0]];

  for (let i = 1; i < expanded.length; i += 1) {
    const prev = expanded[i - 1];
    const curr = expanded[i];
    const edgeSide = sideForEdge(prev[1], curr[1]);

    if (edgeSide === currentSide) {
      currentPoints.push(curr);
    } else {
      if (currentPoints.length >= 2) {
        segments.push({ points: [...currentPoints], side: currentSide });
      }
      currentPoints = [prev, curr];
      currentSide = edgeSide;
    }
  }

  if (currentPoints.length >= 2) {
    segments.push({ points: currentPoints, side: currentSide });
  }

  return segments;
}

function getPointColor(y, positiveColor, negativeColor, neutralColor) {
  if (y > 0) {
    return positiveColor;
  }
  if (y < 0) {
    return negativeColor;
  }
  return neutralColor;
}

export default function EyeBlinkTimelineChart({ selectedPoint = null, onPointSelect }) {
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
  const positiveColor = theme.palette.success.main;
  const negativeColor = theme.palette.error.main;
  const neutralColor = theme.palette.grey[500];

  const plotWidth = Math.max(width - MARGIN.left - MARGIN.right, 0);
  const plotHeight = CHART_HEIGHT - MARGIN.top - MARGIN.bottom;

  const xScale = (value) => MARGIN.left + (value / DURATION_SECONDS) * plotWidth;
  const yScale = (value) =>
    MARGIN.top + ((Y_MAX - value) / (Y_MAX - Y_MIN)) * plotHeight;

  const zeroY = yScale(0);
  const coloredSegments = buildColoredSegments(PLACEHOLDER_DATA);

  const isPointSelected = (x, y) =>
    selectedPoint !== null && selectedPoint.x === x && selectedPoint.y === y;

  return (
    <Card
      sx={{
        height: BLINK_TIMELINE_ROW_HEIGHT,
        width: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <CardContent
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          py: 1.5,
          px: 1,
          minHeight: 0,
          "&:last-child": { pb: 1.5 },
        }}
      >
        <Box
          ref={containerRef}
          sx={{
            position: "relative",
            height: CHART_HEIGHT,
            minHeight: 0,
            flexShrink: 0,
          }}
        >
          {width > 0 && (
            <>
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

              {coloredSegments.map((segment, index) => (
                <path
                  key={`segment-${index}`}
                  d={buildLinePath(segment.points, xScale, yScale)}
                  fill="none"
                  stroke={segment.side === "positive" ? positiveColor : negativeColor}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              ))}

              {PLACEHOLDER_DATA.map(([x, y]) => {
                const pointColor = getPointColor(
                  y,
                  positiveColor,
                  negativeColor,
                  neutralColor
                );
                const selected = isPointSelected(x, y);
                return (
                  <circle
                    key={`point-${x}`}
                    cx={xScale(x)}
                    cy={yScale(y)}
                    r={selected ? POINT_RADIUS_SELECTED : POINT_RADIUS}
                    fill={theme.palette.background.paper}
                    stroke={pointColor}
                    strokeWidth={selected ? 3 : 2}
                  />
                );
              })}

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

            {PLACEHOLDER_DATA.map(([x, y]) => (
              <Tooltip
                key={`tooltip-${x}`}
                title={`(x, y) = (${x}, ${y})`}
                arrow
                placement="top"
              >
                <Box
                  component="button"
                  type="button"
                  aria-label={`(x, y) = (${x}, ${y})`}
                  aria-pressed={isPointSelected(x, y)}
                  onClick={() => onPointSelect?.({ x, y })}
                  sx={{
                    position: "absolute",
                    left: xScale(x),
                    top: yScale(y),
                    width: POINT_HIT_SIZE,
                    height: POINT_HIT_SIZE,
                    transform: "translate(-50%, -50%)",
                    cursor: "pointer",
                    border: 0,
                    padding: 0,
                    background: "transparent",
                  }}
                />
              </Tooltip>
            ))}
            </>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
