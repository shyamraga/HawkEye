import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, Circle, Ellipse, Line, Text as SvgText, Defs, RadialGradient, Stop } from 'react-native-svg';
import { THEME } from '../../theme/theme';

interface HawkEyeChalkVisualizerProps {
  decision: 'IN' | 'OUT';
  offsetMm: number; // Positive = inside court or touching line, Negative = clear gap outside line
  courtSurface?: string; // 'Hard' | 'Clay' | 'Grass'
  reviewedByPlayer?: string;
  isChallengeMode?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const HawkEyeChalkVisualizer: React.FC<HawkEyeChalkVisualizerProps> = ({
  decision,
  offsetMm,
  courtSurface = 'Hard',
  reviewedByPlayer,
  isChallengeMode = false,
}) => {
  const isIn = decision === 'IN';
  const badgeColor = isIn ? THEME.colors.neonGreen : THEME.colors.neonRed;

  // Surface background color
  const surfaceColor =
    courtSurface === 'Clay'
      ? '#8F3415'
      : courtSurface === 'Grass'
      ? '#14532D'
      : '#1E3A8A'; // US Open Blue

  // Geometry: SVG canvas size
  const svgWidth = Math.min(SCREEN_WIDTH - 32, 360);
  const svgHeight = 220;
  const centerX = svgWidth / 2;
  const centerY = svgHeight / 2;

  // Chalk line is vertically centered: 40px wide
  const lineWidth = 36;
  const lineX = centerX - lineWidth / 2;

  // Ball impact ellipse position relative to chalk line edge
  // When offsetMm = 0, edge of ball touches edge of line
  // Scale: 1mm = 1.2px
  const scale = 1.2;
  const ballRadiusX = 26; // compressed ball width
  const ballRadiusY = 18;

  // If IN, ball center overlaps or touches chalk line
  // If OUT, ball center is shifted away by gap
  const ballX = isIn
    ? centerX - Math.min(18, Math.max(-18, offsetMm * 0.5))
    : lineX + lineWidth + ballRadiusX + Math.abs(offsetMm) * scale * 0.3;

  return (
    <View style={styles.container}>
      {/* Broadcast Header Badge */}
      <View style={styles.headerRow}>
        <View style={styles.hawkeyePill}>
          <View style={[styles.statusDot, { backgroundColor: badgeColor }]} />
          <Text style={styles.hawkeyeTitle}>
            {isChallengeMode ? 'HAWK-EYE CHALLENGE REVIEW' : 'ELECTRONIC LINE CALL'}
          </Text>
        </View>
        <Text style={styles.surfaceLabel}>{courtSurface.toUpperCase()} COURT</Text>
      </View>

      {/* Chalk Line High-Definition Zoom Canvas */}
      <View style={styles.canvasWrapper}>
        <Svg width={svgWidth} height={svgHeight}>
          <Defs>
            {/* Court surface texture glow */}
            <RadialGradient id="ballGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#CCFF00" stopOpacity="0.9" />
              <Stop offset="80%" stopColor="#84CC16" stopOpacity="0.7" />
              <Stop offset="100%" stopColor="#4D7C0F" stopOpacity="0.0" />
            </RadialGradient>
            <RadialGradient id="chalkDust" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
              <Stop offset="60%" stopColor="#E2E8F0" stopOpacity="0.3" />
              <Stop offset="100%" stopColor="#CBD5E1" stopOpacity="0" />
            </RadialGradient>
          </Defs>

          {/* Court Surface Background */}
          <Rect x={0} y={0} width={svgWidth} height={svgHeight} rx={16} fill={surfaceColor} />

          {/* Court In-Bounds area marker */}
          <Rect
            x={0}
            y={0}
            width={lineX + lineWidth}
            height={svgHeight}
            fill={surfaceColor}
            opacity={0.95}
          />

          {/* High-Contrast White Chalk Line */}
          <Rect
            x={lineX}
            y={0}
            width={lineWidth}
            height={svgHeight}
            fill="#FFFFFF"
            stroke="rgba(255, 255, 255, 0.4)"
            strokeWidth={1}
          />

          {/* Subtle Chalk Texture Specks */}
          <Line
            x1={lineX + lineWidth}
            y1={0}
            x2={lineX + lineWidth}
            y2={svgHeight}
            stroke="rgba(255, 255, 255, 0.8)"
            strokeWidth={1.5}
            strokeDasharray="4, 3"
          />

          {/* Chalk Dust Explosion effect at bounce */}
          <Ellipse
            cx={ballX}
            cy={centerY}
            rx={ballRadiusX + 14}
            ry={ballRadiusY + 10}
            fill="url(#chalkDust)"
          />

          {/* Tennis Ball Compressed Impact Oval */}
          <Ellipse
            cx={ballX}
            cy={centerY}
            rx={ballRadiusX}
            ry={ballRadiusY}
            fill="#CCFF00"
            stroke="#FFFFFF"
            strokeWidth={2}
          />

          {/* Core contact mark */}
          <Ellipse
            cx={ballX}
            cy={centerY}
            rx={ballRadiusX * 0.65}
            ry={ballRadiusY * 0.6}
            fill="#9AE600"
          />

          {/* Distance Callout Guide Line */}
          <Line
            x1={lineX + lineWidth}
            y1={centerY + ballRadiusY + 16}
            x2={ballX}
            y2={centerY + ballRadiusY + 16}
            stroke={badgeColor}
            strokeWidth={2}
          />
          <Circle cx={lineX + lineWidth} cy={centerY + ballRadiusY + 16} r={3} fill={badgeColor} />
          <Circle cx={ballX} cy={centerY + ballRadiusY + 16} r={3} fill={badgeColor} />

          {/* Distance Text */}
          <SvgText
            x={centerX}
            y={svgHeight - 14}
            fill="#FFFFFF"
            fontSize={12}
            fontWeight="bold"
            textAnchor="middle"
          >
            {isIn
              ? `TOUCHING CHALK LINE (${Math.abs(offsetMm)} mm OVERLAP)`
              : `${Math.abs(offsetMm)} mm CLEAR OF LINE`}
          </SvgText>
        </Svg>
      </View>

      {/* Decision Footer & Millimeter Precision Callout */}
      <View style={styles.footerRow}>
        <View style={[styles.decisionPill, { backgroundColor: badgeColor }]}>
          <Text style={styles.decisionText}>{decision}</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>MARGIN</Text>
          <Text style={[styles.metricValue, { color: badgeColor }]}>
            {isIn ? `+${Math.abs(offsetMm)} mm` : `-${Math.abs(offsetMm)} mm`}
          </Text>
        </View>

        {reviewedByPlayer && (
          <View style={styles.playerReviewCard}>
            <Text style={styles.metricLabel}>CALL CHALLENGED BY</Text>
            <Text style={styles.reviewPlayerText} numberOfLines={1}>
              {reviewedByPlayer}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.colors.surfaceElevated,
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginVertical: THEME.spacing.sm,
    ...THEME.shadows.card,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.sm,
  },
  hawkeyePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  hawkeyeTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  surfaceLabel: {
    color: THEME.colors.tennisVolt,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  canvasWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: THEME.radius.md,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: THEME.spacing.md,
    gap: THEME.spacing.sm,
  },
  decisionPill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: THEME.radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 90,
  },
  decisionText: {
    color: '#000000',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  metricCard: {
    flex: 1,
    backgroundColor: THEME.colors.surface,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: 8,
    borderRadius: THEME.radius.sm,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  metricLabel: {
    color: THEME.colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  playerReviewCard: {
    flex: 1.2,
    backgroundColor: THEME.colors.surface,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: 8,
    borderRadius: THEME.radius.sm,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  reviewPlayerText: {
    color: THEME.colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
});
