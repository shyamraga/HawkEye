import { detectBall, validateFrameBuffer } from '../utils/ballDetector';

describe('Ball Detector Utility', () => {
  test('validates frame buffer dimensions correctly', () => {
    const validBuffer = new Uint8Array(10 * 10 * 3);
    expect(() => validateFrameBuffer(validBuffer, 10, 10, 3)).not.toThrow();

    const shortBuffer = new Uint8Array(5);
    expect(() => validateFrameBuffer(shortBuffer, 10, 10, 3)).toThrow();
    expect(() => validateFrameBuffer(validBuffer, 0, 10, 3)).toThrow();
  });

  test('detects tennis ball in synthetic frame buffer with correct centroid', () => {
    const width = 20;
    const height = 20;
    const channels = 3;
    const buffer = new Uint8Array(width * height * channels);

    // Fill background with dark color (e.g. blue/black court)
    for (let i = 0; i < buffer.length; i += 3) {
      buffer[i] = 20;     // R
      buffer[i + 1] = 40; // G
      buffer[i + 2] = 100;// B
    }

    // Draw a tennis ball (yellow-green: R ~ 180, G ~ 230, B ~ 50) around center (10, 10), radius ~ 2
    for (let y = 8; y <= 12; y++) {
      for (let x = 8; x <= 12; x++) {
        const idx = (y * width + x) * channels;
        buffer[idx] = 180;
        buffer[idx + 1] = 230;
        buffer[idx + 2] = 50;
      }
    }

    const detection = detectBall(buffer, width, height, channels);
    expect(detection).not.toBeNull();
    expect(detection?.x).toBeCloseTo(10, 0);
    expect(detection?.y).toBeCloseTo(10, 0);
    expect(detection?.confidence).toBeGreaterThan(0.5);
  });

  test('returns null when no tennis ball pixels are present (background clutter rejection)', () => {
    const width = 10;
    const height = 10;
    const channels = 3;
    const buffer = new Uint8Array(width * height * channels);

    // Fill with random non-ball colors
    for (let i = 0; i < buffer.length; i += 3) {
      buffer[i] = 10;
      buffer[i + 1] = 10;
      buffer[i + 2] = 10;
    }

    const detection = detectBall(buffer, width, height, channels);
    expect(detection).toBeNull();
  });
});
