export type TrainingSessionType =
  | 'MATCH_PLAY'
  | 'FREE_RALLY'
  | 'SERVE_PRACTICE'
  | 'BALL_MACHINE';

export type CameraMountType =
  | 'FENCE_MOUNT'
  | 'GROUND_MODE'
  | 'TRIPOD';

export interface SessionModeConfig {
  type: TrainingSessionType;
  title: string;
  subtitle: string;
  iconName: string;
  badge: string;
  targetMetric: string;
  suggestedMount: CameraMountType;
}

export interface MountPresetConfig {
  type: CameraMountType;
  name: string;
  recommendedHeight: string;
  recommendedAngle: string;
  accuracyRating: string;
  description: string;
  guidelines: string[];
}

export const SESSION_MODES: Record<TrainingSessionType, SessionModeConfig> = {
  MATCH_PLAY: {
    type: 'MATCH_PLAY',
    title: 'Match Play',
    subtitle: 'Point-by-point scoring, line calls & pro match stats',
    iconName: 'Trophy',
    badge: 'OFFICIAL MATCH',
    targetMetric: 'Match Score & Hawk-Eye Challenges',
    suggestedMount: 'FENCE_MOUNT',
  },
  FREE_RALLY: {
    type: 'FREE_RALLY',
    title: 'Free Rally Practice',
    subtitle: 'Continuous rally streak counter, shot depth & speed radar',
    iconName: 'Activity',
    badge: 'RALLY STREAK',
    targetMetric: 'Rally Count & Depth Consistency',
    suggestedMount: 'FENCE_MOUNT',
  },
  SERVE_PRACTICE: {
    type: 'SERVE_PRACTICE',
    title: 'Serve Practice Radar',
    subtitle: 'Dedicated speed gun, target box accuracy & audio voice callouts',
    iconName: 'Zap',
    badge: 'SPEED GUN',
    targetMetric: 'Serve Velocity & Target Box %',
    suggestedMount: 'TRIPOD',
  },
  BALL_MACHINE: {
    type: 'BALL_MACHINE',
    title: 'Ball Machine Drill',
    subtitle: 'Repetitive stroke training, rhythm tempo & landing accuracy',
    iconName: 'Repeat',
    badge: 'DRILL REPS',
    targetMetric: 'Cadence (Shots/Min) & Accuracy %',
    suggestedMount: 'GROUND_MODE',
  },
};

export const MOUNT_PRESETS: Record<CameraMountType, MountPresetConfig> = {
  FENCE_MOUNT: {
    type: 'FENCE_MOUNT',
    name: 'Fence Mount (Recommended)',
    recommendedHeight: '2.8m - 3.5m (10 - 12 ft)',
    recommendedAngle: '-15° downward tilt',
    accuracyRating: '99.4% Accuracy',
    description: 'Mounted high on fence behind baseline looking down court.',
    guidelines: [
      'Center camera with court center service line',
      'Ensure net tape is visible in top third of frame',
      'Keep baseline in lower third of viewfinder',
    ],
  },
  GROUND_MODE: {
    type: 'GROUND_MODE',
    name: 'Ground Mode / Water Bottle Lean',
    recommendedHeight: '0.0m - 0.4m (Court level)',
    recommendedAngle: '+18° to +24° upward tilt',
    accuracyRating: '96.2% Accuracy',
    description: 'Resting on court surface, bench, or propped against a water bottle.',
    guidelines: [
      'Place phone 1-2 meters behind baseline center',
      'Tilt phone upward until net cord and opposite baseline are in view',
      'Use rubber case to prevent sliding during hard hits',
    ],
  },
  TRIPOD: {
    type: 'TRIPOD',
    name: 'Tripod / Swing Stick',
    recommendedHeight: '1.5m - 1.8m (Eye level)',
    recommendedAngle: '-5° to -10° downward tilt',
    accuracyRating: '98.1% Accuracy',
    description: 'Standard tripod behind baseline or 45° corner angle.',
    guidelines: [
      'Position tripod at least 2 meters behind baseline',
      'Ensure camera is level horizontally',
      'Tighten ball head firmly to prevent vibration',
    ],
  },
};
