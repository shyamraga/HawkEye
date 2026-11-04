import React, { useState, useMemo, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import Svg, { Rect, Line, Circle, Polyline, G } from 'react-native-svg';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Scissors,
  Sparkles,
  Flame,
  Zap,
  Filter,
  Trophy,
  ChevronRight,
  Layers,
} from 'lucide-react-native';
import { ClassifiedShot, StrokeType } from '../../services/shotClassificationEngine';
import { THEME } from '../../theme/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface MatchRallyClip {
  id: string;
  rallyNumber: number;
  scoreContext: string;
  durationSeconds: number;
  shotCount: number;
  decisiveStroke: StrokeType;
  decisiveSpeedKmh: number;
  outcome: 'WINNER' | 'ACE' | 'UNFORCED_ERROR' | 'OUT';
  winnerPlayer: string;
  trajectory: { x: number; y: number; z?: number; u?: number; v?: number }[];
  isBreakPoint?: boolean;
}

interface MatchHighlightsPlayerProps {
  rallies?: MatchRallyClip[];
  courtSurface?: 'Hard' | 'Clay' | 'Grass';
  onSelectRally?: (rally: MatchRallyClip) => void;
  playerOneName?: string;
  playerTwoName?: string;
  matchScore?: string;
  onExportVideo?: () => void;
}

// Built-in broadcast demo rallies if none provided
const DEFAULT_DEMO_RALLIES: MatchRallyClip[] = [
  {
    id: 'rally_1',
    rallyNumber: 14,
    scoreContext: 'Set 1 • 3-2 • 30-40 (Break Point)',
    durationSeconds: 12.4,
    shotCount: 11,
    decisiveStroke: 'FOREHAND',
    decisiveSpeedKmh: 154,
    outcome: 'WINNER',
    winnerPlayer: 'Carlos Alcaraz',
    isBreakPoint: true,
    trajectory: [
      { x: 4.1, y: 1.0, z: 1.2 },
      { x: 4.5, y: 6.0, z: 1.6 },
      { x: 5.2, y: 12.0, z: 1.4 },
      { x: 6.8, y: 20.8, z: 0.0 },
    ],
  },
  {
    id: 'rally_2',
    rallyNumber: 8,
    scoreContext: 'Set 1 • 2-1 • 40-15',
    durationSeconds: 3.2,
    shotCount: 1,
    decisiveStroke: 'SERVE',
    decisiveSpeedKmh: 206,
    outcome: 'ACE',
    winnerPlayer: 'Jannik Sinner',
    trajectory: [
      { x: 4.1, y: 0.5, z: 2.8 },
      { x: 4.2, y: 6.0, z: 1.8 },
      { x: 4.4, y: 16.5, z: 0.0 },
    ],
  },
  {
    id: 'rally_3',
    rallyNumber: 22,
    scoreContext: 'Set 1 • 4-4 • Deuce (Longest Exchange)',
    durationSeconds: 18.6,
    shotCount: 16,
    decisiveStroke: 'BACKHAND',
    decisiveSpeedKmh: 138,
    outcome: 'WINNER',
    winnerPlayer: 'Jannik Sinner',
    trajectory: [
      { x: 2.5, y: 1.2, z: 1.1 },
      { x: 3.8, y: 11.5, z: 1.5 },
      { x: 6.4, y: 21.2, z: 0.0 },
    ],
  },
  {
    id: 'rally_4',
    rallyNumber: 27,
    scoreContext: 'Set 1 • 5-4 • 40-30 (Set Point)',
    durationSeconds: 9.8,
    shotCount: 8,
    decisiveStroke: 'FOREHAND',
    decisiveSpeedKmh: 162,
    outcome: 'WINNER',
    winnerPlayer: 'Carlos Alcaraz',
    isBreakPoint: true,
    trajectory: [
      { x: 6.0, y: 1.5, z: 1.2 },
      { x: 4.5, y: 12.0, z: 1.5 },
      { x: 2.2, y: 21.5, z: 0.0 },
    ],
  },
];

export const MatchHighlightsPlayer: React.FC<MatchHighlightsPlayerProps> = ({
  rallies = DEFAULT_DEMO_RALLIES,
  courtSurface = 'Hard',
  onSelectRally,
}) => {
  const [autoTrimEnabled, setAutoTrimEnabled] = useState(true);
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'TOP_RALLIES' | 'ACES_WINNERS' | 'BREAK_POINTS'>('ALL');
  const [selectedRallyIndex, setSelectedRallyIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);

  // Filter rallies according to active highlight category
  const filteredRallies = useMemo(() => {
    switch (activeCategory) {
      case 'TOP_RALLIES':
        return [...rallies].sort((a, b) => b.shotCount - a.shotCount).slice(0, 5);
      case 'ACES_WINNERS':
        return rallies.filter(r => r.outcome === 'WINNER' || r.outcome === 'ACE');
      case 'BREAK_POINTS':
        return rallies.filter(r => r.isBreakPoint);
      default:
        return rallies;
    }
  }, [rallies, activeCategory]);

  const activeRally = filteredRallies[selectedRallyIndex] || filteredRallies[0];

  // Playback timer simulation
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setPlaybackProgress(prev => {
        if (prev >= 100) {
          // If auto-trim is enabled, advance to next rally immediately!
          if (autoTrimEnabled && selectedRallyIndex < filteredRallies.length - 1) {
            setSelectedRallyIndex(curr => curr + 1);
            return 0;
          }
          setIsPlaying(false);
          return 100;
        }
        return prev + 5;
      });
    }, 150);

    return () => clearInterval(interval);
  }, [isPlaying, autoTrimEnabled, selectedRallyIndex, filteredRallies.length]);

  const handleNextRally = () => {
    if (selectedRallyIndex < filteredRallies.length - 1) {
      setSelectedRallyIndex(prev => prev + 1);
      setPlaybackProgress(0);
      setIsPlaying(true);
    }
  };

  const handlePrevRally = () => {
    if (selectedRallyIndex > 0) {
      setSelectedRallyIndex(prev => prev - 1);
      setPlaybackProgress(0);
      setIsPlaying(true);
    }
  };

  const courtWidth = Math.min(SCREEN_WIDTH - 48, 340);
  const courtHeight = 220;

  return (
    <View style={styles.container}>
      {/* Auto-Trim Dead-Time Removal Banner */}
      <View style={styles.autoTrimHeader}>
        <View style={styles.autoTrimTitleRow}>
          <Scissors size={14} color="#00F59B" />
          <Text style={styles.autoTrimHeading}>SWINGVISION AUTO-TRIM</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.autoTrimToggleBtn,
            autoTrimEnabled && styles.autoTrimToggleBtnActive,
          ]}
          onPress={() => setAutoTrimEnabled(prev => !prev)}
        >
          <Zap size={12} color={autoTrimEnabled ? '#070A11' : '#94A3B8'} />
          <Text
            style={[
              styles.autoTrimToggleText,
              autoTrimEnabled && styles.autoTrimToggleTextActive,
            ]}
          >
            {autoTrimEnabled ? 'DEAD-TIME CUT: ON' : 'DEAD-TIME CUT: OFF'}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.autoTrimSubtext}>
        {autoTrimEnabled
          ? '⚡ Skipping 82% dead time between points. Condensing 2hr match into 18min action.'
          : 'Full match playback including ball retrieval and pauses.'}
      </Text>

      {/* Curated Highlight Category Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryPillsRow}
      >
        {[
          { id: 'ALL', label: 'All Points', icon: Layers },
          { id: 'TOP_RALLIES', label: 'Top Rallies', icon: Flame },
          { id: 'ACES_WINNERS', label: 'Aces & Winners', icon: Sparkles },
          { id: 'BREAK_POINTS', label: 'Break Points', icon: Trophy },
        ].map(cat => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryPill, isActive && styles.categoryPillActive]}
              onPress={() => {
                setActiveCategory(cat.id as any);
                setSelectedRallyIndex(0);
                setPlaybackProgress(0);
              }}
            >
              <Icon size={12} color={isActive ? '#070A11' : '#94A3B8'} />
              <Text
                style={[
                  styles.categoryPillText,
                  isActive && styles.categoryPillTextActive,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Broadcast Video Player Canvas */}
      <View style={styles.playerCanvas}>
        <Svg width={courtWidth} height={courtHeight}>
          {/* Court Surface */}
          <Rect
            x={0}
            y={0}
            width={courtWidth}
            height={courtHeight}
            fill="#0A2540"
            rx={10}
          />

          {/* Playing Field */}
          <Rect
            x={courtWidth * 0.15}
            y={20}
            width={courtWidth * 0.7}
            height={courtHeight - 40}
            fill="#133E68"
          />

          {/* Court Lines */}
          <Line
            x1={courtWidth * 0.15}
            y1={courtHeight / 2}
            x2={courtWidth * 0.85}
            y2={courtHeight / 2}
            stroke="#FFFFFF"
            strokeWidth={3}
          />
          <Line
            x1={courtWidth * 0.15}
            y1={20}
            x2={courtWidth * 0.85}
            y2={20}
            stroke="#FFFFFF"
            strokeWidth={2}
          />
          <Line
            x1={courtWidth * 0.15}
            y1={courtHeight - 20}
            x2={courtWidth * 0.85}
            y2={courtHeight - 20}
            stroke="#FFFFFF"
            strokeWidth={2}
          />
          <Line
            x1={courtWidth * 0.15}
            y1={20}
            x2={courtWidth * 0.15}
            y2={courtHeight - 20}
            stroke="#FFFFFF"
            strokeWidth={2}
          />
          <Line
            x1={courtWidth * 0.85}
            y1={20}
            x2={courtWidth * 0.85}
            y2={courtHeight - 20}
            stroke="#FFFFFF"
            strokeWidth={2}
          />

          {/* Animated Rally Trajectory Path */}
          {activeRally && (
            <G>
              <Polyline
                points={`${courtWidth * 0.3},${courtHeight - 30} ${courtWidth * 0.45},${courtHeight / 2} ${courtWidth * 0.7},${40}`}
                fill="none"
                stroke="#CCFF00"
                strokeWidth={3}
                strokeDasharray="4,3"
              />
              <Circle
                cx={courtWidth * 0.7}
                cy={40}
                r={6}
                fill="#00F59B"
                stroke="#FFFFFF"
                strokeWidth={2}
              />
            </G>
          )}
        </Svg>

        {/* Broadcast Scorebug & Decisive Shot Overlay */}
        {activeRally && (
          <View style={styles.scorebugOverlay}>
            <View style={styles.scorebugTag}>
              <Text style={styles.scorebugContext}>{activeRally.scoreContext}</Text>
            </View>
            <View style={styles.telemetryTag}>
              <Text style={styles.telemetryText}>
                {activeRally.decisiveStroke} • {activeRally.decisiveSpeedKmh} KM/H
              </Text>
            </View>
          </View>
        )}

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${playbackProgress}%` }]} />
        </View>
      </View>

      {/* Transport Controls */}
      <View style={styles.transportRow}>
        <TouchableOpacity
          style={styles.transportBtn}
          onPress={handlePrevRally}
          disabled={selectedRallyIndex === 0}
        >
          <SkipBack size={18} color={selectedRallyIndex === 0 ? '#334155' : '#FFFFFF'} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.playPauseBtn}
          onPress={() => setIsPlaying(prev => !prev)}
        >
          {isPlaying ? (
            <Pause size={20} color="#070A11" />
          ) : (
            <Play size={20} color="#070A11" />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.transportBtn}
          onPress={handleNextRally}
          disabled={selectedRallyIndex === filteredRallies.length - 1}
        >
          <SkipForward
            size={18}
            color={
              selectedRallyIndex === filteredRallies.length - 1 ? '#334155' : '#FFFFFF'
            }
          />
        </TouchableOpacity>

        <View style={styles.counterBadge}>
          <Text style={styles.counterText}>
            RALLY {selectedRallyIndex + 1} OF {filteredRallies.length}
          </Text>
        </View>
      </View>

      {/* Rallies Reel List */}
      <View style={styles.reelListHeader}>
        <Text style={styles.reelListTitle}>CURATED MATCH CLIPS</Text>
        <Text style={styles.reelListSub}>{filteredRallies.length} Highlight Rallies</Text>
      </View>

      {filteredRallies.map((rally, idx) => {
        const isSelected = idx === selectedRallyIndex;
        return (
          <TouchableOpacity
            key={rally.id}
            style={[styles.clipRow, isSelected && styles.clipRowActive]}
            onPress={() => {
              setSelectedRallyIndex(idx);
              setPlaybackProgress(0);
              setIsPlaying(true);
              if (onSelectRally) onSelectRally(rally);
            }}
          >
            <View style={styles.clipIndexBox}>
              <Text style={[styles.clipIndexText, isSelected && styles.clipIndexTextActive]}>
                #{rally.rallyNumber}
              </Text>
            </View>

            <View style={styles.clipInfo}>
              <Text style={styles.clipTitle}>{rally.scoreContext}</Text>
              <Text style={styles.clipMeta}>
                {rally.shotCount} Shots • {rally.winnerPlayer} ({rally.outcome}) • {rally.decisiveSpeedKmh} km/h
              </Text>
            </View>

            <ChevronRight size={16} color={isSelected ? '#CCFF00' : '#475569'} />
          </TouchableOpacity>
        );
      })}
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
  autoTrimHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  autoTrimTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  autoTrimHeading: {
    fontSize: 11,
    fontWeight: '900',
    color: '#00F59B',
    letterSpacing: 0.8,
  },
  autoTrimToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  autoTrimToggleBtnActive: {
    backgroundColor: '#00F59B',
    borderColor: '#00F59B',
  },
  autoTrimToggleText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
  },
  autoTrimToggleTextActive: {
    color: '#070A11',
  },
  autoTrimSubtext: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 12,
  },
  categoryPillsRow: {
    gap: 8,
    marginBottom: 14,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  categoryPillActive: {
    backgroundColor: '#CCFF00',
    borderColor: '#CCFF00',
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  categoryPillTextActive: {
    color: '#070A11',
  },
  playerCanvas: {
    alignItems: 'center',
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  scorebugOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scorebugTag: {
    backgroundColor: 'rgba(7, 10, 17, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  scorebugContext: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  telemetryTag: {
    backgroundColor: 'rgba(0, 245, 155, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#00F59B',
  },
  telemetryText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00F59B',
  },
  progressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#00F59B',
  },
  transportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginVertical: 14,
  },
  transportBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  playPauseBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#CCFF00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterBadge: {
    marginLeft: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  counterText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },
  reelListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  reelListTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  reelListSub: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  clipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 8,
  },
  clipRowActive: {
    borderColor: '#CCFF00',
    backgroundColor: 'rgba(204, 255, 0, 0.05)',
  },
  clipIndexBox: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  clipIndexText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
  },
  clipIndexTextActive: {
    color: '#CCFF00',
  },
  clipInfo: {
    flex: 1,
  },
  clipTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  clipMeta: {
    fontSize: 10,
    fontWeight: '500',
    color: '#94A3B8',
  },
});
