import { KalmanFilter3D } from '../utils/kalmanFilter';

describe('3D Linear Kalman Filter', () => {
  test('initializes correctly with position and zero velocity', () => {
    const kf = new KalmanFilter3D();
    expect(kf.getInitialized()).toBe(false);

    kf.init([10, 20, 5]);
    expect(kf.getInitialized()).toBe(true);

    const state = kf.getState();
    expect(state.position).toEqual([10, 20, 5]);
    expect(state.velocity).toEqual([0, 0, 0]);
  });

  test('smooths noisy trajectory and tracks constant velocity', () => {
    const kf = new KalmanFilter3D({ processNoise: 0.01, measurementNoise: 0.1 });
    const dt = 0.1;

    // True motion: moving along X by +1 every step (vx = 10 units/sec)
    kf.init([0, 0, 2], [10, 0, 0]);

    // Simulate 5 steps with noisy measurements
    const measurements: [number, number, number][] = [
      [1.1, 0.0, 1.9],
      [1.9, 0.1, 2.1],
      [3.0, -0.1, 1.8],
      [4.2, 0.0, 2.0],
      [4.9, 0.1, 1.9],
    ];

    for (const meas of measurements) {
      kf.predict(dt);
      kf.update(meas);
    }

    const finalState = kf.getState();
    // Position should be filtered close to expected progression (~5.0)
    expect(finalState.position[0]).toBeGreaterThan(4.5);
    expect(finalState.position[0]).toBeLessThan(5.5);
    // Velocity should be estimated around 10
    expect(finalState.velocity[0]).toBeGreaterThan(5);
  });

  test('performs dead-reckoning prediction during occlusions (skipping updates)', () => {
    const kf = new KalmanFilter3D({ processNoise: 0.01, measurementNoise: 0.1 });
    const dt = 0.1;

    // Start at x=0, vx=20 (moving fast along X)
    kf.init([0, 0, 5], [20, 0, 0]);

    // Step 1: normal update
    kf.predict(dt);
    kf.update([2.0, 0, 5.0]);

    const posBeforeOcclusion = kf.getState().position[0];

    // Occlusion: 3 steps of pure prediction (no measurement updates)
    for (let i = 0; i < 3; i++) {
      kf.predict(dt);
    }

    const posAfterOcclusion = kf.getState().position[0];
    // With velocity ~20 and dt=0.1, 3 steps = +6 units ahead
    expect(posAfterOcclusion).toBeGreaterThan(posBeforeOcclusion);
  });
});
