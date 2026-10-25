import React from 'react';
import Svg, { Path, Circle, Text as SvgText } from 'react-native-svg';
import { TrajectoryPoint } from '../utils/bounceDetector';

interface TrajectoryOverlaySvgProps {
  trajectory: TrajectoryPoint[];
  bouncePoint?: TrajectoryPoint | null;
  width: number;
  height: number;
  toScreen?: (pt: TrajectoryPoint) => { x: number; y: number } | null;
}

export const TrajectoryOverlaySvg: React.FC<TrajectoryOverlaySvgProps> = ({
  trajectory = [],
  bouncePoint = null,
  width,
  height,
  toScreen,
}) => {
  const mapPoint = (pt: TrajectoryPoint) => {
    if (toScreen) {
      return toScreen(pt);
    }
    return { x: pt.x, y: pt.y };
  };

  const validPoints = trajectory
    .map(mapPoint)
    .filter((p): p is { x: number; y: number } => p !== null);

  let pathData = '';
  if (validPoints.length > 0) {
    pathData = `M ${validPoints[0].x} ${validPoints[0].y}`;
    for (let i = 1; i < validPoints.length; i++) {
      pathData += ` L ${validPoints[i].x} ${validPoints[i].y}`;
    }
  }

  const projectedBounce = bouncePoint ? mapPoint(bouncePoint) : null;

  return (
    <Svg width={width} height={height} style={{ position: 'absolute', top: 0, left: 0 }}>
      {/* Smoothed Trajectory Path */}
      {pathData ? (
        <Path
          d={pathData}
          stroke="#00ffff"
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity={0.85}
        />
      ) : null}

      {/* Trajectory Points */}
      {validPoints.map((pt, idx) => (
        <Circle
          key={`traj-pt-${idx}`}
          cx={pt.x}
          cy={pt.y}
          r={3}
          fill="#00ccff"
          stroke="#ffffff"
          strokeWidth={1}
        />
      ))}

      {/* Bounce Impact Marker */}
      {projectedBounce ? (
        <>
          <Circle
            cx={projectedBounce.x}
            cy={projectedBounce.y}
            r={10}
            fill="none"
            stroke="#ff3b30"
            strokeWidth={3}
          />
          <Circle
            cx={projectedBounce.x}
            cy={projectedBounce.y}
            r={4}
            fill="#ff3b30"
          />
          <SvgText
            x={projectedBounce.x + 12}
            y={projectedBounce.y - 6}
            fill="#ff3b30"
            fontSize="12"
            fontWeight="bold"
          >
            BOUNCE
          </SvgText>
        </>
      ) : null}
    </Svg>
  );
};
