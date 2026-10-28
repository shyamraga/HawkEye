import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useMatchFrameProcessor, FrameMetrics } from '../hooks/useFrameProcessor';

export interface CameraViewfinderProps {
  onRecordPress?: () => void;
  isRecording?: boolean;
}

export function CameraViewfinder({ onRecordPress, isRecording = false }: CameraViewfinderProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [frameStats, setFrameStats] = useState<FrameMetrics | null>(null);

  const frameProcessor = useMatchFrameProcessor((metrics) => {
    setFrameStats(metrics);
  });

  if (!permission?.granted) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.text}>Camera permission is required for tennis match recording.</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
      />

      {frameStats && (
        <View style={styles.statsOverlay}>
          <Text style={styles.statsText}>
            Frame: {frameStats.width}x{frameStats.height} @ 30+ FPS
          </Text>
        </View>
      )}

      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[styles.recordButton, isRecording && styles.recordingActive]}
          onPress={onRecordPress}
        >
          <View style={styles.innerRecordButton} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111',
    padding: 20,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsOverlay: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statsText: {
    color: '#00FF66',
    fontSize: 12,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  recordingActive: {
    borderColor: '#FF3B30',
  },
  innerRecordButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FF3B30',
  },
});
