import { initializeApp } from 'firebase/app';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  getDoc, 
  query, 
  orderBy, 
  limit, 
  deleteDoc, 
  where 
} from 'firebase/firestore';
import { firebaseConfig } from './firebaseConfig';

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
  decision: "IN" | "OUT";
  offsetMm: number;
  trajectoryJson: string;
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with Persistent Offline Caching enabled
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

export async function initDatabase(): Promise<void> {
  // Firestore is automatically initialized upon calling initializeFirestore.
  console.log("Firestore initialized with persistent local cache.");
}

export async function saveMatch(match: MatchRecord): Promise<void> {
  await setDoc(doc(db, "matches", match.id), {
    id: match.id,
    player_one: match.playerOne,
    player_two: match.playerTwo,
    match_date: match.matchDate,
    score: match.score,
    duration_seconds: match.durationSeconds,
    court_surface: match.courtSurface
  });
}

export async function saveLineCall(call: LineCallRecord): Promise<void> {
  await setDoc(doc(db, "line_calls", call.id), {
    id: call.id,
    match_id: call.matchId,
    timestamp: call.timestamp,
    bounce_x: call.bounceX,
    bounce_y: call.bounceY,
    decision: call.decision,
    offset_mm: call.offsetMm,
    trajectory_json: call.trajectoryJson
  });
}

export async function getRecentMatches(): Promise<MatchRecord[]> {
  const q = query(collection(db, "matches"), orderBy("match_date", "desc"), limit(30));
  const querySnapshot = await getDocs(q);
  const matches: MatchRecord[] = [];
  querySnapshot.forEach((docSnap) => {
    const r = docSnap.data();
    matches.push({
      id: r.id,
      playerOne: r.player_one,
      playerTwo: r.player_two,
      matchDate: r.match_date,
      score: r.score,
      durationSeconds: r.duration_seconds,
      courtSurface: r.court_surface
    });
  });
  return matches;
}

export async function getMatchDetails(matchId: string): Promise<{ match: MatchRecord | null; calls: LineCallRecord[] }> {
  // Get match metadata
  const matchDoc = await getDoc(doc(db, "matches", matchId));
  
  if (!matchDoc.exists()) {
    return { match: null, calls: [] };
  }
  
  const matchRow = matchDoc.data();
  const match: MatchRecord = {
    id: matchRow.id,
    playerOne: matchRow.player_one,
    playerTwo: matchRow.player_two,
    matchDate: matchRow.match_date,
    score: matchRow.score,
    durationSeconds: matchRow.duration_seconds,
    courtSurface: matchRow.court_surface
  };
  
  // Get line calls
  const q = query(collection(db, "line_calls"), where("match_id", "==", matchId), orderBy("timestamp", "asc"));
  const querySnapshot = await getDocs(q);
  const calls: LineCallRecord[] = [];
  querySnapshot.forEach((docSnap) => {
    const r = docSnap.data();
    calls.push({
      id: r.id,
      matchId: r.match_id,
      timestamp: r.timestamp,
      bounceX: r.bounce_x,
      bounceY: r.bounce_y,
      decision: r.decision as "IN" | "OUT",
      offsetMm: r.offset_mm,
      trajectoryJson: r.trajectory_json
    });
  });
  
  return { match, calls };
}

export async function clearAllMatches(): Promise<void> {
  // Delete matches
  const matchesSnapshot = await getDocs(collection(db, "matches"));
  const deleteMatchesPromises = matchesSnapshot.docs.map(docSnap => deleteDoc(docSnap.ref));
  await Promise.all(deleteMatchesPromises);

  // Delete line calls
  const callsSnapshot = await getDocs(collection(db, "line_calls"));
  const deleteCallsPromises = callsSnapshot.docs.map(docSnap => deleteDoc(docSnap.ref));
  await Promise.all(deleteCallsPromises);
}

export async function deleteMatch(matchId: string): Promise<void> {
  // Delete the match document
  await deleteDoc(doc(db, "matches", matchId));
  
  // Cascade delete line calls manually
  const q = query(collection(db, "line_calls"), where("match_id", "==", matchId));
  const querySnapshot = await getDocs(q);
  const deletePromises = querySnapshot.docs.map(docSnap => deleteDoc(docSnap.ref));
  await Promise.all(deletePromises);
}
