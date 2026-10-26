// @ts-ignore
import { useFrameProcessor } from 'react-native-vision-camera';
import { Worklets } from 'react-native-worklets-core';

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

  const frameProcessor = useFrameProcessor((frame: any) => {
    'worklet';
    const width = frame?.width || 0;
    const height = frame?.height || 0;
    const timestamp = frame?.timestamp || Date.now();
    runOnJS(width, height, timestamp);
  }, [runOnJS]);

  return frameProcessor;
}
