import React from 'react';
import Svg, { Line, Circle, Path } from 'react-native-svg';
import { inverseProjectPoint, Point2D } from '../utils/homography';
import { ITF_COURT_DIMENSIONS, Point3D } from '../utils/itfCourt';

interface CourtOverlaySvgProps {
  H: number[][] | null;
  width: number;
  height: number;
  tappedPoints?: Point2D[];
}

export const CourtOverlaySvg: React.FC<CourtOverlaySvgProps> = ({
  H,
  width,
  height,
  tappedPoints = [],
}) => {
  // If no homography matrix yet, just render tapped points
  if (!H) {
    return (
      <Svg width={width} height={height} style={{ position: 'absolute', top: 0, left: 0 }}>
        {tappedPoints.map((pt, idx) => (
          <Circle
            key={`tapped-${idx}`}
            cx={pt.x}
            cy={pt.y}
            r={8}
            fill="#ff3b30"
            stroke="#ffffff"
            strokeWidth={2}
          />
        ))}
      </Svg>
    );
  }

  // Helper to project 3D meter point to 2D pixel point via inverse homography
  const toPixel = (pt3d: Point3D): Point2D | null => {
    try {
      return inverseProjectPoint(H, pt3d);
    } catch {
      return null;
    }
  };

  // Court lines in 3D meters
  const {
    doublesSidelineLeft,
    doublesSidelineRight,
    singlesSidelineLeft,
    singlesSidelineRight,
    baselineBottom,
    serviceLineBottom,
    net,
    serviceLineTop,
    baselineTop,
    centerMarkX,
  } = ITF_COURT_DIMENSIONS;

  const lines = [
    // Baselines
    { start: { x: doublesSidelineLeft, y: baselineBottom, z: 0 }, end: { x: doublesSidelineRight, y: baselineBottom, z: 0 } },
    { start: { x: doublesSidelineLeft, y: baselineTop, z: 0 }, end: { x: doublesSidelineRight, y: baselineTop, z: 0 } },
    // Doubles Sidelines
    { start: { x: doublesSidelineLeft, y: baselineBottom, z: 0 }, end: { x: doublesSidelineLeft, y: baselineTop, z: 0 } },
    { start: { x: doublesSidelineRight, y: baselineBottom, z: 0 }, end: { x: doublesSidelineRight, y: baselineTop, z: 0 } },
    // Singles Sidelines
    { start: { x: singlesSidelineLeft, y: baselineBottom, z: 0 }, end: { x: singlesSidelineLeft, y: baselineTop, z: 0 } },
    { start: { x: singlesSidelineRight, y: baselineBottom, z: 0 }, end: { x: singlesSidelineRight, y: baselineTop, z: 0 } },
    // Service Lines
    { start: { x: singlesSidelineLeft, y: serviceLineBottom, z: 0 }, end: { x: singlesSidelineRight, y: serviceLineBottom, z: 0 } },
    { start: { x: singlesSidelineLeft, y: serviceLineTop, z: 0 }, end: { x: singlesSidelineRight, y: serviceLineTop, z: 0 } },
    // Center Service Line (between service lines)
    { start: { x: centerMarkX, y: serviceLineBottom, z: 0 }, end: { x: centerMarkX, y: serviceLineTop, z: 0 } },
    // Net
    { start: { x: doublesSidelineLeft, y: net, z: 0 }, end: { x: doublesSidelineRight, y: net, z: 0 } },
  ];

  const projectedLines = lines
    .map((line) => {
      const p1 = toPixel(line.start);
      const p2 = toPixel(line.end);
      if (!p1 || !p2) return null;
      return { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y };
    })
    .filter((l): l is { x1: number; y1: number; x2: number; y2: number } => l !== null);

  return (
    <Svg width={width} height={height} style={{ position: 'absolute', top: 0, left: 0 }}>
      {projectedLines.map((l, idx) => (
        <Line
          key={`court-line-${idx}`}
          x1={l.x1}
          y1={l.y1}
          x2={l.x2}
          y2={l.y2}
          stroke="#00ffcc"
          strokeWidth={3}
          strokeOpacity={0.8}
        />
      ))}
      {tappedPoints.map((pt, idx) => (
        <Circle
          key={`tapped-${idx}`}
          cx={pt.x}
          cy={pt.y}
          r={6}
          fill="#ff3b30"
          stroke="#ffffff"
          strokeWidth={2}
        />
      ))}
    </Svg>
  );
};
