import React, { useRef, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Play, Pause, RotateCcw } from 'lucide-react-native';

export interface VideoPlayerProps {
  videoUri: string;
  onError?: (error: string) => void;
}

export function VideoPlayer({ videoUri, onError }: VideoPlayerProps) {
  const videoRef = useRef<Video>(null);
  const [status, setStatus] = useState<AVPlaybackStatus>({} as AVPlaybackStatus);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isLoaded = 'isLoaded' in status && status.isLoaded;
  const isPlaying = isLoaded && status.isPlaying;

  const handlePlayPause = async () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
    }
  };

  const handleReplay = async () => {
    if (!videoRef.current) return;
    await videoRef.current.setPositionAsync(0);
    await videoRef.current.playAsync();
  };

  return (
    <View style={styles.container}>
      <Video
        ref={videoRef}
        source={{ uri: videoUri }}
        style={styles.video}
        resizeMode={ResizeMode.CONTAIN}
        isLooping={false}
        shouldPlay={false}
        onPlaybackStatusUpdate={(s) => setStatus(s)}
        onError={(error) => {
          const msg = typeof error === 'string' ? error : 'Failed to load video playback';
          setErrorMessage(msg);
          if (onError) onError(msg);
        }}
      />

      {errorMessage && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}

      {isLoaded && (
        <View style={styles.controlsBar}>
          <TouchableOpacity style={styles.controlButton} onPress={handleReplay}>
            <RotateCcw color="#ffffff" size={24} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.primaryControlButton} onPress={handlePlayPause}>
            {isPlaying ? (
              <Pause color="#ffffff" size={32} />
            ) : (
              <Play color="#ffffff" size={32} />
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  errorOverlay: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 59, 48, 0.8)',
    padding: 16,
    borderRadius: 8,
    margin: 20,
  },
  errorText: {
    color: '#ffffff',
    fontSize: 14,
    textAlign: 'center',
  },
  controlsBar: {
    position: 'absolute',
    bottom: 30,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30,
    gap: 20,
  },
  controlButton: {
    padding: 8,
  },
  primaryControlButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
