import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { TrajectoryPoint } from '../../tracking/utils/bounceDetector';
import { DecisionSummary } from '../../decision/services/decisionService';
import { CourtOverlaySvg } from '../../calibration/components/CourtOverlaySvg';
import { TrajectoryOverlaySvg } from '../../tracking/components/TrajectoryOverlaySvg';
import { LineCallView } from '../../decision/components/LineCallView';

export interface ReplayViewProps {
  trajectory: TrajectoryPoint[];
  bouncePoint?: TrajectoryPoint | null;
  decision?: DecisionSummary | null;
  H?: number[][] | null;
  width: number;
  height: number;
  animationProgress?: number; // 0 to 1
  toScreen?: (pt: TrajectoryPoint) => { x: number; y: number } | null;
  style?: ViewStyle;
  testID?: string;
}

export const ReplayView: React.FC<ReplayViewProps> = ({
  trajectory = [],
  bouncePoint = null,
  decision = null,
  H = null,
  width,
  height,
  animationProgress = 1,
  toScreen,
  style,
  testID = 'replay-view',
}) => {
  const progress = Math.max(0, Math.min(1, animationProgress));
  const visibleCount = Math.max(1, Math.floor(trajectory.length * progress));
  const visibleTrajectory = trajectory.slice(0, visibleCount);

  const showBounce =
    bouncePoint &&
    (progress === 1 ||
      (trajectory.length > 0 &&
        (bouncePoint.t ?? 0) <= (visibleTrajectory[visibleTrajectory.length - 1]?.t ?? 0)));

  return (
    <View style={[styles.container, { width, height }, style]} testID={testID}>
      {/* Court Overlay Background */}
      <CourtOverlaySvg H={H} width={width} height={height} />

      {/* Trajectory & Bounce Overlay */}
      <TrajectoryOverlaySvg
        trajectory={visibleTrajectory}
        bouncePoint={showBounce ? bouncePoint : null}
        width={width}
        height={height}
        toScreen={toScreen}
      />

      {/* Verdict / Decision View Banner Overlay */}
      {decision && (
        <View style={styles.verdictOverlay}>
          <LineCallView decision={decision} testID="replay-line-call" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: '#0f172a',
    overflow: 'hidden',
    borderRadius: 12,
  },
  verdictOverlay: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    alignItems: 'center',
  },
});
