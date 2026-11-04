import {
  SESSION_MODES,
  MOUNT_PRESETS,
  TrainingSessionType,
  CameraMountType,
} from '../sessionModes';

describe('SwingVision Session Modes & Camera Mount Presets', () => {
  test('defines all 4 SwingVision training session modes with valid metadata', () => {
    const modes: TrainingSessionType[] = [
      'MATCH_PLAY',
      'FREE_RALLY',
      'SERVE_PRACTICE',
      'BALL_MACHINE',
    ];

    modes.forEach(modeKey => {
      const mode = SESSION_MODES[modeKey];
      expect(mode).toBeDefined();
      expect(mode.type).toBe(modeKey);
      expect(mode.title.length).toBeGreaterThan(0);
      expect(mode.subtitle.length).toBeGreaterThan(0);
      expect(mode.badge.length).toBeGreaterThan(0);
      expect(mode.targetMetric.length).toBeGreaterThan(0);
      expect(MOUNT_PRESETS[mode.suggestedMount]).toBeDefined();
    });
  });

  test('defines 3 camera mount presets with valid height, angle, and guidelines', () => {
    const presets: CameraMountType[] = ['FENCE_MOUNT', 'GROUND_MODE', 'TRIPOD'];

    presets.forEach(presetKey => {
      const preset = MOUNT_PRESETS[presetKey];
      expect(preset).toBeDefined();
      expect(preset.type).toBe(presetKey);
      expect(preset.name.length).toBeGreaterThan(0);
      expect(preset.recommendedHeight.length).toBeGreaterThan(0);
      expect(preset.recommendedAngle.length).toBeGreaterThan(0);
      expect(preset.accuracyRating).toContain('%');
      expect(preset.guidelines.length).toBeGreaterThanOrEqual(2);
    });
  });
});
