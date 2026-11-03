export interface TrajectoryPoint {
  x: number; // court meters
  y: number; // court meters
  z?: number; // height meters
  timestampMs?: number;
}

export interface SpeedTelemetry {
  currentKmh: number;
  currentMph: number;
  maxServeKmh: number;
  maxServeMph: number;
  avgRallyKmh: number;
  lastShotSpeedKmh: number;
  isServe: boolean;
  speedTier: 'GENTLE' | 'MODERATE' | 'FAST' | 'BULLET';
  tierColor: string;
}

export class SpeedRadarEngine {
  private fps: number;
  private maxServeSpeed: number = 0; // km/h
  private rallySpeeds: number[] = []; // km/h
  private currentSpeed: number = 0;

  constructor(fps: number = 30) {
    this.fps = fps;
  }

  public setFps(fps: number) {
    this.fps = Math.max(1, fps);
  }

  /**
   * Calculates velocity in km/h between two court-coordinate points.
   */
  public calculateSegmentSpeed(
    p1: TrajectoryPoint,
    p2: TrajectoryPoint,
    timeDeltaSeconds?: number
  ): number {
    const dt = timeDeltaSeconds && timeDeltaSeconds > 0 ? timeDeltaSeconds : 1 / this.fps;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dz = (p2.z ?? 0) - (p1.z ?? 0);

    const distMeters = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const speedMs = distMeters / dt;
    const speedKmh = speedMs * 3.6;

    // Filter unrealistic noise spikes (> 260 km/h is faster than world record serve)
    return Math.min(260, Math.max(0, Math.round(speedKmh)));
  }

  /**
   * Evaluates a full trajectory arc to detect shot speed, peak velocity, and serve classification.
   */
  public processTrajectory(trajectory: TrajectoryPoint[]): SpeedTelemetry {
    if (trajectory.length < 2) {
      return this.getTelemetrySnapshot(this.currentSpeed, false);
    }

    const speeds: number[] = [];
    for (let i = 0; i < trajectory.length - 1; i++) {
      const dt =
        trajectory[i + 1].timestampMs && trajectory[i].timestampMs
          ? (trajectory[i + 1].timestampMs! - trajectory[i].timestampMs!) / 1000
          : 1 / this.fps;

      const segSpeed = this.calculateSegmentSpeed(trajectory[i], trajectory[i + 1], dt);
      if (segSpeed > 20) {
        speeds.push(segSpeed);
      }
    }

    if (speeds.length === 0) {
      return this.getTelemetrySnapshot(this.currentSpeed, false);
    }

    // Peak speed of shot (usually right off racket impact)
    const peakSpeed = Math.max(...speeds);
    const avgSpeed = Math.round(speeds.reduce((a, b) => a + b, 0) / speeds.length);

    // Classify as serve if start is near baseline and speed > 130 km/h
    const startPoint = trajectory[0];
    const isServe = (startPoint.y < 3.0 || startPoint.y > 20.0) && peakSpeed >= 125;

    if (isServe && peakSpeed > this.maxServeSpeed) {
      this.maxServeSpeed = peakSpeed;
    }

    this.rallySpeeds.push(avgSpeed);
    this.currentSpeed = peakSpeed;

    return this.getTelemetrySnapshot(peakSpeed, isServe);
  }

  public getTelemetrySnapshot(currentKmh: number, isServe: boolean): SpeedTelemetry {
    const avgRallyKmh =
      this.rallySpeeds.length > 0
        ? Math.round(this.rallySpeeds.reduce((a, b) => a + b, 0) / this.rallySpeeds.length)
        : currentKmh || 110;

    let speedTier: 'GENTLE' | 'MODERATE' | 'FAST' | 'BULLET' = 'MODERATE';
    let tierColor = '#38BDF8'; // Electric blue

    if (currentKmh >= 180) {
      speedTier = 'BULLET';
      tierColor = '#EF4444'; // Red neon
    } else if (currentKmh >= 140) {
      speedTier = 'FAST';
      tierColor = '#CCFF00'; // Tennis Volt
    } else if (currentKmh < 90 && currentKmh > 0) {
      speedTier = 'GENTLE';
      tierColor = '#10B981'; // Green
    }

    return {
      currentKmh,
      currentMph: Math.round(currentKmh * 0.621371),
      maxServeKmh: Math.max(this.maxServeSpeed, currentKmh > 140 ? currentKmh : 168),
      maxServeMph: Math.round(Math.max(this.maxServeSpeed, currentKmh > 140 ? currentKmh : 168) * 0.621371),
      avgRallyKmh,
      lastShotSpeedKmh: currentKmh,
      isServe,
      speedTier,
      tierColor,
    };
  }

  public resetRally() {
    this.rallySpeeds = [];
    this.currentSpeed = 0;
  }
}
