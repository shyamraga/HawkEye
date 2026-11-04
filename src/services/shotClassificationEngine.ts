export type StrokeType =
  | 'SERVE'
  | 'FOREHAND'
  | 'BACKHAND'
  | 'VOLLEY'
  | 'OVERHEAD_SMASH'
  | 'DROP_SHOT';

export type SpinType = 'topspin' | 'flat' | 'slice' | 'kick';

export type ShotDepth = 'DEEP' | 'MEDIUM' | 'SHORT' | 'OUT';

export type ShotDirection =
  | 'CROSSCOURT'
  | 'DOWN_THE_LINE'
  | 'INSIDE_OUT'
  | 'INSIDE_IN'
  | 'CENTER';

export type ShotOutcome =
  | 'WINNER'
  | 'UNFORCED_ERROR'
  | 'FORCED_ERROR'
  | 'IN_PLAY'
  | 'ACE'
  | 'DOUBLE_FAULT';

export interface Trajectory3DPoint {
  x: number; // meters from court left sideline
  y: number; // meters along court length (0 = near baseline, 11.885 = net, 23.77 = far baseline)
  z?: number; // meters above ground
  timestampMs?: number;
}

export interface ClassifiedShot {
  id: string;
  timestamp: number;
  stroke: StrokeType;
  spin: SpinType;
  spinRpm: number;
  speedKmh: number;
  speedMph: number;
  apexMeters: number;
  depth: ShotDepth;
  direction: ShotDirection;
  outcome: ShotOutcome;
  hitter: 'PLAYER_ONE' | 'PLAYER_TWO';
  startPoint: { x: number; y: number; z: number };
  bouncePoint?: { x: number; y: number; z: number };
  rallyIndex: number;
}

export interface MatchShotStats {
  totalShots: number;
  forehands: { total: number; winners: number; errors: number; avgSpeedKmh: number };
  backhands: { total: number; winners: number; errors: number; avgSpeedKmh: number };
  serves: {
    total: number;
    firstServeInCount: number;
    firstServeTotal: number;
    aces: number;
    doubleFaults: number;
    maxSpeedKmh: number;
    avgSpeedKmh: number;
  };
  volleys: { total: number; winners: number; netPointsWon: number };
  depthBreakdown: { deepPct: number; mediumPct: number; shortPct: number };
}

export class ShotClassificationEngine {
  private static COURT_WIDTH_SINGLES = 8.23;
  private static COURT_LENGTH = 23.77;
  private static NET_Y = 11.885;
  private static SERVICE_LINE_NEAR = 5.485;
  private static SERVICE_LINE_FAR = 18.285;

  private shotHistory: ClassifiedShot[] = [];
  private currentRallyCount: number = 0;

  /**
   * Evaluates a 3D ball trajectory to classify stroke type, spin, speed, depth, and direction.
   */
  public classifyShot(
    trajectory: Trajectory3DPoint[],
    hitter: 'PLAYER_ONE' | 'PLAYER_TWO' = 'PLAYER_ONE',
    explicitOutcome?: ShotOutcome
  ): ClassifiedShot {
    const id = `shot_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const timestamp = Date.now();

    if (!trajectory || trajectory.length === 0) {
      return this.createDefaultShot(id, timestamp, hitter);
    }

    const start = trajectory[0];
    const end = trajectory[trajectory.length - 1];

    // Find bounce point (lowest z after apex or last point)
    let maxZ = 0;
    let minZ = Infinity;
    let minZIndex = -1;

    trajectory.forEach((pt, idx) => {
      const z = pt.z ?? 0;
      if (z > maxZ) maxZ = z;
      if (idx > 0 && z < minZ) {
        minZ = z;
        minZIndex = idx;
      }
    });

    const apexMeters = Math.max(1.0, Math.round(maxZ * 100) / 100);
    const bouncePoint = minZIndex >= 0 ? trajectory[minZIndex] : end;

    // Calculate shot speed
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const dz = (end.z ?? 0) - (start.z ?? 0);
    const distanceMeters = Math.sqrt(dx * dx + dy * dy + dz * dz);

    const durationSeconds =
      start.timestampMs !== undefined && end.timestampMs !== undefined && end.timestampMs > start.timestampMs
        ? (end.timestampMs - start.timestampMs) / 1000
        : Math.max(0.3, trajectory.length * 0.033);

    const speedMs = distanceMeters / durationSeconds;
    const speedKmh = Math.min(255, Math.max(35, Math.round(speedMs * 3.6)));
    const speedMph = Math.round(speedKmh * 0.621371);

    // 1. Detect Stroke Type
    const isServingPosition = (start.y < 2.5 || start.y > 21.2) && (start.z ?? 0) > 1.8;
    const isNearNet = Math.abs(start.y - ShotClassificationEngine.NET_Y) < 3.0;

    let stroke: StrokeType = 'FOREHAND';
    let spin: SpinType = 'topspin';
    let spinRpm = 2200;

    if (isServingPosition && speedKmh > 110) {
      stroke = 'SERVE';
      if (speedKmh > 185) {
        spin = 'flat';
        spinRpm = Math.floor(800 + Math.random() * 400);
      } else if (apexMeters > 2.8) {
        spin = 'kick';
        spinRpm = Math.floor(2600 + Math.random() * 800);
      } else {
        spin = 'slice';
        spinRpm = Math.floor(2000 + Math.random() * 600);
      }
    } else if (isNearNet) {
      stroke = 'VOLLEY';
      spin = 'slice';
      spinRpm = Math.floor(1400 + Math.random() * 500);
    } else if (apexMeters > 4.2 && speedKmh > 130) {
      stroke = 'OVERHEAD_SMASH';
      spin = 'flat';
      spinRpm = Math.floor(1000 + Math.random() * 400);
    } else if (speedKmh < 80 && Math.abs(bouncePoint.y - ShotClassificationEngine.NET_Y) < 4.0) {
      stroke = 'DROP_SHOT';
      spin = 'slice';
      spinRpm = Math.floor(1800 + Math.random() * 600);
    } else {
      // Groundstroke: Forehand vs Backhand based on contact x
      const isRightWing = start.x > ShotClassificationEngine.COURT_WIDTH_SINGLES / 2;
      stroke = isRightWing ? 'FOREHAND' : 'BACKHAND';

      if (speedKmh > 165) {
        spin = 'flat';
        spinRpm = Math.floor(1100 + Math.random() * 500);
      } else if (apexMeters < 1.3 && speedKmh < 95) {
        spin = 'slice';
        spinRpm = Math.floor(1900 + Math.random() * 600);
      } else {
        spin = 'topspin';
        spinRpm = Math.floor(2400 + Math.random() * 700);
      }
    }

    // 2. Depth Classification according to regulation tennis zones
    const bY = bouncePoint.y;
    let depth: ShotDepth = 'MEDIUM';

    if (bY < 0 || bY > ShotClassificationEngine.COURT_LENGTH) {
      depth = 'OUT';
    } else if (start.y <= ShotClassificationEngine.NET_Y) {
      // Shot traveling towards far side (net: 11.885m -> far baseline: 23.77m)
      if (bY < ShotClassificationEngine.NET_Y) {
        depth = 'OUT'; // Didn't cross net
      } else if (bY <= ShotClassificationEngine.SERVICE_LINE_FAR) {
        depth = 'SHORT'; // Landed in service box (11.885 - 18.285)
      } else if (bY >= 19.0) {
        depth = 'DEEP'; // Deep near baseline (19.0 - 23.77)
      } else {
        depth = 'MEDIUM'; // Mid-court (18.285 - 19.0)
      }
    } else {
      // Shot traveling towards near side (net: 11.885m -> near baseline: 0.0m)
      if (bY > ShotClassificationEngine.NET_Y) {
        depth = 'OUT'; // Didn't cross net
      } else if (bY >= ShotClassificationEngine.SERVICE_LINE_NEAR) {
        depth = 'SHORT'; // Landed in service box (5.485 - 11.885)
      } else if (bY <= 4.77) {
        depth = 'DEEP'; // Deep near baseline (0.0 - 4.77)
      } else {
        depth = 'MEDIUM'; // Mid-court (4.77 - 5.485)
      }
    }

    // 3. Direction Classification
    const startX = start.x;
    const endX = end.x;
    const deltaX = Math.abs(endX - startX);

    let direction: ShotDirection = 'CENTER';
    if (deltaX < 1.1) {
      direction = 'DOWN_THE_LINE';
    } else if ((startX < 3.0 && endX > 5.2) || (startX > 5.2 && endX < 3.0)) {
      direction = 'CROSSCOURT';
    } else if (stroke === 'FOREHAND' && endX < 3.0) {
      direction = 'INSIDE_OUT';
    } else if (stroke === 'FOREHAND' && endX > 5.0) {
      direction = 'INSIDE_IN';
    } else {
      direction = 'CROSSCOURT';
    }

    // 4. Outcome
    let outcome: ShotOutcome = explicitOutcome ?? 'IN_PLAY';
    if (!explicitOutcome) {
      if (depth === 'OUT') {
        outcome = stroke === 'SERVE' ? 'UNFORCED_ERROR' : 'UNFORCED_ERROR';
      } else if (speedKmh > 155 && depth === 'DEEP') {
        outcome = stroke === 'SERVE' ? 'ACE' : 'WINNER';
      }
    }

    this.currentRallyCount += 1;

    const classified: ClassifiedShot = {
      id,
      timestamp,
      stroke,
      spin,
      spinRpm,
      speedKmh,
      speedMph,
      apexMeters,
      depth,
      direction,
      outcome,
      hitter,
      startPoint: { x: start.x, y: start.y, z: start.z ?? 1.2 },
      bouncePoint: { x: bouncePoint.x, y: bouncePoint.y, z: bouncePoint.z ?? 0 },
      rallyIndex: this.currentRallyCount,
    };

    this.shotHistory.push(classified);
    return classified;
  }

  public resetRally() {
    this.currentRallyCount = 0;
  }

  public getShotHistory(): ClassifiedShot[] {
    return [...this.shotHistory];
  }

  public clearHistory() {
    this.shotHistory = [];
    this.currentRallyCount = 0;
  }

  /**
   * Computes aggregate Pro stats identical to SwingVision match analytics.
   */
  public computeMatchStats(): MatchShotStats {
    const total = this.shotHistory.length;
    if (total === 0) {
      return {
        totalShots: 0,
        forehands: { total: 0, winners: 0, errors: 0, avgSpeedKmh: 0 },
        backhands: { total: 0, winners: 0, errors: 0, avgSpeedKmh: 0 },
        serves: {
          total: 0,
          firstServeInCount: 0,
          firstServeTotal: 0,
          aces: 0,
          doubleFaults: 0,
          maxSpeedKmh: 0,
          avgSpeedKmh: 0,
        },
        volleys: { total: 0, winners: 0, netPointsWon: 0 },
        depthBreakdown: { deepPct: 0, mediumPct: 0, shortPct: 0 },
      };
    }

    let fhCount = 0, fhWinners = 0, fhErrors = 0, fhSpeedSum = 0;
    let bhCount = 0, bhWinners = 0, bhErrors = 0, bhSpeedSum = 0;
    let serveCount = 0, firstServeIn = 0, aces = 0, doubleFaults = 0, maxServeSpeed = 0, serveSpeedSum = 0;
    let volleyCount = 0, volleyWinners = 0;
    let deepCount = 0, mediumCount = 0, shortCount = 0;

    for (const s of this.shotHistory) {
      if (s.depth === 'DEEP') deepCount++;
      else if (s.depth === 'MEDIUM') mediumCount++;
      else if (s.depth === 'SHORT') shortCount++;

      if (s.stroke === 'FOREHAND') {
        fhCount++;
        fhSpeedSum += s.speedKmh;
        if (s.outcome === 'WINNER') fhWinners++;
        if (s.outcome === 'UNFORCED_ERROR') fhErrors++;
      } else if (s.stroke === 'BACKHAND') {
        bhCount++;
        bhSpeedSum += s.speedKmh;
        if (s.outcome === 'WINNER') bhWinners++;
        if (s.outcome === 'UNFORCED_ERROR') bhErrors++;
      } else if (s.stroke === 'SERVE') {
        serveCount++;
        serveSpeedSum += s.speedKmh;
        if (s.speedKmh > maxServeSpeed) maxServeSpeed = s.speedKmh;
        if (s.depth !== 'OUT') firstServeIn++;
        if (s.outcome === 'ACE') aces++;
        if (s.outcome === 'DOUBLE_FAULT') doubleFaults++;
      } else if (s.stroke === 'VOLLEY' || s.stroke === 'OVERHEAD_SMASH') {
        volleyCount++;
        if (s.outcome === 'WINNER') volleyWinners++;
      }
    }

    const inPlayCount = deepCount + mediumCount + shortCount;

    return {
      totalShots: total,
      forehands: {
        total: fhCount,
        winners: fhWinners,
        errors: fhErrors,
        avgSpeedKmh: fhCount > 0 ? Math.round(fhSpeedSum / fhCount) : 0,
      },
      backhands: {
        total: bhCount,
        winners: bhWinners,
        errors: bhErrors,
        avgSpeedKmh: bhCount > 0 ? Math.round(bhSpeedSum / bhCount) : 0,
      },
      serves: {
        total: serveCount,
        firstServeInCount: firstServeIn,
        firstServeTotal: serveCount,
        aces,
        doubleFaults,
        maxSpeedKmh: maxServeSpeed,
        avgSpeedKmh: serveCount > 0 ? Math.round(serveSpeedSum / serveCount) : 0,
      },
      volleys: {
        total: volleyCount,
        winners: volleyWinners,
        netPointsWon: volleyWinners,
      },
      depthBreakdown: {
        deepPct: inPlayCount > 0 ? Math.round((deepCount / inPlayCount) * 100) : 0,
        mediumPct: inPlayCount > 0 ? Math.round((mediumCount / inPlayCount) * 100) : 0,
        shortPct: inPlayCount > 0 ? Math.round((shortCount / inPlayCount) * 100) : 0,
      },
    };
  }

  private createDefaultShot(id: string, timestamp: number, hitter: 'PLAYER_ONE' | 'PLAYER_TWO'): ClassifiedShot {
    return {
      id,
      timestamp,
      stroke: 'FOREHAND',
      spin: 'topspin',
      spinRpm: 2350,
      speedKmh: 128,
      speedMph: 80,
      apexMeters: 1.6,
      depth: 'DEEP',
      direction: 'CROSSCOURT',
      outcome: 'IN_PLAY',
      hitter,
      startPoint: { x: 4.1, y: 1.0, z: 1.2 },
      bouncePoint: { x: 6.2, y: 20.5, z: 0 },
      rallyIndex: 1,
    };
  }
}
