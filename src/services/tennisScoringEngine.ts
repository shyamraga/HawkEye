import * as Speech from 'expo-speech';

export type PointScore = '0' | '15' | '30' | '40' | 'AD';

export interface TennisScoreState {
  playerOneName: string;
  playerTwoName: string;
  playerOnePoints: number; // 0, 1, 2, 3, 4 (AD)
  playerTwoPoints: number;
  playerOneGames: number;
  playerTwoGames: number;
  playerOneSets: number;
  playerTwoSets: number;
  setScores: { p1: number; p2: number }[]; // completed sets e.g. [{p1: 6, p2: 4}]
  isTiebreak: boolean;
  tiebreakPointsP1: number;
  tiebreakPointsP2: number;
  currentServer: 1 | 2;
  servingPlayerName: string;
  matchWinner: 1 | 2 | null;
  p1Challenges: number;
  p2Challenges: number;
  shotClockSeconds: number;
  isShotClockActive: boolean;
}

const POINT_NAMES: Record<number, PointScore> = {
  0: '0',
  1: '15',
  2: '30',
  3: '40',
};

export class TennisScoringEngine {
  private state: TennisScoreState;
  private soundEnabled: boolean = true;

  constructor(p1Name: string = 'Player 1', p2Name: string = 'Player 2') {
    this.state = this.createInitialState(p1Name, p2Name);
  }

  private createInitialState(p1Name: string, p2Name: string): TennisScoreState {
    return {
      playerOneName: p1Name,
      playerTwoName: p2Name,
      playerOnePoints: 0,
      playerTwoPoints: 0,
      playerOneGames: 0,
      playerTwoGames: 0,
      playerOneSets: 0,
      playerTwoSets: 0,
      setScores: [],
      isTiebreak: false,
      tiebreakPointsP1: 0,
      tiebreakPointsP2: 0,
      currentServer: 1,
      servingPlayerName: p1Name,
      matchWinner: null,
      p1Challenges: 3,
      p2Challenges: 3,
      shotClockSeconds: 25,
      isShotClockActive: false,
    };
  }

  public getState(): TennisScoreState {
    return { ...this.state };
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  public speak(phrase: string) {
    if (!this.soundEnabled) return;
    try {
      Speech.stop();
      Speech.speak(phrase, {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.95,
      });
    } catch {
      // Audio speech fallback graceful handling
    }
  }

  public pointWonBy(player: 1 | 2): TennisScoreState {
    if (this.state.matchWinner !== null) return this.state;

    // Reset shot clock on point end
    this.state.shotClockSeconds = 25;
    this.state.isShotClockActive = true;

    if (this.state.isTiebreak) {
      this.handleTiebreakPoint(player);
    } else {
      this.handleStandardPoint(player);
    }

    return this.getState();
  }

  private handleStandardPoint(player: 1 | 2) {
    const p1 = this.state.playerOnePoints;
    const p2 = this.state.playerTwoPoints;

    if (player === 1) {
      if (p1 === 3 && p2 < 3) {
        this.gameWonBy(1);
      } else if (p1 === 3 && p2 === 3) {
        // Deuce -> Advantage P1
        this.state.playerOnePoints = 4;
        this.speak(`Advantage ${this.state.playerOneName}`);
      } else if (p1 === 3 && p2 === 4) {
        // P2 had AD -> Back to Deuce
        this.state.playerTwoPoints = 3;
        this.speak("Deuce");
      } else if (p1 === 4) {
        // P1 had AD -> Game
        this.gameWonBy(1);
      } else {
        this.state.playerOnePoints += 1;
        this.announceGameScore();
      }
    } else {
      if (p2 === 3 && p1 < 3) {
        this.gameWonBy(2);
      } else if (p2 === 3 && p1 === 3) {
        // Deuce -> Advantage P2
        this.state.playerTwoPoints = 4;
        this.speak(`Advantage ${this.state.playerTwoName}`);
      } else if (p2 === 3 && p1 === 4) {
        // P1 had AD -> Back to Deuce
        this.state.playerOnePoints = 3;
        this.speak("Deuce");
      } else if (p2 === 4) {
        // P2 had AD -> Game
        this.gameWonBy(2);
      } else {
        this.state.playerTwoPoints += 1;
        this.announceGameScore();
      }
    }
  }

  private announceGameScore() {
    const p1 = this.state.playerOnePoints;
    const p2 = this.state.playerTwoPoints;

    if (p1 === 3 && p2 === 3) {
      this.speak("Deuce");
      return;
    }

    const p1Term = p1 === 0 ? "Love" : POINT_NAMES[p1];
    const p2Term = p2 === 0 ? "Love" : POINT_NAMES[p2];

    if (p1 === p2) {
      this.speak(`${p1Term} All`);
    } else if (this.state.currentServer === 1) {
      this.speak(`${p1Term} - ${p2Term}`);
    } else {
      this.speak(`${p2Term} - ${p1Term}`);
    }
  }

  private handleTiebreakPoint(player: 1 | 2) {
    if (player === 1) {
      this.state.tiebreakPointsP1 += 1;
    } else {
      this.state.tiebreakPointsP2 += 1;
    }

    const t1 = this.state.tiebreakPointsP1;
    const t2 = this.state.tiebreakPointsP2;

    this.speak(`${t1} - ${t2}`);

    // Server alternation: after point 1, then every 2 points
    const totalPts = t1 + t2;
    if (totalPts % 2 === 1) {
      this.toggleServer();
    }

    // Check tiebreak win (at least 7 points, lead by 2)
    if (t1 >= 7 && t1 - t2 >= 2) {
      this.setWonBy(1, true);
    } else if (t2 >= 7 && t2 - t1 >= 2) {
      this.setWonBy(2, true);
    }
  }

  private gameWonBy(player: 1 | 2) {
    this.state.playerOnePoints = 0;
    this.state.playerTwoPoints = 0;

    const winnerName = player === 1 ? this.state.playerOneName : this.state.playerTwoName;

    if (player === 1) {
      this.state.playerOneGames += 1;
    } else {
      this.state.playerTwoGames += 1;
    }

    const g1 = this.state.playerOneGames;
    const g2 = this.state.playerTwoGames;

    this.speak(`Game ${winnerName}`);

    // Check Set Win condition
    if (g1 >= 6 && g1 - g2 >= 2) {
      this.setWonBy(1, false);
    } else if (g2 >= 6 && g2 - g1 >= 2) {
      this.setWonBy(2, false);
    } else if (g1 === 6 && g2 === 6) {
      // Enter Tiebreak!
      this.state.isTiebreak = true;
      this.state.tiebreakPointsP1 = 0;
      this.state.tiebreakPointsP2 = 0;
      this.speak("Tiebreak");
    } else {
      this.toggleServer();
    }
  }

  private setWonBy(player: 1 | 2, wasTiebreak: boolean) {
    const p1Games = this.state.playerOneGames;
    const p2Games = this.state.playerTwoGames;
    this.state.setScores.push({ p1: p1Games, p2: p2Games });

    const winnerName = player === 1 ? this.state.playerOneName : this.state.playerTwoName;

    if (player === 1) {
      this.state.playerOneSets += 1;
    } else {
      this.state.playerTwoSets += 1;
    }

    this.state.playerOneGames = 0;
    this.state.playerTwoGames = 0;
    this.state.isTiebreak = false;
    this.state.tiebreakPointsP1 = 0;
    this.state.tiebreakPointsP2 = 0;
    // Reset challenges for next set
    this.state.p1Challenges = 3;
    this.state.p2Challenges = 3;

    // Check Match Win (best of 3 sets -> first to 2)
    if (this.state.playerOneSets >= 2) {
      this.state.matchWinner = 1;
      this.speak(`Game, Set and Match, ${this.state.playerOneName}!`);
    } else if (this.state.playerTwoSets >= 2) {
      this.state.matchWinner = 2;
      this.speak(`Game, Set and Match, ${this.state.playerTwoName}!`);
    } else {
      this.speak(`First set ${winnerName}, ${p1Games} games to ${p2Games}`);
      this.toggleServer();
    }
  }

  private toggleServer() {
    this.state.currentServer = this.state.currentServer === 1 ? 2 : 1;
    this.state.servingPlayerName =
      this.state.currentServer === 1 ? this.state.playerOneName : this.state.playerTwoName;
  }

  public useChallenge(player: 1 | 2, callOverruled: boolean): boolean {
    if (player === 1) {
      if (this.state.p1Challenges <= 0) return false;
      if (!callOverruled) {
        this.state.p1Challenges -= 1; // Challenge unsuccessful, loses 1
      }
      return true;
    } else {
      if (this.state.p2Challenges <= 0) return false;
      if (!callOverruled) {
        this.state.p2Challenges -= 1;
      }
      return true;
    }
  }

  public resetMatch(p1Name?: string, p2Name?: string) {
    this.state = this.createInitialState(
      p1Name || this.state.playerOneName,
      p2Name || this.state.playerTwoName
    );
  }

  public getDisplayPointP1(): string {
    if (this.state.isTiebreak) return String(this.state.tiebreakPointsP1);
    if (this.state.playerOnePoints === 4) return 'AD';
    return POINT_NAMES[this.state.playerOnePoints] || '0';
  }

  public getDisplayPointP2(): string {
    if (this.state.isTiebreak) return String(this.state.tiebreakPointsP2);
    if (this.state.playerTwoPoints === 4) return 'AD';
    return POINT_NAMES[this.state.playerTwoPoints] || '0';
  }
}
