export interface FrameMetrics {
  width: number;
  height: number;
  timestamp: number;
}

export function useMatchFrameProcessor(onFrameAnalyzed?: (metrics: FrameMetrics) => void) {
  const frameProcessor = (frame: any) => {
    const width = frame?.width || 0;
    const height = frame?.height || 0;
    const timestamp = frame?.timestamp || Date.now();
    if (onFrameAnalyzed) {
      onFrameAnalyzed({ width, height, timestamp });
    }
  };

  return frameProcessor;
}
