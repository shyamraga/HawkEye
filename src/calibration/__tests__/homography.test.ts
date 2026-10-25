import {
  computeHomography,
  projectPoint,
  inverseProjectPoint,
  calculateReprojectionError,
  Point2D,
} from '../utils/homography';
import { Point3D } from '../utils/itfCourt';

describe('Homography DLT Engine & Coordinate Transforms', () => {
  const squareSrc: Point2D[] = [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 100 },
    { x: 0, y: 100 },
  ];

  const squareDst: Point3D[] = [
    { x: 0, y: 0, z: 0 },
    { x: 10, y: 0, z: 0 },
    { x: 10, y: 10, z: 0 },
    { x: 0, y: 10, z: 0 },
  ];

  test('computes homography matrix and projects points accurately', () => {
    const H = computeHomography(squareSrc, squareDst);
    expect(H).toBeDefined();
    expect(H.length).toBe(3);
    expect(H[0].length).toBe(3);

    // Test projection of corner
    const projected = projectPoint(H, { x: 50, y: 50 });
    expect(projected.x).toBeCloseTo(5, 1);
    expect(projected.y).toBeCloseTo(5, 1);
  });

  test('performs inverse projection correctly (roundtrip)', () => {
    const H = computeHomography(squareSrc, squareDst);
    const target3D: Point3D = { x: 7, y: 3, z: 0 };
    const pixel = inverseProjectPoint(H, target3D);
    expect(pixel.x).toBeCloseTo(70, 1);
    expect(pixel.y).toBeCloseTo(30, 1);

    const backTo3D = projectPoint(H, pixel);
    expect(backTo3D.x).toBeCloseTo(target3D.x, 2);
    expect(backTo3D.y).toBeCloseTo(target3D.y, 2);
  });

  test('calculates zero reprojection error for exact matches', () => {
    const H = computeHomography(squareSrc, squareDst);
    const error = calculateReprojectionError(H, squareSrc, squareDst);
    expect(error).toBeLessThan(1e-4);
  });

  test('throws error for insufficient or collinear points', () => {
    const fewPointsSrc: Point2D[] = [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 2 },
    ];
    const fewPointsDst: Point3D[] = [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 2 },
    ];
    expect(() => computeHomography(fewPointsSrc, fewPointsDst)).toThrow();

    const collinearSrc: Point2D[] = [
      { x: 0, y: 0 },
      { x: 10, y: 10 },
      { x: 20, y: 20 },
      { x: 30, y: 30 },
    ];
    const collinearDst: Point3D[] = [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 2 },
      { x: 3, y: 3 },
    ];
    expect(() => computeHomography(collinearSrc, collinearDst)).toThrow();
  });
});
