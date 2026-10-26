import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Play, Pause, RotateCcw } from 'lucide-react-native';
import { TrajectoryPoint } from '../../tracking/utils/bounceDetector';
import { DecisionSummary } from '../../decision/services/decisionService';
import { ReplayView } from './ReplayView';

export interface SlowMoReplayPlayerProps {
  videoUri: string;
  trajectory: TrajectoryPoint[];
  bouncePoint?: TrajectoryPoint | null;
  decision?: DecisionSummary | null;
  H?: number[][] | null;
  width: number;
  height: number;
  toScreen?: (pt: TrajectoryPoint) => { x: number; y: number } | null;
  style?: ViewStyle;
  testID?: string;
  onPlaybackStatusUpdate?: (status: AVPlaybackStatus) => void;
}

export const SlowMoReplayPlayer: React.FC<SlowMoReplayPlayerProps> = ({
  videoUri,
  trajectory = [],
  bouncePoint = null,
  decision = null,
  H = null,
  width,
  height,
  toScreen,
  style,
  testID = 'slow-mo-player',
  onPlaybackStatusUpdate,
}) => {
  const videoRef = useRef<Video>(null);
  const [status, setStatus] = useState<AVPlaybackStatus>({} as AVPlaybackStatus);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isLoaded = 'isLoaded' in status && status.isLoaded;
  const isPlaying = isLoaded && status.isPlaying;
  const positionMillis = isLoaded ? status.positionMillis : 0;
  const durationMillis = isLoaded && status.durationMillis ? status.durationMillis : 1;

  const animationProgress = Math.max(0, Math.min(1, positionMillis / durationMillis));

  const currentTimeSec = positionMillis / 1000;
  const bounceTimeSec = bouncePoint?.t ?? -1;
  const isNearImpact = bouncePoint !== null && bounceTimeSec >= 0 && Math.abs(currentTimeSec - bounceTimeSec) < 0.2;

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

  const handleSetRate = async (rate: number) => {
    if (!videoRef.current) return;
    try {
      await videoRef.current.setRateAsync(rate, true);
      setPlaybackRate(rate);
    } catch (err) {
      console.warn('Failed to set playback rate:', err);
    }
  };

  return (
    <View style={[styles.container, { width, height }, style]} testID={testID}>
      <Video
        ref={videoRef}
        source={{ uri: videoUri }}
        style={styles.video}
        resizeMode={ResizeMode.CONTAIN}
        isLooping={false}
        shouldPlay={false}
        onPlaybackStatusUpdate={(s) => {
          setStatus(s);
          if (onPlaybackStatusUpdate) onPlaybackStatusUpdate(s);
        }}
        onError={(error) => {
          const msg = typeof error === 'string' ? error : 'Failed to load video playback';
          setErrorMessage(msg);
        }}
      />

      {errorMessage && (
        <View style={styles.errorOverlay} testID="error-overlay">
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}

      <View style={[styles.replayOverlayContainer, { width, height }]} pointerEvents="box-none">
        <ReplayView
          trajectory={trajectory}
          bouncePoint={bouncePoint}
          decision={decision}
          H={H}
          width={width}
          height={height}
          animationProgress={animationProgress}
          toScreen={toScreen}
          testID="replay-view-overlay"
        />
      </View>

      {isNearImpact && (
        <View style={styles.impactBadge} testID="impact-badge">
          <Text style={styles.impactText}>⚡ IMPACT MOMENT ({playbackRate}x)</Text>
        </View>
      )}

      <View style={styles.controlsBar} testID="controls-bar">
        <TouchableOpacity style={styles.controlButton} onPress={handleReplay} testID="replay-button">
          <RotateCcw color="#ffffff" size={20} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.primaryControlButton} onPress={handlePlayPause} testID="play-pause-button">
          {isPlaying ? <Pause color="#ffffff" size={24} /> : <Play color="#ffffff" size={24} />}
        </TouchableOpacity>

        <View style={styles.speedButtonsContainer}>
          {[1.0, 0.5, 0.25].map((rate) => (
            <TouchableOpacity
              key={rate}
              style={[
                styles.speedButton,
                playbackRate === rate && styles.speedButtonActive,
              ]}
              onPress={() => handleSetRate(rate)}
              testID={`speed-${rate}`}
            >
              <Text
                style={[
                  styles.speedButtonText,
                  playbackRate === rate && styles.speedButtonTextActive,
                ]}
              >
                {rate}x
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: '#000000',
    overflow: 'hidden',
    borderRadius: 12,
  },
  video: {
    ...StyleSheet.absoluteFillObject,
  },
  replayOverlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    opacity: 0.85,
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 59, 48, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    color: '#ffffff',
    fontSize: 14,
    textAlign: 'center',
  },
  impactBadge: {
    position: 'absolute',
    top: 16,
    alignSelf: 'center',
    backgroundColor: 'rgba(234, 179, 8, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    elevation: 4,
  },
  impactText: {
    color: '#000000',
    fontWeight: 'bold',
    fontSize: 12,
  },
  controlsBar: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 30,
    gap: 12,
  },
  controlButton: {
    padding: 6,
  },
  primaryControlButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  speedButtonsContainer: {
    flexDirection: 'row',
    gap: 6,
    marginLeft: 8,
  },
  speedButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  speedButtonActive: {
    backgroundColor: '#007AFF',
  },
  speedButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  speedButtonTextActive: {
    color: '#ffffff',
  },
});
