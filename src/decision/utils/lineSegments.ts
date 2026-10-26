import { ITF_COURT_DIMENSIONS, Point3D } from '../../calibration/utils/itfCourt';

export interface LineSegment {
  id: string;
  name: string;
  p1: Point3D;
  p2: Point3D;
  type: 'baseline' | 'sideline' | 'service_line' | 'center_line';
}

/**
 * Standard ITF court line segments defined in 3D court coordinates (meters).
 */
export const ITF_LINE_SEGMENTS: LineSegment[] = [
  // Baselines
  {
    id: 'doubles_baseline_bottom',
    name: 'Bottom Doubles Baseline',
    p1: { x: 0, y: 0, z: 0 },
    p2: { x: ITF_COURT_DIMENSIONS.widthDoubles, y: 0, z: 0 },
    type: 'baseline',
  },
  {
    id: 'doubles_baseline_top',
    name: 'Top Doubles Baseline',
    p1: { x: 0, y: ITF_COURT_DIMENSIONS.baselineTop, z: 0 },
    p2: { x: ITF_COURT_DIMENSIONS.widthDoubles, y: ITF_COURT_DIMENSIONS.baselineTop, z: 0 },
    type: 'baseline',
  },
  {
    id: 'singles_baseline_bottom',
    name: 'Bottom Singles Baseline',
    p1: { x: ITF_COURT_DIMENSIONS.singlesSidelineLeft, y: 0, z: 0 },
    p2: { x: ITF_COURT_DIMENSIONS.singlesSidelineRight, y: 0, z: 0 },
    type: 'baseline',
  },
  {
    id: 'singles_baseline_top',
    name: 'Top Singles Baseline',
    p1: { x: ITF_COURT_DIMENSIONS.singlesSidelineLeft, y: ITF_COURT_DIMENSIONS.baselineTop, z: 0 },
    p2: { x: ITF_COURT_DIMENSIONS.singlesSidelineRight, y: ITF_COURT_DIMENSIONS.baselineTop, z: 0 },
    type: 'baseline',
  },
  // Sidelines
  {
    id: 'doubles_sideline_left',
    name: 'Left Doubles Sideline',
    p1: { x: ITF_COURT_DIMENSIONS.doublesSidelineLeft, y: 0, z: 0 },
    p2: { x: ITF_COURT_DIMENSIONS.doublesSidelineLeft, y: ITF_COURT_DIMENSIONS.baselineTop, z: 0 },
    type: 'sideline',
  },
  {
    id: 'doubles_sideline_right',
    name: 'Right Doubles Sideline',
    p1: { x: ITF_COURT_DIMENSIONS.doublesSidelineRight, y: 0, z: 0 },
    p2: { x: ITF_COURT_DIMENSIONS.doublesSidelineRight, y: ITF_COURT_DIMENSIONS.baselineTop, z: 0 },
    type: 'sideline',
  },
  {
    id: 'singles_sideline_left',
    name: 'Left Singles Sideline',
    p1: { x: ITF_COURT_DIMENSIONS.singlesSidelineLeft, y: 0, z: 0 },
    p2: { x: ITF_COURT_DIMENSIONS.singlesSidelineLeft, y: ITF_COURT_DIMENSIONS.baselineTop, z: 0 },
    type: 'sideline',
  },
  {
    id: 'singles_sideline_right',
    name: 'Right Singles Sideline',
    p1: { x: ITF_COURT_DIMENSIONS.singlesSidelineRight, y: 0, z: 0 },
    p2: { x: ITF_COURT_DIMENSIONS.singlesSidelineRight, y: ITF_COURT_DIMENSIONS.baselineTop, z: 0 },
    type: 'sideline',
  },
  // Service Lines
  {
    id: 'service_line_bottom',
    name: 'Bottom Service Line',
    p1: { x: ITF_COURT_DIMENSIONS.singlesSidelineLeft, y: ITF_COURT_DIMENSIONS.serviceLineBottom, z: 0 },
    p2: { x: ITF_COURT_DIMENSIONS.singlesSidelineRight, y: ITF_COURT_DIMENSIONS.serviceLineBottom, z: 0 },
    type: 'service_line',
  },
  {
    id: 'service_line_top',
    name: 'Top Service Line',
    p1: { x: ITF_COURT_DIMENSIONS.singlesSidelineLeft, y: ITF_COURT_DIMENSIONS.serviceLineTop, z: 0 },
    p2: { x: ITF_COURT_DIMENSIONS.singlesSidelineRight, y: ITF_COURT_DIMENSIONS.serviceLineTop, z: 0 },
    type: 'service_line',
  },
  // Center Service Line
  {
    id: 'center_service_line',
    name: 'Center Service Line',
    p1: { x: ITF_COURT_DIMENSIONS.centerMarkX, y: ITF_COURT_DIMENSIONS.serviceLineBottom, z: 0 },
    p2: { x: ITF_COURT_DIMENSIONS.centerMarkX, y: ITF_COURT_DIMENSIONS.serviceLineTop, z: 0 },
    type: 'center_line',
  },
];
