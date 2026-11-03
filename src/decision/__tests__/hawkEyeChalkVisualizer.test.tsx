import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

jest.mock('react-native', () => ({
  View: 'View',
  Text: 'Text',
  Modal: 'Modal',
  TouchableOpacity: 'TouchableOpacity',
  Dimensions: {
    get: () => ({ width: 390, height: 844 }),
  },
  StyleSheet: {
    create: (styles: any) => styles,
  },
}));

import { HawkEyeChalkVisualizer } from '../components/HawkEyeChalkVisualizer';
import { HawkEyeChallengeModal } from '../components/HawkEyeChallengeModal';

describe('HawkEyeChalkVisualizer & ChallengeModal', () => {
  test('renders IN decision correctly', () => {
    let component: TestRenderer.ReactTestRenderer;
    act(() => {
      component = TestRenderer.create(
        <HawkEyeChalkVisualizer decision="IN" offsetMm={14} courtSurface="Hard" />
      );
    });

    const root = component!.root;
    const allTexts = root.findAll((node) => node.type === 'Text');
    const textValues = allTexts.map((n) => (Array.isArray(n.props.children) ? n.props.children.join('') : n.props.children));

    expect(textValues).toContain('IN');
    expect(textValues).toContain('+14 mm');
    expect(textValues).toContain('HARD COURT');
  });

  test('renders OUT decision correctly', () => {
    let component: TestRenderer.ReactTestRenderer;
    act(() => {
      component = TestRenderer.create(
        <HawkEyeChalkVisualizer decision="OUT" offsetMm={25} courtSurface="Clay" />
      );
    });

    const root = component!.root;
    const allTexts = root.findAll((node) => node.type === 'Text');
    const textValues = allTexts.map((n) => (Array.isArray(n.props.children) ? n.props.children.join('') : n.props.children));

    expect(textValues).toContain('OUT');
    expect(textValues).toContain('-25 mm');
    expect(textValues).toContain('CLAY COURT');
  });

  test('renders challenge modal with player info', () => {
    let component: TestRenderer.ReactTestRenderer;
    act(() => {
      component = TestRenderer.create(
        <HawkEyeChallengeModal
          visible={true}
          decision="IN"
          offsetMm={8}
          courtSurface="Grass"
          challengingPlayer="Player 1"
          p1Name="Player 1"
          p2Name="Player 2"
          p1Challenges={3}
          p2Challenges={2}
          onDismiss={() => {}}
          onApplyRuling={() => {}}
        />
      );
    });

    const root = component!.root;
    const allTexts = root.findAll((node) => node.type === 'Text');
    const textValues = allTexts.map((n) => (Array.isArray(n.props.children) ? n.props.children.join('') : n.props.children));

    expect(textValues).toContain('HAWK-EYE SYSTEM REVIEW');
    expect(textValues).toContain('RESUME MATCH');
  });
});
