import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  GestureResponderEvent,
} from 'react-native';
import { ITF_REFERENCE_POINTS, CourtReferencePoint } from '../utils/itfCourt';
import { computeHomography, calculateReprojectionError, Point2D } from '../utils/homography';
import { CourtOverlaySvg } from './CourtOverlaySvg';
import { Point3D } from '../utils/itfCourt';

interface CalibrationViewProps {
  width?: number;
  height?: number;
  onCalibrationComplete?: (H: number[][], error: number) => void;
}

export const CalibrationView: React.FC<CalibrationViewProps> = ({
  width = Dimensions.get('window').width,
  height = 400,
  onCalibrationComplete,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [tappedPoints, setTappedPoints] = useState<Point2D[]>([]);
  const [referencePoints, setReferencePoints] = useState<CourtReferencePoint[]>([]);
  const [homographyMatrix, setHomographyMatrix] = useState<number[][] | null>(null);
  const [reprojectionError, setReprojectionError] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeTargetPoint = ITF_REFERENCE_POINTS[currentStep] || ITF_REFERENCE_POINTS[0];

  const handleTouch = (event: GestureResponderEvent) => {
    const { locationX, locationY } = event.nativeEvent;
    const newPoint: Point2D = { x: locationX, y: locationY };

    const updatedTapped = [...tappedPoints, newPoint];
    const updatedRefs = [...referencePoints, activeTargetPoint];

    setTappedPoints(updatedTapped);
    setReferencePoints(updatedRefs);
    setErrorMessage(null);

    // Compute homography if we have at least 4 points
    if (updatedTapped.length >= 4) {
      try {
        const src: Point2D[] = updatedTapped;
        const dst: Point3D[] = updatedRefs.map((r) => r.coords);
        const H = computeHomography(src, dst);
        const err = calculateReprojectionError(H, src, dst);
        setHomographyMatrix(H);
        setReprojectionError(err);
      } catch (err: any) {
        setErrorMessage(err.message);
      }
    }

    if (currentStep < ITF_REFERENCE_POINTS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleUndo = () => {
    if (tappedPoints.length === 0) return;
    const updatedTapped = tappedPoints.slice(0, -1);
    const updatedRefs = referencePoints.slice(0, -1);

    setTappedPoints(updatedTapped);
    setReferencePoints(updatedRefs);
    setCurrentStep(Math.max(0, currentStep - 1));
    setErrorMessage(null);

    if (updatedTapped.length >= 4) {
      try {
        const H = computeHomography(
          updatedTapped,
          updatedRefs.map((r) => r.coords)
        );
        const err = calculateReprojectionError(
          H,
          updatedTapped,
          updatedRefs.map((r) => r.coords)
        );
        setHomographyMatrix(H);
        setReprojectionError(err);
      } catch (err: any) {
        setErrorMessage(err.message);
        setHomographyMatrix(null);
        setReprojectionError(null);
      }
    } else {
      setHomographyMatrix(null);
      setReprojectionError(null);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setTappedPoints([]);
    setReferencePoints([]);
    setHomographyMatrix(null);
    setReprojectionError(null);
    setErrorMessage(null);
  };

  const handleConfirm = () => {
    if (homographyMatrix && onCalibrationComplete && reprojectionError !== null) {
      onCalibrationComplete(homographyMatrix, reprojectionError);
    }
  };

  return (
    <View style={styles.container} testID="calibration-container">
      <View style={styles.header}>
        <Text style={styles.title} testID="calibration-step-title">
          Tap Point: {activeTargetPoint.name}
        </Text>
        <Text style={styles.subtitle}>
          Step {currentStep + 1} of {ITF_REFERENCE_POINTS.length} ({tappedPoints.length} points tapped)
        </Text>
      </View>

      <TouchableOpacity
        activeOpacity={1}
        style={[styles.videoContainer, { width, height }]}
        onPress={handleTouch}
        testID="video-touch-area"
      >
        <View style={styles.mockVideoBackground} />
        <CourtOverlaySvg
          H={homographyMatrix}
          width={width}
          height={height}
          tappedPoints={tappedPoints}
        />
      </TouchableOpacity>

      {errorMessage && (
        <Text style={styles.errorText} testID="calibration-error">
          {errorMessage}
        </Text>
      )}

      {reprojectionError !== null && (
        <View style={styles.statusBox} testID="calibration-status">
          <Text style={styles.statusText}>
            Calibration Active | Reprojection Error: {reprojectionError.toFixed(3)}m
          </Text>
        </View>
      )}

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleUndo} testID="undo-button">
          <Text style={styles.buttonText}>Undo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleReset} testID="reset-button">
          <Text style={styles.buttonText}>Reset</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.primaryButton,
            (!homographyMatrix || (reprojectionError !== null && reprojectionError > 2.0)) &&
              styles.disabledButton,
          ]}
          onPress={handleConfirm}
          disabled={!homographyMatrix}
          testID="confirm-button"
        >
          <Text style={styles.primaryButtonText}>Confirm Calibration</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 16,
    alignItems: 'center',
  },
  header: {
    marginBottom: 12,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 14,
    color: '#a0a0a0',
    marginTop: 4,
  },
  videoContainer: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#333333',
  },
  mockVideoBackground: {
    flex: 1,
    backgroundColor: '#252830',
  },
  errorText: {
    color: '#ff453a',
    marginTop: 8,
    textAlign: 'center',
  },
  statusBox: {
    marginTop: 12,
    padding: 8,
    backgroundColor: 'rgba(0, 255, 204, 0.1)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#00ffcc',
  },
  statusText: {
    color: '#00ffcc',
    fontWeight: '600',
    fontSize: 13,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  secondaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#2c2c2e',
    borderRadius: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  primaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#00ffcc',
    borderRadius: 8,
  },
  disabledButton: {
    backgroundColor: '#555555',
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#121212',
    fontWeight: 'bold',
  },
});
