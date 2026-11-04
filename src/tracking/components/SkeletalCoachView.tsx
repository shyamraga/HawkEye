import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import Svg, { Line, Circle, Path, Rect, G } from 'react-native-svg';
import {
  Camera,
  Activity,
  Zap,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Award,
} from 'lucide-react-native';
import { THEME } from '../../theme/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SwingBiomechanics {
  id: string;
  stroke: 'FOREHAND' | 'BACKHAND' | 'SERVE' | 'VOLLEY' | 'SMASH';
  speedKmh: number;
  shoulderRotationDeg: number;
  kneeBendDeg: number;
  contactPointStatus: 'IN_FRONT' | 'LATE' | 'STRETCHED';
  followThroughStatus: 'HIGH_FINISH' | 'LOW_WRAPPED' | 'SHORT';
  coachTip: string;
  isGood: boolean;
  timestamp: string;
}

interface SkeletalCoachViewProps {
  onTriggerSimulation?: (stroke: string) => void;
}

export const SkeletalCoachView: React.FC<SkeletalCoachViewProps> = ({
  onTriggerSimulation,
}) => {
  const [activeStroke, setActiveStroke] = useState<'FOREHAND' | 'BACKHAND' | 'SERVE' | 'VOLLEY'>('FOREHAND');
  const [isDetecting, setIsDetecting] = useState(true);
  const [recentSwings, setRecentSwings] = useState<SwingBiomechanics[]>([
    {
      id: 'sw_1',
      stroke: 'FOREHAND',
      speedKmh: 138,
      shoulderRotationDeg: 92,
      kneeBendDeg: 42,
      contactPointStatus: 'IN_FRONT',
      followThroughStatus: 'HIGH_FINISH',
      coachTip: 'Excellent contact point 25cm in front of lead hip with full extension.',
      isGood: true,
      timestamp: 'Just now',
    },
    {
      id: 'sw_2',
      stroke: 'BACKHAND',
      speedKmh: 124,
      shoulderRotationDeg: 78,
      kneeBendDeg: 35,
      contactPointStatus: 'LATE',
      followThroughStatus: 'SHORT',
      coachTip: 'Contact point was slightly late. Prepare unit turn 0.3s earlier.',
      isGood: false,
      timestamp: '2 mins ago',
    },
  ]);

  // Simulated live swing detection tick
  useEffect(() => {
    if (!isDetecting) return;
    const interval = setInterval(() => {
      // Periodic update simulation for tripod skeletal pose
    }, 4000);
    return () => clearInterval(interval);
  }, [isDetecting]);

  const handleSimulateSwing = (stroke: 'FOREHAND' | 'BACKHAND' | 'SERVE' | 'VOLLEY') => {
    setActiveStroke(stroke);
    const speed = stroke === 'SERVE' ? 185 : stroke === 'FOREHAND' ? 142 : 128;
    const isGood = Math.random() > 0.3;
    const newSwing: SwingBiomechanics = {
      id: `sw_${Date.now()}`,
      stroke,
      speedKmh: speed,
      shoulderRotationDeg: isGood ? 95 : 72,
      kneeBendDeg: isGood ? 45 : 28,
      contactPointStatus: isGood ? 'IN_FRONT' : 'LATE',
      followThroughStatus: isGood ? 'HIGH_FINISH' : 'SHORT',
      coachTip: isGood
        ? `Great ${stroke.toLowerCase()} mechanics! Perfect kinetic chain transfer.`
        : `Improve ${stroke.toLowerCase()}: Bend knees lower and extend through contact.`,
      isGood,
      timestamp: 'Just now',
    };
    setRecentSwings(prev => [newSwing, ...prev.slice(0, 4)]);
    if (onTriggerSimulation) onTriggerSimulation(stroke);
  };

  const canvasWidth = Math.min(SCREEN_WIDTH - 32, 360);
  const canvasHeight = 280;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Activity size={16} color="#00F59B" />
          <Text style={styles.titleText}>TRIPOD SKELETAL & SWING COACH</Text>
        </View>
        <View style={styles.badge}>
          <View style={styles.pulseDot} />
          <Text style={styles.badgeText}>AI POSE 60 FPS</Text>
        </View>
      </View>

      <Text style={styles.subtitle}>
        Tripod-mounted AI vision detects your skeletal pose, racket swing arc, and biomechanics in real time.
      </Text>

      {/* Live Viewfinder & Skeletal Overlay Canvas */}
      <View style={styles.viewfinderCard}>
        <Svg width={canvasWidth} height={canvasHeight}>
          {/* Court / Background Grid */}
          <Rect x={0} y={0} width={canvasWidth} height={canvasHeight} fill="#0B0F19" rx={12} />
          <Line x1={0} y1={canvasHeight * 0.75} x2={canvasWidth} y2={canvasHeight * 0.75} stroke="#1E293B" strokeWidth={2} />

          {/* Center Net Line Indicator */}
          <Line x1={canvasWidth / 2} y1={20} x2={canvasWidth / 2} y2={canvasHeight - 20} stroke="rgba(255,255,255,0.1)" strokeDasharray="4,4" />

          {/* Skeletal Pose Joints & Bones Overlay */}
          <G>
            {/* Spine / Torso */}
            <Line x1={canvasWidth / 2} y1={60} x2={canvasWidth / 2} y2={160} stroke="#00F59B" strokeWidth={3} />
            {/* Shoulders */}
            <Line x1={canvasWidth / 2 - 40} y1={80} x2={canvasWidth / 2 + 40} y2={80} stroke="#00F59B" strokeWidth={3} />
            {/* Left Arm (Non-hitting) */}
            <Line x1={canvasWidth / 2 - 40} y1={80} x2={canvasWidth / 2 - 70} y2={130} stroke="#00E5FF" strokeWidth={3} />
            <Line x1={canvasWidth / 2 - 70} y1={130} x2={canvasWidth / 2 - 80} y2={170} stroke="#00E5FF" strokeWidth={2} />
            {/* Right Arm (Racket Arm) - Dynamic Swing Arc */}
            <Line x1={canvasWidth / 2 + 40} y1={80} x2={canvasWidth / 2 + 80} y2={110} stroke="#CCFF00" strokeWidth={3} />
            <Line x1={canvasWidth / 2 + 80} y1={110} x2={canvasWidth / 2 + 120} y2={90} stroke="#CCFF00" strokeWidth={3} />

            {/* Racket Head & Swing Arc Path */}
            <Path
              d={`M ${canvasWidth / 2 + 120} 90 Q ${canvasWidth / 2 + 150} 60 ${canvasWidth / 2 + 130} 40`}
              fill="none"
              stroke="#CCFF00"
              strokeWidth={3}
              strokeDasharray="4,3"
            />

            {/* Hips */}
            <Line x1={canvasWidth / 2 - 25} y1={160} x2={canvasWidth / 2 + 25} y2={160} stroke="#00F59B" strokeWidth={3} />
            {/* Legs */}
            <Line x1={canvasWidth / 2 - 25} y1={160} x2={canvasWidth / 2 - 40} y2={220} stroke="#00F59B" strokeWidth={3} />
            <Line x1={canvasWidth / 2 - 40} y1={220} x2={canvasWidth / 2 - 50} y2={260} stroke="#00F59B" strokeWidth={3} />
            <Line x1={canvasWidth / 2 + 25} y1={160} x2={canvasWidth / 2 + 40} y2={220} stroke="#00F59B" strokeWidth={3} />
            <Line x1={canvasWidth / 2 + 40} y1={220} x2={canvasWidth / 2 + 50} y2={260} stroke="#00F59B" strokeWidth={3} />

            {/* Joint Nodes (Glowing Circles) */}
            <Circle cx={canvasWidth / 2} cy={45} r={8} fill="#00F59B" /> {/* Head */}
            <Circle cx={canvasWidth / 2 - 40} cy={80} r={5} fill="#00E5FF" /> {/* Left Shoulder */}
            <Circle cx={canvasWidth / 2 + 40} cy={80} r={5} fill="#CCFF00" /> {/* Right Shoulder */}
            <Circle cx={canvasWidth / 2 + 80} cy={110} r={5} fill="#CCFF00" /> {/* Right Elbow */}
            <Circle cx={canvasWidth / 2 + 120} cy={90} r={6} fill="#FF3B30" /> {/* Racket Contact Point */}
            <Circle cx={canvasWidth / 2 - 25} cy={160} r={5} fill="#00F59B" /> {/* Left Hip */}
            <Circle cx={canvasWidth / 2 + 25} cy={160} r={5} fill="#00F59B" /> {/* Right Hip */}
            <Circle cx={canvasWidth / 2 - 40} cy={220} r={5} fill="#00F59B" /> {/* Left Knee */}
            <Circle cx={canvasWidth / 2 + 40} cy={220} r={5} fill="#00F59B" /> {/* Right Knee */}
          </G>
        </Svg>

        {/* Live HUD Floating Tag */}
        <View style={styles.viewfinderHudTag}>
          <Zap size={12} color="#CCFF00" />
          <Text style={styles.viewfinderHudText}>ACTIVE STROKE: {activeStroke}</Text>
        </View>
      </View>

      {/* Manual Stroke Simulation Bar */}
      <View style={styles.simulationBar}>
        <Text style={styles.simBarLabel}>TEST STROKE DETECTOR:</Text>
        <View style={styles.simButtonsRow}>
          {(['FOREHAND', 'BACKHAND', 'SERVE', 'VOLLEY'] as const).map(stroke => (
            <TouchableOpacity
              key={stroke}
              style={[styles.simBtn, activeStroke === stroke && styles.simBtnActive]}
              onPress={() => handleSimulateSwing(stroke)}
            >
              <Text style={[styles.simBtnText, activeStroke === stroke && styles.simBtnTextActive]}>
                {stroke}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Latest Swing Biomechanics Breakdown */}
      {recentSwings.length > 0 && (
        <View style={styles.biomechCard}>
          <View style={styles.biomechHeader}>
            <Award size={16} color="#00F59B" />
            <Text style={styles.biomechTitle}>LATEST SWING BIOMECHANICS</Text>
          </View>

          <View style={styles.metricsGrid}>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>SHOULDER ROTATION</Text>
              <Text style={styles.metricVal}>{recentSwings[0].shoulderRotationDeg}°</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>KNEE BEND</Text>
              <Text style={styles.metricVal}>{recentSwings[0].kneeBendDeg}°</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>CONTACT POINT</Text>
              <Text style={[styles.metricVal, { fontSize: 12, color: recentSwings[0].isGood ? '#00F59B' : '#FF3B30' }]}>
                {recentSwings[0].contactPointStatus}
              </Text>
            </View>
          </View>

          {/* AI Coach Feedback Box */}
          <View style={[styles.coachBox, recentSwings[0].isGood ? styles.coachBoxGood : styles.coachBoxWarn]}>
            {recentSwings[0].isGood ? (
              <CheckCircle2 size={16} color="#00F59B" style={{ marginTop: 2 }} />
            ) : (
              <AlertCircle size={16} color="#FF3B30" style={{ marginTop: 2 }} />
            )}
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.coachBoxTitle}>AI SWING COACH FEEDBACK</Text>
              <Text style={styles.coachBoxText}>{recentSwings[0].coachTip}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Swing History Log */}
      <View style={styles.historySection}>
        <Text style={styles.historyTitle}>SESSION SWING HISTORY</Text>
        {recentSwings.map((sw, idx) => (
          <View key={sw.id} style={styles.historyRow}>
            <View style={[styles.historyIndicator, { backgroundColor: sw.isGood ? '#00F59B' : '#FF3B30' }]} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.historyStrokeText}>
                {sw.stroke} • {sw.speedKmh} km/h • {sw.timestamp}
              </Text>
              <Text style={styles.historyTipText} numberOfLines={1}>
                {sw.coachTip}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleText: {
    color: '#00F59B',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 245, 155, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 155, 0.3)',
    gap: 5,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00F59B',
  },
  badgeText: {
    color: '#00F59B',
    fontSize: 9,
    fontWeight: '800',
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 16,
  },
  viewfinderCard: {
    backgroundColor: '#070A11',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 16,
  },
  viewfinderHudTag: {
    position: 'absolute',
    top: 18,
    left: 18,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(7, 10, 17, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.4)',
    gap: 5,
  },
  viewfinderHudText: {
    color: '#CCFF00',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  simulationBar: {
    backgroundColor: THEME.colors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: 16,
  },
  simBarLabel: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  simButtonsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  simBtn: {
    flex: 1,
    backgroundColor: '#0F172A',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  simBtnActive: {
    backgroundColor: '#CCFF00',
    borderColor: '#CCFF00',
  },
  simBtnText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '900',
  },
  simBtnTextActive: {
    color: '#070A11',
  },
  biomechCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: 16,
  },
  biomechHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  biomechTitle: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  metricBox: {
    flex: 1,
    backgroundColor: '#070A11',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  metricLabel: {
    color: '#64748B',
    fontSize: 8,
    fontWeight: '800',
    marginBottom: 4,
  },
  metricVal: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  coachBox: {
    flexDirection: 'row',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  coachBoxGood: {
    backgroundColor: 'rgba(0, 245, 155, 0.1)',
    borderColor: 'rgba(0, 245, 155, 0.3)',
  },
  coachBoxWarn: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderColor: 'rgba(255, 59, 48, 0.3)',
  },
  coachBoxTitle: {
    color: '#E2E8F0',
    fontSize: 9,
    fontWeight: '900',
    marginBottom: 2,
  },
  coachBoxText: {
    color: '#94A3B8',
    fontSize: 10,
    lineHeight: 14,
  },
  historySection: {
    backgroundColor: THEME.colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  historyTitle: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '900',
    marginBottom: 10,
    letterSpacing: 0.8,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  historyIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  historyStrokeText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '800',
  },
  historyTipText: {
    color: '#64748B',
    fontSize: 9,
    marginTop: 2,
  },
});
