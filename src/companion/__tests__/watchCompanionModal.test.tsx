import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

jest.mock('react-native', () => ({
  View: 'View',
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
  Modal: ({ children, visible }: any) => (visible ? <>{children}</> : null),
  Dimensions: {
    get: jest.fn(() => ({ width: 400, height: 800 })),
  },
  StyleSheet: {
    create: (styles: any) => styles,
  },
}));

jest.mock('lucide-react-native', () => ({
  Watch: 'Watch',
  Heart: 'Heart',
  Flame: 'Flame',
  Footprints: 'Footprints',
  RotateCcw: 'RotateCcw',
  ShieldAlert: 'ShieldAlert',
  Zap: 'Zap',
  Volume2: 'Volume2',
  VolumeX: 'VolumeX',
  X: 'X',
  Plus: 'Plus',
  Activity: 'Activity',
  Check: 'Check',
}));

import { WatchCompanionModal } from '../components/WatchCompanionModal';
import { TennisScoreState } from '../../services/tennisScoringEngine';

describe('WatchCompanionModal Component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  const mockScoreState: TennisScoreState = {
    points: { player1: '30', player2: '40' },
    games: { player1: 3, player2: 2 },
    sets: { player1: 0, player2: 0 },
    server: 1,
    isTiebreak: false,
    setHistory: [],
    matchCompleted: false,
    winner: null,
    challengesRemaining: { player1: 3, player2: 3 },
  };

  test('renders simulated Apple Watch interface with live score and health stats', () => {
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <WatchCompanionModal
          visible={true}
          scoreState={mockScoreState}
          playerOneName="Carlos Alcaraz"
          playerTwoName="Jannik Sinner"
          onScorePoint={jest.fn()}
          onUndoPoint={jest.fn()}
          onTriggerChallenge={jest.fn()}
          onClose={jest.fn()}
        />
      );
    });

    const root = renderer!.root;
    expect(root).toBeTruthy();

    const texts = root.findAllByType('Text' as any).map(t => t.props.children);
    expect(texts).toContain('APPLE WATCH LIVE');
    expect(texts).toContain('30');
    expect(texts).toContain('40');
  });

  test('calls onScorePoint when wrist score buttons tapped', () => {
    const handleScore = jest.fn();
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <WatchCompanionModal
          visible={true}
          scoreState={mockScoreState}
          playerOneName="Carlos Alcaraz"
          playerTwoName="Jannik Sinner"
          onScorePoint={handleScore}
          onUndoPoint={jest.fn()}
          onTriggerChallenge={jest.fn()}
          onClose={jest.fn()}
        />
      );
    });

    const buttons = renderer!.root.findAllByType('TouchableOpacity' as any);
    const p1Btn = buttons.find(b => {
      const texts = b.findAllByType('Text' as any);
      return texts.some(t => {
        const str = Array.isArray(t.props.children) ? t.props.children.join('') : String(t.props.children);
        return str.includes('CARLOS');
      });
    });

    expect(p1Btn).toBeTruthy();
    act(() => {
      p1Btn?.props.onPress();
      jest.runAllTimers();
    });

    expect(handleScore).toHaveBeenCalledWith(1);
  });
});
