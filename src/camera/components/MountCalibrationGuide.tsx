import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Svg, { Line, Circle, Rect, G } from 'react-native-svg';
import {
  Camera,
  Check,
  AlertTriangle,
  Sliders,
  Maximize2,
  Info,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react-native';
import {
  CameraMountType,
  MOUNT_PRESETS,
} from '../../services/sessionModes';
import { THEME } from '../../theme/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MountCalibrationGuideProps {
  currentMount?: CameraMountType;
  activePreset?: CameraMountType;
  onSelectMount?: (mount: CameraMountType) => void;
  onSelectPreset?: (mount: CameraMountType) => void;
  onDismiss?: () => void;
}

export const MountCalibrationGuide: React.FC<MountCalibrationGuideProps> = ({
  currentMount,
  activePreset,
  onSelectMount,
  onSelectPreset,
  onDismiss,
}) => {
  const selectedMount = currentMount || activePreset || 'FENCE_MOUNT';
  const handleSelect = onSelectMount || onSelectPreset || (() => {});
  const [levelPitchDeg, setLevelPitchDeg] = useState(-14);
  const activeConfig = MOUNT_PRESETS[selectedMount] || MOUNT_PRESETS.FENCE_MOUNT;

  const guideWidth = Math.min(SCREEN_WIDTH - 48, 340);
  const guideHeight = 160;

  return (
    <View style={styles.container}>
      {/* Header with Mount Type Chips */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Camera size={14} color="#00F59B" />
          <Text style={styles.titleText}>SWINGVISION MOUNT CALIBRATION</Text>
        </View>

        <View style={styles.accuracyPill}>
          <ShieldCheck size={12} color="#00F59B" />
          <Text style={styles.accuracyText}>{activeConfig.accuracyRating}</Text>
        </View>
      </View>

      {/* Mount Switcher Tabs */}
      <View style={styles.mountTabsRow}>
        {(['FENCE_MOUNT', 'GROUND_MODE', 'TRIPOD'] as const).map(mount => {
          const isSelected = selectedMount === mount;
          const label =
            mount === 'FENCE_MOUNT'
              ? 'Fence (10ft)'
              : mount === 'GROUND_MODE'
              ? 'Ground / Bench'
              : 'Tripod (5ft)';
          return (
            <TouchableOpacity
              key={mount}
              style={[styles.mountTabBtn, isSelected && styles.mountTabBtnActive]}
              onPress={() => handleSelect(mount)}
            >
              <Text
                style={[
                  styles.mountTabText,
                  isSelected && styles.mountTabTextActive,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Visual Alignment HUD Reticle */}
      <View style={styles.reticleCanvas}>
        <Svg width={guideWidth} height={guideHeight}>
          {/* Target Boundary Box */}
          <Rect
            x={10}
            y={10}
            width={guideWidth - 20}
            height={guideHeight - 20}
            fill="transparent"
            stroke="rgba(0, 245, 155, 0.3)"
            strokeWidth={1}
            strokeDasharray="4,4"
            rx={8}
          />

          {/* Corner Brackets */}
          {/* Top Left */}
          <Line x1={10} y1={25} x2={10} y2={10} stroke="#00F59B" strokeWidth={2} />
          <Line x1={10} y1={10} x2={25} y2={10} stroke="#00F59B" strokeWidth={2} />
          {/* Top Right */}
          <Line x1={guideWidth - 25} y1={10} x2={guideWidth - 10} y2={10} stroke="#00F59B" strokeWidth={2} />
          <Line x1={guideWidth - 10} y1={10} x2={guideWidth - 10} y2={25} stroke="#00F59B" strokeWidth={2} />
          {/* Bottom Left */}
          <Line x1={10} y1={guideHeight - 25} x2={10} y2={guideHeight - 10} stroke="#00F59B" strokeWidth={2} />
          <Line x1={10} y1={guideHeight - 10} x2={25} y2={guideHeight - 10} stroke="#00F59B" strokeWidth={2} />
          {/* Bottom Right */}
          <Line x1={guideWidth - 25} y1={guideHeight - 10} x2={guideWidth - 10} y2={guideHeight - 10} stroke="#00F59B" strokeWidth={2} />
          <Line x1={guideWidth - 10} y1={guideHeight - 25} x2={guideWidth - 10} y2={guideHeight - 10} stroke="#00F59B" strokeWidth={2} />

          {/* Net Tape Target Line (Upper Third) */}
          <Line
            x1={20}
            y1={guideHeight * 0.35}
            x2={guideWidth - 20}
            y2={guideHeight * 0.35}
            stroke="#CCFF00"
            strokeWidth={1.5}
            strokeDasharray="6,3"
          />

          {/* Baseline Target Line (Lower Third) */}
          <Line
            x1={20}
            y1={guideHeight * 0.75}
            x2={guideWidth - 20}
            y2={guideHeight * 0.75}
            stroke="#38BDF8"
            strokeWidth={1.5}
            strokeDasharray="6,3"
          />

          {/* Center Vertical Court Alignment Axis */}
          <Line
            x1={guideWidth / 2}
            y1={15}
            x2={guideWidth / 2}
            y2={guideHeight - 15}
            stroke="rgba(255, 255, 255, 0.4)"
            strokeWidth={1}
            strokeDasharray="4,4"
          />

          {/* Center Crosshair Target Ring */}
          <Circle
            cx={guideWidth / 2}
            cy={guideHeight * 0.55}
            r={12}
            fill="transparent"
            stroke="#00F59B"
            strokeWidth={1.5}
          />
          <Circle
            cx={guideWidth / 2}
            cy={guideHeight * 0.55}
            r={2}
            fill="#00F59B"
          />
        </Svg>

        {/* Dynamic HUD Labels */}
        <View style={styles.hudOverlay}>
          <Text style={styles.hudNetLabel}>ALIGN NET TAPE HERE ──</Text>
          <Text style={styles.hudBaselineLabel}>ALIGN NEAR BASELINE HERE ──</Text>
        </View>
      </View>

      {/* Specifications & Pitch Angle Status */}
      <View style={styles.specsRow}>
        <View style={styles.specItem}>
          <Text style={styles.specTitle}>HEIGHT</Text>
          <Text style={styles.specValue}>{activeConfig.recommendedHeight}</Text>
        </View>

        <View style={styles.specItem}>
          <Text style={styles.specTitle}>TILT ANGLE</Text>
          <Text style={styles.specValue}>{activeConfig.recommendedAngle}</Text>
        </View>

        <View style={styles.specItem}>
          <Text style={styles.specTitle}>HORIZON LEVEL</Text>
          <Text style={[styles.specValue, { color: '#00F59B' }]}>0.0° [LEVEL]</Text>
        </View>
      </View>

      {/* Guidelines checklist */}
      <View style={styles.guidelinesBox}>
        {activeConfig.guidelines.map((tip, idx) => (
          <View key={idx} style={styles.guidelineRow}>
            <Check size={12} color="#00F59B" />
            <Text style={styles.guidelineText}>{tip}</Text>
          </View>
        ))}
      </View>

      {onDismiss && (
        <TouchableOpacity style={styles.confirmBtn} onPress={onDismiss}>
          <Text style={styles.confirmBtnText}>CONFIRM MOUNT ALIGNMENT</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#070A11',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginVertical: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  titleText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#00F59B',
    letterSpacing: 0.8,
  },
  accuracyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 245, 155, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 155, 0.3)',
  },
  accuracyText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#00F59B',
  },
  mountTabsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  mountTabBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    alignItems: 'center',
  },
  mountTabBtnActive: {
    backgroundColor: '#CCFF00',
    borderColor: '#CCFF00',
  },
  mountTabText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },
  mountTabTextActive: {
    color: '#070A11',
  },
  reticleCanvas: {
    alignItems: 'center',
    position: 'relative',
    borderRadius: 10,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1E293B',
    overflow: 'hidden',
  },
  hudOverlay: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    bottom: 0,
  },
  hudNetLabel: {
    position: 'absolute',
    top: 48,
    left: 10,
    fontSize: 8,
    fontWeight: '800',
    color: '#CCFF00',
    letterSpacing: 0.5,
  },
  hudBaselineLabel: {
    position: 'absolute',
    top: 112,
    left: 10,
    fontSize: 8,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 0.5,
  },
  specsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  specItem: {
    alignItems: 'center',
  },
  specTitle: {
    fontSize: 8,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  specValue: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  guidelinesBox: {
    marginTop: 10,
    gap: 4,
  },
  guidelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  guidelineText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '500',
  },
  confirmBtn: {
    marginTop: 12,
    backgroundColor: '#00F59B',
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#070A11',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
