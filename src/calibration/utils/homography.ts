import * as math from 'mathjs';
import { Point3D } from './itfCourt';

export interface Point2D {
  x: number;
  y: number;
}

/**
 * Validates whether points are collinear or degenerate to prevent singular matrices.
 */
function validatePoints(srcPoints: Point2D[], dstPoints: Point3D[]): void {
  if (srcPoints.length < 4 || dstPoints.length < 4) {
    throw new Error('At least 4 point correspondences are required for homography calculation.');
  }
  if (srcPoints.length !== dstPoints.length) {
    throw new Error('Source points and destination points must have the same length.');
  }

  // Check for collinearity of source points (simplified cross-product check for first 3 points)
  const p0 = srcPoints[0];
  const p1 = srcPoints[1];
  const p2 = srcPoints[2];
  const crossProduct = (p1.x - p0.x) * (p2.y - p0.y) - (p1.y - p0.y) * (p2.x - p0.x);
  if (Math.abs(crossProduct) < 1e-5) {
    let allCollinear = true;
    for (let i = 3; i < srcPoints.length; i++) {
      const pi = srcPoints[i];
      const cp = (p1.x - p0.x) * (pi.y - p0.y) - (p1.y - p0.y) * (pi.x - p0.x);
      if (Math.abs(cp) > 1e-5) {
        allCollinear = false;
        break;
      }
    }
    if (allCollinear) {
      throw new Error('Calibration points are collinear; homography cannot be computed from a straight line.');
    }
  }
}

/**
 * Computes 3x3 homography matrix using Direct Linear Transformation (DLT) and ATA eigen decomposition via mathjs.
 * Maps 2D pixel coordinates (srcPoints) to 3D real-world court coordinates (dstPoints).
 */
export function computeHomography(srcPoints: Point2D[], dstPoints: Point3D[]): number[][] {
  validatePoints(srcPoints, dstPoints);

  const A: number[][] = [];
  for (let i = 0; i < srcPoints.length; i++) {
    const x = srcPoints[i].x;
    const y = srcPoints[i].y;
    const X = dstPoints[i].x;
    const Y = dstPoints[i].y;

    A.push([-x, -y, -1, 0, 0, 0, X * x, X * y, X]);
    A.push([0, 0, 0, -x, -y, -1, Y * x, Y * y, Y]);
  }

  try {
    // Form AtA (9x9 matrix)
    const At = math.transpose(A);
    const AtA = math.multiply(At, A);

    // Find eigenvalues and eigenvectors of AtA
    const eigsResult = math.eigs(AtA) as any;
    const values: number[] = eigsResult.values;
    const eigenvectors: Array<{ value: number; vector: any }> = eigsResult.eigenvectors;

    if (!values || values.length === 0 || !eigenvectors || eigenvectors.length === 0) {
      throw new Error('Eigen decomposition failed to return eigenvalues/vectors.');
    }

    // Find index of minimum eigenvalue
    let minIdx = 0;
    let minVal = values[0];
    for (let i = 1; i < values.length; i++) {
      if (values[i] < minVal) {
        minVal = values[i];
        minIdx = i;
      }
    }

    const bestVector = eigenvectors[minIdx].vector;
    const hFlat = (typeof bestVector.valueOf === 'function' ? bestVector.valueOf() : bestVector) as number[];

    if (hFlat.length !== 9) {
      throw new Error('Invalid homography vector length extracted from eigenvector.');
    }

    const H = [
      [hFlat[0], hFlat[1], hFlat[2]],
      [hFlat[3], hFlat[4], hFlat[5]],
      [hFlat[6], hFlat[7], hFlat[8]],
    ];

    return H;
  } catch (error: any) {
    throw new Error(`Failed to compute homography via DLT: ${error.message}`);
  }
}

/**
 * Projects a 2D pixel point to a 3D real-world meter point using homography matrix H.
 */
export function projectPoint(H: number[][], pt: Point2D): Point3D {
  const h = math.matrix(H);
  const p = math.matrix([[pt.x], [pt.y], [1]]);
  const result = math.multiply(h, p) as any;
  const resArray = result.valueOf() as number[][];

  const w = resArray[2][0];
  if (Math.abs(w) < 1e-8) {
    throw new Error('Homography projection resulted in division by near-zero (point at infinity).');
  }

  return {
    x: resArray[0][0] / w,
    y: resArray[1][0] / w,
    z: 0,
  };
}

/**
 * Inverse projects a 3D real-world meter point to 2D pixel coordinates using H^-1.
 */
export function inverseProjectPoint(H: number[][], pt3d: Point3D): Point2D {
  try {
    const hMat = math.matrix(H);
    const hInv = math.inv(hMat) as any;
    const p = math.matrix([[pt3d.x], [pt3d.y], [1]]);
    const result = math.multiply(hInv, p) as any;
    const resArray = result.valueOf() as number[][];

    const w = resArray[2][0];
    if (Math.abs(w) < 1e-8) {
      throw new Error('Inverse homography projection resulted in division by near-zero.');
    }

    return {
      x: resArray[0][0] / w,
      y: resArray[1][0] / w,
    };
  } catch (error: any) {
    throw new Error(`Failed to inverse project point: ${error.message}`);
  }
}

/**
 * Calculates mean reprojection error in meters between predicted and actual coordinates.
 */
export function calculateReprojectionError(
  H: number[][],
  srcPoints: Point2D[],
  actualDst: Point3D[]
): number {
  if (srcPoints.length === 0) return 0;
  let totalError = 0;
  for (let i = 0; i < srcPoints.length; i++) {
    const projected = projectPoint(H, srcPoints[i]);
    const dx = projected.x - actualDst[i].x;
    const dy = projected.y - actualDst[i].y;
    totalError += Math.sqrt(dx * dx + dy * dy);
  }
  return totalError / srcPoints.length;
}
