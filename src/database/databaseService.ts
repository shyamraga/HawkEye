import * as SQLite from 'expo-sqlite';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) {
    return dbInstance;
  }
  dbInstance = await SQLite.openDatabaseAsync('tennis_matches.db');
  await initDatabase(dbInstance);
  return dbInstance;
}

async function initDatabase(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      player1 TEXT NOT NULL,
      player2 TEXT NOT NULL,
      score TEXT NOT NULL,
      duration TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS challenges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      match_id INTEGER NOT NULL,
      set_number INTEGER NOT NULL,
      point_number INTEGER NOT NULL,
      call_type TEXT NOT NULL,
      verdict TEXT NOT NULL,
      confidence REAL NOT NULL,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (match_id) REFERENCES matches (id) ON DELETE CASCADE
    );
  `);
}
