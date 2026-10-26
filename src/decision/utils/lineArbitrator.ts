import { Point3D, ITF_COURT_DIMENSIONS } from '../../calibration/utils/itfCourt';
import { ITF_LINE_SEGMENTS, LineSegment } from './lineSegments';

export const TENNIS_BALL_RADIUS_METERS = 0.033; // 33mm radius (66mm diameter)

export interface LineCallResult {
  verdict: 'IN' | 'OUT';
  isTouch: boolean;
  distanceFromLineCm: number; // Positive if inside/touching line, negative if outside line
  nearestLineId?: string;
  nearestLineName?: string;
  confidence: number;
}

/**
 * Validates that a 3D point has finite numerical coordinates.
 */
function validatePoint(point: Point3D): void {
  if (
    !point ||
    typeof point.x !== 'number' ||
    typeof point.y !== 'number' ||
    isNaN(point.x) ||
    isNaN(point.y) ||
    !isFinite(point.x) ||
    !isFinite(point.y)
  ) {
    throw new Error(`Invalid or non-finite coordinate input: ${JSON.stringify(point)}`);
  }
}

/**
 * Calculates the shortest perpendicular distance from a point to a 3D line segment.
 */
export function calculateDistanceToLineSegment(
  point: Point3D,
  segment: LineSegment
): { distance: number; closestPoint: Point3D } {
  validatePoint(point);
  validatePoint(segment.p1);
  validatePoint(segment.p2);

  const { p1, p2 } = segment;
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dz = (p2.z ?? 0) - (p1.z ?? 0);

  const l2 = dx * dx + dy * dy + dz * dz;

  if (l2 === 0) {
    // Segment is a single point
    const dist = Math.sqrt(
      Math.pow(point.x - p1.x, 2) +
        Math.pow(point.y - p1.y, 2) +
        Math.pow((point.z ?? 0) - (p1.z ?? 0), 2)
    );
    return { distance: dist, closestPoint: { ...p1 } };
  }

  // Consider the line extending the segment, parameterized as p1 + t * (p2 - p1).
  // Find projection of point onto the line.
  let t =
    ((point.x - p1.x) * dx +
      (point.y - p1.y) * dy +
      ((point.z ?? 0) - (p1.z ?? 0)) * dz) /
    l2;

  // Clamp t to the [0, 1] range to stay within segment bounds
  t = Math.max(0, Math.min(1, t));

  const closestPoint: Point3D = {
    x: p1.x + t * dx,
    y: p1.y + t * dy,
    z: (p1.z ?? 0) + t * dz,
  };

  const distance = Math.sqrt(
    Math.pow(point.x - closestPoint.x, 2) +
      Math.pow(point.y - closestPoint.y, 2) +
      Math.pow((point.z ?? 0) - (closestPoint.z ?? 0), 2)
  );

  return { distance, closestPoint };
}

/**
 * Arbitrates whether a ball bounce is IN or OUT based on ITF court boundaries and ball radius (33mm).
 */
export function arbitrateLineCall(
  bouncePoint: Point3D,
  trackingConfidence: number = 1.0,
  matchType: 'singles' | 'doubles' = 'singles'
): LineCallResult {
  validatePoint(bouncePoint);

  // Determine court boundary limits based on match type
  const minX = matchType === 'singles' ? ITF_COURT_DIMENSIONS.singlesSidelineLeft : ITF_COURT_DIMENSIONS.doublesSidelineLeft;
  const maxX = matchType === 'singles' ? ITF_COURT_DIMENSIONS.singlesSidelineRight : ITF_COURT_DIMENSIONS.doublesSidelineRight;
  const minY = ITF_COURT_DIMENSIONS.baselineBottom;
  const maxY = ITF_COURT_DIMENSIONS.baselineTop;

  // Filter relevant line segments based on match type
  const relevantLines = ITF_LINE_SEGMENTS.filter((seg) => {
    if (matchType === 'singles') {
      // Exclude doubles sidelines for singles arbitration
      if (seg.id === 'doubles_sideline_left' || seg.id === 'doubles_sideline_right') {
        return false;
      }
    }
    return true;
  });

  // Find distance to all relevant line segments
  let minDistance = Infinity;
  let nearestLine: LineSegment | null = null;

  for (const seg of relevantLines) {
    const { distance } = calculateDistanceToLineSegment(bouncePoint, seg);
    if (distance < minDistance) {
      minDistance = distance;
      nearestLine = seg;
    }
  }

  // Check if point is strictly inside court polygon
  const isInsideCourt =
    bouncePoint.x >= minX &&
    bouncePoint.x <= maxX &&
    bouncePoint.y >= minY &&
    bouncePoint.y <= maxY;

  let verdict: 'IN' | 'OUT' = 'OUT';
  let isTouch = false;
  let distanceFromLineCm = 0;

  if (isInsideCourt) {
    verdict = 'IN';
    // If inside court, check if it's also touching or close to a line
    isTouch = minDistance <= TENNIS_BALL_RADIUS_METERS;
    distanceFromLineCm = minDistance * 100;
  } else {
    // Outside court bounds, check if ball radius overlaps any line (distance <= 0.033m)
    if (minDistance <= TENNIS_BALL_RADIUS_METERS) {
      verdict = 'IN';
      isTouch = true;
      distanceFromLineCm = minDistance * 100; // positive or zero for touch
    } else {
      verdict = 'OUT';
      isTouch = false;
      distanceFromLineCm = -minDistance * 100; // negative to indicate out by X cm
    }
  }

  // Compute confidence based on tracking confidence and margin from line
  // If a call is razor-thin (distance very close to 33mm), confidence is slightly lower
  const marginFromThreshold = Math.abs(minDistance - TENNIS_BALL_RADIUS_METERS);
  const boundaryUncertaintyFactor = Math.min(1.0, marginFromThreshold / 0.01); // within 1cm of 33mm threshold
  const confidence = Math.max(0.1, Math.min(1.0, trackingConfidence * (0.7 + 0.3 * boundaryUncertaintyFactor)));

  return {
    verdict,
    isTouch,
    distanceFromLineCm: Math.round(distanceFromLineCm * 10) / 10,
    nearestLineId: nearestLine?.id,
    nearestLineName: nearestLine?.name,
    confidence: Math.round(confidence * 100) / 100,
  };
}
