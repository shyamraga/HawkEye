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
  Play: 'Play',
  Pause: 'Pause',
  SkipForward: 'SkipForward',
  SkipBack: 'SkipBack',
  Scissors: 'Scissors',
  Sparkles: 'Sparkles',
  Flame: 'Flame',
  Zap: 'Zap',
  Filter: 'Filter',
  CheckCircle2: 'CheckCircle2',
  Trophy: 'Trophy',
  ChevronRight: 'ChevronRight',
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
  G: 'G',
}));

import { MatchHighlightsPlayer } from '../components/MatchHighlightsPlayer';

describe('MatchHighlightsPlayer Component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  test('renders highlights player with Auto-Trim controls and curated clips', () => {
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(<MatchHighlightsPlayer />);
    });

    const root = renderer!.root;
    expect(root).toBeTruthy();

    const texts = root.findAllByType('Text' as any).map(t => t.props.children);
    expect(texts).toContain('SWINGVISION AUTO-TRIM');
    expect(texts).toContain('Top Rallies');
    expect(texts).toContain('Aces & Winners');
    expect(texts).toContain('Break Points');
  });

  test('toggles auto-trim on and off', () => {
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(<MatchHighlightsPlayer />);
    });

    const buttons = renderer!.root.findAllByType('TouchableOpacity' as any);
    const autoTrimBtn = buttons.find(b => {
      const texts = b.findAllByType('Text' as any);
      return texts.some(t => typeof t.props.children === 'string' && t.props.children.includes('DEAD-TIME CUT'));
    });

    expect(autoTrimBtn).toBeTruthy();
    act(() => {
      autoTrimBtn?.props.onPress();
    });

    const updatedText = renderer!.root.findAllByType('Text' as any).find(t =>
      typeof t.props.children === 'string' && t.props.children.includes('DEAD-TIME CUT: OFF')
    );
    expect(updatedText).toBeTruthy();
  });
});
