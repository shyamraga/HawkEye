import { useMatchFrameProcessor } from '../hooks/useFrameProcessor';

jest.mock('react-native-vision-camera', () => ({
  useFrameProcessor: (callback: any) => callback,
}));

jest.mock('react-native-worklets-core', () => ({
  Worklets: {
    createRunOnJS: (fn: any) => fn,
  },
}));

describe('Frame Processor Hook (CAM-02)', () => {
  test('useMatchFrameProcessor returns a valid frame processor function', () => {
    const callback = jest.fn();
    const processor = useMatchFrameProcessor(callback);
    expect(typeof processor).toBe('function');

    const mockFrame = { width: 1920, height: 1080, timestamp: 123456789 };
    expect(() => processor(mockFrame)).not.toThrow();
    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({ width: 1920, height: 1080 })
    );
  });
});
