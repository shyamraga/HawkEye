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
  Filter: 'Filter',
  Flame: 'Flame',
  Target: 'Target',
  Sparkles: 'Sparkles',
  TrendingUp: 'TrendingUp',
  Activity: 'Activity',
  CheckCircle2: 'CheckCircle2',
  XCircle: 'XCircle',
}));

jest.mock('react-native-svg', () => ({
  __esModule: true,
  default: 'Svg',
  Svg: 'Svg',
  Rect: 'Rect',
  Line: 'Line',
  Circle: 'Circle',
  G: 'G',
  Defs: 'Defs',
  RadialGradient: 'RadialGradient',
  Stop: 'Stop',
}));

import { CourtHeatmapView } from '../components/CourtHeatmapView';
import { ClassifiedShot } from '../../services/shotClassificationEngine';

describe('CourtHeatmapView Component', () => {
  const mockShots: ClassifiedShot[] = [
    {
      id: 'shot_1',
      timestamp: Date.now(),
      stroke: 'FOREHAND',
      spin: 'topspin',
      spinRpm: 2400,
      speedKmh: 142,
      speedMph: 88,
      apexMeters: 1.6,
      depth: 'DEEP',
      direction: 'CROSSCOURT',
      outcome: 'WINNER',
      hitter: 'PLAYER_ONE',
      startPoint: { x: 5.5, y: 1.2, z: 1.0 },
      bouncePoint: { x: 6.5, y: 21.0, z: 0 },
      rallyIndex: 1,
    },
    {
      id: 'shot_2',
      timestamp: Date.now(),
      stroke: 'SERVE',
      spin: 'flat',
      spinRpm: 900,
      speedKmh: 198,
      speedMph: 123,
      apexMeters: 2.4,
      depth: 'SHORT',
      direction: 'DOWN_THE_LINE',
      outcome: 'ACE',
      hitter: 'PLAYER_ONE',
      startPoint: { x: 4.1, y: 0.5, z: 2.8 },
      bouncePoint: { x: 5.5, y: 16.0, z: 0 },
      rallyIndex: 1,
    },
  ];

  test('renders court heatmap with stroke filters and depth stats', () => {
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <CourtHeatmapView shots={mockShots} courtSurface="Hard" />
      );
    });

    const root = renderer!.root;
    expect(root).toBeTruthy();

    // Check that stroke filter buttons exist
    const texts = root.findAllByType('Text' as any);
    const textContents = texts.map(t => t.props.children);
    expect(textContents).toContain('FOREHAND');
    expect(textContents).toContain('SERVE');
    expect(textContents).toContain('BALL DEPTH DISTRIBUTION');
  });

  test('allows selecting a sector chip to filter shots', () => {
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <CourtHeatmapView shots={mockShots} courtSurface="Hard" />
      );
    });

    const buttons = renderer!.root.findAllByType('TouchableOpacity' as any);
    // Find Deuce Box chip
    const deuceChip = buttons.find(b => {
      const childTexts = b.findAllByType('Text' as any);
      return childTexts.some(t => t.props.children === 'Deuce Box');
    });

    expect(deuceChip).toBeTruthy();
    act(() => {
      deuceChip?.props.onPress();
    });

    // Reset button should now appear
    const resetText = renderer!.root.findAllByType('Text' as any).find(t => t.props.children === 'Reset');
    expect(resetText).toBeTruthy();
  });
});
