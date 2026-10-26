import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

jest.mock('react-native', () => ({
  View: 'View',
  Text: 'Text',
  FlatList: 'FlatList',
  TouchableOpacity: 'TouchableOpacity',
  StyleSheet: {
    create: (styles: any) => styles,
  },
}));

import { MatchHistoryScreen } from '../src/history/screens/MatchHistoryScreen';

describe('MatchHistoryScreen Component', () => {
  test('renders match history title correctly', async () => {
    let component: TestRenderer.ReactTestRenderer;
    await act(async () => {
      component = TestRenderer.create(<MatchHistoryScreen onSelectMatch={() => {}} />);
    });

    const textNodes = component!.root.findAllByType('Text');
    const titleNode = textNodes.find((node) => node.props.children === 'Match History' || node.props.children === 'Loading match history...');
    expect(titleNode).toBeTruthy();
  });
});
