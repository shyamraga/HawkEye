import { SpeedRadarEngine } from '../speedRadarEngine';

describe('SpeedRadarEngine', () => {
  let radar: SpeedRadarEngine;

  beforeEach(() => {
    radar = new SpeedRadarEngine(30); // 30 fps
  });

  test('calculates segment speed correctly in km/h', () => {
    // Ball travels 1.0 meter in 1 frame (1/30s) -> 30 m/s -> 108 km/h
    const p1 = { x: 4.0, y: 10.0, z: 1.0 };
    const p2 = { x: 4.0, y: 11.0, z: 1.0 };
    const speed = radar.calculateSegmentSpeed(p1, p2, 1 / 30);
    expect(speed).toBe(108);
  });

  test('caps unrealistic physics anomalies at 260 km/h', () => {
    const p1 = { x: 0.0, y: 0.0, z: 0.0 };
    const p2 = { x: 50.0, y: 50.0, z: 10.0 }; // impossible teleports
    const speed = radar.calculateSegmentSpeed(p1, p2, 1 / 30);
    expect(speed).toBeLessThanOrEqual(260);
  });

  test('processes multi-point trajectory and classifies fast serves', () => {
    // Simulate high-speed serve from baseline (y = 1.0)
    const trajectory = [
      { x: 4.0, y: 1.0, z: 2.5 },
      { x: 4.1, y: 2.6, z: 2.3 }, // dy = 1.6m in 1/30s -> ~172 km/h
      { x: 4.2, y: 4.2, z: 2.0 },
      { x: 4.3, y: 5.8, z: 1.7 },
    ];

    const telemetry = radar.processTrajectory(trajectory);
    expect(telemetry.currentKmh).toBeGreaterThan(150);
    expect(telemetry.isServe).toBe(true);
    expect(telemetry.speedTier).toBe('FAST');
    expect(telemetry.maxServeKmh).toBeGreaterThanOrEqual(telemetry.currentKmh);
  });

  test('converts km/h to mph accurately', () => {
    const p1 = { x: 0, y: 0 };
    const p2 = { x: 0, y: 1.0 }; // 108 km/h
    const kmh = radar.calculateSegmentSpeed(p1, p2, 1 / 30);
    const telemetry = radar.getTelemetrySnapshot(kmh, false);
    // 108 km/h * 0.621371 = 67.1 mph -> 67 mph
    expect(telemetry.currentMph).toBe(Math.round(108 * 0.621371));
  });
});
