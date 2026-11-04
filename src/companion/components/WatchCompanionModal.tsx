import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import {
  Watch,
  Heart,
  Flame,
  Footprints,
  RotateCcw,
  ShieldAlert,
  Zap,
  Volume2,
  VolumeX,
  X,
  Plus,
  Activity,
  Check,
} from 'lucide-react-native';
import { THEME } from '../../theme/theme';
import { TennisScoreState } from '../../services/tennisScoringEngine';

interface WatchCompanionModalProps {
  visible: boolean;
  scoreState: TennisScoreState;
  playerOneName: string;
  playerTwoName: string;
  lastServeSpeedKmh?: number;
  enableBiometricsSimulation?: boolean;
  onScorePoint: (player: 1 | 2) => void;
  onUndoPoint: () => void;
  onTriggerChallenge: (player: 1 | 2) => void;
  onClose: () => void;
}

export const WatchCompanionModal: React.FC<WatchCompanionModalProps> = ({
  visible,
  scoreState,
  playerOneName,
  playerTwoName,
  lastServeSpeedKmh = 188,
  enableBiometricsSimulation = false,
  onScorePoint,
  onUndoPoint,
  onTriggerChallenge,
  onClose,
}) => {
  // Simulated Apple Watch HealthKit Biometrics
  const [heartRate, setHeartRate] = useState(142);
  const [calories, setCalories] = useState(460);
  const [distanceKm, setDistanceKm] = useState(2.6);
  const [hapticPing, setHapticPing] = useState(false);

  useEffect(() => {
    if (!visible || !enableBiometricsSimulation) return;
    const interval = setInterval(() => {
      setHeartRate(prev => 135 + Math.floor(Math.random() * 15));
      setCalories(prev => prev + 1);
      setDistanceKm(prev => Math.round((prev + 0.01) * 100) / 100);
    }, 3000);
    return () => clearInterval(interval);
  }, [visible, enableBiometricsSimulation]);

  const triggerTapFeedback = () => {
    setHapticPing(true);
    setTimeout(() => setHapticPing(false), 200);
  };

  const handleScore = (p: 1 | 2) => {
    triggerTapFeedback();
    onScorePoint(p);
  };

  const p1Short = playerOneName.split(' ')[0].toUpperCase();
  const p2Short = playerTwoName.split(' ')[0].toUpperCase();

  // Safely normalize score values across engine models
  const completedSets =
    (scoreState as any).setScores?.length ??
    (scoreState as any).setHistory?.length ??
    0;
  const p1Games =
    (scoreState as any).playerOneGames ??
    (scoreState as any).games?.player1 ??
    0;
  const p2Games =
    (scoreState as any).playerTwoGames ??
    (scoreState as any).games?.player2 ??
    0;
  const serverNum: 1 | 2 =
    (scoreState as any).currentServer ??
    (scoreState as any).server ??
    1;

  const formatPoints = (
    pts: any,
    tiebreakPts: number = 0,
    isTiebreak: boolean = false
  ): string => {
    if (typeof pts === 'string') return pts;
    if (isTiebreak) return String(tiebreakPts);
    if (pts === 0) return '0';
    if (pts === 1) return '15';
    if (pts === 2) return '30';
    if (pts === 3) return '40';
    if (pts >= 4) return 'AD';
    return String(pts ?? 0);
  };

  const p1PointsDisplay =
    (scoreState as any).points?.player1 ??
    formatPoints(
      (scoreState as any).playerOnePoints,
      (scoreState as any).tiebreakPointsP1,
      (scoreState as any).isTiebreak
    );

  const p2PointsDisplay =
    (scoreState as any).points?.player2 ??
    formatPoints(
      (scoreState as any).playerTwoPoints,
      (scoreState as any).tiebreakPointsP2,
      (scoreState as any).isTiebreak
    );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        {/* Watch Chassis Container */}
        <View style={[styles.watchChassis, hapticPing && styles.watchChassisActive]}>
          {/* Top Digital Crown & Watch Bezel Frame */}
          <View style={styles.watchHeader}>
            <View style={styles.timeRow}>
              <Watch size={12} color="#94A3B8" />
              <Text style={styles.watchTime}>10:42 AM</Text>
            </View>

            <View style={styles.syncBadge}>
              <View style={styles.syncPulse} />
              <Text style={styles.syncText}>APPLE WATCH LIVE</Text>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={14} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* OLED Screen Bezel */}
          <View style={styles.oledScreen}>
            {/* Health & Biometrics Row */}
            <View style={styles.biometricsBar}>
              <View style={styles.bioMetric}>
                <Heart size={11} color="#FF3B30" />
                <Text style={styles.bioValue}>{heartRate} BPM</Text>
              </View>

              <View style={styles.bioMetric}>
                <Flame size={11} color="#F59E0B" />
                <Text style={styles.bioValue}>{calories} KCAL</Text>
              </View>

              <View style={styles.bioMetric}>
                <Footprints size={11} color="#00F59B" />
                <Text style={styles.bioValue}>{distanceKm} KM</Text>
              </View>
            </View>

            {/* Current Match Score Display */}
            <View style={styles.scoreDisplayCard}>
              <Text style={styles.setContextText}>
                SET {completedSets + 1} • GAME {p1Games + p2Games + 1}
              </Text>

              <View style={styles.scoreRow}>
                {/* Player 1 */}
                <View style={styles.playerScoreColumn}>
                  <Text
                    style={[
                      styles.playerNameText,
                      serverNum === 1 && styles.serverIndicator,
                    ]}
                    numberOfLines={1}
                  >
                    {p1Short} {serverNum === 1 && '●'}
                  </Text>
                  <Text style={styles.pointNumberText}>{p1PointsDisplay}</Text>
                  <Text style={styles.gamesNumberText}>
                    {p1Games} Games
                  </Text>
                </View>

                <View style={styles.scoreDivider}>
                  <Text style={styles.vsText}>VS</Text>
                </View>

                {/* Player 2 */}
                <View style={styles.playerScoreColumn}>
                  <Text
                    style={[
                      styles.playerNameText,
                      serverNum === 2 && styles.serverIndicator,
                    ]}
                    numberOfLines={1}
                  >
                    {p2Short} {serverNum === 2 && '●'}
                  </Text>
                  <Text style={styles.pointNumberText}>{p2PointsDisplay}</Text>
                  <Text style={styles.gamesNumberText}>
                    {p2Games} Games
                  </Text>
                </View>
              </View>

              {/* Speed Gun Telemetry Pill */}
              <View style={styles.speedGunPill}>
                <Zap size={10} color="#CCFF00" />
                <Text style={styles.speedGunText}>
                  LAST SERVE: {lastServeSpeedKmh} KM/H
                </Text>
              </View>
            </View>

            {/* Wrist Quick-Score Tap Buttons */}
            <View style={styles.tapControlsRow}>
              <TouchableOpacity
                style={[styles.scoreTapBtn, styles.scoreTapBtnP1]}
                onPress={() => handleScore(1)}
              >
                <Plus size={16} color="#070A11" />
                <Text style={styles.scoreTapBtnText}>POINT {p1Short}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.scoreTapBtn, styles.scoreTapBtnP2]}
                onPress={() => handleScore(2)}
              >
                <Plus size={16} color="#070A11" />
                <Text style={styles.scoreTapBtnText}>POINT {p2Short}</Text>
              </TouchableOpacity>
            </View>

            {/* Bottom Actions: Undo & Hawk-Eye Challenge */}
            <View style={styles.bottomActionsRow}>
              <TouchableOpacity
                style={styles.undoBtn}
                onPress={() => {
                  triggerTapFeedback();
                  onUndoPoint();
                }}
              >
                <RotateCcw size={13} color="#94A3B8" />
                <Text style={styles.undoBtnText}>UNDO</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.challengeWristBtn}
                onPress={() => {
                  triggerTapFeedback();
                  onTriggerChallenge(serverNum);
                  onClose();
                }}
              >
                <ShieldAlert size={13} color="#FF3B30" />
                <Text style={styles.challengeWristText}>HAWK-EYE CHALLENGE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  watchChassis: {
    width: Math.min(Dimensions.get('window').width - 32, 340),
    backgroundColor: '#1E293B',
    borderRadius: 36,
    padding: 10,
    borderWidth: 3,
    borderColor: '#334155',
    shadowColor: '#00F59B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  watchChassisActive: {
    borderColor: '#00F59B',
  },
  watchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 8,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  watchTime: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  syncPulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00F59B',
  },
  syncText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#00F59B',
    letterSpacing: 0.5,
  },
  closeBtn: {
    padding: 4,
  },
  oledScreen: {
    backgroundColor: '#000000',
    borderRadius: 26,
    padding: 14,
    borderWidth: 1,
    borderColor: '#0F172A',
  },
  biometricsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#0B0F19',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 10,
  },
  bioMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bioValue: {
    fontSize: 9,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  scoreDisplayCard: {
    backgroundColor: '#0B0F19',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
    alignItems: 'center',
  },
  setContextText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
  },
  playerScoreColumn: {
    alignItems: 'center',
    flex: 1,
  },
  playerNameText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    marginBottom: 2,
  },
  serverIndicator: {
    color: '#CCFF00',
  },
  pointNumberText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  gamesNumberText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  scoreDivider: {
    paddingHorizontal: 8,
  },
  vsText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#334155',
  },
  speedGunPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.3)',
  },
  speedGunText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#CCFF00',
  },
  tapControlsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  scoreTapBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 12,
    borderRadius: 10,
  },
  scoreTapBtnP1: {
    backgroundColor: '#00F59B',
  },
  scoreTapBtnP2: {
    backgroundColor: '#00E5FF',
  },
  scoreTapBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#070A11',
    letterSpacing: 0.5,
  },
  bottomActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  undoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#0F172A',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  undoBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
  },
  challengeWristBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  challengeWristText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FF3B30',
    letterSpacing: 0.5,
  },
});
