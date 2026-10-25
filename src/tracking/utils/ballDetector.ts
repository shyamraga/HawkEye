export interface Point2D {
  x: number;
  y: number;
}

export interface DetectedBall {
  x: number;
  y: number;
  radius: number;
  confidence: number;
}

export interface BallDetectorOptions {
  minRed?: number;
  maxRed?: number;
  minGreen?: number;
  maxGreen?: number;
  minBlue?: number;
  maxBlue?: number;
  minPixels?: number;
}

const DEFAULT_OPTIONS: Required<BallDetectorOptions> = {
  minRed: 120,
  maxRed: 240,
  minGreen: 180,
  maxGreen: 255,
  minBlue: 20,
  maxBlue: 140,
  minPixels: 3,
};

/**
 * Validates frame buffer dimensions and type to prevent buffer overflow or invalid memory access (Threat T-03-01).
 */
export function validateFrameBuffer(
  frameBuffer: Uint8Array | number[] | Uint8ClampedArray,
  width: number,
  height: number,
  channels: number = 3
): void {
  if (!frameBuffer) {
    throw new Error('Frame buffer is null or undefined');
  }
  if (width <= 0 || height <= 0) {
    throw new Error(`Invalid frame dimensions: width=${width}, height=${height}`);
  }
  const expectedMinLength = width * height * channels;
  if (frameBuffer.length < expectedMinLength) {
    throw new Error(
      `Frame buffer length (${frameBuffer.length}) is smaller than expected (${expectedMinLength}) for ${width}x${height} with ${channels} channels`
    );
  }
}

/**
 * Detects tennis ball in a raw pixel frame buffer (RGB or RGBA) via color thresholding and centroid calculation.
 */
export function detectBall(
  frameBuffer: Uint8Array | number[] | Uint8ClampedArray,
  width: number,
  height: number,
  channels: number = 3,
  options?: BallDetectorOptions
): DetectedBall | null {
  validateFrameBuffer(frameBuffer, width, height, channels);

  const opts = { ...DEFAULT_OPTIONS, ...options };
  let sumX = 0;
  let sumY = 0;
  let pixelCount = 0;
  let minX = width;
  let maxX = 0;
  let minY = height;
  let maxY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      const r = frameBuffer[idx];
      const g = frameBuffer[idx + 1];
      const b = frameBuffer[idx + 2];

      // Check if pixel falls within tennis ball color range (yellow-green)
      if (
        r >= opts.minRed &&
        r <= opts.maxRed &&
        g >= opts.minGreen &&
        g <= opts.maxGreen &&
        b >= opts.minBlue &&
        b <= opts.maxBlue
      ) {
        sumX += x;
        sumY += y;
        pixelCount++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (pixelCount < opts.minPixels) {
    return null;
  }

  const centerX = sumX / pixelCount;
  const centerY = sumY / pixelCount;
  const radius = Math.max(maxX - minX, maxY - minY) / 2 || 1;
  const confidence = Math.min(1.0, pixelCount / (Math.PI * radius * radius * 0.8 || 1));

  return {
    x: centerX,
    y: centerY,
    radius,
    confidence: Number(confidence.toFixed(2)),
  };
}
