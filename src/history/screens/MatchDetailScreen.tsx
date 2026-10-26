import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { getMatchById, getChallengesForMatch, calculateMatchStats, MatchRecord, ChallengeRecord, MatchStats } from '../../database/matchService';

interface MatchDetailScreenProps {
  matchId: number;
  onBack: () => void;
}

export function MatchDetailScreen({ matchId, onBack }: MatchDetailScreenProps) {
  const [match, setMatch] = useState<MatchRecord | null>(null);
  const [challenges, setChallenges] = useState<ChallengeRecord[]>([]);
  const [stats, setStats] = useState<MatchStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadData();
  }, [matchId]);

  const loadData = async () => {
    try {
      const matchData = await getMatchById(matchId);
      const challengeData = await getChallengesForMatch(matchId);
      const statsData = await calculateMatchStats(matchId);
      setMatch(matchData);
      setChallenges(challengeData);
      setStats(statsData);
    } catch (e) {
      console.error('Failed to load match detail', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !match) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading match details...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backButtonText}>← Back to History</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{match.player1} vs {match.player2}</Text>
      <Text style={styles.subtitle}>Date: {match.date} | Duration: {match.duration}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Match Score</Text>
        <Text style={styles.scoreText}>{match.score}</Text>
      </View>

      {stats && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Challenge Statistics</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.totalChallenges}</Text>
              <Text style={styles.statLabel}>Total Challenges</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.successfulChallenges}</Text>
              <Text style={styles.statLabel}>Successful</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.accuracyPercentage}%</Text>
              <Text style={styles.statLabel}>Accuracy</Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Challenge Log</Text>
        {challenges.length === 0 ? (
          <Text style={styles.emptyText}>No challenges recorded in this match.</Text>
        ) : (
          challenges.map((c, index) => (
            <View key={c.id || index} style={styles.challengeItem}>
              <View style={styles.challengeHeader}>
                <Text style={styles.challengeCall}>Set {c.set_number}, Point {c.point_number} ({c.call_type})</Text>
                <Text style={[styles.challengeVerdict, c.verdict === 'OVERTURNED' ? styles.overturned : styles.confirmed]}>
                  {c.verdict}
                </Text>
              </View>
              <Text style={styles.challengeMeta}>Confidence: {Math.round(c.confidence * 100)}% | Time: {c.timestamp}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 16,
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    color: '#38bdf8',
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 20,
  },
  loadingText: {
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 40,
  },
  emptyText: {
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  scoreText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#38bdf8',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 12,
    borderRadius: 6,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#38bdf8',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
  },
  challengeItem: {
    backgroundColor: '#0f172a',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  challengeCall: {
    fontSize: 15,
    fontWeight: '500',
    color: '#ffffff',
  },
  challengeVerdict: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  overturned: {
    color: '#f43f5e',
  },
  confirmed: {
    color: '#10b981',
  },
  challengeMeta: {
    fontSize: 12,
    color: '#94a3b8',
  },
});
