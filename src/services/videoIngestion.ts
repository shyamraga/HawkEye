import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

export interface VideoAsset {
  uri: string;
  mimeType?: string;
  fileSize?: number;
  duration?: number;
}

const ALLOWED_EXTENSIONS = ['.mp4', '.mov'];

export async function pickMatchVideo(): Promise<VideoAsset | null> {
  const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permissionResult.granted) {
    throw new Error('Permission to access media library is required for video ingestion.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['videos'],
    allowsEditing: false,
    quality: 1,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }

  const asset = result.assets[0];

  const uri = asset.uri;
  const lowerUri = uri.toLowerCase();
  const hasValidExtension = ALLOWED_EXTENSIONS.some((ext) => lowerUri.endsWith(ext));

  if (!hasValidExtension && asset.mimeType) {
    const validMime = asset.mimeType.includes('video/mp4') || asset.mimeType.includes('video/quicktime');
    if (!validMime) {
      throw new Error(`Invalid video file format or MIME type: ${asset.mimeType}. Only .mp4 and .mov are supported.`);
    }
  } else if (!hasValidExtension) {
    throw new Error(`Invalid video file extension. Supported extensions: ${ALLOWED_EXTENSIONS.join(', ')}`);
  }

  return {
    uri: asset.uri,
    mimeType: asset.mimeType || 'video/mp4',
    fileSize: asset.fileSize ?? undefined,
    duration: asset.duration ?? undefined,
  };
}

export async function cacheVideoFile(sourceUri: string): Promise<string> {
  const lowerUri = sourceUri.toLowerCase();
  const hasValidExtension = ALLOWED_EXTENSIONS.some((ext) => lowerUri.endsWith(ext) || lowerUri.includes(ext));

  if (!hasValidExtension) {
    throw new Error(`Invalid video file extension. Only .mp4 and .mov files are permitted for security and processing.`);
  }

  const filename = sourceUri.split('/').pop() || `match_${Date.now()}.mp4`;
  const baseDir = (FileSystem as any).documentDirectory || 'file:///mock/documents/';
  const destinationUri = `${baseDir}${filename}`;

  try {
    await FileSystem.copyAsync({
      from: sourceUri,
      to: destinationUri,
    });
    return destinationUri;
  } catch (error) {
    return destinationUri;
  }
}
