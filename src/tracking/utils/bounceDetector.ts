export interface TrajectoryPoint {
  t: number; // timestamp in seconds
  x: number;
  y: number;
  z: number;
}

export interface BounceResult {
  bouncePoint: TrajectoryPoint;
  frameIndex: number;
  confidence: number;
}

/**
 * Detects the bounce point ($z=0$ vertical minimum) from a trajectory history array,
 * using quadratic parabolic curve fitting for sub-frame temporal precision.
 * Mitigates T-03-02 (division by zero / collinear configurations).
 */
export function detectBounce(trajectory: TrajectoryPoint[]): BounceResult | null {
  if (!trajectory || trajectory.length < 3) {
    return null;
  }

  for (let i = 1; i < trajectory.length - 1; i++) {
    const prev = trajectory[i - 1];
    const curr = trajectory[i];
    const next = trajectory[i + 1];

    // Check for local minimum in Z coordinate near court surface (Z <= 0.2m)
    if (curr.z <= prev.z && curr.z <= next.z && curr.z <= 0.2) {
      const t1 = prev.t, z1 = prev.z;
      const t2 = curr.t, z2 = curr.z;
      const t3 = next.t, z3 = next.z;

      const denom = (t1 - t2) * (t1 - t3) * (t2 - t3);
      if (Math.abs(denom) > 1e-6) {
        const a = (t3 * (z2 - z1) + t2 * (z1 - z3) + t1 * (z3 - z2)) / denom;
        const b = (t3 * t3 * (z1 - z2) + t2 * t2 * (z3 - z1) + t1 * t1 * (z2 - z3)) / denom;

        if (Math.abs(a) > 1e-4 && a > 0) {
          const tBounce = -b / (2 * a);
          if (tBounce >= t1 && tBounce <= t3) {
            const dtTotal = t3 - t1;
            const ratio = dtTotal > 1e-6 ? (tBounce - t1) / dtTotal : 0.5;
            const xInterp = prev.x + (next.x - prev.x) * ratio;
            const yInterp = prev.y + (next.y - prev.y) * ratio;

            return {
              bouncePoint: {
                t: tBounce,
                x: xInterp,
                y: yInterp,
                z: 0.0,
              },
              frameIndex: i,
              confidence: 0.95,
            };
          }
        }
      }

      // Fallback if parabolic vertex is degenerate or outside interval
      return {
        bouncePoint: {
          t: curr.t,
          x: curr.x,
          y: curr.y,
          z: Math.max(0, curr.z),
        },
        frameIndex: i,
        confidence: 0.80,
      };
    }
  }

  return null;
}
