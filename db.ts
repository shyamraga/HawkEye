import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

export interface MatchRecord {
  id: string;
  playerOne: string;
  playerTwo: string;
  matchDate: number;
  score: string;
  durationSeconds: number;
  courtSurface: string;
}

export interface LineCallRecord {
  id: string;
  matchId: string;
  timestamp: number;
  bounceX: number;
  bounceY: number;
  decision: 'IN' | 'OUT';
  offsetMm: number;
  trajectoryJson: string;
}

// In-memory cache mirror for instant UI updates and offline fallback
const memoryMatches: MatchRecord[] = [];
const memoryCalls: LineCallRecord[] = [];

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase | null> {
  if (Platform.OS === 'web') return null;
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('tennis_line_caller.db');
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS matches (
          id TEXT PRIMARY KEY,
          player_one TEXT NOT NULL,
          player_two TEXT NOT NULL,
          match_date INTEGER NOT NULL,
          score TEXT NOT NULL,
          duration_seconds INTEGER NOT NULL,
          court_surface TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS line_calls (
          id TEXT PRIMARY KEY,
          match_id TEXT NOT NULL,
          timestamp INTEGER NOT NULL,
          bounce_x REAL NOT NULL,
          bounce_y REAL NOT NULL,
          decision TEXT NOT NULL,
          offset_mm INTEGER NOT NULL,
          trajectory_json TEXT NOT NULL
        );
      `);
      return db;
    })();
  }
  return dbPromise;
}

export async function initDatabase(): Promise<void> {
  try {
    const db = await getDb();
    if (db) {
      // Pre-load memory cache from SQLite
      const rows = await db.getAllAsync<{
        id: string;
        player_one: string;
        player_two: string;
        match_date: number;
        score: string;
        duration_seconds: number;
        court_surface: string;
      }>('SELECT * FROM matches ORDER BY match_date DESC LIMIT 50');

      memoryMatches.length = 0;
      for (const r of rows) {
        memoryMatches.push({
          id: r.id,
          playerOne: r.player_one,
          playerTwo: r.player_two,
          matchDate: r.match_date,
          score: r.score,
          durationSeconds: r.duration_seconds,
          courtSurface: r.court_surface,
        });
      }
    }
  } catch (err) {
    console.warn('SQLite init warning (using in-memory store):', err);
  }
}

export async function saveMatch(match: MatchRecord): Promise<void> {
  // Update memory immediately
  const existingIdx = memoryMatches.findIndex(m => m.id === match.id);
  if (existingIdx >= 0) {
    memoryMatches[existingIdx] = match;
  } else {
    memoryMatches.unshift(match);
  }

  try {
    const db = await getDb();
    if (db) {
      await db.runAsync(
        `INSERT OR REPLACE INTO matches (id, player_one, player_two, match_date, score, duration_seconds, court_surface) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [match.id, match.playerOne, match.playerTwo, match.matchDate, match.score, match.durationSeconds, match.courtSurface]
      );
    }
  } catch (err) {
    console.warn('SQLite saveMatch warning:', err);
  }
}

export async function saveLineCall(call: LineCallRecord): Promise<void> {
  memoryCalls.push(call);
  try {
    const db = await getDb();
    if (db) {
      await db.runAsync(
        `INSERT OR REPLACE INTO line_calls (id, match_id, timestamp, bounce_x, bounce_y, decision, offset_mm, trajectory_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [call.id, call.matchId, call.timestamp, call.bounceX, call.bounceY, call.decision, call.offsetMm, call.trajectoryJson]
      );
    }
  } catch (err) {
    console.warn('SQLite saveLineCall warning:', err);
  }
}

export async function getRecentMatches(): Promise<MatchRecord[]> {
  try {
    const db = await getDb();
    if (db) {
      const rows = await db.getAllAsync<{
        id: string;
        player_one: string;
        player_two: string;
        match_date: number;
        score: string;
        duration_seconds: number;
        court_surface: string;
      }>('SELECT * FROM matches ORDER BY match_date DESC LIMIT 30');

      return rows.map(r => ({
        id: r.id,
        playerOne: r.player_one,
        playerTwo: r.player_two,
        matchDate: r.match_date,
        score: r.score,
        durationSeconds: r.duration_seconds,
        courtSurface: r.court_surface,
      }));
    }
  } catch (err) {
    console.warn('SQLite getRecentMatches warning:', err);
  }
  return [...memoryMatches];
}

export async function getMatchDetails(matchId: string): Promise<{ match: MatchRecord | null; calls: LineCallRecord[] }> {
  try {
    const db = await getDb();
    if (db) {
      const matchRow = await db.getFirstAsync<{
        id: string;
        player_one: string;
        player_two: string;
        match_date: number;
        score: string;
        duration_seconds: number;
        court_surface: string;
      }>('SELECT * FROM matches WHERE id = ?', [matchId]);

      const callsRows = await db.getAllAsync<{
        id: string;
        match_id: string;
        timestamp: number;
        bounce_x: number;
        bounce_y: number;
        decision: string;
        offset_mm: number;
        trajectory_json: string;
      }>('SELECT * FROM line_calls WHERE match_id = ? ORDER BY timestamp ASC', [matchId]);

      const match: MatchRecord | null = matchRow ? {
        id: matchRow.id,
        playerOne: matchRow.player_one,
        playerTwo: matchRow.player_two,
        matchDate: matchRow.match_date,
        score: matchRow.score,
        durationSeconds: matchRow.duration_seconds,
        courtSurface: matchRow.court_surface,
      } : null;

      const calls: LineCallRecord[] = callsRows.map(c => ({
        id: c.id,
        matchId: c.match_id,
        timestamp: c.timestamp,
        bounceX: c.bounce_x,
        bounceY: c.bounce_y,
        decision: c.decision as 'IN' | 'OUT',
        offsetMm: c.offset_mm,
        trajectoryJson: c.trajectory_json,
      }));

      return { match, calls };
    }
  } catch (err) {
    console.warn('SQLite getMatchDetails warning:', err);
  }

  const match = memoryMatches.find(m => m.id === matchId) || null;
  const calls = memoryCalls.filter(c => c.matchId === matchId);
  return { match, calls };
}

export async function clearAllMatches(): Promise<void> {
  memoryMatches.length = 0;
  memoryCalls.length = 0;
  try {
    const db = await getDb();
    if (db) {
      await db.runAsync('DELETE FROM matches');
      await db.runAsync('DELETE FROM line_calls');
    }
  } catch (err) {
    console.warn('SQLite clearAllMatches warning:', err);
  }
}

export async function deleteMatch(matchId: string): Promise<void> {
  const idx = memoryMatches.findIndex(m => m.id === matchId);
  if (idx !== -1) memoryMatches.splice(idx, 1);
  try {
    const db = await getDb();
    if (db) {
      await db.runAsync('DELETE FROM matches WHERE id = ?', [matchId]);
      await db.runAsync('DELETE FROM line_calls WHERE match_id = ?', [matchId]);
    }
  } catch (err) {
    console.warn('SQLite deleteMatch warning:', err);
  }
}
