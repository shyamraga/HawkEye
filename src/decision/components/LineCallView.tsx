import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DecisionSummary } from '../services/decisionService';

export interface LineCallViewProps {
  decision: DecisionSummary | null;
  testID?: string;
}

export function LineCallView({ decision, testID = 'line-call-view' }: LineCallViewProps) {
  if (!decision) {
    return (
      <View style={styles.container} testID={testID}>
        <Text style={styles.waitingText}>Waiting for bounce decision...</Text>
      </View>
    );
  }

  const isIn = decision.verdict === 'IN';
  const bannerStyle = isIn ? styles.bannerIn : styles.bannerOut;
  const verdictText = decision.verdict;

  return (
    <View style={styles.container} testID={testID}>
      <View style={[styles.banner, bannerStyle]}>
        <Text style={styles.verdictText} testID="verdict-text">
          {verdictText}
        </Text>
        {decision.isTouch && <Text style={styles.touchText} testID="touch-text">TOUCH</Text>}
      </View>

      <View style={styles.detailsContainer}>
        <Text style={styles.detailText} testID="distance-text">
          Distance: {Math.abs(decision.distanceFromLineCm)} cm {decision.distanceFromLineCm >= 0 ? 'inside/touching' : 'outside'}
        </Text>
        {decision.nearestLineName && (
          <Text style={styles.detailText} testID="line-name-text">
            Line: {decision.nearestLineName}
          </Text>
        )}
        <Text style={styles.detailText} testID="confidence-text">
          Confidence: {Math.round(decision.confidence * 100)}%
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
    width: '100%',
    maxWidth: 400,
  },
  waitingText: {
    color: '#888888',
    fontSize: 16,
    fontStyle: 'italic',
  },
  banner: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    flexDirection: 'row',
  },
  bannerIn: {
    backgroundColor: '#2e7d32', // Green
  },
  bannerOut: {
    backgroundColor: '#c62828', // Red
  },
  verdictText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  touchText: {
    color: '#ffeb3b',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  detailsContainer: {
    width: '100%',
    alignItems: 'center',
  },
  detailText: {
    color: '#e0e0e0',
    fontSize: 14,
    marginVertical: 2,
  },
});
