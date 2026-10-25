import * as math from 'mathjs';

export interface KalmanFilterOptions {
  processNoise?: number;
  measurementNoise?: number;
  gravity?: number;
}

/**
 * 3D Linear Kalman Filter for Tennis Ball Tracking with Constant Velocity and Gravity Model.
 * State vector: [x, y, z, vx, vy, vz]^T
 */
export class KalmanFilter3D {
  private state: math.Matrix; // 6x1
  private covariance: math.Matrix; // 6x6
  private processNoise: number;
  private measurementNoise: number;
  private gravity: number;
  private isInitialized: boolean = false;

  constructor(options?: KalmanFilterOptions) {
    this.processNoise = options?.processNoise ?? 0.1;
    this.measurementNoise = options?.measurementNoise ?? 1.0;
    this.gravity = options?.gravity ?? 9.81;

    // Initialize state to zeros (6x1)
    this.state = math.matrix([[0], [0], [0], [0], [0], [0]]);

    // Initialize covariance matrix with high uncertainty (6x6 diagonal)
    const covData = Array.from({ length: 6 }, (_, i) =>
      Array.from({ length: 6 }, (_, j) => (i === j ? 100 : 0))
    );
    this.covariance = math.matrix(covData);
  }

  /**
   * Initializes or resets the filter state with a 3D position [x, y, z].
   */
  public init(position: [number, number, number], velocity: [number, number, number] = [0, 0, 0]): void {
    this.state = math.matrix([
      [position[0]],
      [position[1]],
      [position[2]],
      [velocity[0]],
      [velocity[1]],
      [velocity[2]],
    ]);

    const covData = Array.from({ length: 6 }, (_, i) =>
      Array.from({ length: 6 }, (_, j) => (i === j ? 1 : 0))
    );
    this.covariance = math.matrix(covData);
    this.isInitialized = true;
  }

  public getInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Predict step (time update) with dt and gravity effect.
   */
  public predict(dt: number): void {
    if (!this.isInitialized) return;

    // State transition matrix A (6x6)
    const AData = [
      [1, 0, 0, dt, 0, 0],
      [0, 1, 0, 0, dt, 0],
      [0, 0, 1, 0, 0, dt],
      [0, 0, 0, 1, 0, 0],
      [0, 0, 0, 0, 1, 0],
      [0, 0, 0, 0, 0, 1],
    ];
    const A = math.matrix(AData);

    // Gravity effect vector (assuming Z is vertical height)
    // z = z + vz*dt - 0.5*g*dt^2, vz = vz - g*dt
    const gravityEffect = math.matrix([
      [0],
      [0],
      [-0.5 * this.gravity * dt * dt],
      [0],
      [0],
      [-this.gravity * dt],
    ]);

    // x = A * x + gravity
    const Ax = math.multiply(A, this.state);
    this.state = math.add(Ax, gravityEffect) as math.Matrix;

    // P = A * P * A^T + Q
    const AT = math.transpose(A);
    const AP = math.multiply(A, this.covariance);
    const APAT = math.multiply(AP, AT);

    // Process noise covariance Q (6x6)
    const qVal = this.processNoise * dt;
    const QData = Array.from({ length: 6 }, (_, i) =>
      Array.from({ length: 6 }, (_, j) => (i === j ? qVal : 0))
    );
    const Q = math.matrix(QData);

    this.covariance = math.add(APAT, Q) as math.Matrix;
  }

  /**
   * Measurement update step (correction) with 3D position measurement [x, y, z].
   */
  public update(measurement: [number, number, number]): void {
    if (!this.isInitialized) {
      this.init(measurement);
      return;
    }

    // Measurement matrix H (3x6)
    const HData = [
      [1, 0, 0, 0, 0, 0],
      [0, 1, 0, 0, 0, 0],
      [0, 0, 1, 0, 0, 0],
    ];
    const H = math.matrix(HData);
    const HT = math.transpose(H);

    // Measurement vector z (3x1)
    const z = math.matrix([[measurement[0]], [measurement[1]], [measurement[2]]]);

    // Innovation y = z - H * x
    const Hx = math.multiply(H, this.state);
    const y = math.subtract(z, Hx) as math.Matrix;

    // Innovation covariance S = H * P * H^T + R
    const HP = math.multiply(H, this.covariance);
    const HPHT = math.multiply(HP, HT);

    const RData = [
      [this.measurementNoise, 0, 0],
      [0, this.measurementNoise, 0],
      [0, 0, this.measurementNoise],
    ];
    const R = math.matrix(RData);
    const S = math.add(HPHT, R) as math.Matrix;

    // Kalman gain K = P * H^T * inv(S)
    const SInv = math.inv(S);
    const PHT = math.multiply(this.covariance, HT);
    const K = math.multiply(PHT, SInv) as math.Matrix;

    // Updated state x = x + K * y
    const Ky = math.multiply(K, y);
    this.state = math.add(this.state, Ky) as math.Matrix;

    // Updated covariance P = (I - K * H) * P
    const IData = Array.from({ length: 6 }, (_, i) =>
      Array.from({ length: 6 }, (_, j) => (i === j ? 1 : 0))
    );
    const I = math.matrix(IData);
    const KH = math.multiply(K, H);
    const I_KH = math.subtract(I, KH);
    this.covariance = math.multiply(I_KH, this.covariance) as math.Matrix;
  }

  /**
   * Returns current estimated position [x, y, z] and velocity [vx, vy, vz].
   */
  public getState(): {
    position: [number, number, number];
    velocity: [number, number, number];
  } {
    const s = this.state.toArray() as number[][];
    return {
      position: [s[0][0], s[1][0], s[2][0]],
      velocity: [s[3][0], s[4][0], s[5][0]],
    };
  }
}
