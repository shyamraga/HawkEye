import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Svg, {
  Rect,
  Line,
  Circle,
  G,
  Defs,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import {
  Filter,
  Flame,
  Target,
  Sparkles,
  TrendingUp,
  Activity,
  XCircle,
} from 'lucide-react-native';
import { ClassifiedShot, StrokeType } from '../../services/shotClassificationEngine';
import { THEME } from '../../theme/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export type CourtSectorId =
  | 'ALL'
  | 'DEUCE_SERVICE'
  | 'AD_SERVICE'
  | 'DEEP_FOREHAND'
  | 'DEEP_BACKHAND'
  | 'MIDCOURT'
  | 'OUT_LONG';

interface CourtHeatmapViewProps {
  shots: ClassifiedShot[];
  courtSurface?: 'Hard' | 'Clay' | 'Grass';
  onSelectShot?: (shot: ClassifiedShot) => void;
  playerOneName?: string;
  playerTwoName?: string;
}

export const CourtHeatmapView: React.FC<CourtHeatmapViewProps> = ({
  shots,
  courtSurface = 'Hard',
  onSelectShot,
  playerOneName,
  playerTwoName,
}) => {
  const [selectedStroke, setSelectedStroke] = useState<'ALL' | StrokeType>('ALL');
  const [selectedSector, setSelectedSector] = useState<CourtSectorId>('ALL');
  const [activeShot, setActiveShot] = useState<ClassifiedShot | null>(null);

  const courtColors = useMemo(() => {
    switch (courtSurface) {
      case 'Clay':
        return {
          outer: '#8C381E',
          inner: '#B54926',
          line: '#FFFFFF',
        };
      case 'Grass':
        return {
          outer: '#1E4620',
          inner: '#2E6930',
          line: '#FFFFFF',
        };
      default: // Hard
        return {
          outer: '#0A2540',
          inner: '#133E68',
          line: '#FFFFFF',
        };
    }
  }, [courtSurface]);

  // Filter shots based on selected stroke and sector
  const filteredShots = useMemo(() => {
    return shots.filter(shot => {
      if (selectedStroke !== 'ALL' && shot.stroke !== selectedStroke) {
        return false;
      }

      if (selectedSector === 'ALL') return true;

      const bx = shot.bouncePoint?.x ?? 4.1;
      const by = shot.bouncePoint?.y ?? 12.0;

      switch (selectedSector) {
        case 'DEUCE_SERVICE':
          return bx >= 4.115 && bx <= 8.23 && by >= 11.885 && by <= 18.285;
        case 'AD_SERVICE':
          return bx >= 0 && bx < 4.115 && by >= 11.885 && by <= 18.285;
        case 'DEEP_FOREHAND':
          return bx >= 4.115 && by >= 19.5;
        case 'DEEP_BACKHAND':
          return bx < 4.115 && by >= 19.5;
        case 'MIDCOURT':
          return by >= 18.285 && by < 19.5;
        case 'OUT_LONG':
          return by > 23.77 || shot.depth === 'OUT';
        default:
          return true;
      }
    });
  }, [shots, selectedStroke, selectedSector]);

  // Compute depth stats from filtered subset
  const depthStats = useMemo(() => {
    const total = filteredShots.length;
    if (total === 0) return { deep: 0, medium: 0, short: 0, out: 0 };

    let deep = 0, medium = 0, short = 0, out = 0;
    filteredShots.forEach(s => {
      if (s.depth === 'DEEP') deep++;
      else if (s.depth === 'MEDIUM') medium++;
      else if (s.depth === 'SHORT') short++;
      else if (s.depth === 'OUT') out++;
    });

    return {
      deep: Math.round((deep / total) * 100),
      medium: Math.round((medium / total) * 100),
      short: Math.round((short / total) * 100),
      out: Math.round((out / total) * 100),
    };
  }, [filteredShots]);

  // Coordinate mapper from court meters to SVG viewport
  // Court is 8.23m wide (plus alleys = 10.97m) x 23.77m long
  // We render far half-court: x: 0..8.23m, y: 11.885..24.5m
  const svgWidth = Math.min(SCREEN_WIDTH - 32, 360);
  const svgHeight = 320;
  const paddingX = 32;
  const paddingY = 24;

  const courtW = svgWidth - paddingX * 2;
  const courtH = svgHeight - paddingY * 2;

  const mapX = (metersX: number) => {
    const norm = Math.max(0, Math.min(8.23, metersX)) / 8.23;
    return paddingX + norm * courtW;
  };

  const mapY = (metersY: number) => {
    // 11.885m (Net) is at top, 23.77m (Baseline) is near bottom
    const norm = Math.max(11.885, Math.min(24.5, metersY)) - 11.885;
    const range = 24.5 - 11.885; // 12.615m
    return paddingY + (norm / range) * courtH;
  };

  // Precomputed line coordinates
  const netY = mapY(11.885);
  const serviceLineY = mapY(18.285);
  const baselineY = mapY(23.77);
  const leftSidelineX = mapX(0);
  const rightSidelineX = mapX(8.23);
  const centerLineX = mapX(4.115);

  return (
    <View style={styles.container}>
      {/* Heatmap Header Title */}
      <View style={styles.headerRow}>
        <View style={styles.titleWithIcon}>
          <Activity size={14} color="#00F59B" />
          <Text style={styles.headerTitle}>COURT LANDING HEATMAP</Text>
        </View>
        <Text style={styles.headerCount}>{shots.length} SHOTS</Text>
      </View>

      {/* Stroke Filter Bar */}
      <View style={styles.strokeFilterRow}>
        {(['ALL', 'SERVE', 'FOREHAND', 'BACKHAND'] as const).map(stroke => (
          <TouchableOpacity
            key={stroke}
            style={[
              styles.strokeFilterBtn,
              selectedStroke === stroke && styles.strokeFilterBtnActive,
            ]}
            onPress={() => {
              setSelectedStroke(stroke);
              setActiveShot(null);
            }}
          >
            <Text
              style={[
                styles.strokeFilterText,
                selectedStroke === stroke && styles.strokeFilterTextActive,
              ]}
            >
              {stroke}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* SVG Court Heatmap View */}
      <View style={styles.courtContainer}>
        <Svg width={svgWidth} height={svgHeight}>
          <Defs>
            <RadialGradient id="winnerHeatGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#00F59B" stopOpacity="0.8" />
              <Stop offset="50%" stopColor="#00F59B" stopOpacity="0.3" />
              <Stop offset="100%" stopColor="#00F59B" stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id="rallyHeatGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#00E5FF" stopOpacity="0.8" />
              <Stop offset="50%" stopColor="#00E5FF" stopOpacity="0.3" />
              <Stop offset="100%" stopColor="#00E5FF" stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id="errorHeatGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#FF3B30" stopOpacity="0.8" />
              <Stop offset="50%" stopColor="#FF3B30" stopOpacity="0.3" />
              <Stop offset="100%" stopColor="#FF3B30" stopOpacity="0" />
            </RadialGradient>
          </Defs>

          {/* Court Surrounding Runoff */}
          <Rect
            x={4}
            y={4}
            width={svgWidth - 8}
            height={svgHeight - 8}
            fill={courtColors.outer}
            rx={8}
          />

          {/* Playing Field Rect */}
          <Rect
            x={leftSidelineX}
            y={netY}
            width={courtW}
            height={baselineY - netY}
            fill={courtColors.inner}
          />

          {/* Interactive Court Sectors Overlay */}
          {/* Deuce Service Box (Right of center, net to service line) */}
          <Rect
            x={centerLineX}
            y={netY}
            width={courtW / 2}
            height={serviceLineY - netY}
            fill={selectedSector === 'DEUCE_SERVICE' ? 'rgba(204, 255, 0, 0.25)' : 'transparent'}
            stroke={selectedSector === 'DEUCE_SERVICE' ? '#CCFF00' : 'transparent'}
            strokeWidth={2}
            onPress={() => setSelectedSector(prev => prev === 'DEUCE_SERVICE' ? 'ALL' : 'DEUCE_SERVICE')}
          />

          {/* Ad Service Box (Left of center, net to service line) */}
          <Rect
            x={leftSidelineX}
            y={netY}
            width={courtW / 2}
            height={serviceLineY - netY}
            fill={selectedSector === 'AD_SERVICE' ? 'rgba(204, 255, 0, 0.25)' : 'transparent'}
            stroke={selectedSector === 'AD_SERVICE' ? '#CCFF00' : 'transparent'}
            strokeWidth={2}
            onPress={() => setSelectedSector(prev => prev === 'AD_SERVICE' ? 'ALL' : 'AD_SERVICE')}
          />

          {/* Deep Forehand (Right, beyond service line to baseline) */}
          <Rect
            x={centerLineX}
            y={serviceLineY}
            width={courtW / 2}
            height={baselineY - serviceLineY}
            fill={selectedSector === 'DEEP_FOREHAND' ? 'rgba(204, 255, 0, 0.25)' : 'transparent'}
            stroke={selectedSector === 'DEEP_FOREHAND' ? '#CCFF00' : 'transparent'}
            strokeWidth={2}
            onPress={() => setSelectedSector(prev => prev === 'DEEP_FOREHAND' ? 'ALL' : 'DEEP_FOREHAND')}
          />

          {/* Deep Backhand (Left, beyond service line to baseline) */}
          <Rect
            x={leftSidelineX}
            y={serviceLineY}
            width={courtW / 2}
            height={baselineY - serviceLineY}
            fill={selectedSector === 'DEEP_BACKHAND' ? 'rgba(204, 255, 0, 0.25)' : 'transparent'}
            stroke={selectedSector === 'DEEP_BACKHAND' ? '#CCFF00' : 'transparent'}
            strokeWidth={2}
            onPress={() => setSelectedSector(prev => prev === 'DEEP_BACKHAND' ? 'ALL' : 'DEEP_BACKHAND')}
          />

          {/* Court Markings */}
          {/* Net (Double Line at Top) */}
          <Line
            x1={leftSidelineX - 12}
            y1={netY}
            x2={rightSidelineX + 12}
            y2={netY}
            stroke="#94A3B8"
            strokeWidth={4}
          />
          <Line
            x1={leftSidelineX - 12}
            y1={netY + 2}
            x2={rightSidelineX + 12}
            y2={netY + 2}
            stroke="#FFFFFF"
            strokeWidth={2}
          />

          {/* Baseline */}
          <Line
            x1={leftSidelineX}
            y1={baselineY}
            x2={rightSidelineX}
            y2={baselineY}
            stroke={courtColors.line}
            strokeWidth={3}
          />

          {/* Center Mark on Baseline */}
          <Line
            x1={centerLineX}
            y1={baselineY - 6}
            x2={centerLineX}
            y2={baselineY}
            stroke={courtColors.line}
            strokeWidth={3}
          />

          {/* Service Line */}
          <Line
            x1={leftSidelineX}
            y1={serviceLineY}
            x2={rightSidelineX}
            y2={serviceLineY}
            stroke={courtColors.line}
            strokeWidth={2}
          />

          {/* Center Service Line */}
          <Line
            x1={centerLineX}
            y1={netY}
            x2={centerLineX}
            y2={serviceLineY}
            stroke={courtColors.line}
            strokeWidth={2}
          />

          {/* Sidelines */}
          <Line
            x1={leftSidelineX}
            y1={netY}
            x2={leftSidelineX}
            y2={baselineY}
            stroke={courtColors.line}
            strokeWidth={2}
          />
          <Line
            x1={rightSidelineX}
            y1={netY}
            x2={rightSidelineX}
            y2={baselineY}
            stroke={courtColors.line}
            strokeWidth={2}
          />

          {/* Bounce Landing Markers with Heat Glow */}
          {filteredShots.map(shot => {
            const bx = shot.bouncePoint?.x ?? 4.1;
            const by = shot.bouncePoint?.y ?? 12.0;
            const px = mapX(bx);
            const py = mapY(by);

            const isWinner = shot.outcome === 'WINNER' || shot.outcome === 'ACE';
            const isError = shot.depth === 'OUT' || shot.outcome === 'UNFORCED_ERROR';
            const glowId = isWinner
              ? 'winnerHeatGlow'
              : isError
              ? 'errorHeatGlow'
              : 'rallyHeatGlow';
            const dotColor = isWinner ? '#00F59B' : isError ? '#FF3B30' : '#00E5FF';

            const isSelected = activeShot?.id === shot.id;

            return (
              <G key={shot.id}>
                {/* Radial Heat Density Glow */}
                <Circle cx={px} cy={py} r={14} fill={`url(#${glowId})`} />

                {/* Solid Core Dot */}
                <Circle
                  cx={px}
                  cy={py}
                  r={isSelected ? 6 : 4}
                  fill={dotColor}
                  stroke="#FFFFFF"
                  strokeWidth={isSelected ? 2 : 1}
                  onPress={() => {
                    setActiveShot(shot);
                    if (onSelectShot) onSelectShot(shot);
                  }}
                />
              </G>
            );
          })}
        </Svg>
      </View>

      {/* Sector Quick-Select Chips */}
      <View style={styles.sectorChipsRow}>
        <TouchableOpacity
          style={[
            styles.sectorChip,
            selectedSector === 'DEUCE_SERVICE' && styles.sectorChipActive,
          ]}
          onPress={() =>
            setSelectedSector(prev => (prev === 'DEUCE_SERVICE' ? 'ALL' : 'DEUCE_SERVICE'))
          }
        >
          <Text
            style={[
              styles.sectorChipText,
              selectedSector === 'DEUCE_SERVICE' && styles.sectorChipTextActive,
            ]}
          >
            Deuce Box
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.sectorChip,
            selectedSector === 'AD_SERVICE' && styles.sectorChipActive,
          ]}
          onPress={() =>
            setSelectedSector(prev => (prev === 'AD_SERVICE' ? 'ALL' : 'AD_SERVICE'))
          }
        >
          <Text
            style={[
              styles.sectorChipText,
              selectedSector === 'AD_SERVICE' && styles.sectorChipTextActive,
            ]}
          >
            Ad Box
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.sectorChip,
            selectedSector === 'DEEP_FOREHAND' && styles.sectorChipActive,
          ]}
          onPress={() =>
            setSelectedSector(prev => (prev === 'DEEP_FOREHAND' ? 'ALL' : 'DEEP_FOREHAND'))
          }
        >
          <Text
            style={[
              styles.sectorChipText,
              selectedSector === 'DEEP_FOREHAND' && styles.sectorChipTextActive,
            ]}
          >
            Deep FH
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.sectorChip,
            selectedSector === 'DEEP_BACKHAND' && styles.sectorChipActive,
          ]}
          onPress={() =>
            setSelectedSector(prev => (prev === 'DEEP_BACKHAND' ? 'ALL' : 'DEEP_BACKHAND'))
          }
        >
          <Text
            style={[
              styles.sectorChipText,
              selectedSector === 'DEEP_BACKHAND' && styles.sectorChipTextActive,
            ]}
          >
            Deep BH
          </Text>
        </TouchableOpacity>

        {selectedSector !== 'ALL' && (
          <TouchableOpacity
            style={styles.resetSectorBtn}
            onPress={() => setSelectedSector('ALL')}
          >
            <Text style={styles.resetSectorText}>Reset</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Depth Breakdown Bar */}
      <View style={styles.depthCard}>
        <View style={styles.depthHeader}>
          <Text style={styles.depthTitle}>BALL DEPTH DISTRIBUTION</Text>
          <Text style={styles.depthTotal}>{filteredShots.length} SHOTS</Text>
        </View>

        <View style={styles.depthProgressBar}>
          <View style={[styles.depthSegment, { flex: depthStats.deep, backgroundColor: '#00F59B' }]} />
          <View style={[styles.depthSegment, { flex: depthStats.medium, backgroundColor: '#00E5FF' }]} />
          <View style={[styles.depthSegment, { flex: depthStats.short, backgroundColor: '#FACC15' }]} />
          <View style={[styles.depthSegment, { flex: depthStats.out, backgroundColor: '#FF3B30' }]} />
        </View>

        <View style={styles.depthLegendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#00F59B' }]} />
            <Text style={styles.legendLabel}>Deep ({depthStats.deep}%)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#00E5FF' }]} />
            <Text style={styles.legendLabel}>Mid ({depthStats.medium}%)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FACC15' }]} />
            <Text style={styles.legendLabel}>Short ({depthStats.short}%)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FF3B30' }]} />
            <Text style={styles.legendLabel}>Out ({depthStats.out}%)</Text>
          </View>
        </View>
      </View>

      {/* Active Shot Telemetry Card */}
      {activeShot && (
        <View style={styles.activeShotCard}>
          <View style={styles.activeShotTop}>
            <View style={styles.activeShotBadge}>
              <Text style={styles.activeShotStroke}>{activeShot.stroke}</Text>
            </View>
            <Text style={styles.activeShotSpeed}>{activeShot.speedKmh} KM/H</Text>
          </View>

          <View style={styles.activeShotDetails}>
            <Text style={styles.activeShotMeta}>
              Spin: {activeShot.spin.toUpperCase()} ({activeShot.spinRpm} RPM) • Depth: {activeShot.depth}
            </Text>
            <Text style={styles.activeShotOutcome}>
              Outcome: {activeShot.outcome.replace('_', ' ')}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#070A11',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginVertical: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#00F59B',
    letterSpacing: 0.8,
  },
  headerCount: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  strokeFilterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  strokeFilterBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  strokeFilterBtnActive: {
    backgroundColor: '#CCFF00',
    borderColor: '#CCFF00',
  },
  strokeFilterText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  strokeFilterTextActive: {
    color: '#070A11',
  },
  courtContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  sectorChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
    justifyContent: 'center',
  },
  sectorChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  sectorChipActive: {
    borderColor: '#CCFF00',
    backgroundColor: 'rgba(204, 255, 0, 0.15)',
  },
  sectorChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
  },
  sectorChipTextActive: {
    color: '#CCFF00',
  },
  resetSectorBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  resetSectorText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FF3B30',
  },
  depthCard: {
    marginTop: 14,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  depthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  depthTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  depthTotal: {
    fontSize: 10,
    fontWeight: '700',
    color: '#38BDF8',
  },
  depthProgressBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#1E293B',
  },
  depthSegment: {
    height: '100%',
  },
  depthLegendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  activeShotCard: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#0F172A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#00F59B',
  },
  activeShotTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activeShotBadge: {
    backgroundColor: 'rgba(0, 245, 155, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  activeShotStroke: {
    color: '#00F59B',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  activeShotSpeed: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  activeShotDetails: {
    marginTop: 6,
  },
  activeShotMeta: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  activeShotOutcome: {
    fontSize: 11,
    color: '#CCFF00',
    fontWeight: '700',
    marginTop: 2,
  },
});
