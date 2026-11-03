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
  Play: 'Play',
  Pause: 'Pause',
  RotateCcw: 'RotateCcw',
  Zap: 'Zap',
  Repeat: 'Repeat',
  ChevronLeft: 'ChevronLeft',
  ChevronRight: 'ChevronRight',
  Maximize2: 'Maximize2',
  Crosshair: 'Crosshair',
  Sliders: 'Sliders',
  Sparkles: 'Sparkles',
}));

import { SlowMoBallZoomPlayer } from '../components/SlowMoBallZoomPlayer';

describe('SlowMoBallZoomPlayer Component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  test('renders with default props and autoPlay', () => {
    let component: TestRenderer.ReactTestRenderer;
    act(() => {
      component = TestRenderer.create(
        <SlowMoBallZoomPlayer autoPlay={false} />
      );
    });

    const root = component!.root;
    expect(root.findByProps({ testID: 'slow-mo-ball-zoom-player' })).toBeTruthy();
    expect(root.findByProps({ testID: 'play-pause-btn' })).toBeTruthy();
    expect(root.findByProps({ testID: 'rewind-btn' })).toBeTruthy();

    act(() => {
      component.unmount();
    });
  });

  test('toggles play/pause state', () => {
    let component: TestRenderer.ReactTestRenderer;
    act(() => {
      component = TestRenderer.create(
        <SlowMoBallZoomPlayer autoPlay={false} />
      );
    });

    const root = component!.root;
    const playPauseBtn = root.findByProps({ testID: 'play-pause-btn' });

    // Press to start playing
    act(() => {
      playPauseBtn.props.onPress();
    });

    // Advance timers inside act
    act(() => {
      jest.advanceTimersByTime(200);
    });

    // Press to pause
    act(() => {
      playPauseBtn.props.onPress();
    });

    act(() => {
      component.unmount();
    });
  });

  test('handles slow-mo speed change buttons', () => {
    let component: TestRenderer.ReactTestRenderer;
    act(() => {
      component = TestRenderer.create(
        <SlowMoBallZoomPlayer autoPlay={false} />
      );
    });

    const root = component!.root;
    const speedHalfBtn = root.findByProps({ testID: 'speed-btn-0.5' });
    const speedSlowMoBtn = root.findByProps({ testID: 'speed-btn-0.25' });

    act(() => {
      speedHalfBtn.props.onPress();
    });

    act(() => {
      speedSlowMoBtn.props.onPress();
    });

    act(() => {
      component.unmount();
    });
  });

  test('handles zoom mode changes', () => {
    let component: TestRenderer.ReactTestRenderer;
    act(() => {
      component = TestRenderer.create(
        <SlowMoBallZoomPlayer autoPlay={false} />
      );
    });

    const root = component!.root;
    const zoomAuto = root.findByProps({ testID: 'zoom-btn-auto' });
    const zoomExtreme = root.findByProps({ testID: 'zoom-btn-5' });

    act(() => {
      zoomExtreme.props.onPress();
    });

    act(() => {
      zoomAuto.props.onPress();
    });

    act(() => {
      component.unmount();
    });
  });

  test('handles step next, step prev, and rewind', () => {
    let component: TestRenderer.ReactTestRenderer;
    act(() => {
      component = TestRenderer.create(
        <SlowMoBallZoomPlayer autoPlay={false} />
      );
    });

    const root = component!.root;
    const nextBtn = root.findByProps({ testID: 'step-next-btn' });
    const prevBtn = root.findByProps({ testID: 'step-prev-btn' });
    const rewindBtn = root.findByProps({ testID: 'rewind-btn' });

    act(() => {
      nextBtn.props.onPress();
      nextBtn.props.onPress();
    });

    act(() => {
      prevBtn.props.onPress();
    });

    act(() => {
      rewindBtn.props.onPress();
    });

    act(() => {
      component.unmount();
    });
  });

  test('handles scrub timeline touch', () => {
    let component: TestRenderer.ReactTestRenderer;
    act(() => {
      component = TestRenderer.create(
        <SlowMoBallZoomPlayer autoPlay={false} />
      );
    });

    const root = component!.root;
    const scrubTimeline = root.findByProps({ testID: 'scrub-timeline' });

    act(() => {
      scrubTimeline.props.onPress({
        nativeEvent: { locationX: 180 },
      });
    });

    act(() => {
      component.unmount();
    });
  });
});
