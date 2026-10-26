import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { getMatches, MatchRecord } from '../../database/matchService';

interface MatchHistoryScreenProps {
  onSelectMatch: (matchId: number) => void;
}

export function MatchHistoryScreen({ onSelectMatch }: MatchHistoryScreenProps) {
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      const data = await getMatches();
      setMatches(data);
    } catch (e) {
      console.error('Failed to load matches', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading match history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Match History</Text>
      {matches.length === 0 ? (
        <Text style={styles.emptyText}>No recorded matches found.</Text>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(item) => (item.id ? item.id.toString() : Math.random().toString())}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => item.id && onSelectMatch(item.id)}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.players}>{item.player1} vs {item.player2}</Text>
                <Text style={styles.date}>{item.date}</Text>
              </View>
              <Text style={styles.score}>Score: {item.score}</Text>
              <Text style={styles.duration}>Duration: {item.duration}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  loadingText: {
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 40,
  },
  emptyText: {
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  players: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  date: {
    fontSize: 14,
    color: '#94a3b8',
  },
  score: {
    fontSize: 16,
    color: '#38bdf8',
    marginBottom: 4,
  },
  duration: {
    fontSize: 14,
    color: '#94a3b8',
  },
});
