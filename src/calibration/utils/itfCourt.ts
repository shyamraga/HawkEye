export interface Point3D {
  x: number;
  y: number;
  z?: number;
}

export interface CourtReferencePoint {
  id: string;
  name: string;
  coords: Point3D;
}

/**
 * Standard ITF Tennis Court dimensions in meters.
 * Origin (0, 0) is set at the bottom-left corner of the doubles baseline.
 * Width (X axis): 10.97 meters (doubles width)
 * Length (Y axis): 23.77 meters (baseline to baseline)
 */
export const ITF_COURT_DIMENSIONS = {
  widthDoubles: 10.97,
  widthSingles: 8.23,
  singlesSidelineLeft: 1.37,
  singlesSidelineRight: 9.60,
  doublesSidelineLeft: 0.0,
  doublesSidelineRight: 10.97,
  baselineBottom: 0.0,
  serviceLineBottom: 6.40,
  net: 11.885,
  serviceLineTop: 17.37,
  baselineTop: 23.77,
  centerMarkX: 5.485,
};

/**
 * Standard reference points on an ITF tennis court used for calibration.
 */
export const ITF_REFERENCE_POINTS: CourtReferencePoint[] = [
  {
    id: 'bottom_left_doubles',
    name: 'Bottom-Left Doubles Corner',
    coords: { x: 0.0, y: 0.0, z: 0 },
  },
  {
    id: 'bottom_right_doubles',
    name: 'Bottom-Right Doubles Corner',
    coords: { x: 10.97, y: 0.0, z: 0 },
  },
  {
    id: 'bottom_left_singles',
    name: 'Bottom-Left Singles Corner',
    coords: { x: 1.37, y: 0.0, z: 0 },
  },
  {
    id: 'bottom_right_singles',
    name: 'Bottom-Right Singles Corner',
    coords: { x: 9.60, y: 0.0, z: 0 },
  },
  {
    id: 'bottom_center_service_left',
    name: 'Bottom Center Service T (Left)',
    coords: { x: 5.485, y: 6.40, z: 0 },
  },
  {
    id: 'top_left_doubles',
    name: 'Top-Left Doubles Corner',
    coords: { x: 0.0, y: 23.77, z: 0 },
  },
  {
    id: 'top_right_doubles',
    name: 'Top-Right Doubles Corner',
    coords: { x: 10.97, y: 23.77, z: 0 },
  },
  {
    id: 'top_left_singles',
    name: 'Top-Left Singles Corner',
    coords: { x: 1.37, y: 23.77, z: 0 },
  },
  {
    id: 'top_right_singles',
    name: 'Top-Right Singles Corner',
    coords: { x: 9.60, y: 23.77, z: 0 },
  },
  {
    id: 'top_center_service_left',
    name: 'Top Center Service T (Left)',
    coords: { x: 5.485, y: 17.37, z: 0 },
  },
];
