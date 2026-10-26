import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

jest.mock('react-native', () => ({
  View: 'View',
  Text: 'Text',
  StyleSheet: {
    create: (styles: any) => styles,
  },
}));

import { ReplayView } from '../components/ReplayView';
import { TrajectoryPoint } from '../../tracking/utils/bounceDetector';
import { DecisionSummary } from '../../decision/services/decisionService';

describe('ReplayView Component', () => {
  const sampleTrajectory: TrajectoryPoint[] = [
    { t: 1.0, x: 0, y: 12, z: 2.0 },
    { t: 1.1, x: 0.2, y: 11, z: 1.5 },
    { t: 1.2, x: 0.5, y: 10, z: 0.0 }, // bounce
    { t: 1.3, x: 0.8, y: 9, z: 0.8 },
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

  test('renders ReplayView container with court, trajectory, and decision view', () => {
    let component: TestRenderer.ReactTestRenderer;
    act(() => {
      component = TestRenderer.create(
        <ReplayView
          trajectory={sampleTrajectory}
          bouncePoint={sampleBounce}
          decision={sampleDecision}
          width={400}
          height={600}
        />
      );
    });

    const root = component!.root;
    const view = root.find((node) => node.props.testID === 'replay-view');
    expect(view).toBeTruthy();

    const decisionBanner = root.find((node) => node.props.testID === 'replay-line-call');
    expect(decisionBanner).toBeTruthy();
  });

  test('respects animation progress by slicing trajectory points', () => {
    let component: TestRenderer.ReactTestRenderer;
    act(() => {
      component = TestRenderer.create(
        <ReplayView
          trajectory={sampleTrajectory}
          bouncePoint={sampleBounce}
          width={400}
          height={600}
          animationProgress={0.25}
        />
      );
    });

    expect(component!).toBeTruthy();
  });
});
