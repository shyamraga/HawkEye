import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  Alert,
} from 'react-native';
import Svg, { Rect, Line, Circle, Path, G, Text as SvgText } from 'react-native-svg';
import * as Speech from 'expo-speech';
import {
  Sparkles,
  Trophy,
  Zap,
  Volume2,
  VolumeX,
  Activity,
  ChevronRight,
  Play,
  RotateCcw,
  Award,
  CheckCircle2,
  Target,
  ArrowUpRight,
  Flame,
  Layers,
  HelpCircle,
  TrendingUp,
} from 'lucide-react-native';
import { THEME } from '../../theme/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface TacticalPattern {
  id: string;
  name: string;
  category: 'SERVE_PLUS_ONE' | 'CROSSCOURT_RALLY' | 'INSIDE_OUT' | 'DEFENSE_RESET';
  winRate: number;
  occurrences: number;
  description: string;
  coachingAction: string;
  diagramPath: string; // SVG path
}

export interface StanceMetric {
  stanceType: 'OPEN' | 'SEMI_OPEN' | 'NEUTRAL';
  percentage: number;
  stabilityScore: number;
  powerTransfer: number;
}

const TACTICAL_PATTERNS: TacticalPattern[] = [
  {
    id: 'pat_1',
    name: 'Crosscourt Grind to Backhand',
    category: 'CROSSCOURT_RALLY',
    winRate: 74,
    occurrences: 23,
    description: 'Holding deep crosscourt angle to opponent backhand forces a short weak ball on shot 4+.',
    coachingAction: 'Keep ball 3+ feet over net with heavy topspin until opponent ball lands inside service line.',
    diagramPath: 'M 60 220 Q 140 130 180 50',
  },
  {
    id: 'pat_2',
    name: 'Serve + 1 Forehand Dominance',
    category: 'SERVE_PLUS_ONE',
    winRate: 82,
    occurrences: 17,
    description: 'Slice serve wide on Deuce pulls opponent off court; first forehand attacks open corner.',
    coachingAction: 'Step inside baseline immediately after split-step to take ball early before it drops.',
    diagramPath: 'M 100 240 L 40 120 M 110 230 L 170 60',
  },
  {
    id: 'pat_3',
    name: 'Inside-Out Forehand Winner',
    category: 'INSIDE_OUT',
    winRate: 78,
    occurrences: 14,
    description: 'Running around backhand in ad-court to hit heavy topspin inside-out into opponent backhand.',
    coachingAction: 'Commit to footwork earlier; drop racket head below ball for 2800 RPM topspin.',
    diagramPath: 'M 140 220 Q 90 140 50 60',
  },
  {
    id: 'pat_4',
    name: 'Deep Moonball Defensive Reset',
    category: 'DEFENSE_RESET',
    winRate: 61,
    occurrences: 11,
    description: 'When pushed 2.5m behind baseline, hitting high arching ball (5ft net clearance) resets rally neutral.',
    coachingAction: 'Do not attempt low-percentage down-the-line winner when stretched wide behind baseline.',
    diagramPath: 'M 30 250 Q 100 80 160 50',
  },
];

interface SwingVisionCoachViewProps {
  playerOneName?: string;
  playerTwoName?: string;
  onNavigateToMatch?: () => void;
}

export const SwingVisionCoachView: React.FC<SwingVisionCoachViewProps> = ({
  playerOneName = 'Player 1',
  playerTwoName = 'Opponent',
  onNavigateToMatch,
}) => {
  const [activeTab, setActiveTab] = useState<'MATCH_AI' | 'SERVE_STRATEGY' | 'PATTERNS' | 'BIOMECHANICS'>('MATCH_AI');
  const [audioCoachActive, setAudioCoachActive] = useState(true);
  const [selectedPattern, setSelectedPattern] = useState<TacticalPattern>(TACTICAL_PATTERNS[0]);
  const [isDrillSimulating, setIsDrillSimulating] = useState(false);
  const [coachSpeakingText, setCoachSpeakingText] = useState<string | null>(null);

  const courtWidth = Math.min(SCREEN_WIDTH - 48, 330);
  const courtHeight = 240;

  // Speak voice coaching cue via expo-speech
  const triggerAudioCoachCue = (text: string) => {
    if (!audioCoachActive) return;
    setCoachSpeakingText(text);
    Speech.stop();
    Speech.speak(text, {
      language: 'en-US',
      pitch: 1.05,
      rate: 0.95,
      onDone: () => setCoachSpeakingText(null),
      onError: () => setCoachSpeakingText(null),
    });
  };

  const simulatePatternDrill = (pattern: TacticalPattern) => {
    setSelectedPattern(pattern);
    setIsDrillSimulating(true);
    triggerAudioCoachCue(`Tactical drill initiated: ${pattern.name}. ${pattern.coachingAction}`);
    setTimeout(() => {
      setIsDrillSimulating(false);
    }, 4500);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      {/* 🦅 Header Badge & Live Audio Coach Toggle */}
      <View style={styles.headerRow}>
        <View style={styles.headerTitleWrap}>
          <View style={styles.owlLogoBadge}>
            <Sparkles size={16} color={THEME.colors.tennisVolt} />
          </View>
          <View>
            <Text style={styles.headerTitle}>SWINGVISION AI COACH</Text>
            <Text style={styles.headerSubtitle}>Video-Anchored Intelligence & Tactics</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.audioToggleBtn, audioCoachActive && styles.audioToggleBtnActive]}
          onPress={() => {
            const next = !audioCoachActive;
            setAudioCoachActive(next);
            if (next) triggerAudioCoachCue('Audio Coach active. Live audio cues enabled.');
          }}
          activeOpacity={0.8}
        >
          {audioCoachActive ? (
            <Volume2 size={16} color="#070A11" />
          ) : (
            <VolumeX size={16} color="#64748B" />
          )}
          <Text style={[styles.audioToggleText, audioCoachActive && styles.audioToggleTextActive]}>
            {audioCoachActive ? 'AUDIO ON' : 'MUTED'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Live Voice Coach Speaking Banner */}
      {coachSpeakingText && (
        <View style={styles.speakingBanner}>
          <Flame size={16} color={THEME.colors.tennisVolt} />
          <Text style={styles.speakingText} numberOfLines={2}>
            {coachSpeakingText}
          </Text>
        </View>
      )}

      {/* Navigation Sub-Tabs */}
      <View style={styles.tabNavRow}>
        {[
          { key: 'MATCH_AI', label: 'Match AI' },
          { key: 'SERVE_STRATEGY', label: 'Serve Strategy' },
          { key: 'PATTERNS', label: 'Patterns' },
          { key: 'BIOMECHANICS', label: 'Biomechanics' },
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabNavBtn, activeTab === tab.key && styles.tabNavBtnActive]}
            onPress={() => setActiveTab(tab.key as any)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabNavText, activeTab === tab.key && styles.tabNavTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ==================== 1. MATCH AI: WIN/LOSS BREAKDOWN ==================== */}
      {activeTab === 'MATCH_AI' && (
        <View style={styles.sectionWrap}>
          {/* Key Coach Recommendation Card */}
          <View style={styles.keyInsightCard}>
            <View style={styles.keyInsightHeader}>
              <Award size={18} color={THEME.colors.tennisVolt} />
              <Text style={styles.keyInsightTitle}>PRIMARY TACTICAL ADVANTAGE</Text>
            </View>
            <Text style={styles.keyInsightBody}>
              Your crosscourt forehand produces a <Text style={{ color: THEME.colors.neonGreen, fontWeight: 'bold' }}>74% win rate</Text> when landing within 1.5m of the baseline. Opponent commits an error on 4 out of 5 rallies exceeding 6 shots.
            </Text>

            <TouchableOpacity
              style={styles.voiceCoachCta}
              onPress={() =>
                triggerAudioCoachCue(
                  'Coach Analysis: Attack the opponent backhand corner with high net clearance. When they leave it short, step inside the baseline for the forehand winner.'
                )
              }
              activeOpacity={0.85}
            >
              <Zap size={14} color="#070A11" />
              <Text style={styles.voiceCoachCtaText}>LISTEN TO AI MATCH PLAN</Text>
            </TouchableOpacity>
          </View>

          {/* Points Won vs Points Lost Attribution */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Target size={16} color={THEME.colors.electricBlue} />
              <Text style={styles.cardTitle}>POINTS WON ATTRIBUTION</Text>
            </View>

            <View style={styles.statBarWrap}>
              <View style={styles.statBarMeta}>
                <Text style={styles.statBarLabel}>Winners (FH/BH/Volley)</Text>
                <Text style={styles.statBarVal}>22 pts (46%)</Text>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: '46%', backgroundColor: THEME.colors.tennisVolt }]} />
              </View>
            </View>

            <View style={styles.statBarWrap}>
              <View style={styles.statBarMeta}>
                <Text style={styles.statBarLabel}>Opponent Forced Errors</Text>
                <Text style={styles.statBarVal}>16 pts (33%)</Text>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: '33%', backgroundColor: THEME.colors.electricBlue }]} />
              </View>
            </View>

            <View style={styles.statBarWrap}>
              <View style={styles.statBarMeta}>
                <Text style={styles.statBarLabel}>Service Aces / Service Winners</Text>
                <Text style={styles.statBarVal}>10 pts (21%)</Text>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: '21%', backgroundColor: THEME.colors.neonGreen }]} />
              </View>
            </View>
          </View>

          {/* Points Lost / Error Distribution */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Activity size={16} color={THEME.colors.neonRed} />
              <Text style={styles.cardTitle}>POINTS LOST / ERROR PROFILE</Text>
            </View>

            <View style={styles.metricsGridTwo}>
              <View style={styles.metricCard}>
                <Text style={styles.metricCardLabel}>UNFORCED ERRORS</Text>
                <Text style={[styles.metricCardVal, { color: THEME.colors.neonRed }]}>14</Text>
                <Text style={styles.metricCardSub}>8 Long • 6 In Net</Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricCardLabel}>FORCED ERRORS</Text>
                <Text style={[styles.metricCardVal, { color: THEME.colors.warning }]}>9</Text>
                <Text style={styles.metricCardSub}>Opponent heavy pace</Text>
              </View>
            </View>

            <View style={styles.statBarWrap}>
              <View style={styles.statBarMeta}>
                <Text style={styles.statBarLabel}>Backhand Unforced Errors</Text>
                <Text style={styles.statBarVal}>9 errors (64%)</Text>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: '64%', backgroundColor: THEME.colors.neonRed }]} />
              </View>
              <Text style={styles.barTip}>💡 Coach Tip: Contact point on backhand is 18cm late when hitting on the run.</Text>
            </View>
          </View>
        </View>
      )}

      {/* ==================== 2. SERVE & RETURN STRATEGY ==================== */}
      {activeTab === 'SERVE_STRATEGY' && (
        <View style={styles.sectionWrap}>
          {/* Serve Dispersion Radar Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Target size={16} color={THEME.colors.tennisVolt} />
              <Text style={styles.cardTitle}>SERVE PLACEMENT & WIN % BY TARGET</Text>
            </View>

            {/* Interactive Court Service Box SVG */}
            <View style={{ alignItems: 'center', marginVertical: 8 }}>
              <Svg width={courtWidth} height={courtHeight}>
                <Rect x={10} y={10} width={courtWidth - 20} height={courtHeight - 20} fill="#0A111E" stroke="#1E293B" strokeWidth={2} rx={8} />

                {/* Net */}
                <Line x1={10} y1={courtHeight / 2} x2={courtWidth - 10} y2={courtHeight / 2} stroke="#FFFFFF" strokeWidth={3} />
                <SvgText x={courtWidth / 2 - 12} y={courtHeight / 2 - 6} fill="#94A3B8" fontSize={9} fontWeight="bold">
                  NET
                </SvgText>

                {/* Service Line Top */}
                <Line x1={30} y1={courtHeight * 0.22} x2={courtWidth - 30} y2={courtHeight * 0.22} stroke="#334155" strokeWidth={2} />
                {/* Center Service Line Top */}
                <Line x1={courtWidth / 2} y1={courtHeight * 0.22} x2={courtWidth / 2} y2={courtHeight / 2} stroke="#334155" strokeWidth={2} />

                {/* Service Line Bottom */}
                <Line x1={30} y1={courtHeight * 0.78} x2={courtWidth - 30} y2={courtHeight * 0.78} stroke="#334155" strokeWidth={2} />
                {/* Center Service Line Bottom */}
                <Line x1={courtWidth / 2} y1={courtHeight / 2} x2={courtWidth / 2} y2={courtHeight * 0.78} stroke="#334155" strokeWidth={2} />

                {/* Deuce Court Serve Target Hotspots (Bottom Left Box) */}
                <G>
                  {/* Deuce T Target */}
                  <Circle cx={courtWidth / 2 - 25} cy={courtHeight * 0.72} r={18} fill="rgba(204, 255, 0, 0.25)" stroke={THEME.colors.tennisVolt} strokeWidth={2} />
                  <SvgText x={courtWidth / 2 - 32} y={courtHeight * 0.72 + 3} fill="#CCFF00" fontSize={9} fontWeight="bold">
                    84% W
                  </SvgText>
                  {/* Deuce Wide Target */}
                  <Circle cx={48} cy={courtHeight * 0.58} r={16} fill="rgba(0, 240, 255, 0.25)" stroke={THEME.colors.electricBlue} strokeWidth={2} />
                  <SvgText x={38} y={courtHeight * 0.58 + 3} fill="#00F0FF" fontSize={9} fontWeight="bold">
                    71% W
                  </SvgText>
                </G>

                {/* Ad Court Serve Target Hotspots (Bottom Right Box) */}
                <G>
                  {/* Ad Wide Target (Opponent Backhand) */}
                  <Circle cx={courtWidth - 48} cy={courtHeight * 0.58} r={20} fill="rgba(0, 245, 155, 0.3)" stroke={THEME.colors.neonGreen} strokeWidth={2} />
                  <SvgText x={courtWidth - 58} y={courtHeight * 0.58 + 3} fill="#00F59B" fontSize={10} fontWeight="900">
                    89% W
                  </SvgText>
                  {/* Ad T Target */}
                  <Circle cx={courtWidth / 2 + 25} cy={courtHeight * 0.72} r={15} fill="rgba(255, 255, 255, 0.15)" stroke="#94A3B8" strokeWidth={1} />
                  <SvgText x={courtWidth / 2 + 16} y={courtHeight * 0.72 + 3} fill="#FFFFFF" fontSize={9} fontWeight="bold">
                    60% W
                  </SvgText>
                </G>
              </Svg>
            </View>

            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: THEME.colors.neonGreen }]} />
                <Text style={styles.legendText}>Ad Wide (89% Win Rate - Best)</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: THEME.colors.tennisVolt }]} />
                <Text style={styles.legendText}>Deuce T (84% Win Rate)</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.drillSimBtn}
              onPress={() =>
                triggerAudioCoachCue(
                  'Serve Strategy Alert: On 30-all or ad-points, aim your 1st serve Ad Wide with slice to target their backhand. Win percentage jumps to 89%.'
                )
              }
              activeOpacity={0.8}
            >
              <Volume2 size={14} color="#070A11" />
              <Text style={styles.drillSimBtnText}>HEAR PRESSURE-POINT SERVE CUES</Text>
            </TouchableOpacity>
          </View>

          {/* Return Depth Breakdown */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <TrendingUp size={16} color={THEME.colors.electricBlue} />
              <Text style={styles.cardTitle}>RETURN DEPTH & AGGRESSION</Text>
            </View>

            <View style={styles.metricsGridThree}>
              <View style={styles.metricCardSmall}>
                <Text style={styles.metricCardLabel}>DEEP RETURNS</Text>
                <Text style={[styles.metricCardVal, { color: THEME.colors.neonGreen }]}>62%</Text>
                <Text style={styles.metricCardSub}>Behind Serv. Line</Text>
              </View>
              <View style={styles.metricCardSmall}>
                <Text style={styles.metricCardLabel}>SHORT / ATTACKED</Text>
                <Text style={[styles.metricCardVal, { color: THEME.colors.neonRed }]}>18%</Text>
                <Text style={styles.metricCardSub}>Forced on 2nd</Text>
              </View>
              <View style={styles.metricCardSmall}>
                <Text style={styles.metricCardLabel}>BREAK POINTS</Text>
                <Text style={[styles.metricCardVal, { color: THEME.colors.tennisVolt }]}>4/5</Text>
                <Text style={styles.metricCardSub}>80% Converted</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* ==================== 3. TACTICAL PATTERNS OF PLAY ==================== */}
      {activeTab === 'PATTERNS' && (
        <View style={styles.sectionWrap}>
          <Text style={styles.patternsIntro}>
            SwingVision identifies high-percentage tactical sequences. Tap a pattern to review court trajectory and listen to the drills.
          </Text>

          {/* Interactive Trajectory Simulation Card */}
          <View style={styles.patternSimCard}>
            <View style={styles.patternSimHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.patternSimName}>{selectedPattern.name}</Text>
                <Text style={styles.patternSimCat}>{selectedPattern.category.replace(/_/g, ' ')}</Text>
              </View>
              <View style={styles.badgeVolt}>
                <Text style={styles.badgeVoltText}>{selectedPattern.winRate}% WIN RATE</Text>
              </View>
            </View>

            {/* Tactical Court Diagram */}
            <View style={{ alignItems: 'center', marginVertical: 8 }}>
              <Svg width={courtWidth} height={180}>
                <Rect x={10} y={10} width={courtWidth - 20} height={160} fill="#070D18" stroke="#1E293B" strokeWidth={2} rx={6} />
                {/* Court Net */}
                <Line x1={10} y1={90} x2={courtWidth - 10} y2={90} stroke="#FFFFFF" strokeWidth={2} />
                <SvgText x={courtWidth / 2 - 10} y={84} fill="#64748B" fontSize={8}>
                  NET
                </SvgText>

                {/* Pattern Trajectory Vector */}
                <Path
                  d={selectedPattern.diagramPath}
                  fill="none"
                  stroke={isDrillSimulating ? THEME.colors.tennisVolt : THEME.colors.electricBlue}
                  strokeWidth={isDrillSimulating ? 4 : 3}
                  strokeDasharray={isDrillSimulating ? '6,4' : undefined}
                />

                {/* Player and Target positions */}
                <Circle cx={60} cy={160} r={7} fill={THEME.colors.tennisVolt} />
                <Circle cx={courtWidth - 50} cy={30} r={6} fill={THEME.colors.neonRed} />
              </Svg>
            </View>

            <Text style={styles.patternDesc}>{selectedPattern.description}</Text>

            <View style={styles.actionPlanBox}>
              <CheckCircle2 size={14} color={THEME.colors.neonGreen} style={{ marginTop: 2 }} />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.actionPlanTitle}>AI DRILL INSTRUCTION</Text>
                <Text style={styles.actionPlanText}>{selectedPattern.coachingAction}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.simulatePatternActionBtn}
              onPress={() => simulatePatternDrill(selectedPattern)}
              activeOpacity={0.8}
            >
              <Play size={14} color="#070A11" fill="#070A11" />
              <Text style={styles.simulatePatternActionText}>
                {isDrillSimulating ? 'SIMULATING PATTERN DRILL...' : 'WATCH DRILL & PLAY VOICE CUE'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Pattern Selection List */}
          <View style={styles.patternList}>
            {TACTICAL_PATTERNS.map(pat => (
              <TouchableOpacity
                key={pat.id}
                style={[styles.patternItem, selectedPattern.id === pat.id && styles.patternItemActive]}
                onPress={() => setSelectedPattern(pat)}
                activeOpacity={0.8}
              >
                <View style={styles.patternItemHeader}>
                  <Text style={[styles.patternItemTitle, selectedPattern.id === pat.id && { color: THEME.colors.tennisVolt }]}>
                    {pat.name}
                  </Text>
                  <Text style={styles.patternItemWin}>{pat.winRate}% W</Text>
                </View>
                <Text style={styles.patternItemSub}>{pat.occurrences} rallies analyzed in match</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* ==================== 4. BIOMECHANICS & STANCE ==================== */}
      {activeTab === 'BIOMECHANICS' && (
        <View style={styles.sectionWrap}>
          {/* Stance Breakdown */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Layers size={16} color={THEME.colors.tennisVolt} />
              <Text style={styles.cardTitle}>FOOTWORK & STANCE CLASSIFICATION</Text>
            </View>

            <View style={styles.metricsGridThree}>
              <View style={styles.metricCardSmall}>
                <Text style={styles.metricCardLabel}>OPEN STANCE</Text>
                <Text style={[styles.metricCardVal, { color: THEME.colors.electricBlue }]}>48%</Text>
                <Text style={styles.metricCardSub}>Wide & Baseline</Text>
              </View>
              <View style={styles.metricCardSmall}>
                <Text style={styles.metricCardLabel}>SEMI-OPEN</Text>
                <Text style={[styles.metricCardVal, { color: THEME.colors.tennisVolt }]}>37%</Text>
                <Text style={styles.metricCardSub}>Aggressive Drive</Text>
              </View>
              <View style={styles.metricCardSmall}>
                <Text style={styles.metricCardLabel}>NEUTRAL</Text>
                <Text style={[styles.metricCardVal, { color: '#94A3B8' }]}>15%</Text>
                <Text style={styles.metricCardSub}>Approach / Volley</Text>
              </View>
            </View>

            <View style={styles.statBarWrap}>
              <View style={styles.statBarMeta}>
                <Text style={styles.statBarLabel}>Stance Balance & Kinetic Stability</Text>
                <Text style={styles.statBarVal}>88 / 100</Text>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: '88%', backgroundColor: THEME.colors.neonGreen }]} />
              </View>
            </View>
          </View>

          {/* Contact Point & Height Strike Zone */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Activity size={16} color={THEME.colors.electricBlue} />
              <Text style={styles.cardTitle}>STRIKE ZONE & CONTACT TIMING</Text>
            </View>

            <View style={styles.metricsGridTwo}>
              <View style={styles.metricCard}>
                <Text style={styles.metricCardLabel}>CONTACT POINT</Text>
                <Text style={[styles.metricCardVal, { color: THEME.colors.neonGreen }]}>24 cm</Text>
                <Text style={styles.metricCardSub}>In Front of Hip (Optimal)</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricCardLabel}>NET CLEARANCE</Text>
                <Text style={[styles.metricCardVal, { color: THEME.colors.tennisVolt }]}>2.4 ft</Text>
                <Text style={styles.metricCardSub}>Avg Height Over Net</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.drillSimBtn}
              onPress={() =>
                triggerAudioCoachCue(
                  'Biomechanics Tip: Maintain a firm wrist on contact and finish your racket over the opposite shoulder for consistent topspin.'
                )
              }
              activeOpacity={0.8}
            >
              <Volume2 size={14} color="#070A11" />
              <Text style={styles.drillSimBtnText}>TEST STROKE BIOMECHANICS CUE</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Bottom CTA: Return to Live Match */}
      {onNavigateToMatch && (
        <TouchableOpacity style={styles.bottomCta} onPress={onNavigateToMatch} activeOpacity={0.85}>
          <Activity size={18} color="#070A11" />
          <Text style={styles.bottomCtaText}>RESUME LIVE HUD & LINE CALLER</Text>
        </TouchableOpacity>
      )}
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
    paddingBottom: 110,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  owlLogoBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(204, 255, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  headerSubtitle: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 1,
  },
  audioToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 5,
  },
  audioToggleBtnActive: {
    backgroundColor: THEME.colors.tennisVolt,
    borderColor: THEME.colors.tennisVolt,
  },
  audioToggleText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
  },
  audioToggleTextActive: {
    color: '#070A11',
  },
  speakingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(204, 255, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 12,
    gap: 8,
  },
  speakingText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
    lineHeight: 15,
  },
  tabNavRow: {
    flexDirection: 'row',
    backgroundColor: '#070A11',
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  tabNavBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 7,
  },
  tabNavBtnActive: {
    backgroundColor: '#1E293B',
  },
  tabNavText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
  },
  tabNavTextActive: {
    color: THEME.colors.tennisVolt,
  },
  sectionWrap: {
    gap: 14,
  },
  keyInsightCard: {
    backgroundColor: '#0B1220',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.35)',
  },
  keyInsightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  keyInsightTitle: {
    color: THEME.colors.tennisVolt,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  keyInsightBody: {
    color: '#E2E8F0',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  voiceCoachCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.tennisVolt,
    borderRadius: 8,
    paddingVertical: 10,
    gap: 6,
  },
  voiceCoachCtaText: {
    color: '#070A11',
    fontSize: 11,
    fontWeight: '900',
  },
  card: {
    backgroundColor: THEME.colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  statBarWrap: {
    marginBottom: 10,
  },
  statBarMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  statBarLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  statBarVal: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  barTrack: {
    height: 7,
    backgroundColor: '#070A11',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  barTip: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 4,
    lineHeight: 14,
  },
  metricsGridTwo: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#070A11',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  metricCardLabel: {
    color: '#64748B',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metricCardVal: {
    fontSize: 20,
    fontWeight: '900',
  },
  metricCardSub: {
    color: '#94A3B8',
    fontSize: 9,
    marginTop: 2,
  },
  metricsGridThree: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  metricCardSmall: {
    flex: 1,
    backgroundColor: '#070A11',
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
  },
  drillSimBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.tennisVolt,
    borderRadius: 8,
    paddingVertical: 9,
    marginTop: 8,
    gap: 6,
  },
  drillSimBtnText: {
    color: '#070A11',
    fontSize: 10,
    fontWeight: '900',
  },
  patternsIntro: {
    color: '#94A3B8',
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 4,
  },
  patternSimCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  patternSimHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  patternSimName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  patternSimCat: {
    color: THEME.colors.electricBlue,
    fontSize: 9,
    fontWeight: '800',
    marginTop: 2,
  },
  badgeVolt: {
    backgroundColor: 'rgba(204, 255, 0, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.4)',
  },
  badgeVoltText: {
    color: THEME.colors.tennisVolt,
    fontSize: 9,
    fontWeight: '900',
  },
  patternDesc: {
    color: '#CBD5E1',
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 10,
  },
  actionPlanBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 245, 155, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 155, 0.3)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  actionPlanTitle: {
    color: THEME.colors.neonGreen,
    fontSize: 9,
    fontWeight: '900',
    marginBottom: 2,
  },
  actionPlanText: {
    color: '#E2E8F0',
    fontSize: 10,
    lineHeight: 14,
  },
  simulatePatternActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.tennisVolt,
    borderRadius: 8,
    paddingVertical: 10,
    gap: 6,
  },
  simulatePatternActionText: {
    color: '#070A11',
    fontSize: 10,
    fontWeight: '900',
  },
  patternList: {
    gap: 8,
    marginTop: 8,
  },
  patternItem: {
    backgroundColor: '#070A11',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  patternItemActive: {
    borderColor: THEME.colors.tennisVolt,
    backgroundColor: '#0C1220',
  },
  patternItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  patternItemTitle: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  patternItemWin: {
    color: THEME.colors.neonGreen,
    fontSize: 11,
    fontWeight: '900',
  },
  patternItemSub: {
    color: '#64748B',
    fontSize: 9,
    marginTop: 2,
  },
  bottomCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.tennisVolt,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  bottomCtaText: {
    color: '#070A11',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
});
