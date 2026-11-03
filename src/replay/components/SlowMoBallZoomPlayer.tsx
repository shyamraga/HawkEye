import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  Dimensions,
} from 'react-native';
import Svg, {
  Rect,
  Line,
  Circle,
  Ellipse,
  Path,
  G,
  Defs,
  RadialGradient,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import {
  Play,
  Pause,
  RotateCcw,
  Zap,
  Repeat,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Crosshair,
  Sliders,
  Sparkles,
} from 'lucide-react-native';
import { THEME } from '../../theme/theme';

export interface TrajectoryPointData {
  x: number;
  y: number;
  z?: number;
  u?: number;
  v?: number;
  t?: number;
}

export interface SlowMoBallZoomPlayerProps {
  trajectory?: TrajectoryPointData[];
  bouncePoint?: {
    x?: number;
    y?: number;
    u?: number;
    v?: number;
    decision: 'IN' | 'OUT';
    offsetMm?: number;
    distanceCm?: number;
  } | null;
  courtSurface?: 'Hard' | 'Clay' | 'Grass';
  width?: number;
  height?: number;
  autoPlay?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export const SlowMoBallZoomPlayer: React.FC<SlowMoBallZoomPlayerProps> = ({
  trajectory = [],
  bouncePoint = null,
  courtSurface = 'Hard',
  width: customWidth,
  height: customHeight,
  autoPlay = false,
  style,
  testID = 'slow-mo-ball-zoom-player',
}) => {
  const screenWidth = Dimensions.get('window').width || 380;
  const playerWidth = customWidth || screenWidth - 32;
  const playerHeight = customHeight || 380;

  // Pre-seed realistic tennis rally trajectory if not provided
  const activeTrajectory: TrajectoryPointData[] = useMemo(() => {
    if (trajectory && trajectory.length >= 3) {
      return trajectory;
    }
    // High-precision 25-frame curved arc with flight and impact
    const pts: TrajectoryPointData[] = [];
    const totalFrames = 26;
    const impactIdx = 16;
    for (let i = 0; i < totalFrames; i++) {
      const t = i / (totalFrames - 1);
      // Normalized coordinates [0..1]
      // Ball approaches baseline from top-right to bottom-left line impact
      let x = 0.72 - t * 0.44;
      let y = 0.15 + t * 0.72;
      let z = 0;
      if (i <= impactIdx) {
        // Approaching bounce: parabolic descent
        const rel = i / impactIdx;
        z = Math.max(0, 2.8 * (1 - rel * rel));
      } else {
        // Post bounce rebound
        const rel = (i - impactIdx) / (totalFrames - 1 - impactIdx);
        z = Math.max(0, 1.4 * Math.sin(rel * Math.PI * 0.8));
      }
      pts.push({
        x,
        y,
        z,
        u: x * playerWidth,
        v: y * playerHeight,
        t: Number((i * 0.04).toFixed(3)),
      });
    }
    return pts;
  }, [trajectory, playerWidth, playerHeight]);

  const bounceIdx = useMemo(() => {
    return Math.floor(activeTrajectory.length * 0.64);
  }, [activeTrajectory]);

  const activeBounce = useMemo(() => {
    if (bouncePoint) return bouncePoint;
    const pt = activeTrajectory[bounceIdx] || { x: 0.5, y: 0.6, u: playerWidth * 0.5, v: playerHeight * 0.6 };
    return {
      x: pt.x,
      y: pt.y,
      u: pt.u,
      v: pt.v,
      decision: 'IN' as const,
      offsetMm: 14,
      distanceCm: 1.4,
    };
  }, [bouncePoint, activeTrajectory, bounceIdx, playerWidth, playerHeight]);

  // Playback States
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(0.25); // Default: 0.25x Slow-Mo
  const [isLooping, setIsLooping] = useState(true);

  // Zoom Camera Modes: 'auto' (dynamic tracking + impact zoom), 1.0 (wide), 2.5 (ball track), 5.0 (extreme ball zoom)
  const [zoomMode, setZoomMode] = useState<'auto' | 1.0 | 2.5 | 5.0>('auto');

  const animationTimerRef = useRef<any>(null);

  // Playback Loop
  useEffect(() => {
    if (!isPlaying) {
      if (animationTimerRef.current) clearInterval(animationTimerRef.current);
      return;
    }

    // Base interval at 1.0x is ~40ms (25fps). Scale inversely with speed.
    const intervalMs = Math.max(16, Math.round(40 / playbackSpeed));

    animationTimerRef.current = setInterval(() => {
      setCurrentFrame(prev => {
        if (prev >= activeTrajectory.length - 1) {
          if (isLooping) return 0;
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => {
      if (animationTimerRef.current) clearInterval(animationTimerRef.current);
    };
  }, [isPlaying, playbackSpeed, isLooping, activeTrajectory.length]);

  // Current ball data
  const currentPt = activeTrajectory[currentFrame] || activeTrajectory[0] || { u: playerWidth / 2, v: playerHeight / 2, z: 0 };
  const ballX = currentPt.u ?? currentPt.x * playerWidth;
  const ballY = currentPt.v ?? currentPt.y * playerHeight;
  const ballZ = currentPt.z ?? 0;

  // Impact Proximity
  const framesToImpact = Math.abs(currentFrame - bounceIdx);
  const isAtImpact = currentFrame === bounceIdx;
  const isNearImpact = framesToImpact <= 2;

  // Camera Zoom Calculation
  const effectiveZoom = useMemo(() => {
    if (typeof zoomMode === 'number') {
      return zoomMode;
    }
    // Dynamic Broadcast 'auto' mode:
    // Starts at 1.4x, climbs smoothly to 4.5x macro zoom right at impact, then relaxes
    if (framesToImpact <= 3) {
      return 4.5 - framesToImpact * 0.6;
    } else if (framesToImpact <= 8) {
      return 2.5 - (framesToImpact - 3) * 0.2;
    }
    return 1.4;
  }, [zoomMode, framesToImpact]);

  // Camera Target (smoothly centers ball in viewport)
  const camX = ballX;
  const camY = ballY;

  // Ball Squash & Stretch compression at bounce moment
  const ballRadius = 8;
  const ballScaleX = isAtImpact ? 1.35 : 1.0;
  const ballScaleY = isAtImpact ? 0.65 : 1.0;

  // Ball shadow displacement based on height (z)
  const shadowOffsetY = Math.min(30, ballZ * 12);
  const shadowScale = Math.max(0.4, 1.0 - ballZ * 0.2);

  // Surface colors
  const surfaceColors = {
    Hard: { court: '#1E3A8A', outer: '#172554', line: '#FFFFFF', chalk: 'rgba(255,255,255,0.9)' },
    Clay: { court: '#C2410C', outer: '#9A3412', line: '#FFFFFF', chalk: 'rgba(251,146,60,0.85)' },
    Grass: { court: '#15803D', outer: '#14532D', line: '#FFFFFF', chalk: 'rgba(255,255,255,0.9)' },
  };
  const activeSurface = surfaceColors[courtSurface] || surfaceColors.Hard;

  // Path data for trajectory trail up to current frame
  const visibleTrail = activeTrajectory.slice(0, currentFrame + 1);
  let trailPathData = '';
  if (visibleTrail.length > 0) {
    const first = visibleTrail[0];
    trailPathData = `M ${first.u ?? first.x * playerWidth} ${first.v ?? first.y * playerHeight}`;
    for (let i = 1; i < visibleTrail.length; i++) {
      const p = visibleTrail[i];
      trailPathData += ` L ${p.u ?? p.x * playerWidth} ${p.v ?? p.y * playerHeight}`;
    }
  }

  // Baseline and line reference near impact
  const baselineY = (activeBounce.v ?? activeBounce.y * playerHeight) + (activeBounce.decision === 'IN' ? 8 : -8);

  return (
    <View style={[styles.container, { width: playerWidth }, style]} testID={testID}>
      {/* Top Broadcast Bar */}
      <View style={styles.broadcastHeader}>
        <View style={styles.brandRow}>
          <Zap size={16} color={THEME.colors.tennisVolt} />
          <Text style={styles.brandTitle}>HAWK-EYE 240 FPS SLOW-MO</Text>
          <View style={styles.fpsBadge}>
            <Text style={styles.fpsBadgeText}>{playbackSpeed}x SLOW-MO</Text>
          </View>
        </View>

        <View style={styles.zoomIndicator}>
          <Crosshair size={14} color={THEME.colors.electricBlue} />
          <Text style={styles.zoomIndicatorText}>
            ZOOM: {effectiveZoom.toFixed(1)}x {zoomMode === 'auto' ? '[AUTO]' : ''}
          </Text>
        </View>
      </View>

      {/* SVG Canvas with Dynamic Ball-Tracking Camera */}
      <View style={[styles.canvasWrapper, { height: playerHeight }]}>
        <Svg width={playerWidth} height={playerHeight} style={styles.svgCanvas}>
          <Defs>
            {/* Tennis Ball Radial Gradient */}
            <RadialGradient id="ballGradient" cx="35%" cy="35%" r="65%">
              <Stop offset="0%" stopColor="#FAFF00" />
              <Stop offset="65%" stopColor="#CCFF00" />
              <Stop offset="100%" stopColor="#84CC16" />
            </RadialGradient>

            {/* Ball Shadow Gradient */}
            <RadialGradient id="shadowGradient" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="rgba(0,0,0,0.6)" />
              <Stop offset="80%" stopColor="rgba(0,0,0,0.2)" />
              <Stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </RadialGradient>

            {/* Chalk Dust Gradient */}
            <RadialGradient id="chalkGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
              <Stop offset="60%" stopColor="rgba(255,255,255,0.4)" />
              <Stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </RadialGradient>
          </Defs>

          {/* Camera Viewport Group: transforms to zoom and center on ball */}
          <G
            transform={`translate(${playerWidth / 2}, ${playerHeight / 2}) scale(${effectiveZoom}) translate(${-camX}, ${-camY})`}
          >
            {/* Outer Court */}
            <Rect
              x={-playerWidth * 2}
              y={-playerHeight * 2}
              width={playerWidth * 5}
              height={playerHeight * 5}
              fill={activeSurface.outer}
            />

            {/* Court Playing Field */}
            <Rect
              x={playerWidth * 0.15}
              y={playerHeight * 0.1}
              width={playerWidth * 0.7}
              height={playerHeight * 0.8}
              fill={activeSurface.court}
              rx={6}
            />

            {/* Regulation Court Lines (White, 50mm scaled) */}
            {/* Baseline */}
            <Line
              x1={playerWidth * 0.15}
              y1={baselineY}
              x2={playerWidth * 0.85}
              y2={baselineY}
              stroke={activeSurface.line}
              strokeWidth={8}
            />

            {/* Singles Sideline */}
            <Line
              x1={playerWidth * 0.28}
              y1={playerHeight * 0.1}
              x2={playerWidth * 0.28}
              y2={playerHeight * 0.9}
              stroke={activeSurface.line}
              strokeWidth={5}
            />

            {/* Doubles Sideline */}
            <Line
              x1={playerWidth * 0.15}
              y1={playerHeight * 0.1}
              x2={playerWidth * 0.15}
              y2={playerHeight * 0.9}
              stroke={activeSurface.line}
              strokeWidth={5}
            />

            {/* Service Line */}
            <Line
              x1={playerWidth * 0.28}
              y1={playerHeight * 0.45}
              x2={playerWidth * 0.72}
              y2={playerHeight * 0.45}
              stroke={activeSurface.line}
              strokeWidth={4}
            />

            {/* Center Service Line */}
            <Line
              x1={playerWidth * 0.5}
              y1={playerHeight * 0.45}
              x2={playerWidth * 0.5}
              y2={baselineY}
              stroke={activeSurface.line}
              strokeWidth={4}
            />

            {/* Trajectory Flight Path Arc (Glowing Neon Cyan) */}
            {trailPathData ? (
              <Path
                d={trailPathData}
                stroke="#00FFFF"
                strokeWidth={3}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeOpacity={0.85}
              />
            ) : null}

            {/* Past Trajectory Point Dots */}
            {visibleTrail.map((p, idx) => (
              <Circle
                key={`traj-${idx}`}
                cx={p.u ?? p.x * playerWidth}
                cy={p.v ?? p.y * playerHeight}
                r={2}
                fill="#38BDF8"
                opacity={0.6}
              />
            ))}

            {/* Ball Ground Shadow */}
            <Ellipse
              cx={ballX}
              cy={ballY + shadowOffsetY}
              rx={ballRadius * shadowScale * 1.2}
              ry={ballRadius * shadowScale * 0.5}
              fill="url(#shadowGradient)"
            />

            {/* Chalk Dust Particle Explosion at Bounce Impact */}
            {isNearImpact && (
              <G>
                {/* Chalk contact flash */}
                <Circle cx={ballX} cy={ballY} r={16} fill="url(#chalkGlow)" opacity={0.7} />
                {/* Radial chalk specks */}
                {[-14, -8, -4, 4, 8, 12].map((offX, sIdx) => (
                  <Circle
                    key={`speck-${sIdx}`}
                    cx={ballX + offX}
                    cy={ballY + (sIdx % 2 === 0 ? -6 : 6)}
                    r={1.5}
                    fill="#FFFFFF"
                    opacity={0.9}
                  />
                ))}
              </G>
            )}

            {/* The Tennis Ball (High-definition felt + seam + compression) */}
            <G transform={`translate(${ballX}, ${ballY}) scale(${ballScaleX}, ${ballScaleScaleY(ballScaleY)})`}>
              {/* Ball Body */}
              <Circle cx={0} cy={0} r={ballRadius} fill="url(#ballGradient)" />
              {/* Ball Seam (Signature White Tennis Curve) */}
              <Path
                d={`M -${ballRadius * 0.7} -${ballRadius * 0.5} Q 0 0 -${ballRadius * 0.7} ${ballRadius * 0.5}`}
                stroke="#FFFFFF"
                strokeWidth={1.2}
                fill="none"
                strokeOpacity={0.9}
              />
              <Path
                d={`M ${ballRadius * 0.7} -${ballRadius * 0.5} Q 0 0 ${ballRadius * 0.7} ${ballRadius * 0.5}`}
                stroke="#FFFFFF"
                strokeWidth={1.2}
                fill="none"
                strokeOpacity={0.9}
              />
              {/* Specular 3D Highlight */}
              <Circle cx={-ballRadius * 0.3} cy={-ballRadius * 0.3} r={ballRadius * 0.25} fill="#FFFFFF" opacity={0.6} />
            </G>

            {/* Optical Tracking Reticle / Crosshair surrounding the ball */}
            <G transform={`translate(${ballX}, ${ballY})`}>
              <Circle cx={0} cy={0} r={ballRadius + 9} stroke="#38BDF8" strokeWidth={1} strokeDasharray="3,3" fill="none" opacity={0.8} />
              <Line x1={-(ballRadius + 14)} y1={0} x2={-(ballRadius + 7)} y2={0} stroke="#38BDF8" strokeWidth={1.5} />
              <Line x1={ballRadius + 7} y1={0} x2={ballRadius + 14} y2={0} stroke="#38BDF8" strokeWidth={1.5} />
              <Line x1={0} y1={-(ballRadius + 14)} x2={0} y2={-(ballRadius + 7)} stroke="#38BDF8" strokeWidth={1.5} />
              <Line x1={0} y1={ballRadius + 7} x2={0} y2={ballRadius + 14} stroke="#38BDF8" strokeWidth={1.5} />
            </G>

            {/* High-Precision Measurement Indicator at Impact */}
            {currentFrame >= bounceIdx && (
              <G transform={`translate(${ballX + 18}, ${ballY - 12})`}>
                <Rect
                  x={0}
                  y={0}
                  width={activeBounce.decision === 'IN' ? 76 : 82}
                  height={22}
                  rx={4}
                  fill={activeBounce.decision === 'IN' ? 'rgba(16, 185, 129, 0.92)' : 'rgba(239, 68, 68, 0.92)'}
                />
                <SvgText
                  x={6}
                  y={15}
                  fill="#FFFFFF"
                  fontSize="11"
                  fontWeight="bold"
                >
                  {activeBounce.decision} ({activeBounce.offsetMm ? `${activeBounce.offsetMm > 0 ? '+' : ''}${activeBounce.offsetMm}mm` : 'LINE'})
                </SvgText>
              </G>
            )}
          </G>
        </Svg>

        {/* Live Impact Overlay Banner (when at or near bounce) */}
        {isAtImpact && (
          <View style={styles.impactBadgeOverlay}>
            <Sparkles size={14} color="#070A11" />
            <Text style={styles.impactBadgeText}>
              BALL IMPACT MOMENT ({playbackSpeed}x SLOW-MO)
            </Text>
          </View>
        )}

        {/* Floating Call Decision Banner */}
        {currentFrame >= bounceIdx && (
          <View
            style={[
              styles.floatingVerdict,
              {
                borderColor: activeBounce.decision === 'IN' ? THEME.colors.neonGreen : THEME.colors.neonRed,
                backgroundColor: 'rgba(7, 10, 17, 0.88)',
              },
            ]}
          >
            <View
              style={[
                styles.verdictDot,
                { backgroundColor: activeBounce.decision === 'IN' ? THEME.colors.neonGreen : THEME.colors.neonRed },
              ]}
            />
            <Text
              style={[
                styles.verdictText,
                { color: activeBounce.decision === 'IN' ? THEME.colors.neonGreen : THEME.colors.neonRed },
              ]}
            >
              CALL: {activeBounce.decision} ({activeBounce.offsetMm ? `${activeBounce.offsetMm > 0 ? '+' : ''}${activeBounce.offsetMm} mm` : ''})
            </Text>
          </View>
        )}
      </View>

      {/* Scrub Bar & Timeline */}
      <View style={styles.scrubberSection}>
        <View style={styles.timelineRow}>
          <Text style={styles.timeLabel}>
            FRAME {currentFrame + 1} / {activeTrajectory.length}
          </Text>
          <Text style={styles.timeVal}>
            T = {(currentPt.t ?? currentFrame * 0.04).toFixed(2)}s
          </Text>
        </View>

        {/* Touch / Clickable Track */}
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.scrubTrack}
          onPress={(e) => {
            const touchX = e.nativeEvent.locationX;
            const ratio = Math.max(0, Math.min(1, touchX / (playerWidth - 32)));
            const targetFrame = Math.round(ratio * (activeTrajectory.length - 1));
            setCurrentFrame(targetFrame);
          }}
          testID="scrub-timeline"
        >
          <View
            style={[
              styles.scrubFill,
              { width: `${(currentFrame / (activeTrajectory.length - 1)) * 100}%` },
            ]}
          />
          {/* Bounce marker pin on timeline */}
          <View
            style={[
              styles.bounceTimelinePin,
              { left: `${(bounceIdx / (activeTrajectory.length - 1)) * 100}%` },
            ]}
          />
          <View
            style={[
              styles.scrubThumb,
              { left: `${(currentFrame / (activeTrajectory.length - 1)) * 96}%` },
            ]}
          />
        </TouchableOpacity>
      </View>

      {/* Primary Playback Controls */}
      <View style={styles.controlsRow}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => setCurrentFrame(0)}
          testID="rewind-btn"
        >
          <RotateCcw size={18} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => setCurrentFrame(prev => Math.max(0, prev - 1))}
          testID="step-prev-btn"
        >
          <ChevronLeft size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.playPauseBtn}
          onPress={() => setIsPlaying(p => !p)}
          testID="play-pause-btn"
        >
          {isPlaying ? <Pause size={22} color="#070A11" /> : <Play size={22} color="#070A11" />}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => setCurrentFrame(prev => Math.min(activeTrajectory.length - 1, prev + 1))}
          testID="step-next-btn"
        >
          <ChevronRight size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.iconBtn, isLooping && styles.iconBtnActive]}
          onPress={() => setIsLooping(l => !l)}
          testID="loop-toggle-btn"
        >
          <Repeat size={18} color={isLooping ? THEME.colors.tennisVolt : '#64748B'} />
        </TouchableOpacity>
      </View>

      {/* Speed & Zoom Toggles Bento Row */}
      <View style={styles.togglesBento}>
        {/* Speed Controls */}
        <View style={styles.toggleGroup}>
          <Text style={styles.toggleGroupTitle}>SLOW-MO SPEED</Text>
          <View style={styles.chipsRow}>
            {[1.0, 0.5, 0.25, 0.1].map(rate => (
              <TouchableOpacity
                key={rate}
                style={[
                  styles.chipBtn,
                  playbackSpeed === rate && styles.chipBtnActive,
                ]}
                onPress={() => setPlaybackSpeed(rate)}
                testID={`speed-btn-${rate}`}
              >
                <Text
                  style={[
                    styles.chipBtnText,
                    playbackSpeed === rate && styles.chipBtnTextActive,
                  ]}
                >
                  {rate}x
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Dynamic Zoom Controls */}
        <View style={styles.toggleGroup}>
          <Text style={styles.toggleGroupTitle}>CAMERA BALL ZOOM</Text>
          <View style={styles.chipsRow}>
            {(['auto', 1.0, 2.5, 5.0] as const).map(mode => (
              <TouchableOpacity
                key={String(mode)}
                style={[
                  styles.chipBtn,
                  zoomMode === mode && styles.chipBtnActiveVolt,
                ]}
                onPress={() => setZoomMode(mode)}
                testID={`zoom-btn-${mode}`}
              >
                <Text
                  style={[
                    styles.chipBtnText,
                    zoomMode === mode && styles.chipBtnTextVolt,
                  ]}
                >
                  {mode === 'auto' ? 'AUTO' : `${mode}x`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
};

// Helper for ball scale
function ballScaleScaleY(val: number): number {
  return val;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    overflow: 'hidden',
    marginVertical: THEME.spacing.md,
  },
  broadcastHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: 10,
    backgroundColor: THEME.colors.surfaceElevated,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.8,
  },
  fpsBadge: {
    backgroundColor: 'rgba(204, 255, 0, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  fpsBadgeText: {
    color: THEME.colors.tennisVolt,
    fontSize: 10,
    fontWeight: '700',
  },
  zoomIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  zoomIndicatorText: {
    color: THEME.colors.electricBlue,
    fontSize: 11,
    fontWeight: '700',
  },
  canvasWrapper: {
    position: 'relative',
    backgroundColor: '#070A11',
    overflow: 'hidden',
  },
  svgCanvas: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  impactBadgeOverlay: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: THEME.colors.tennisVolt,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#CCFF00',
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 6,
  },
  impactBadgeText: {
    color: '#070A11',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  floatingVerdict: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  verdictDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  verdictText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  scrubberSection: {
    paddingHorizontal: THEME.spacing.md,
    paddingTop: 12,
    paddingBottom: 6,
    backgroundColor: THEME.colors.surface,
  },
  timelineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  timeLabel: {
    color: THEME.colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  timeVal: {
    color: THEME.colors.electricBlue,
    fontSize: 11,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  scrubTrack: {
    height: 24,
    justifyContent: 'center',
    position: 'relative',
  },
  scrubFill: {
    height: 6,
    backgroundColor: THEME.colors.tennisVolt,
    borderRadius: 3,
  },
  bounceTimelinePin: {
    position: 'absolute',
    top: 6,
    width: 2,
    height: 12,
    backgroundColor: THEME.colors.neonRed,
  },
  scrubThumb: {
    position: 'absolute',
    top: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: THEME.colors.tennisVolt,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 10,
    backgroundColor: THEME.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: THEME.colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBtnActive: {
    borderColor: THEME.colors.tennisVolt,
    borderWidth: 1,
  },
  playPauseBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: THEME.colors.tennisVolt,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#CCFF00',
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  togglesBento: {
    padding: THEME.spacing.md,
    gap: 10,
    backgroundColor: THEME.colors.surfaceElevated,
  },
  toggleGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleGroupTitle: {
    color: THEME.colors.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  chipBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  chipBtnActive: {
    backgroundColor: THEME.colors.electricBlue,
    borderColor: THEME.colors.electricBlue,
  },
  chipBtnActiveVolt: {
    backgroundColor: THEME.colors.tennisVolt,
    borderColor: THEME.colors.tennisVolt,
  },
  chipBtnText: {
    color: THEME.colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  chipBtnTextActive: {
    color: '#070A11',
    fontWeight: '800',
  },
  chipBtnTextVolt: {
    color: '#070A11',
    fontWeight: '800',
  },
});
