// Gauss-Jordan elimination solver for 8x8 linear system: M * h = B
function solveLinearSystem(M: number[][], B: number[]): number[] {
  const n = 8;
  // Create augmented matrix [M | B] of size 8x9
  const A: number[][] = [];
  for (let i = 0; i < n; i++) {
    A.push([...M[i], B[i]]);
  }

  for (let i = 0; i < n; i++) {
    // Pivot search
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(A[k][i]) > Math.abs(A[maxRow][i])) {
        maxRow = k;
      }
    }

    // Swap rows
    const temp = A[i];
    A[i] = A[maxRow];
    A[maxRow] = temp;

    const pivot = A[i][i];
    if (Math.abs(pivot) < 1e-8) {
      throw new Error("Linear system is singular or degenerate.");
    }

    // Normalize row
    for (let j = i; j <= n; j++) {
      A[i][j] /= pivot;
    }

    // Eliminate column elements in other rows
    for (let k = 0; k < n; k++) {
      if (k !== i) {
        const factor = A[k][i];
        for (let j = i; j <= n; j++) {
          A[k][j] -= factor * A[i][j];
        }
      }
    }
  }

  // The last column contains the solution
  return A.map(row => row[n]);
}

export class CourtCalibration {
  public H: number[][] | null = null;
  public H_inv: number[][] | null = null;

  // Standard Tennis Court dimensions
  public static readonly COURT_WIDTH_DOUBLES = 10.97;
  public static readonly COURT_WIDTH_SINGLES = 8.23;
  public static readonly COURT_LENGTH = 23.77;
  public static readonly ALLEY_WIDTH = 1.37;
  public static readonly NET_Y = 11.89;
  public static readonly SERVICE_LINE_DIST = 6.4;
  public static readonly SERVICE_LINE_FAR = 11.89 + 6.4; // 18.29m
  public static readonly SERVICE_LINE_NEAR = 11.89 - 6.4; // 5.49m
  public static readonly CENTER_LINE_X = 10.97 / 2.0;

  constructor() {}

  /**
   * Computes the Homography matrix H mapping image pixels to world meters.
   * srcPts: 4 points in image space [[u1, v1], [u2, v2], [u3, v3], [u4, v4]]
   * dstPts: 4 points in world space [[X1, Y1], [X2, Y2], [X3, Y3], [X4, Y4]]
   */
  public computeHomography(srcPts: number[][], dstPts: number[][]): number[][] {
    const M: number[][] = [];
    const B: number[] = [];

    for (let i = 0; i < 4; i++) {
      const [x, y] = srcPts[i];
      const [X, Y] = dstPts[i];

      // Row 2i: maps X
      M.push([x, y, 1, 0, 0, 0, -x * X, -y * X]);
      B.push(X);

      // Row 2i+1: maps Y
      M.push([0, 0, 0, x, y, 1, -x * Y, -y * Y]);
      B.push(Y);
    }

    const h = solveLinearSystem(M, B);
    this.H = [
      [h[0], h[1], h[2]],
      [h[3], h[4], h[5]],
      [h[6], h[7], 1.0]
    ];

    // Compute H_inv analytically for 3x3 matrix
    const det = 
      this.H[0][0] * (this.H[1][1] * this.H[2][2] - this.H[1][2] * this.H[2][1]) -
      this.H[0][1] * (this.H[1][0] * this.H[2][2] - this.H[1][2] * this.H[2][0]) +
      this.H[0][2] * (this.H[1][0] * this.H[2][1] - this.H[1][1] * this.H[2][0]);

    if (Math.abs(det) < 1e-8) {
      throw new Error("Homography matrix is singular.");
    }

    const invDet = 1.0 / det;
    this.H_inv = [
      [
        (this.H[1][1] * this.H[2][2] - this.H[1][2] * this.H[2][1]) * invDet,
        (this.H[0][2] * this.H[2][1] - this.H[0][1] * this.H[2][2]) * invDet,
        (this.H[0][1] * this.H[1][2] - this.H[0][2] * this.H[1][1]) * invDet
      ],
      [
        (this.H[1][2] * this.H[2][0] - this.H[1][0] * this.H[2][2]) * invDet,
        (this.H[0][0] * this.H[2][2] - this.H[0][2] * this.H[2][0]) * invDet,
        (this.H[0][2] * this.H[1][0] - this.H[0][0] * this.H[1][2]) * invDet
      ],
      [
        (this.H[1][0] * this.H[2][1] - this.H[1][1] * this.H[2][0]) * invDet,
        (this.H[0][1] * this.H[2][0] - this.H[0][0] * this.H[2][1]) * invDet,
        (this.H[0][0] * this.H[1][1] - this.H[0][1] * this.H[1][0]) * invDet
      ]
    ];

    return this.H;
  }

  public imageToWorld(x: number, y: number): [number, number] {
    if (!this.H) throw new Error("Homography not computed.");
    const u = this.H[0][0] * x + this.H[0][1] * y + this.H[0][2];
    const v = this.H[1][0] * x + this.H[1][1] * y + this.H[1][2];
    const w = this.H[2][0] * x + this.H[2][1] * y + this.H[2][2];
    return [u / w, v / w];
  }

  public worldToImage(X: number, Y: number): [number, number] {
    if (!this.H_inv) throw new Error("Homography not computed.");
    const u = this.H_inv[0][0] * X + this.H_inv[0][1] * Y + this.H_inv[0][2];
    const v = this.H_inv[1][0] * X + this.H_inv[1][1] * Y + this.H_inv[1][2];
    const w = this.H_inv[2][0] * X + this.H_inv[2][1] * Y + this.H_inv[2][2];
    return [Math.round(u / w), Math.round(v / w)];
  }
}

// 2D Kalman Filter with position measurements
export class KalmanFilter2D {
  private dt: number;
  private q: number;
  private r: number;

  // States
  public x: number = 0;
  public y: number = 0;
  public vx: number = 0;
  public vy: number = 0;

  // State covariance
  private P = [
    [10.0, 0, 0, 0],
    [0, 10.0, 0, 0],
    [0, 0, 10.0, 0],
    [0, 0, 0, 10.0]
  ];

  public initialized = false;

  constructor(dt = 1.0/60.0, processNoise = 1.5, measurementNoise = 0.5) {
    this.dt = dt;
    this.q = processNoise;
    this.r = measurementNoise;
  }

  public initialize(initX: number, initY: number) {
    this.x = initX;
    this.y = initY;
    this.vx = 0;
    this.vy = 0;
    this.P = [
      [10.0, 0, 0, 0],
      [0, 10.0, 0, 0],
      [0, 0, 10.0, 0],
      [0, 0, 0, 10.0]
    ];
    this.initialized = true;
  }

  public predict() {
    if (!this.initialized) return;
    // x_t = x_{t-1} + vx * dt
    this.x += this.vx * this.dt;
    this.y += this.vy * this.dt;

    // Transition matrix F
    const F = [
      [1.0, 0.0, this.dt, 0.0],
      [0.0, 1.0, 0.0, this.dt],
      [0.0, 0.0, 1.0, 0.0],
      [0.0, 0.0, 0.0, 1.0]
    ];

    // Predict covariance P = F * P * F^T + Q
    // We compute this matrix multiplication manually for performance
    const FP = F.map(row => 
      Array(4).fill(0).map((_, colIdx) => 
        row.reduce((sum, val, k) => sum + val * this.P[k][colIdx], 0)
      )
    );

    const FPFt = FP.map(row =>
      Array(4).fill(0).map((_, colIdx) =>
        row.reduce((sum, val, k) => sum + val * F[colIdx][k], 0)
      )
    );

    // Kinematic Q
    const dt2 = this.dt * this.dt;
    const dt3 = dt2 * this.dt;
    const dt4 = dt3 * this.dt;
    const Q = [
      [0.25 * dt4 * this.q, 0.0, 0.5 * dt3 * this.q, 0.0],
      [0.0, 0.25 * dt4 * this.q, 0.0, 0.5 * dt3 * this.q],
      [0.5 * dt3 * this.q, 0.0, dt2 * this.q, 0.0],
      [0.0, 0.5 * dt3 * this.q, 0.0, dt2 * this.q]
    ];

    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        this.P[i][j] = FPFt[i][j] + Q[i][j];
      }
    }
  }

  public update(zx: number, zy: number): [number, number] {
    if (!this.initialized) {
      this.initialize(zx, zy);
      return [zx, zy];
    }

    // Residual (Innovation)
    const yx = zx - this.x;
    const yy = zy - this.y;

    // Innovation covariance S = H * P * H^T + R
    // Since H = [[1, 0, 0, 0], [0, 1, 0, 0]], S is just top-left 2x2 of P + R
    const S = [
      [this.P[0][0] + this.r, this.P[0][1]],
      [this.P[1][0], this.P[1][1] + this.r]
    ];

    // Inverse of S (2x2 matrix inversion)
    const detS = S[0][0] * S[1][1] - S[0][1] * S[1][0];
    if (Math.abs(detS) < 1e-8) return [this.x, this.y];
    const invDetS = 1.0 / detS;
    const invS = [
      [S[1][1] * invDetS, -S[0][1] * invDetS],
      [-S[1][0] * invDetS, S[0][0] * invDetS]
    ];

    // Kalman gain K = P * H^T * invS
    // Since H^T is size 4x2 with 1s at [0,0] and [1,1], P * H^T is the first 2 columns of P
    const PHt = [
      [this.P[0][0], this.P[0][1]],
      [this.P[1][0], this.P[1][1]],
      [this.P[2][0], this.P[2][1]],
      [this.P[3][0], this.P[3][1]]
    ];

    const K = PHt.map(row => [
      row[0] * invS[0][0] + row[1] * invS[1][0],
      row[0] * invS[0][1] + row[1] * invS[1][1]
    ]);

    // Update state x = x + K * y
    this.x += K[0][0] * yx + K[0][1] * yy;
    this.y += K[1][0] * yx + K[1][1] * yy;
    this.vx += K[2][0] * yx + K[2][1] * yy;
    this.vy += K[3][0] * yx + K[3][1] * yy;

    // Update covariance P = (I - K * H) * P
    // KH is size 4x4, equal to K's rows multiplied by H's rows
    const KH = K.map(row => [row[0], row[1], 0.0, 0.0]);
    const I_KH = Array(4).fill(0).map((_, i) => 
      Array(4).fill(0).map((_, j) => (i === j ? 1.0 : 0.0) - KH[i][j])
    );

    const newP = I_KH.map(row =>
      Array(4).fill(0).map((_, colIdx) =>
        row.reduce((sum, val, k) => sum + val * this.P[k][colIdx], 0)
      )
    );

    this.P = newP;
    return [this.x, this.y];
  }
}

interface TrajectoryPoint {
  x: number;
  y: number;
  t: number;
  vx_diff?: number;
  vy_diff?: number;
}

export class BounceDetector {
  private windowSize: number;
  public history: TrajectoryPoint[] = [];

  constructor(windowSize = 7) {
    this.windowSize = windowSize;
  }

  public addPoint(x: number, y: number, t: number): { isBounce: boolean; point: { x: number; y: number; t: number; frameIndex: number } | null } {
    this.history.push({ x, y, t });
    if (this.history.length > this.windowSize) {
      this.history.shift();
    }

    return this.detectBounce();
  }

  private detectBounce(): { isBounce: boolean; point: { x: number; y: number; t: number; frameIndex: number } | null } {
    if (this.history.length < 6) {
      return { isBounce: false, point: null };
    }

    // 1. Compute velocity differences
    for (let i = 1; i < this.history.length; i++) {
      this.history[i].vx_diff = this.history[i].x - this.history[i-1].x;
      this.history[i].vy_diff = this.history[i].y - this.history[i-1].y;
    }

    const midIdx = Math.floor(this.history.length / 2); // usually 3

    // 2. Average vertical velocities before and after transition
    const vyBefore = this.history.slice(1, midIdx).map(pt => pt.vy_diff || 0);
    const vyAfter = this.history.slice(midIdx).map(pt => pt.vy_diff || 0);

    const avgVyBefore = vyBefore.reduce((a, b) => a + b, 0) / vyBefore.length;
    const avgVyAfter = vyAfter.reduce((a, b) => a + b, 0) / vyAfter.length;

    // 3. Velocity sign flip check
    const signFlip = (avgVyBefore > 0.2 && avgVyAfter < -0.2) || (avgVyBefore < -0.2 && avgVyAfter > 0.2);

    // 4. Magnitude check (velocity jump)
    const velChange = Math.abs(avgVyBefore - avgVyAfter);
    const isBounceImpulse = velChange > 2.0;

    if (signFlip && isBounceImpulse) {
      const refinedPoint = this.refineBouncePoint(midIdx);
      return { isBounce: true, point: refinedPoint };
    }

    return { isBounce: false, point: null };
  }

  private refineBouncePoint(midIdx: number): { x: number; y: number; t: number; frameIndex: number } {
    // Fits simple linear regression around the transition point to find the intersection.
    // To make it simple and NPU/JS compatible, we do a local linear intersection:
    // Line 1: fits the points before the bounce.
    // Line 2: fits the points after the bounce.
    const ptsIn = this.history.slice(0, midIdx + 1);
    const ptsOut = this.history.slice(midIdx + 1);

    // Fit x = mx*t + cx, y = my*t + cy
    const fitLine = (pts: TrajectoryPoint[]) => {
      const n = pts.length;
      let sumT = 0, sumX = 0, sumY = 0, sumTT = 0, sumTX = 0, sumTY = 0;
      for (const pt of pts) {
        sumT += pt.t;
        sumX += pt.x;
        sumY += pt.y;
        sumTT += pt.t * pt.t;
        sumTX += pt.t * pt.x;
        sumTY += pt.t * pt.y;
      }
      const mx = (n * sumTX - sumT * sumX) / (n * sumTT - sumT * sumT || 1);
      const cx = (sumX - mx * sumT) / n;
      const my = (n * sumTY - sumT * sumY) / (n * sumTT - sumT * sumT || 1);
      const cy = (sumY - my * sumT) / n;
      return { mx, cx, my, cy };
    };

    const lineIn = fitLine(ptsIn);
    const lineOut = fitLine(ptsOut);

    // Intersect in Y: myIn * t + cyIn = myOut * t + cyOut
    // t = (cyOut - cyIn) / (myIn - myOut)
    const den = lineIn.my - lineOut.my;
    let tBounce = this.history[midIdx].t;
    if (Math.abs(den) > 1e-5) {
      const tCalc = (lineOut.cy - lineIn.cy) / den;
      if (tCalc >= this.history[0].t && tCalc <= this.history[this.history.length - 1].t) {
        tBounce = tCalc;
      }
    }

    // Interpolate
    const xBounce = tBounce <= this.history[midIdx].t
      ? lineIn.mx * tBounce + lineIn.cx
      : lineOut.mx * tBounce + lineOut.cx;

    const yBounce = tBounce <= this.history[midIdx].t
      ? lineIn.my * tBounce + lineIn.cy
      : lineOut.my * tBounce + lineOut.cy;

    return {
      x: xBounce,
      y: yBounce,
      t: tBounce,
      frameIndex: this.history[midIdx].t
    };
  }
}

// Tennis Rule Decision Logic
export function checkInOut(
  X: number,
  Y: number,
  mode: "singles" | "doubles" = "singles",
  shotType: "rally" | "serve_far_deuce" | "serve_far_ad" | "serve_near_deuce" | "serve_near_ad" = "rally",
  ballRadius = 0.033 // 3.3 cm in meters
): { decision: "IN" | "OUT"; distanceCm: number } {
  
  let xMin = CourtCalibration.ALLEY_WIDTH;
  let xMax = CourtCalibration.COURT_WIDTH_DOUBLES - CourtCalibration.ALLEY_WIDTH;
  let yMin = 0.0;
  let yMax = CourtCalibration.COURT_LENGTH;

  if (mode === "doubles") {
    xMin = 0.0;
    xMax = CourtCalibration.COURT_WIDTH_DOUBLES;
  }

  switch (shotType) {
    case "rally":
      yMin = 0.0;
      yMax = CourtCalibration.COURT_LENGTH;
      break;
    case "serve_far_deuce":
      xMin = CourtCalibration.ALLEY_WIDTH;
      xMax = CourtCalibration.CENTER_LINE_X;
      yMin = CourtCalibration.NET_Y;
      yMax = CourtCalibration.SERVICE_LINE_FAR;
      break;
    case "serve_far_ad":
      xMin = CourtCalibration.CENTER_LINE_X;
      xMax = CourtCalibration.COURT_WIDTH_DOUBLES - CourtCalibration.ALLEY_WIDTH;
      yMin = CourtCalibration.NET_Y;
      yMax = CourtCalibration.SERVICE_LINE_FAR;
      break;
    case "serve_near_deuce":
      xMin = CourtCalibration.CENTER_LINE_X;
      xMax = CourtCalibration.COURT_WIDTH_DOUBLES - CourtCalibration.ALLEY_WIDTH;
      yMin = CourtCalibration.SERVICE_LINE_NEAR;
      yMax = CourtCalibration.NET_Y;
      break;
    case "serve_near_ad":
      xMin = CourtCalibration.ALLEY_WIDTH;
      xMax = CourtCalibration.CENTER_LINE_X;
      yMin = CourtCalibration.SERVICE_LINE_NEAR;
      yMax = CourtCalibration.NET_Y;
      break;
  }

  const isInside = X >= xMin && X <= xMax && Y >= yMin && Y <= yMax;

  if (isInside) {
    const dx = Math.min(X - xMin, xMax - X);
    const dy = Math.min(Y - yMin, yMax - Y);
    const distToLine = Math.min(dx, dy);
    return { decision: "IN", distanceCm: distToLine * 100.0 };
  }

  // Calculate distance outside the bounding box
  let dx = 0.0;
  if (X < xMin) dx = xMin - X;
  else if (X > xMax) dx = X - xMax;

  let dy = 0.0;
  if (Y < yMin) dy = yMin - Y;
  else if (Y > yMax) dy = Y - yMax;

  const distToLine = Math.sqrt(dx * dx + dy * dy);

  if (distToLine <= ballRadius) {
    // Ball overlap with line
    return { decision: "IN", distanceCm: distToLine * 100.0 };
  } else {
    const offset = distToLine - ballRadius;
    return { decision: "OUT", distanceCm: offset * 100.0 };
  }
}
