import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { Text, TouchableOpacity } from 'react-native';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
}));

import App from '../../App';

describe('App SwingVision Suite Integration', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  test('renders full app with SwingVision 7-tab navigation and pro features', async () => {
    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(<App />);
    });

    const root = renderer!.root;
    expect(root).toBeTruthy();

    const texts = root.findAllByType(Text).map(t => {
      const child = t.props.children;
      return Array.isArray(child) ? child.join('') : String(child);
    });

    expect(texts).toContain('Sessions');
    expect(texts).toContain('Calibrate');
    expect(texts).toContain('Live HUD');
    expect(texts).toContain('Hawk-Eye');
    expect(texts).toContain('Coach');
    expect(texts).toContain('Reels');
    expect(texts).toContain('Heatmap');
  });

  test('navigates to Coach tab and renders SwingVision AI Coach view', async () => {
    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(<App />);
    });

    const touchables = renderer!.root.findAllByType(TouchableOpacity);
    const coachTab = touchables.find(b => {
      const texts = b.findAllByType(Text);
      return texts.some(t => t.props.children === 'Coach');
    });

    expect(coachTab).toBeTruthy();

    await act(async () => {
      coachTab?.props.onPress();
    });

    const coachTexts = renderer!.root.findAllByType(Text).map(t => {
      const child = t.props.children;
      return Array.isArray(child) ? child.join('') : String(child);
    });

    expect(coachTexts).toContain('SWINGVISION AI COACH');
  });

  test('navigates to Highlights reels tab and renders auto-trim player', async () => {
    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(<App />);
    });

    const touchables = renderer!.root.findAllByType(TouchableOpacity);
    const reelsTab = touchables.find(b => {
      const texts = b.findAllByType(Text);
      return texts.some(t => t.props.children === 'Reels');
    });

    expect(reelsTab).toBeTruthy();

    await act(async () => {
      reelsTab?.props.onPress();
    });

    const highlightTexts = renderer!.root.findAllByType(Text).map(t => {
      const child = t.props.children;
      return Array.isArray(child) ? child.join('') : String(child);
    });

    expect(highlightTexts).toContain('SWINGVISION AUTO-TRIM');
  });

  test('navigates to Heatmap tab and renders interactive SVG court heatmap', async () => {
    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(<App />);
    });

    const touchables = renderer!.root.findAllByType(TouchableOpacity);
    const heatmapTab = touchables.find(b => {
      const texts = b.findAllByType(Text);
      return texts.some(t => t.props.children === 'Heatmap');
    });

    expect(heatmapTab).toBeTruthy();

    await act(async () => {
      heatmapTab?.props.onPress();
    });

    const statsTexts = renderer!.root.findAllByType(Text).map(t => {
      const child = t.props.children;
      return Array.isArray(child) ? child.join('') : String(child);
    });

    expect(statsTexts).toContain('COURT LANDING HEATMAP');
  });

  test('navigates to Calibrate tab and switches to mount presets guide', async () => {
    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(<App />);
    });

    const touchables = renderer!.root.findAllByType(TouchableOpacity);
    const calibTab = touchables.find(b => {
      const texts = b.findAllByType(Text);
      return texts.some(t => t.props.children === 'Calibrate');
    });

    expect(calibTab).toBeTruthy();

    await act(async () => {
      calibTab?.props.onPress();
    });

    const calibButtons = renderer!.root.findAllByType(TouchableOpacity);
    const mountGuideBtn = calibButtons.find(b => {
      const texts = b.findAllByType(Text);
      return texts.some(t => t.props.children === 'MOUNT PRESETS GUIDE');
    });

    expect(mountGuideBtn).toBeTruthy();

    await act(async () => {
      mountGuideBtn?.props.onPress();
    });

    const guideTexts = renderer!.root.findAllByType(Text).map(t => {
      const child = t.props.children;
      return Array.isArray(child) ? child.join('') : String(child);
    });

    expect(guideTexts).toContain('SWINGVISION MOUNT CALIBRATION');
  });
});
