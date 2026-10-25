import { useFrameProcessor } from 'react-native-vision-camera';
import { Worklets } from 'react-native-worklets-core';
import { useCallback } from 'react';

export interface FrameMetrics {
  width: number;
  height: number;
  timestamp: number;
}

export function useMatchFrameProcessor(onFrameAnalyzed?: (metrics: FrameMetrics) => void) {
  const runOnJS = Worklets.createRunOnJS((width: number, height: number, timestamp: number) => {
    if (onFrameAnalyzed) {
      onFrameAnalyzed({ width, height, timestamp });
    }
  });

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    const { width, height, timestamp } = frame;
    // Downsampling / ROI windowing trigger placeholder or callback
    runOnJS(width, height, timestamp || Date.now());
  }, [runOnJS]);

  return frameProcessor;
}
