import { detectBounce, TrajectoryPoint } from '../utils/bounceDetector';

describe('BounceDetector', () => {
  it('should return null for insufficient trajectory points', () => {
    const trajectory: TrajectoryPoint[] = [
      { t: 0, x: 0, y: 0, z: 1.0 },
      { t: 0.033, x: 1, y: 1, z: 0.5 },
    ];
    expect(detectBounce(trajectory)).toBeNull();
  });

  it('should detect a bounce at vertical minimum with parabolic interpolation', () => {
    const trajectory: TrajectoryPoint[] = [
      { t: 0.0, x: 10, y: 20, z: 0.4 },
      { t: 0.033, x: 11, y: 21, z: 0.15 },
      { t: 0.066, x: 12, y: 22, z: 0.02 },
      { t: 0.100, x: 13, y: 23, z: 0.05 },
      { t: 0.133, x: 14, y: 24, z: 0.18 },
    ];

    const result = detectBounce(trajectory);
    expect(result).not.toBeNull();
    expect(result?.bouncePoint.z).toBe(0.0);
    expect(result?.frameIndex).toBe(2);
    expect(result?.bouncePoint.t).toBeGreaterThanOrEqual(0.033);
    expect(result?.bouncePoint.t).toBeLessThanOrEqual(0.133);
  });

  it('should handle degenerate or collinear points gracefully (T-03-02)', () => {
    const trajectory: TrajectoryPoint[] = [
      { t: 0.0, x: 10, y: 20, z: 0.1 },
      { t: 0.033, x: 10, y: 20, z: 0.1 },
      { t: 0.066, x: 10, y: 20, z: 0.1 },
    ];

    const result = detectBounce(trajectory);
    expect(result).not.toBeNull();
    expect(result?.bouncePoint.z).toBeCloseTo(0.1);
  });
});
