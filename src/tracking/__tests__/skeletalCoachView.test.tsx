import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

jest.mock('react-native', () => ({
  View: 'View',
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
  ScrollView: 'ScrollView',
  Dimensions: {
    get: jest.fn(() => ({ width: 400, height: 800 })),
  },
  StyleSheet: {
    create: (styles: any) => styles,
  },
}));

jest.mock('lucide-react-native', () => ({
  Camera: 'Camera',
  Activity: 'Activity',
  Zap: 'Zap',
  Sparkles: 'Sparkles',
  ShieldCheck: 'ShieldCheck',
  TrendingUp: 'TrendingUp',
  RotateCcw: 'RotateCcw',
  CheckCircle2: 'CheckCircle2',
  AlertCircle: 'AlertCircle',
  Award: 'Award',
}));

jest.mock('react-native-svg', () => ({
  __esModule: true,
  default: 'Svg',
  Svg: 'Svg',
  Line: 'Line',
  Circle: 'Circle',
  Path: 'Path',
  Rect: 'Rect',
  G: 'G',
}));

import { SkeletalCoachView } from '../components/SkeletalCoachView';

describe('SkeletalCoachView Component', () => {
  test('renders tripod skeletal pose canvas and initial biomechanics', () => {
    let renderer: any;
    act(() => {
      renderer = TestRenderer.create(<SkeletalCoachView />);
    });

    expect(renderer).toBeTruthy();
    const texts = renderer.root.findAllByType('Text').map((t: any) => {
      const child = t.props.children;
      return Array.isArray(child) ? child.join('') : String(child);
    });

    expect(texts).toContain('TRIPOD SKELETAL & SWING COACH');
    expect(texts).toContain('LATEST SWING BIOMECHANICS');
  });

  test('switches active stroke when simulation button pressed', () => {
    const handleTrigger = jest.fn();
    let renderer: any;
    act(() => {
      renderer = TestRenderer.create(<SkeletalCoachView onTriggerSimulation={handleTrigger} />);
    });

    const buttons = renderer.root.findAllByType('TouchableOpacity');
    const serveBtn = buttons.find((b: any) => {
      const texts = b.findAllByType('Text');
      return texts.some((t: any) => t.props.children === 'SERVE');
    });

    expect(serveBtn).toBeTruthy();

    act(() => {
      serveBtn.props.onPress();
    });

    expect(handleTrigger).toHaveBeenCalledWith('SERVE');
  });
});
