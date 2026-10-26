import { getDatabase } from './databaseService';

export interface MatchRecord {
  id?: number;
  date: string;
  player1: string;
  player2: string;
  score: string;
  duration: string;
}

export interface ChallengeRecord {
  id?: number;
  match_id: number;
  set_number: number;
  point_number: number;
  call_type: string;
  verdict: string;
  confidence: number;
  timestamp: string;
}

export interface MatchStats {
  totalChallenges: number;
  successfulChallenges: number;
  accuracyPercentage: number;
}

export async function insertMatch(match: MatchRecord): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT INTO matches (date, player1, player2, score, duration) VALUES (?, ?, ?, ?, ?)`,
    [match.date, match.player1, match.player2, match.score, match.duration]
  );
  return result.lastInsertRowId;
}

export async function getMatches(): Promise<MatchRecord[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<MatchRecord>('SELECT * FROM matches ORDER BY id DESC');
  return rows;
}

export async function getMatchById(id: number): Promise<MatchRecord | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<MatchRecord>('SELECT * FROM matches WHERE id = ?', [id]);
  return row || null;
}

export async function insertChallenge(challenge: ChallengeRecord): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT INTO challenges (match_id, set_number, point_number, call_type, verdict, confidence, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      challenge.match_id,
      challenge.set_number,
      challenge.point_number,
      challenge.call_type,
      challenge.verdict,
      challenge.confidence,
      challenge.timestamp,
    ]
  );
  return result.lastInsertRowId;
}

export async function getChallengesForMatch(matchId: number): Promise<ChallengeRecord[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ChallengeRecord>('SELECT * FROM challenges WHERE match_id = ?', [matchId]);
  return rows;
}

export async function calculateMatchStats(matchId: number): Promise<MatchStats> {
  const challenges = await getChallengesForMatch(matchId);
  const totalChallenges = challenges.length;
  if (totalChallenges === 0) {
    return { totalChallenges: 0, successfulChallenges: 0, accuracyPercentage: 0 };
  }
  // A challenge is considered successful/correct if verdict is OVERTURNED or SUCCESS (or if user challenge overturned the original call)
  const successfulChallenges = challenges.filter(
    (c) => c.verdict.toUpperCase() === 'OVERTURNED' || c.verdict.toUpperCase() === 'SUCCESS' || c.verdict.toUpperCase() === 'CORRECT'
  ).length;
  const accuracyPercentage = Math.round((successfulChallenges / totalChallenges) * 100);
  return {
    totalChallenges,
    successfulChallenges,
    accuracyPercentage,
  };
}
