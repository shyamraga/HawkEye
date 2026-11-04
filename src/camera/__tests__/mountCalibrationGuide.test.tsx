import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

jest.mock('react-native', () => ({
  View: 'View',
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
  Dimensions: {
    get: jest.fn(() => ({ width: 400, height: 800 })),
  },
  StyleSheet: {
    create: (styles: any) => styles,
  },
}));

jest.mock('lucide-react-native', () => ({
  Camera: 'Camera',
  Check: 'Check',
  CheckCircle2: 'CheckCircle2',
  AlertTriangle: 'AlertTriangle',
  Sliders: 'Sliders',
  Maximize2: 'Maximize2',
  Info: 'Info',
  ChevronRight: 'ChevronRight',
  ShieldCheck: 'ShieldCheck',
}));

jest.mock('react-native-svg', () => ({
  __esModule: true,
  default: 'Svg',
  Svg: 'Svg',
  Line: 'Line',
  Circle: 'Circle',
  Rect: 'Rect',
  G: 'G',
}));

import { MountCalibrationGuide } from '../components/MountCalibrationGuide';

describe('MountCalibrationGuide Component', () => {
  test('renders mount presets with guidelines and accuracy rating', () => {
    const handleSelect = jest.fn();
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <MountCalibrationGuide
          currentMount="FENCE_MOUNT"
          onSelectMount={handleSelect}
        />
      );
    });

    const root = renderer!.root;
    expect(root).toBeTruthy();

    const texts = root.findAllByType('Text' as any).map(t => t.props.children);
    expect(texts).toContain('SWINGVISION MOUNT CALIBRATION');
    expect(texts).toContain('99.4% Accuracy');
    expect(texts).toContain('Fence (10ft)');
  });

  test('switches mount preset when tab clicked', () => {
    const handleSelect = jest.fn();
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <MountCalibrationGuide
          currentMount="FENCE_MOUNT"
          onSelectMount={handleSelect}
        />
      );
    });

    const buttons = renderer!.root.findAllByType('TouchableOpacity' as any);
    const groundBtn = buttons.find(b => {
      const childTexts = b.findAllByType('Text' as any);
      return childTexts.some(t => t.props.children === 'Ground / Bench');
    });

    expect(groundBtn).toBeTruthy();
    act(() => {
      groundBtn?.props.onPress();
    });

    expect(handleSelect).toHaveBeenCalledWith('GROUND_MODE');
  });
});
