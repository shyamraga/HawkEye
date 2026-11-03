import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { ShieldAlert, CheckCircle, XCircle } from 'lucide-react-native';
import { THEME } from '../../theme/theme';
import { HawkEyeChalkVisualizer } from './HawkEyeChalkVisualizer';

interface HawkEyeChallengeModalProps {
  visible: boolean;
  decision: 'IN' | 'OUT';
  offsetMm: number;
  courtSurface: string;
  challengingPlayer: string;
  p1Name: string;
  p2Name: string;
  p1Challenges: number;
  p2Challenges: number;
  onDismiss: () => void;
  onApplyRuling: (overruled: boolean) => void;
}

export const HawkEyeChallengeModal: React.FC<HawkEyeChallengeModalProps> = ({
  visible,
  decision,
  offsetMm,
  courtSurface,
  challengingPlayer,
  p1Name,
  p2Name,
  p1Challenges,
  p2Challenges,
  onDismiss,
  onApplyRuling,
}) => {
  const isIn = decision === 'IN';
  const accentColor = isIn ? THEME.colors.neonGreen : THEME.colors.neonRed;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Top Broadcast Bar */}
          <View style={styles.topBar}>
            <View style={styles.brandRow}>
              <ShieldAlert size={20} color={THEME.colors.tennisVolt} />
              <Text style={styles.brandText}>HAWK-EYE SYSTEM REVIEW</Text>
            </View>
            <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Remaining Challenges Tracker */}
          <View style={styles.challengesTracker}>
            <View style={styles.playerChallengeBox}>
              <Text style={styles.playerTitle} numberOfLines={1}>{p1Name}</Text>
              <View style={styles.dotsRow}>
                {[1, 2, 3].map(i => (
                  <View
                    key={i}
                    style={[
                      styles.challengeDot,
                      i <= p1Challenges ? styles.dotActive : styles.dotInactive,
                    ]}
                  />
                ))}
              </View>
            </View>

            <View style={styles.vsBox}>
              <Text style={styles.vsText}>VS</Text>
            </View>

            <View style={styles.playerChallengeBox}>
              <Text style={styles.playerTitle} numberOfLines={1}>{p2Name}</Text>
              <View style={styles.dotsRow}>
                {[1, 2, 3].map(i => (
                  <View
                    key={i}
                    style={[
                      styles.challengeDot,
                      i <= p2Challenges ? styles.dotActive : styles.dotInactive,
                    ]}
                  />
                ))}
              </View>
            </View>
          </View>

          {/* Zoomed Impact Canvas */}
          <HawkEyeChalkVisualizer
            decision={decision}
            offsetMm={offsetMm}
            courtSurface={courtSurface}
            reviewedByPlayer={challengingPlayer}
            isChallengeMode={true}
          />

          {/* Call Verdict Box */}
          <View style={[styles.verdictBox, { borderColor: accentColor }]}>
            {isIn ? (
              <CheckCircle size={24} color={THEME.colors.neonGreen} />
            ) : (
              <XCircle size={24} color={THEME.colors.neonRed} />
            )}
            <View style={styles.verdictTextCol}>
              <Text style={[styles.verdictTitle, { color: accentColor }]}>
                {isIn ? 'CALL CONFIRMED: IN' : 'CALL CONFIRMED: OUT'}
              </Text>
              <Text style={styles.verdictSub}>
                Impact recorded with millimeter accuracy
              </Text>
            </View>
          </View>

          {/* Action Button */}
          <TouchableOpacity
            style={[styles.confirmBtn, { backgroundColor: THEME.colors.tennisVolt }]}
            onPress={() => onApplyRuling(false)}
            activeOpacity={0.8}
          >
            <Text style={styles.confirmBtnText}>RESUME MATCH</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: THEME.spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.xl,
    padding: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: THEME.colors.borderGlow,
    ...THEME.shadows.glowVolt,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandText: {
    color: THEME.colors.tennisVolt,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  closeBtn: {
    color: THEME.colors.textSecondary,
    fontSize: 18,
    fontWeight: 'bold',
    padding: 4,
  },
  challengesTracker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.colors.surfaceElevated,
    borderRadius: THEME.radius.md,
    padding: THEME.spacing.sm,
    marginBottom: THEME.spacing.sm,
  },
  playerChallengeBox: {
    flex: 1,
    alignItems: 'center',
  },
  playerTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  challengeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotActive: {
    backgroundColor: THEME.colors.neonGreen,
  },
  dotInactive: {
    backgroundColor: THEME.colors.textMuted,
    opacity: 0.3,
  },
  vsBox: {
    paddingHorizontal: 8,
  },
  vsText: {
    color: THEME.colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
  },
  verdictBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: THEME.colors.surfaceElevated,
    padding: THEME.spacing.md,
    borderRadius: THEME.radius.md,
    borderLeftWidth: 4,
    marginVertical: THEME.spacing.md,
  },
  verdictTextCol: {
    flex: 1,
  },
  verdictTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  verdictSub: {
    color: THEME.colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  confirmBtn: {
    paddingVertical: 14,
    borderRadius: THEME.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...THEME.shadows.glowVolt,
  },
  confirmBtnText: {
    color: '#070A11',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
