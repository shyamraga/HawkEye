import { pickMatchVideo, cacheVideoFile } from '../../services/videoIngestion';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted', granted: true })),
  launchImageLibraryAsync: jest.fn(() => Promise.resolve({
    canceled: false,
    assets: [{ uri: 'file:///mock/match.mp4', mimeType: 'video/mp4', fileSize: 1024000 }]
  })),
}));

jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///mock/documents/',
  copyAsync: jest.fn(() => Promise.resolve()),
  getInfoAsync: jest.fn(() => Promise.resolve({ exists: true, size: 1024000 })),
}));

describe('Video Ingestion Service (CAM-01)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('pickMatchVideo requests permissions and returns valid video asset', async () => {
    const result = await pickMatchVideo();
    expect(ImagePicker.requestMediaLibraryPermissionsAsync).toHaveBeenCalled();
    expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalledWith(
      expect.objectContaining({ mediaTypes: ['videos'] })
    );
    expect(result).toEqual(
      expect.objectContaining({
        uri: 'file:///mock/match.mp4',
        mimeType: 'video/mp4',
      })
    );
  });

  test('cacheVideoFile validates extension and copies video to cache directory', async () => {
    const cachedUri = await cacheVideoFile('file:///mock/match.mp4');
    expect(cachedUri).toContain('.mp4');
    expect(FileSystem.copyAsync).toHaveBeenCalled();
  });

  test('cacheVideoFile rejects invalid file extensions (.txt, .exe)', async () => {
    await expect(cacheVideoFile('file:///mock/malicious.txt')).rejects.toThrow(
      /Invalid video file extension/i
    );
    await expect(cacheVideoFile('file:///mock/malicious.exe')).rejects.toThrow(
      /Invalid video file extension/i
    );
  });
});
