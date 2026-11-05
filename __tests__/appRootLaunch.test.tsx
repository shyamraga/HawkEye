import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import App from '../App';

describe('App Root Startup & Inset Safety', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  test('App mounts with root SafeAreaProvider without throwing safe area errors', async () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    await act(async () => {
      renderer = TestRenderer.create(<App />);
    });

    expect(renderer).toBeDefined();
    expect(renderer?.root).toBeTruthy();
  });
});
