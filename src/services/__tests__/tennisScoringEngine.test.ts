import { TennisScoringEngine } from '../tennisScoringEngine';

describe('TennisScoringEngine', () => {
  let engine: TennisScoringEngine;

  beforeEach(() => {
    engine = new TennisScoringEngine('Carlos', 'Jannik');
    engine.setSoundEnabled(false); // disable sound in tests
  });

  test('initializes with zero score and 3 challenges', () => {
    const state = engine.getState();
    expect(state.playerOneName).toBe('Carlos');
    expect(state.playerTwoName).toBe('Jannik');
    expect(state.playerOnePoints).toBe(0);
    expect(state.playerTwoPoints).toBe(0);
    expect(state.playerOneGames).toBe(0);
    expect(state.playerTwoGames).toBe(0);
    expect(state.p1Challenges).toBe(3);
    expect(state.p2Challenges).toBe(3);
  });

  test('advances game points correctly (15, 30, 40, Game)', () => {
    engine.pointWonBy(1);
    expect(engine.getDisplayPointP1()).toBe('15');
    engine.pointWonBy(1);
    expect(engine.getDisplayPointP1()).toBe('30');
    engine.pointWonBy(1);
    expect(engine.getDisplayPointP1()).toBe('40');
    engine.pointWonBy(1);
    // Game won by player 1
    const state = engine.getState();
    expect(state.playerOneGames).toBe(1);
    expect(state.playerOnePoints).toBe(0);
  });

  test('handles Deuce and Advantage transitions', () => {
    // Bring to 40-40 (Deuce)
    engine.pointWonBy(1); // 15
    engine.pointWonBy(1); // 30
    engine.pointWonBy(1); // 40
    engine.pointWonBy(2); // 15
    engine.pointWonBy(2); // 30
    engine.pointWonBy(2); // 40 (Deuce)

    expect(engine.getDisplayPointP1()).toBe('40');
    expect(engine.getDisplayPointP2()).toBe('40');

    // P1 wins point -> Advantage P1
    engine.pointWonBy(1);
    expect(engine.getDisplayPointP1()).toBe('AD');
    expect(engine.getDisplayPointP2()).toBe('40');

    // P2 wins point -> Back to Deuce
    engine.pointWonBy(2);
    expect(engine.getDisplayPointP1()).toBe('40');
    expect(engine.getDisplayPointP2()).toBe('40');

    // P2 wins two in a row -> Game P2
    engine.pointWonBy(2); // AD P2
    expect(engine.getDisplayPointP2()).toBe('AD');
    engine.pointWonBy(2); // Game P2
    expect(engine.getState().playerTwoGames).toBe(1);
  });

  test('triggers tiebreak at 6-6 in games', () => {
    // Alternate games so neither player gets a 2-game lead at 6:
    // 1-0, 1-1, 2-1, 2-2, 3-2, 3-3, 4-3, 4-4, 5-4, 5-5, 6-5, 6-6
    for (let round = 0; round < 5; round++) {
      for (let p = 0; p < 4; p++) engine.pointWonBy(1);
      for (let p = 0; p < 4; p++) engine.pointWonBy(2);
    }
    // Now 5-5
    expect(engine.getState().playerOneGames).toBe(5);
    expect(engine.getState().playerTwoGames).toBe(5);

    // 6-5
    for (let p = 0; p < 4; p++) engine.pointWonBy(1);
    expect(engine.getState().playerOneGames).toBe(6);
    expect(engine.getState().playerTwoGames).toBe(5);

    // 6-6 -> Tiebreak
    for (let p = 0; p < 4; p++) engine.pointWonBy(2);
    expect(engine.getState().isTiebreak).toBe(true);
  });

  test('deducts challenge only on unsuccessful challenge', () => {
    // Overruled = true (successful challenge) -> challenges remain 3
    engine.useChallenge(1, true);
    expect(engine.getState().p1Challenges).toBe(3);

    // Overruled = false (failed challenge) -> loses 1 challenge
    engine.useChallenge(1, false);
    expect(engine.getState().p1Challenges).toBe(2);
  });
});
