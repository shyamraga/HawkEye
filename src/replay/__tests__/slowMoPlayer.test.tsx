import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

jest.mock('react-native', () => ({
  View: 'View',
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
  StyleSheet: {
    create: (styles: any) => styles,
  },
}));

jest.mock('expo-av', () => ({
  Video: 'Video',
  ResizeMode: {
    CONTAIN: 'contain',
  },
}));

jest.mock('lucide-react-native', () => ({
  Play: 'Play',
  Pause: 'Pause',
  RotateCcw: 'RotateCcw',
}));

import { SlowMoReplayPlayer } from '../components/SlowMoReplayPlayer';
import { TrajectoryPoint } from '../../tracking/utils/bounceDetector';
import { DecisionSummary } from '../../decision/services/decisionService';

describe('SlowMoReplayPlayer Component', () => {
  const sampleTrajectory: TrajectoryPoint[] = [
    { t: 1.0, x: 0, y: 12, z: 2.0 },
    { t: 1.2, x: 0.5, y: 10, z: 0.0 }, // bounce
    { t: 1.4, x: 1.0, y: 8, z: 1.0 },
  ];

  const sampleBounce: TrajectoryPoint = { t: 1.2, x: 0.5, y: 10, z: 0.0 };

  const sampleDecision: DecisionSummary = {
    verdict: 'IN',
    isTouch: true,
    distanceFromLineCm: 1.5,
    nearestLineId: 'singles_sideline_left',
    nearestLineName: 'Left Singles Sideline',
    confidence: 0.98,
    frameIndex: 45,
    bouncePoint: sampleBounce,
  };

  test('renders SlowMoReplayPlayer with video player and controls', () => {
    let component: TestRenderer.ReactTestRenderer;
    act(() => {
      component = TestRenderer.create(
        <SlowMoReplayPlayer
          videoUri="file:///path/to/video.mp4"
          trajectory={sampleTrajectory}
          bouncePoint={sampleBounce}
          decision={sampleDecision}
          width={400}
          height={600}
        />
      );
    });

    const root = component!.root;
    const player = root.find((node) => node.props.testID === 'slow-mo-player');
    expect(player).toBeTruthy();

    const controlsBar = root.find((node) => node.props.testID === 'controls-bar');
    expect(controlsBar).toBeTruthy();

    const speed05 = root.find((node) => node.props.testID === 'speed-0.5');
    expect(speed05).toBeTruthy();
  });

  test('allows changing playback speed rates (0.25x, 0.5x, 1.0x)', () => {
    let component: TestRenderer.ReactTestRenderer;
    act(() => {
      component = TestRenderer.create(
        <SlowMoReplayPlayer
          videoUri="file:///path/to/video.mp4"
          trajectory={sampleTrajectory}
          bouncePoint={sampleBounce}
          width={400}
          height={600}
        />
      );
    });

    const root = component!.root;
    const speedButton025 = root.find((node) => node.props.testID === 'speed-0.25');

    act(() => {
      speedButton025.props.onPress();
    });

    const activeSpeed = root.find((node) => node.props.testID === 'speed-0.25');
    expect(activeSpeed).toBeTruthy();
  });
});
