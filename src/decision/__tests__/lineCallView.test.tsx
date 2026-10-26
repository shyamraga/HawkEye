import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

jest.mock('react-native', () => ({
  View: 'View',
  Text: 'Text',
  StyleSheet: {
    create: (styles: any) => styles,
  },
}));

import { LineCallView } from '../components/LineCallView';
import { DecisionSummary } from '../services/decisionService';

describe('LineCallView Component & Decision Service', () => {
  const mockInDecision: DecisionSummary = {
    verdict: 'IN',
    isTouch: true,
    distanceFromLineCm: 2.5,
    nearestLineId: 'singles_sideline_left',
    nearestLineName: 'Left Singles Sideline',
    confidence: 0.95,
    frameIndex: 120,
    bouncePoint: { t: 4.0, x: 1.35, y: 10.0, z: 0 },
  };

  const mockOutDecision: DecisionSummary = {
    verdict: 'OUT',
    isTouch: false,
    distanceFromLineCm: -5.2,
    nearestLineId: 'singles_sideline_left',
    nearestLineName: 'Left Singles Sideline',
    confidence: 0.90,
    frameIndex: 125,
    bouncePoint: { t: 4.1, x: 1.30, y: 10.0, z: 0 },
  };

  test('renders waiting message when decision is null', () => {
    let component: TestRenderer.ReactTestRenderer;
    act(() => {
      component = TestRenderer.create(<LineCallView decision={null} />);
    });

    const waitingText = component!.root.find(
      (node) => node.type === 'Text' && typeof node.props.children === 'string' && node.props.children.includes('Waiting for bounce decision')
    );
    expect(waitingText).toBeTruthy();
  });

  test('renders IN verdict, touch indicator, and distance correctly', () => {
    let component: TestRenderer.ReactTestRenderer;
    act(() => {
      component = TestRenderer.create(<LineCallView decision={mockInDecision} />);
    });

    const verdictText = component!.root.find(
      (node) => node.props.testID === 'verdict-text'
    );
    expect(verdictText.props.children).toBe('IN');

    const touchText = component!.root.find(
      (node) => node.props.testID === 'touch-text'
    );
    expect(touchText).toBeTruthy();

    const lineName = component!.root.find(
      (node) => node.props.testID === 'line-name-text'
    );
    expect(lineName.props.children.join('')).toContain('Left Singles Sideline');
  });

  test('renders OUT verdict and negative distance correctly', () => {
    let component: TestRenderer.ReactTestRenderer;
    act(() => {
      component = TestRenderer.create(<LineCallView decision={mockOutDecision} />);
    });

    const verdictText = component!.root.find(
      (node) => node.props.testID === 'verdict-text'
    );
    expect(verdictText.props.children).toBe('OUT');

    const distanceText = component!.root.find(
      (node) => node.props.testID === 'distance-text'
    );
    expect(distanceText.props.children.join('')).toContain('outside');
  });
});
