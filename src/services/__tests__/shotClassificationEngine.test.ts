import { ShotClassificationEngine, Trajectory3DPoint } from '../shotClassificationEngine';

describe('ShotClassificationEngine', () => {
  let engine: ShotClassificationEngine;

  beforeEach(() => {
    engine = new ShotClassificationEngine();
  });

  test('classifies a fast flat serve from baseline', () => {
    // Serve starts high at baseline and travels fast
    const trajectory: Trajectory3DPoint[] = [
      { x: 4.1, y: 0.5, z: 2.8, timestampMs: 0 },
      { x: 4.2, y: 5.0, z: 2.0, timestampMs: 80 },
      { x: 4.3, y: 11.8, z: 1.1, timestampMs: 160 },
      { x: 4.4, y: 17.5, z: 0.1, timestampMs: 250 },
    ];

    const shot = engine.classifyShot(trajectory, 'PLAYER_ONE');
    expect(shot.stroke).toBe('SERVE');
    expect(shot.speedKmh).toBeGreaterThan(150);
    expect(['flat', 'slice', 'kick']).toContain(shot.spin);
  });

  test('classifies forehand groundstroke with topspin', () => {
    // Groundstroke from right side of court (x = 5.5m)
    const trajectory: Trajectory3DPoint[] = [
      { x: 5.5, y: 1.2, z: 0.9, timestampMs: 0 },
      { x: 5.2, y: 6.0, z: 1.8, timestampMs: 140 },
      { x: 4.8, y: 12.0, z: 1.5, timestampMs: 280 },
      { x: 3.2, y: 19.5, z: 0.05, timestampMs: 440 },
    ];

    const shot = engine.classifyShot(trajectory, 'PLAYER_ONE');
    expect(shot.stroke).toBe('FOREHAND');
    expect(shot.spin).toBe('topspin');
    expect(shot.spinRpm).toBeGreaterThan(1600);
    expect(shot.depth).toBe('DEEP');
  });

  test('classifies backhand groundstroke from left side', () => {
    // Groundstroke from left side of court (x = 2.5m)
    const trajectory: Trajectory3DPoint[] = [
      { x: 2.5, y: 1.2, z: 0.9, timestampMs: 0 },
      { x: 2.8, y: 6.0, z: 1.7, timestampMs: 140 },
      { x: 3.5, y: 12.0, z: 1.4, timestampMs: 280 },
      { x: 4.5, y: 19.2, z: 0.05, timestampMs: 440 },
    ];

    const shot = engine.classifyShot(trajectory, 'PLAYER_ONE');
    expect(shot.stroke).toBe('BACKHAND');
    expect(shot.depth).toBe('DEEP');
  });

  test('classifies drop shot when speed is low and bounce is near net', () => {
    // Drop shot: low speed (< 75 km/h), shallow landing near net
    const trajectory: Trajectory3DPoint[] = [
      { x: 4.0, y: 2.0, z: 1.1, timestampMs: 0 },
      { x: 4.0, y: 6.0, z: 1.6, timestampMs: 300 },
      { x: 4.1, y: 11.5, z: 1.2, timestampMs: 600 },
      { x: 4.1, y: 13.5, z: 0.02, timestampMs: 850 },
    ];

    const shot = engine.classifyShot(trajectory, 'PLAYER_ONE');
    expect(shot.stroke).toBe('DROP_SHOT');
    expect(shot.spin).toBe('slice');
  });

  test('computes aggregate match stats correctly', () => {
    // Add 2 serves, 2 forehands, 1 backhand
    const serveTrajectory: Trajectory3DPoint[] = [
      { x: 4.1, y: 0.5, z: 2.8, timestampMs: 0 },
      { x: 4.3, y: 17.5, z: 0.0, timestampMs: 250 },
    ];
    const fhTrajectory: Trajectory3DPoint[] = [
      { x: 6.0, y: 1.2, z: 0.9, timestampMs: 0 },
      { x: 3.0, y: 20.0, z: 0.0, timestampMs: 400 },
    ];

    engine.classifyShot(serveTrajectory, 'PLAYER_ONE', 'ACE');
    engine.classifyShot(serveTrajectory, 'PLAYER_ONE', 'IN_PLAY');
    engine.classifyShot(fhTrajectory, 'PLAYER_ONE', 'WINNER');
    engine.classifyShot(fhTrajectory, 'PLAYER_ONE', 'UNFORCED_ERROR');

    const stats = engine.computeMatchStats();
    expect(stats.totalShots).toBe(4);
    expect(stats.serves.total).toBe(2);
    expect(stats.serves.aces).toBe(1);
    expect(stats.forehands.total).toBe(2);
    expect(stats.forehands.winners).toBe(1);
    expect(stats.forehands.errors).toBe(1);
    expect(stats.depthBreakdown.deepPct).toBeGreaterThan(0);
  });
});
