import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

// Mock react-native components for pure test-renderer execution
jest.mock('react-native', () => ({
  View: 'View',
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
  StyleSheet: {
    create: (styles: any) => styles,
  },
  Dimensions: {
    get: () => ({ width: 400, height: 400 }),
  },
}));

import { CalibrationView } from '../components/CalibrationView';

describe('CalibrationView UI & Touch Workflow (CAL-01)', () => {
  test('renders calibration view and step instructions', () => {
    let component: TestRenderer.ReactTestRenderer;
    act(() => {
      component = TestRenderer.create(<CalibrationView width={300} height={300} />);
    });

    const stepTitle = component!.root.find(
      (node) => node.props.testID === 'calibration-step-title'
    );
    expect(stepTitle.props.children.join('')).toContain('Bottom-Left Doubles Corner');

    const touchArea = component!.root.find(
      (node) => node.props.testID === 'video-touch-area'
    );
    expect(touchArea).toBeTruthy();
  });

  test('progresses steps and computes homography after 4 taps', () => {
    const onComplete = jest.fn();
    let component: TestRenderer.ReactTestRenderer;
    act(() => {
      component = TestRenderer.create(
        <CalibrationView width={400} height={400} onCalibrationComplete={onComplete} />
      );
    });

    const touchArea = component!.root.find(
      (node) => node.props.testID === 'video-touch-area'
    );

    // Tap 4 points with spatial spread to avoid collinearity
    act(() => {
      touchArea.props.onPress({ nativeEvent: { locationX: 50, locationY: 50 } });
    });
    act(() => {
      touchArea.props.onPress({ nativeEvent: { locationX: 350, locationY: 50 } });
    });
    act(() => {
      touchArea.props.onPress({ nativeEvent: { locationX: 350, locationY: 350 } });
    });
    act(() => {
      touchArea.props.onPress({ nativeEvent: { locationX: 50, locationY: 350 } });
    });

    // After 4 taps, calibration status should show reprojection error
    const statusBox = component!.root.find(
      (node) => node.props.testID === 'calibration-status'
    );
    expect(statusBox).toBeTruthy();

    // Confirm button should be enabled and clickable
    const confirmButton = component!.root.find(
      (node) => node.props.testID === 'confirm-button'
    );
    act(() => {
      confirmButton.props.onPress();
    });

    expect(onComplete).toHaveBeenCalled();
  });

  test('allows resetting and undoing taps', () => {
    let component: TestRenderer.ReactTestRenderer;
    act(() => {
      component = TestRenderer.create(<CalibrationView width={300} height={300} />);
    });

    const touchArea = component!.root.find(
      (node) => node.props.testID === 'video-touch-area'
    );

    act(() => {
      touchArea.props.onPress({ nativeEvent: { locationX: 10, locationY: 10 } });
    });

    const stepTitle = component!.root.find(
      (node) => node.props.testID === 'calibration-step-title'
    );
    expect(stepTitle.props.children.join('')).toContain('Bottom-Right Doubles Corner');

    const undoButton = component!.root.find(
      (node) => node.props.testID === 'undo-button'
    );
    act(() => {
      undoButton.props.onPress();
    });

    const stepTitleAfterUndo = component!.root.find(
      (node) => node.props.testID === 'calibration-step-title'
    );
    expect(stepTitleAfterUndo.props.children.join('')).toContain('Bottom-Left Doubles Corner');
  });
});
