import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

jest.mock('react-native', () => ({
  View: 'View',
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
  ScrollView: 'ScrollView',
  Modal: ({ children, visible }: any) => (visible ? <>{children}</> : null),
  Dimensions: {
    get: jest.fn(() => ({ width: 400, height: 800 })),
  },
  StyleSheet: {
    create: (styles: any) => styles,
  },
}));

jest.mock('lucide-react-native', () => ({
  Share2: 'Share2',
  Video: 'Video',
  Download: 'Download',
  Smartphone: 'Smartphone',
  Tv: 'Tv',
  Check: 'Check',
  Sliders: 'Sliders',
  Sparkles: 'Sparkles',
  Zap: 'Zap',
  Eye: 'Eye',
  X: 'X',
  Layers: 'Layers',
}));

jest.mock('react-native-svg', () => ({
  __esModule: true,
  default: 'Svg',
  Svg: 'Svg',
  Rect: 'Rect',
  Line: 'Line',
  Circle: 'Circle',
  Polyline: 'Polyline',
}));

import { BroadcastExportModal } from '../components/BroadcastExportModal';

describe('BroadcastExportModal Component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  test('renders export studio modal with format selection', () => {
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <BroadcastExportModal
          visible={true}
          playerOneName="Carlos Alcaraz"
          playerTwoName="Jannik Sinner"
          matchScore="6-4, 5-3"
          onClose={jest.fn()}
        />
      );
    });

    const root = renderer!.root;
    expect(root).toBeTruthy();

    const texts = root.findAllByType('Text' as any).map(t => t.props.children);
    expect(texts).toContain('SWINGVISION BROADCAST EXPORT');
    expect(texts).toContain('9:16 Vertical');
    expect(texts).toContain('16:9 Widescreen');
    expect(texts).toContain('RENDER & EXPORT BROADCAST VIDEO');
  });

  test('initiates export rendering progress when button clicked', () => {
    const handleExportComplete = jest.fn();
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <BroadcastExportModal
          visible={true}
          playerOneName="Carlos Alcaraz"
          playerTwoName="Jannik Sinner"
          matchScore="6-4, 5-3"
          onClose={jest.fn()}
          onExportComplete={handleExportComplete}
        />
      );
    });

    const buttons = renderer!.root.findAllByType('TouchableOpacity' as any);
    const exportBtn = buttons.find(b => {
      const texts = b.findAllByType('Text' as any);
      return texts.some(t => t.props.children === 'RENDER & EXPORT BROADCAST VIDEO');
    });

    expect(exportBtn).toBeTruthy();
    act(() => {
      exportBtn?.props.onPress();
    });
    act(() => {
      jest.runAllTimers();
    });

    expect(handleExportComplete).toHaveBeenCalled();
  });
});
