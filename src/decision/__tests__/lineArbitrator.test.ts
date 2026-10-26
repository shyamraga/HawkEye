import {
  calculateDistanceToLineSegment,
  arbitrateLineCall,
  TENNIS_BALL_RADIUS_METERS,
} from '../utils/lineArbitrator';
import { ITF_LINE_SEGMENTS } from '../utils/lineSegments';
import { ITF_COURT_DIMENSIONS } from '../../calibration/utils/itfCourt';

describe('Line Arbitration Engine & Ball Radius Boundary Logic', () => {
  describe('calculateDistanceToLineSegment', () => {
    test('computes correct perpendicular distance for horizontal line segment', () => {
      const segment = {
        id: 'test_h',
        name: 'Test Horizontal',
        p1: { x: 0, y: 5, z: 0 },
        p2: { x: 10, y: 5, z: 0 },
        type: 'baseline' as const,
      };

      const pointAbove = { x: 5, y: 7, z: 0 };
      const result = calculateDistanceToLineSegment(pointAbove, segment);
      expect(result.distance).toBeCloseTo(2, 5);
      expect(result.closestPoint).toEqual({ x: 5, y: 5, z: 0 });
    });

    test('computes correct distance when point projects outside segment endpoints (clamping)', () => {
      const segment = {
        id: 'test_seg',
        name: 'Test Segment',
        p1: { x: 2, y: 2, z: 0 },
        p2: { x: 8, y: 2, z: 0 },
        type: 'baseline' as const,
      };

      // Point past p1 (x=0, y=5) -> closest point should be p1 (2,2)
      const pointPastP1 = { x: 0, y: 5, z: 0 };
      const res1 = calculateDistanceToLineSegment(pointPastP1, segment);
      expect(res1.closestPoint).toEqual({ x: 2, y: 2, z: 0 });
      expect(res1.distance).toBeCloseTo(Math.sqrt(2 * 2 + 3 * 3), 5);
    });

    test('handles degenerate single-point segments safely', () => {
      const degenerateSegment = {
        id: 'test_deg',
        name: 'Test Degenerate',
        p1: { x: 5, y: 5, z: 0 },
        p2: { x: 5, y: 5, z: 0 },
        type: 'baseline' as const,
      };

      const point = { x: 8, y: 9, z: 0 };
      const result = calculateDistanceToLineSegment(point, degenerateSegment);
      expect(result.distance).toBeCloseTo(5, 5); // sqrt((8-5)^2 + (9-5)^2) = sqrt(9+16) = 5
      expect(result.closestPoint).toEqual({ x: 5, y: 5, z: 0 });
    });
  });

  describe('arbitrateLineCall with Ball Radius Threshold (33mm / 0.033m)', () => {
    const leftSinglesSidelineX = ITF_COURT_DIMENSIONS.singlesSidelineLeft; // 1.37m

    test('classifies ball deep inside court as IN', () => {
      const bouncePoint = { x: 5.0, y: 10.0, z: 0 }; // Center-ish court
      const result = arbitrateLineCall(bouncePoint, 0.95, 'singles');

      expect(result.verdict).toBe('IN');
      expect(result.isTouch).toBe(false);
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    test('classifies ball far outside court as OUT', () => {
      const bouncePoint = { x: 0.5, y: 10.0, z: 0 }; // 0.87m outside left singles sideline
      const result = arbitrateLineCall(bouncePoint, 0.95, 'singles');

      expect(result.verdict).toBe('OUT');
      expect(result.isTouch).toBe(false);
      expect(result.distanceFromLineCm).toBeLessThan(0);
    });

    test('exact boundary test case: 32mm outside line is IN (Touch)', () => {
      // Left singles sideline is at x = 1.37. 32mm (0.032m) outside is x = 1.37 - 0.032 = 1.338
      const bouncePoint = { x: leftSinglesSidelineX - 0.032, y: 10.0, z: 0 };
      const result = arbitrateLineCall(bouncePoint, 1.0, 'singles');

      expect(result.verdict).toBe('IN');
      expect(result.isTouch).toBe(true);
      expect(result.distanceFromLineCm).toBeCloseTo(3.2, 1);
    });

    test('exact boundary test case: 33mm outside line is IN (Touch at exact limit)', () => {
      // Exactly at 33mm (0.033m)
      const bouncePoint = { x: leftSinglesSidelineX - 0.033, y: 10.0, z: 0 };
      const result = arbitrateLineCall(bouncePoint, 1.0, 'singles');

      expect(result.verdict).toBe('IN');
      expect(result.isTouch).toBe(true);
      expect(result.distanceFromLineCm).toBeCloseTo(3.3, 1);
    });

    test('exact boundary test case: 34mm outside line is OUT', () => {
      // 34mm (0.034m) outside is x = 1.37 - 0.034 = 1.336
      const bouncePoint = { x: leftSinglesSidelineX - 0.034, y: 10.0, z: 0 };
      const result = arbitrateLineCall(bouncePoint, 1.0, 'singles');

      expect(result.verdict).toBe('OUT');
      expect(result.isTouch).toBe(false);
      expect(result.distanceFromLineCm).toBeCloseTo(-3.4, 1);
    });

    test('throws error on invalid or non-finite coordinate inputs (Threat T-04-01)', () => {
      const invalidPoint = { x: NaN, y: 10.0, z: 0 };
      expect(() => arbitrateLineCall(invalidPoint)).toThrow();
    });
  });
});
