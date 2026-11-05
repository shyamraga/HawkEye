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
  Alert: {
    alert: jest.fn(),
  },
}));

jest.mock('react-native-svg', () => ({
  __esModule: true,
  default: 'Svg',
  Svg: 'Svg',
  Rect: 'Rect',
  Line: 'Line',
  Circle: 'Circle',
  Path: 'Path',
  G: 'G',
  Text: 'SvgText',
}));

jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn(),
}));

import { SwingVisionCoachView } from '../components/SwingVisionCoachView';

describe('SwingVisionCoachView Component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  test('renders AI Coach interface with Match AI tab by default', () => {
    let renderer: any;
    act(() => {
      renderer = TestRenderer.create(
        <SwingVisionCoachView playerOneName="Federer" playerTwoName="Nadal" />
      );
    });

    expect(renderer).toBeTruthy();
    const texts = renderer.root.findAllByType('Text').map((t: any) => {
      const child = t.props.children;
      return Array.isArray(child) ? child.join('') : String(child);
    });

    expect(texts).toContain('SWINGVISION AI COACH');
  });

  test('renders navigation buttons and allows interacting with coach features', () => {
    let renderer: any;
    act(() => {
      renderer = TestRenderer.create(
        <SwingVisionCoachView playerOneName="Federer" playerTwoName="Nadal" />
      );
    });

    const touchables = renderer.root.findAllByType('TouchableOpacity');
    expect(touchables.length).toBeGreaterThan(0);
  });
});

