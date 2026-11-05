import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Dimensions,
  PanResponder,
  Animated,
  Alert,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets, SafeAreaProvider } from 'react-native-safe-area-context';
import Svg, { Line, Circle, Polyline, Rect, G } from 'react-native-svg';
import * as Speech from 'expo-speech';
import { CameraView, useCameraPermissions } from 'expo-camera';
import {
  Play,
  Camera,
  RotateCcw,
  History,
  Volume2,
  VolumeX,
  Sliders,
  ChevronRight,
  TrendingUp,
  User,
  Activity,
  Trash2,
  Users,
  X,
  ShieldAlert,
  Gauge,
  Timer,
  Zap,
  Sparkles,
  Video,
  Eye,
  Layers,
  Watch,
  Scissors,
  Share2,
  Trophy,
  Flame,
  Download,
} from 'lucide-react-native';

import {
  CourtCalibration,
  KalmanFilter2D,
  BounceDetector,
  checkInOut,
} from './algorithms';

import {
  initDatabase,
  saveMatch,
  saveLineCall,
  getRecentMatches,
  clearAllMatches,
  deleteMatch,
  MatchRecord,
} from './db';

import { THEME } from './src/theme/theme';
import { TennisScoringEngine, TennisScoreState } from './src/services/tennisScoringEngine';
import { SpeedRadarEngine, SpeedTelemetry } from './src/services/speedRadarEngine';
import { HawkEyeChalkVisualizer } from './src/decision/components/HawkEyeChalkVisualizer';
import { HawkEyeChallengeModal } from './src/decision/components/HawkEyeChallengeModal';
import { SlowMoBallZoomPlayer } from './src/replay/components/SlowMoBallZoomPlayer';
import { CourtHeatmapView } from './src/analytics/components/CourtHeatmapView';
import { MatchHighlightsPlayer } from './src/replay/components/MatchHighlightsPlayer';
import { MountCalibrationGuide } from './src/camera/components/MountCalibrationGuide';
import { WatchCompanionModal } from './src/companion/components/WatchCompanionModal';
import { BroadcastExportModal, ExportAspectRatio, ExportResolution } from './src/export/components/BroadcastExportModal';
import { SkeletalCoachView } from './src/tracking/components/SkeletalCoachView';
import {
  ShotClassificationEngine,
  ClassifiedShot,
} from './src/services/shotClassificationEngine';
import {
  TrainingSessionType,
  CameraMountType,
  SESSION_MODES,
  MOUNT_PRESETS,
} from './src/services/sessionModes';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type PageType = 'HOME' | 'CALIBRATE' | 'MATCH' | 'REPLAY' | 'HIGHLIGHTS' | 'STATS';

// Pre-calculated regulation physical trajectories
const trajectoryShotIn = [
  { x: 3.5, y: 1.0, z: 1.2 }, { x: 3.6, y: 1.5, z: 1.25 }, { x: 3.7, y: 2.0, z: 1.3 },
  { x: 3.8, y: 2.5, z: 1.35 }, { x: 3.9, y: 3.0, z: 1.4 }, { x: 4.0, y: 3.5, z: 1.44 },
  { x: 4.1, y: 4.0, z: 1.48 }, { x: 4.2, y: 4.5, z: 1.5 }, { x: 4.3, y: 5.0, z: 1.52 },
  { x: 4.4, y: 5.6, z: 1.53 }, { x: 4.5, y: 6.2, z: 1.53 }, { x: 4.6, y: 6.8, z: 1.52 },
  { x: 4.7, y: 7.4, z: 1.51 }, { x: 4.8, y: 8.0, z: 1.48 }, { x: 4.9, y: 8.6, z: 1.45 },
  { x: 5.0, y: 9.2, z: 1.41 }, { x: 5.1, y: 9.8, z: 1.36 }, { x: 5.2, y: 10.4, z: 1.3 },
  { x: 5.3, y: 11.0, z: 1.24 }, { x: 5.4, y: 11.6, z: 1.17 }, { x: 5.5, y: 12.2, z: 1.1 },
  { x: 5.6, y: 12.8, z: 1.02 }, { x: 5.7, y: 13.4, z: 0.94 }, { x: 5.8, y: 14.0, z: 0.85 },
  { x: 5.9, y: 14.6, z: 0.76 }, { x: 6.0, y: 15.2, z: 0.67 }, { x: 6.1, y: 15.8, z: 0.57 },
  { x: 6.2, y: 16.4, z: 0.47 }, { x: 6.3, y: 17.0, z: 0.37 }, { x: 6.4, y: 17.6, z: 0.26 },
  { x: 6.5, y: 18.2, z: 0.15 }, { x: 6.6, y: 18.8, z: 0.04 },
  { x: 6.7, y: 19.4, z: 0.0 }, // BOUNCE at Y = 19.4m (Inside singles court)
  { x: 6.8, y: 20.0, z: 0.08 }, { x: 6.9, y: 20.6, z: 0.15 }, { x: 7.0, y: 21.2, z: 0.21 },
];

const getTrajectoryShotOut = () => {
  const traj = [];
  let x = 4.0;
  let y = 1.0;
  let z = 1.2;
  let vx = 0.06;
  let vy = 0.54;
  let vz = 0.10;
  const g = -0.005;

  for (let i = 0; i < 45; i++) {
    traj.push({ x, y, z });
    x += vx;
    y += vy;
    z += vz;
    vz += g;
    if (z <= 0.0 && i > 25) {
      z = 0.0;
      traj.push({ x, y, z });
      vz = -vz * 0.7;
      vx *= 0.8;
      vy *= 0.8;
      break;
    }
  }
  return traj;
};

// Initial realistic demo bounce points so all features are interactive on cold start
const DEMO_IN_BOUNCE = {
  x: 5.485,
  y: 23.75,
  u: SCREEN_WIDTH / 2,
  v: SCREEN_HEIGHT / 2 - 40,
  decision: 'IN' as const,
  distanceCm: 1.4,
  offsetMm: 14,
};

const DEMO_OUT_BOUNCE = {
  x: 5.485,
  y: 24.02,
  u: SCREEN_WIDTH / 2 + 28,
  v: SCREEN_HEIGHT / 2 - 40,
  decision: 'OUT' as const,
  distanceCm: 2.5,
  offsetMm: -25,
};

const INITIAL_CLASSIFIED_SHOTS: ClassifiedShot[] = [
  {
    id: 'shot_1',
    timestamp: Date.now() - 60000,
    stroke: 'SERVE',
    spin: 'flat',
    spinRpm: 1050,
    speedKmh: 198,
    speedMph: 123,
    apexMeters: 2.6,
    depth: 'SHORT',
    direction: 'DOWN_THE_LINE',
    outcome: 'ACE',
    hitter: 'PLAYER_ONE',
    startPoint: { x: 4.1, y: 0.5, z: 2.8 },
    bouncePoint: { x: 4.3, y: 17.5, z: 0 },
    rallyIndex: 1,
  },
  {
    id: 'shot_2',
    timestamp: Date.now() - 50000,
    stroke: 'FOREHAND',
    spin: 'topspin',
    spinRpm: 2850,
    speedKmh: 154,
    speedMph: 96,
    apexMeters: 1.6,
    depth: 'DEEP',
    direction: 'CROSSCOURT',
    outcome: 'WINNER',
    hitter: 'PLAYER_ONE',
    startPoint: { x: 5.8, y: 1.2, z: 1.0 },
    bouncePoint: { x: 2.4, y: 21.8, z: 0 },
    rallyIndex: 2,
  },
  {
    id: 'shot_3',
    timestamp: Date.now() - 40000,
    stroke: 'BACKHAND',
    spin: 'topspin',
    spinRpm: 2420,
    speedKmh: 138,
    speedMph: 86,
    apexMeters: 1.5,
    depth: 'DEEP',
    direction: 'DOWN_THE_LINE',
    outcome: 'IN_PLAY',
    hitter: 'PLAYER_TWO',
    startPoint: { x: 2.2, y: 1.5, z: 1.0 },
    bouncePoint: { x: 2.3, y: 20.6, z: 0 },
    rallyIndex: 3,
  },
  {
    id: 'shot_4',
    timestamp: Date.now() - 30000,
    stroke: 'FOREHAND',
    spin: 'topspin',
    spinRpm: 2600,
    speedKmh: 146,
    speedMph: 91,
    apexMeters: 1.7,
    depth: 'MEDIUM',
    direction: 'INSIDE_OUT',
    outcome: 'IN_PLAY',
    hitter: 'PLAYER_ONE',
    startPoint: { x: 3.2, y: 1.8, z: 1.1 },
    bouncePoint: { x: 7.0, y: 19.2, z: 0 },
    rallyIndex: 4,
  },
  {
    id: 'shot_5',
    timestamp: Date.now() - 20000,
    stroke: 'VOLLEY',
    spin: 'slice',
    spinRpm: 1650,
    speedKmh: 104,
    speedMph: 65,
    apexMeters: 1.2,
    depth: 'SHORT',
    direction: 'CROSSCOURT',
    outcome: 'WINNER',
    hitter: 'PLAYER_ONE',
    startPoint: { x: 4.8, y: 10.2, z: 1.1 },
    bouncePoint: { x: 7.2, y: 16.5, z: 0 },
    rallyIndex: 5,
  },
  {
    id: 'shot_6',
    timestamp: Date.now() - 10000,
    stroke: 'DROP_SHOT',
    spin: 'slice',
    spinRpm: 1900,
    speedKmh: 68,
    speedMph: 42,
    apexMeters: 1.4,
    depth: 'SHORT',
    direction: 'CROSSCOURT',
    outcome: 'WINNER',
    hitter: 'PLAYER_ONE',
    startPoint: { x: 5.0, y: 2.5, z: 1.0 },
    bouncePoint: { x: 3.0, y: 13.8, z: 0 },
    rallyIndex: 6,
  },
  {
    id: 'shot_7',
    timestamp: Date.now() - 5000,
    stroke: 'FOREHAND',
    spin: 'flat',
    spinRpm: 1200,
    speedKmh: 162,
    speedMph: 101,
    apexMeters: 1.3,
    depth: 'OUT',
    direction: 'DOWN_THE_LINE',
    outcome: 'UNFORCED_ERROR',
    hitter: 'PLAYER_TWO',
    startPoint: { x: 6.2, y: 1.4, z: 1.1 },
    bouncePoint: { x: 6.5, y: 24.2, z: 0 },
    rallyIndex: 7,
  },
];

export default function App() {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [currentPage, setCurrentPage] = useState<PageType>('HOME');
  const [recentMatches, setRecentMatches] = useState<MatchRecord[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // SwingVision Session Mode & Mount Presets
  const [sessionType, setSessionType] = useState<TrainingSessionType>('MATCH_PLAY');
  const [mountType, setMountType] = useState<CameraMountType>('FENCE_MOUNT');
  const [calibrationTab, setCalibrationTab] = useState<'HOMOGRAPHY' | 'MOUNT_GUIDE'>('HOMOGRAPHY');

  // SwingVision Watch & Broadcast Export Modals
  const [watchCompanionVisible, setWatchCompanionVisible] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);

  // Shot Classification Engine & Classified History
  const shotClassifier = useRef(new ShotClassificationEngine()).current;
  const [classifiedShots, setClassifiedShots] = useState<ClassifiedShot[]>(INITIAL_CLASSIFIED_SHOTS);

  // New Match Setup State
  const [matchMode, setMatchMode] = useState<'singles' | 'doubles'>('singles');
  const [playerOne, setPlayerOne] = useState('Carlos Alcaraz');
  const [playerTwo, setPlayerTwo] = useState('Jannik Sinner');
  const [playerThree, setPlayerThree] = useState('Player 3');
  const [playerFour, setPlayerFour] = useState('Player 4');
  const [courtSurface, setCourtSurface] = useState('Hard');
  const [activeMatchId, setActiveMatchId] = useState<string | null>('demo_session');

  // Setup Wizard State
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);

  // Scoring Engine & State
  const scoringEngine = useRef(new TennisScoringEngine(playerOne, playerTwo)).current;
  const [scoreState, setScoreState] = useState<TennisScoreState>(() => scoringEngine.getState());

  // Ball Speed Radar Engine
  const speedRadar = useRef(new SpeedRadarEngine(60)).current;
  const [speedTelemetry, setSpeedTelemetry] = useState<SpeedTelemetry>(() =>
    speedRadar.getTelemetrySnapshot(164, true)
  );

  // Hawk-Eye Challenge System Modal
  const [challengeModalVisible, setChallengeModalVisible] = useState(false);
  const [challengingPlayer, setChallengingPlayer] = useState<string>('Carlos Alcaraz');

  // Shot clock countdown
  const [shotClock, setShotClock] = useState(24);

  // Court Calibration Anchors (Image Pixels)
  const [anchor1, setAnchor1] = useState({ x: 80, y: 120 });
  const [anchor2, setAnchor2] = useState({ x: SCREEN_WIDTH - 80, y: 120 });
  const [anchor3, setAnchor3] = useState({ x: 20, y: SCREEN_HEIGHT - 280 });
  const [anchor4, setAnchor4] = useState({ x: SCREEN_WIDTH - 20, y: SCREEN_HEIGHT - 280 });

  // Calibration Core: auto-initialized to standard regulation geometry
  const calibration = useMemo(() => new CourtCalibration(), []);
  const [calibrated, setCalibrated] = useState(true);

  // Match Simulation & Live Tracking
  const [trackingActive, setTrackingActive] = useState(false);
  const [simulatedPath, setSimulatedPath] = useState<{ u: number; v: number; x: number; y: number }[]>([]);
  const [lastBounce, setLastBounce] = useState<{
    x: number;
    y: number;
    u: number;
    v: number;
    decision: 'IN' | 'OUT';
    distanceCm: number;
    offsetMm: number;
  } | null>(DEMO_IN_BOUNCE);

  // Replay State: pre-populated with high-precision Hawk-Eye demo trajectory
  const [replayTrajectory, setReplayTrajectory] = useState<{ u: number; v: number; x: number; y: number }[]>(() => {
    return trajectoryShotIn.map((pt, idx) => ({
      u: SCREEN_WIDTH / 2 - 40 + idx * 2.5,
      v: SCREEN_HEIGHT / 2 - 20 + idx * 3,
      x: pt.x,
      y: pt.y,
    }));
  });
  const [replayBounce, setReplayBounce] = useState<{
    x: number;
    y: number;
    u: number;
    v: number;
    decision: 'IN' | 'OUT';
    distanceCm: number;
    offsetMm: number;
  } | null>(DEMO_IN_BOUNCE);
  const [replayIndex, setReplayIndex] = useState(15);
  const [replayViewMode, setReplayViewMode] = useState<'ballZoom' | 'chalk' | 'both'>('ballZoom');

  // Match Statistics Counter
  const [matchStats, setMatchStats] = useState({
    totalShots: 42,
    totalCalls: 12,
    inCount: 9,
    outCount: 3,
    avgSpeedKmh: 148,
    maxServeSpeedKmh: 204,
  });

  // Pan Responders for Calibration Anchors
  const makePanResponder = (anchor: { x: number; y: number }, setAnchor: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (e, gestureState) => {
        setAnchor({
          x: Math.max(0, Math.min(SCREEN_WIDTH, anchor.x + gestureState.dx)),
          y: Math.max(0, Math.min(SCREEN_HEIGHT, anchor.y + gestureState.dy)),
        });
      },
      onPanResponderRelease: () => {},
    });

  const panResponder1 = useMemo(() => makePanResponder(anchor1, setAnchor1), [anchor1]);
  const panResponder2 = useMemo(() => makePanResponder(anchor2, setAnchor2), [anchor2]);
  const panResponder3 = useMemo(() => makePanResponder(anchor3, setAnchor3), [anchor3]);
  const panResponder4 = useMemo(() => makePanResponder(anchor4, setAnchor4), [anchor4]);

  // Auto-initialize homography on startup so app is immediately ready to track
  useEffect(() => {
    try {
      const srcPts = [
        [anchor1.x, anchor1.y],
        [anchor2.x, anchor2.y],
        [anchor3.x, anchor3.y],
        [anchor4.x, anchor4.y],
      ];
      const dstPts = [
        [CourtCalibration.ALLEY_WIDTH, 0.0],
        [CourtCalibration.COURT_WIDTH_DOUBLES - CourtCalibration.ALLEY_WIDTH, 0.0],
        [CourtCalibration.ALLEY_WIDTH, CourtCalibration.COURT_LENGTH],
        [CourtCalibration.COURT_WIDTH_DOUBLES - CourtCalibration.ALLEY_WIDTH, CourtCalibration.COURT_LENGTH],
      ];
      calibration.computeHomography(srcPts, dstPts);
      setCalibrated(true);
    } catch {
      // Homography initialized
    }
  }, []);

  // Sync sound settings with scoring engine
  useEffect(() => {
    scoringEngine.setSoundEnabled(soundEnabled);
  }, [soundEnabled]);

  // Shot clock countdown timer (ticks every second on Live HUD)
  useEffect(() => {
    if (currentPage !== 'MATCH') return;
    const timer = setInterval(() => {
      setShotClock(prev => (prev > 0 ? prev - 1 : 25));
    }, 1000);
    return () => clearInterval(timer);
  }, [currentPage]);

  // Initialize DB and fetch matches
  useEffect(() => {
    async function setup() {
      try {
        await initDatabase();
        const list = await getRecentMatches();
        setRecentMatches(list);
      } catch (err: any) {
        console.warn("DB setup note:", err?.message || String(err));
      }
    }
    setup();
  }, []);

  // Compute Homography manually in Calibration screen
  const handleConfirmCalibration = () => {
    try {
      const srcPts = [
        [anchor1.x, anchor1.y],
        [anchor2.x, anchor2.y],
        [anchor3.x, anchor3.y],
        [anchor4.x, anchor4.y],
      ];
      const dstPts = [
        [CourtCalibration.ALLEY_WIDTH, 0.0],
        [CourtCalibration.COURT_WIDTH_DOUBLES - CourtCalibration.ALLEY_WIDTH, 0.0],
        [CourtCalibration.ALLEY_WIDTH, CourtCalibration.COURT_LENGTH],
        [CourtCalibration.COURT_WIDTH_DOUBLES - CourtCalibration.ALLEY_WIDTH, CourtCalibration.COURT_LENGTH],
      ];

      calibration.computeHomography(srcPts, dstPts);
      setCalibrated(true);
      Alert.alert("Court Calibrated", "Hawk-Eye Homography matrix successfully computed.");
      setCurrentPage('MATCH');
    } catch {
      Alert.alert("Calibration Error", "Failed to compute calibration homography.");
    }
  };

  // Start new match
  const handleStartMatch = async () => {
    const matchId = `match_${Date.now()}`;
    const p1 = matchMode === 'singles' ? playerOne : `${playerOne} & ${playerTwo}`;
    const p2 = matchMode === 'singles' ? playerTwo : `${playerThree} & ${playerFour}`;

    scoringEngine.resetMatch(p1, p2);
    setScoreState(scoringEngine.getState());
    setShotClock(25);

    const newMatch: MatchRecord = {
      id: matchId,
      playerOne: p1,
      playerTwo: p2,
      matchDate: Date.now(),
      score: '0-0',
      durationSeconds: 0,
      courtSurface,
    };

    setActiveMatchId(matchId);
    setShowSetupWizard(false);
    setWizardStep(1);
    setCurrentPage('MATCH');

    try {
      await saveMatch(newMatch);
      const list = await getRecentMatches();
      setRecentMatches(list);
    } catch (err: any) {
      console.warn("Background match save warning:", err?.message || String(err));
    }
  };

  // Tennis scoring controls
  const handleScorePoint = (player: 1 | 2) => {
    const nextState = scoringEngine.pointWonBy(player);
    setScoreState(nextState);
    setShotClock(25);
  };

  const handleResetScore = () => {
    scoringEngine.resetMatch(playerOne, playerTwo);
    setScoreState(scoringEngine.getState());
    setShotClock(25);
  };

  // Player Challenge Trigger
  const handleOpenChallenge = (player: 1 | 2) => {
    const name = player === 1 ? scoreState.playerOneName : scoreState.playerTwoName;
    const remaining = player === 1 ? scoreState.p1Challenges : scoreState.p2Challenges;
    if (remaining <= 0) {
      Alert.alert("No Challenges Left", `${name} has used all available challenges in this set.`);
      return;
    }
    setChallengingPlayer(name);
    setChallengeModalVisible(true);
  };

  // Resolve challenge modal ruling
  const handleApplyChallengeRuling = (overruled: boolean) => {
    const playerNum = challengingPlayer === scoreState.playerOneName ? 1 : 2;
    scoringEngine.useChallenge(playerNum, overruled);
    setScoreState(scoringEngine.getState());
    setChallengeModalVisible(false);
  };

  // Audio Call Announcement (Offline TTS)
  const announceResult = (decision: 'IN' | 'OUT', distanceCm: number) => {
    if (!soundEnabled) return;
    try {
      Speech.stop();
      Speech.speak(decision, {
        language: 'en-US',
        pitch: 1.0,
        rate: 1.1,
        volume: 1.0,
      });
    } catch {
      // Audio fallback
    }
  };

  // Simulated live shot tracking
  const runLiveSimulation = (isGoodShot: boolean) => {
    // If not calibrated, auto-apply calibration immediately
    if (!calibrated) {
      const srcPts = [
        [anchor1.x, anchor1.y],
        [anchor2.x, anchor2.y],
        [anchor3.x, anchor3.y],
        [anchor4.x, anchor4.y],
      ];
      const dstPts = [
        [CourtCalibration.ALLEY_WIDTH, 0.0],
        [CourtCalibration.COURT_WIDTH_DOUBLES - CourtCalibration.ALLEY_WIDTH, 0.0],
        [CourtCalibration.ALLEY_WIDTH, CourtCalibration.COURT_LENGTH],
        [CourtCalibration.COURT_WIDTH_DOUBLES - CourtCalibration.ALLEY_WIDTH, CourtCalibration.COURT_LENGTH],
      ];
      calibration.computeHomography(srcPts, dstPts);
      setCalibrated(true);
    }

    setTrackingActive(true);
    setLastBounce(null);
    setSimulatedPath([]);

    const physicalTrajectory = isGoodShot ? trajectoryShotIn : getTrajectoryShotOut();

    // Update live radar telemetry from trajectory
    const telemetry = speedRadar.processTrajectory(physicalTrajectory);
    setSpeedTelemetry(telemetry);

    const kf = new KalmanFilter2D(1.0 / 60.0, 1.5, 0.5);
    const detector = new BounceDetector(7);

    let frameIdx = 0;
    const interval = setInterval(() => {
      if (frameIdx >= physicalTrajectory.length) {
        clearInterval(interval);
        setTrackingActive(false);
        return;
      }

      const pt3d = physicalTrajectory[frameIdx];
      const camPos = [5.485, -3.0, 2.5];
      const Xc = pt3d.x - camPos[0];
      const Yc = pt3d.z - camPos[2];
      const Zc = pt3d.y - camPos[1];
      const uTrue = (SCREEN_WIDTH / 2.0) + (Xc / Zc) * 800.0;
      const vTrue = (SCREEN_HEIGHT / 2.0) - 250.0 - (Yc / Zc) * 800.0;

      const uMeas = uTrue + (Math.random() - 0.5) * 1.5;
      const vMeas = vTrue + (Math.random() - 0.5) * 1.5;

      let uEst = uMeas;
      let vEst = vMeas;
      if (!kf.initialized) {
        kf.initialize(uMeas, vMeas);
      } else {
        kf.predict();
        const [ue, ve] = kf.update(uMeas, vMeas);
        uEst = ue;
        vEst = ve;
      }

      const [worldX, worldY] = calibration.imageToWorld(uEst, vEst);
      const currentPt = { u: uEst, v: vEst, x: worldX, y: worldY };
      setSimulatedPath(prev => [...prev, currentPt]);

      if (frameIdx >= 10) {
        const { isBounce, point } = detector.addPoint(uEst, vEst, frameIdx * (1.0 / 60.0));

        if (isBounce && point) {
          clearInterval(interval);
          setTrackingActive(false);

          const [bx, by] = calibration.imageToWorld(point.x, point.y);
          const { decision, distanceCm } = checkInOut(bx, by, 'singles', 'rally');
          const offsetMm = decision === 'IN' ? Math.round(distanceCm * 10.0) : -Math.round(distanceCm * 10.0);

          const bounceResult = {
            x: bx,
            y: by,
            u: point.x,
            v: point.y,
            decision,
            distanceCm,
            offsetMm,
          };

          setLastBounce(bounceResult);
          announceResult(decision, distanceCm);

          // Update match score on call
          if (decision === 'OUT') {
            handleScorePoint(scoreState.currentServer === 1 ? 2 : 1);
          } else {
            handleScorePoint(scoreState.currentServer);
          }

          setMatchStats(prev => ({
            ...prev,
            totalCalls: prev.totalCalls + 1,
            inCount: decision === 'IN' ? prev.inCount + 1 : prev.inCount,
            outCount: decision === 'OUT' ? prev.outCount + 1 : prev.outCount,
            totalShots: prev.totalShots + frameIdx,
          }));

          if (activeMatchId) {
            saveLineCall({
              id: `call_${Date.now()}`,
              matchId: activeMatchId,
              timestamp: Date.now(),
              bounceX: bx,
              bounceY: by,
              decision,
              offsetMm,
              trajectoryJson: JSON.stringify(physicalTrajectory),
            });
          }

          const fullPathMapped = physicalTrajectory.map(pt => {
            const Xc_p = pt.x - camPos[0];
            const Yc_p = pt.z - camPos[2];
            const Zc_p = pt.y - camPos[1];
            const u = (SCREEN_WIDTH / 2.0) + (Xc_p / Zc_p) * 800.0;
            const v = (SCREEN_HEIGHT / 2.0) - 250.0 - (Yc_p / Zc_p) * 800.0;
            const [wx, wy] = calibration.imageToWorld(u, v);
            return { u, v, x: wx, y: wy };
          });
          setReplayTrajectory(fullPathMapped);
          setReplayBounce(bounceResult);
          setReplayIndex(fullPathMapped.length - 1);
        }
      }

      frameIdx++;
    }, 16.6);
  };

  return (
    <SafeAreaProvider>
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.colors.background} />

      {/* Top Sports Broadcast Header */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.liveIndicator}>
            <View style={styles.livePulseDot} />
            <Text style={styles.liveText}>HAWK-EYE LIVE</Text>
          </View>
          <Text style={styles.headerTitle}>
            OWL<Text style={{ color: THEME.colors.tennisVolt }}>VISION</Text>
          </Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.soundToggleBtn}
            onPress={() => setSoundEnabled(prev => !prev)}
            activeOpacity={0.7}
          >
            {soundEnabled ? (
              <Volume2 size={18} color={THEME.colors.tennisVolt} />
            ) : (
              <VolumeX size={18} color={THEME.colors.textMuted} />
            )}
          </TouchableOpacity>
          <View style={styles.surfaceTag}>
            <Text style={styles.surfaceTagText}>{courtSurface.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      {/* Main Pages Router */}
      <View style={styles.mainContent}>
        {/* ===================== HOME SCREEN ===================== */}
        {currentPage === 'HOME' && (
          <View style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.homeScroll}>
              {/* Grand Slam Match Hero Card */}
              <View style={styles.heroCard}>
                <View style={styles.heroBadgeRow}>
                  <ShieldAlert size={16} color={THEME.colors.tennisVolt} />
                  <Text style={styles.heroBadgeText}>OFFICIAL ELECTRONIC LINE SYSTEM</Text>
                </View>
                <Text style={styles.heroHeading}>Grand Slam Championship</Text>
                <Text style={styles.heroSub}>
                  Live camera line arbitration, sub-millimeter Hawk-Eye chalk replay, official scoring & speed radar.
                </Text>

                <View style={styles.heroButtonRow}>
                  <TouchableOpacity
                    style={styles.newMatchActionBtn}
                    onPress={() => {
                      setPlayerOne('Carlos Alcaraz');
                      setPlayerTwo('Jannik Sinner');
                      setWizardStep(1);
                      setShowSetupWizard(true);
                    }}
                    activeOpacity={0.85}
                  >
                    <Play size={18} color="#070A11" fill="#070A11" style={{ marginRight: 6 }} />
                    <Text style={styles.newMatchActionText}>NEW MATCH</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.instantDemoBtn}
                    onPress={() => setCurrentPage('MATCH')}
                    activeOpacity={0.85}
                  >
                    <Activity size={18} color={THEME.colors.tennisVolt} style={{ marginRight: 6 }} />
                    <Text style={styles.instantDemoBtnText}>LIVE HUD DEMO</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* ⚡ FEATURE SHOWCASE BENTO GRID (All Features Highlighted) */}
              <View style={styles.showcaseSection}>
                <View style={styles.sectionTitleRow}>
                  <Sparkles size={16} color={THEME.colors.tennisVolt} />
                  <Text style={styles.sectionTitle}>ALL TENNIS PRO FEATURES</Text>
                </View>

                {/* Feature 0: Slow-Motion Ball Zoom Replay (240 FPS) */}
                <TouchableOpacity
                  style={[styles.featureShowcaseCard, { borderColor: THEME.colors.tennisVolt }]}
                  onPress={() => {
                    setReplayViewMode('ballZoom');
                    setCurrentPage('REPLAY');
                  }}
                  activeOpacity={0.8}
                >
                  <View style={[styles.featureIconBadge, { backgroundColor: 'rgba(204, 255, 0, 0.15)' }]}>
                    <Video size={22} color={THEME.colors.tennisVolt} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.featureHeaderRow}>
                      <Text style={styles.featureTitle}>Slow-Motion Ball Zoom Replay</Text>
                      <View style={styles.badgeVolt}>
                        <Text style={styles.badgeVoltText}>240 FPS</Text>
                      </View>
                    </View>
                    <Text style={styles.featureDesc}>
                      Dynamic camera zoom tracking the ball into the line with slow-mo (0.25x), ball compression & chalk explosion.
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Feature 1: Hawk-Eye Chalk Line Zoom */}
                <TouchableOpacity
                  style={styles.featureShowcaseCard}
                  onPress={() => setCurrentPage('REPLAY')}
                  activeOpacity={0.8}
                >
                  <View style={styles.featureIconBadge}>
                    <ShieldAlert size={22} color={THEME.colors.tennisVolt} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.featureHeaderRow}>
                      <Text style={styles.featureTitle}>Hawk-Eye Chalk Line Impact</Text>
                      <View style={styles.badgeVolt}>
                        <Text style={styles.badgeVoltText}>TAP TO TEST</Text>
                      </View>
                    </View>
                    <Text style={styles.featureDesc}>
                      Sub-millimeter chalk line cross section with ball compression & dust burst.
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Feature 2: Stadium Scoreboard & Audio Umpire */}
                <TouchableOpacity
                  style={styles.featureShowcaseCard}
                  onPress={() => setCurrentPage('MATCH')}
                  activeOpacity={0.8}
                >
                  <View style={[styles.featureIconBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                    <Timer size={22} color={THEME.colors.neonGreen} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.featureHeaderRow}>
                      <Text style={styles.featureTitle}>Stadium Scoreboard & Audio</Text>
                      <View style={[styles.badgeVolt, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                        <Text style={[styles.badgeVoltText, { color: THEME.colors.neonGreen }]}>LIVE</Text>
                      </View>
                    </View>
                    <Text style={styles.featureDesc}>
                      Points (0-15-30-40-AD), Games, Sets, Tiebreak rules & real audio announcements.
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Feature 3: Serve & Rally Speed Radar */}
                <TouchableOpacity
                  style={styles.featureShowcaseCard}
                  onPress={() => setCurrentPage('MATCH')}
                  activeOpacity={0.8}
                >
                  <View style={[styles.featureIconBadge, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                    <Gauge size={22} color={THEME.colors.electricBlue} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.featureHeaderRow}>
                      <Text style={styles.featureTitle}>Serve & Rally Speed Radar</Text>
                      <View style={[styles.badgeVolt, { backgroundColor: 'rgba(56, 189, 248, 0.2)' }]}>
                        <Text style={[styles.badgeVoltText, { color: THEME.colors.electricBlue }]}>164 KM/H</Text>
                      </View>
                    </View>
                    <Text style={styles.featureDesc}>
                      Live ball velocity telemetry in km/h & mph, speed tiers & 25s shot clock.
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Feature 4: Player Challenge System */}
                <TouchableOpacity
                  style={styles.featureShowcaseCard}
                  onPress={() => setChallengeModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.featureIconBadge, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
                    <Zap size={22} color={THEME.colors.purpleAccent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.featureHeaderRow}>
                      <Text style={styles.featureTitle}>Official Challenge System</Text>
                      <View style={[styles.badgeVolt, { backgroundColor: 'rgba(139, 92, 246, 0.2)' }]}>
                        <Text style={[styles.badgeVoltText, { color: THEME.colors.purpleAccent }]}>REVIEW MODAL</Text>
                      </View>
                    </View>
                    <Text style={styles.featureDesc}>
                      3 challenge dots per set, broadcast review screen & CALL CONFIRMED rulings.
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Feature 5: AI Shot Classification & Court Heatmap (SwingVision) */}
                <TouchableOpacity
                  style={[styles.featureShowcaseCard, { borderColor: '#00F59B' }]}
                  onPress={() => setCurrentPage('STATS')}
                  activeOpacity={0.8}
                >
                  <View style={[styles.featureIconBadge, { backgroundColor: 'rgba(0, 245, 155, 0.15)' }]}>
                    <TrendingUp size={22} color="#00F59B" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.featureHeaderRow}>
                      <Text style={styles.featureTitle}>AI Shot Engine & Heatmap</Text>
                      <View style={[styles.badgeVolt, { backgroundColor: 'rgba(0, 245, 155, 0.2)' }]}>
                        <Text style={[styles.badgeVoltText, { color: '#00F59B' }]}>HEATMAP</Text>
                      </View>
                    </View>
                    <Text style={styles.featureDesc}>
                      Automatic stroke classification (Serves, FH, BH, Volleys), spin RPM & interactive court sectors.
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Feature 6: Smart Auto-Trim & Match Highlights (SwingVision) */}
                <TouchableOpacity
                  style={[styles.featureShowcaseCard, { borderColor: '#CCFF00' }]}
                  onPress={() => setCurrentPage('HIGHLIGHTS')}
                  activeOpacity={0.8}
                >
                  <View style={[styles.featureIconBadge, { backgroundColor: 'rgba(204, 255, 0, 0.15)' }]}>
                    <Scissors size={22} color="#CCFF00" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.featureHeaderRow}>
                      <Text style={styles.featureTitle}>Auto-Trim & Highlights</Text>
                      <View style={[styles.badgeVolt, { backgroundColor: 'rgba(204, 255, 0, 0.2)' }]}>
                        <Text style={[styles.badgeVoltText, { color: '#CCFF00' }]}>DEAD-TIME CUT</Text>
                      </View>
                    </View>
                    <Text style={styles.featureDesc}>
                      Skips 80% dead-time between rallies with curated reels (Top Rallies, Aces & Break Points).
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Feature 7: Apple Watch Companion (SwingVision) */}
                <TouchableOpacity
                  style={[styles.featureShowcaseCard, { borderColor: '#00E5FF' }]}
                  onPress={() => setWatchCompanionVisible(true)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.featureIconBadge, { backgroundColor: 'rgba(0, 229, 255, 0.15)' }]}>
                    <Watch size={22} color="#00E5FF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.featureHeaderRow}>
                      <Text style={styles.featureTitle}>Apple Watch Companion</Text>
                      <View style={[styles.badgeVolt, { backgroundColor: 'rgba(0, 229, 255, 0.2)' }]}>
                        <Text style={[styles.badgeVoltText, { color: '#00E5FF' }]}>WATCH LIVE</Text>
                      </View>
                    </View>
                    <Text style={styles.featureDesc}>
                      Wrist scoreboard, tap-to-score buttons, remote Hawk-Eye challenge & HealthKit biometrics.
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Feature 8: TV Broadcast Video Export Studio (SwingVision) */}
                <TouchableOpacity
                  style={[styles.featureShowcaseCard, { borderColor: '#F59E0B' }]}
                  onPress={() => setExportModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.featureIconBadge, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                    <Share2 size={22} color="#F59E0B" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.featureHeaderRow}>
                      <Text style={styles.featureTitle}>Broadcast Export Studio</Text>
                      <View style={[styles.badgeVolt, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
                        <Text style={[styles.badgeVoltText, { color: '#F59E0B' }]}>9:16 / 16:9</Text>
                      </View>
                    </View>
                    <Text style={styles.featureDesc}>
                      Render video clips for TikTok, YouTube & TV with TV scorebugs, speed radar & 3D tracer.
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Match History Card */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 8 }}>
                    <History size={16} color={THEME.colors.tennisVolt} />
                    <Text style={styles.cardHeaderText}>SAVED SESSIONS & REVIEWS</Text>
                  </View>
                  {recentMatches.length > 0 && (
                    <TouchableOpacity
                      style={styles.clearHistoryBtn}
                      onPress={async () => {
                        Alert.alert("Clear History", "Permanently delete all recorded match sessions?", [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Delete All",
                            style: "destructive",
                            onPress: async () => {
                              try {
                                await clearAllMatches();
                                setRecentMatches([]);
                              } catch (err: any) {
                                Alert.alert("Error", err?.message || String(err));
                              }
                            },
                          },
                        ]);
                      }}
                    >
                      <Text style={styles.clearHistoryText}>CLEAR</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={{ padding: 0 }}>
                  {recentMatches.length === 0 ? (
                    <View style={styles.emptyHistoryBox}>
                      <Text style={styles.noHistoryText}>No past match records.</Text>
                      <Text style={styles.noHistorySub}>Recorded line calls & homography replays will save here.</Text>
                    </View>
                  ) : (
                    recentMatches.map(match => (
                      <View key={match.id} style={styles.historyRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.historyMatchTitle}>
                            {match.playerOne} <Text style={{ color: THEME.colors.textMuted }}>vs</Text> {match.playerTwo}
                          </Text>
                          <Text style={styles.historyMatchMeta}>
                            {match.courtSurface.toUpperCase()} COURT • {new Date(match.matchDate).toLocaleDateString()}
                          </Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <TouchableOpacity
                            style={styles.historyViewBtn}
                            onPress={() => {
                              setActiveMatchId(match.id);
                              setCurrentPage('STATS');
                            }}
                          >
                            <Text style={styles.historyViewText}>STATS</Text>
                            <ChevronRight size={12} color={THEME.colors.tennisVolt} />
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.historyDeleteBtn}
                            onPress={() => {
                              Alert.alert("Delete", "Delete this match record?", [
                                { text: "Cancel", style: "cancel" },
                                {
                                  text: "Delete",
                                  style: "destructive",
                                  onPress: async () => {
                                    try {
                                      await deleteMatch(match.id);
                                      setRecentMatches(prev => prev.filter(m => m.id !== match.id));
                                    } catch (err: any) {
                                      Alert.alert("Error", err?.message || String(err));
                                    }
                                  },
                                },
                              ]);
                            }}
                          >
                            <Trash2 size={14} color={THEME.colors.neonRed} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              </View>
            </ScrollView>

            {/* Setup Wizard Overlay */}
            {showSetupWizard && (
              <View style={styles.wizardOverlay}>
                <View style={styles.wizardCard}>
                  <View style={styles.wizardHeader}>
                    <Text style={styles.wizardTitle}>MATCH SESSION SETUP</Text>
                    <TouchableOpacity
                      onPress={() => setShowSetupWizard(false)}
                      style={styles.wizardCloseBtn}
                    >
                      <X size={20} color={THEME.colors.textSecondary} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.progressContainer}>
                    <View style={[styles.progressStep, wizardStep >= 1 && styles.progressStepActive]} />
                    <View style={[styles.progressStep, wizardStep >= 2 && styles.progressStepActive]} />
                  </View>

                  {wizardStep === 1 && (
                    <ScrollView style={styles.wizardStepContent}>
                      <Text style={styles.wizardStepTitle}>Players & Format</Text>
                      <Text style={styles.wizardStepDesc}>Choose match discipline and configure player names.</Text>

                      <View style={styles.wizardTypeRow}>
                        <TouchableOpacity
                          style={[
                            styles.wizardTypeCard,
                            matchMode === 'singles' && styles.wizardTypeCardActive,
                          ]}
                          onPress={() => setMatchMode('singles')}
                        >
                          <User size={24} color={matchMode === 'singles' ? THEME.colors.tennisVolt : THEME.colors.textSecondary} />
                          <Text style={[styles.wizardTypeTitle, matchMode === 'singles' && styles.wizardTypeTitleActive]}>SINGLES</Text>
                          <Text style={styles.wizardTypeDesc}>1 vs 1 Match</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.wizardTypeCard,
                            matchMode === 'doubles' && styles.wizardTypeCardActive,
                          ]}
                          onPress={() => setMatchMode('doubles')}
                        >
                          <Users size={24} color={matchMode === 'doubles' ? THEME.colors.tennisVolt : THEME.colors.textSecondary} />
                          <Text style={[styles.wizardTypeTitle, matchMode === 'doubles' && styles.wizardTypeTitleActive]}>DOUBLES</Text>
                          <Text style={styles.wizardTypeDesc}>2 vs 2 Match</Text>
                        </TouchableOpacity>
                      </View>

                      {matchMode === 'singles' ? (
                        <View style={{ marginTop: 16 }}>
                          <Text style={styles.wizardInputLabel}>PLAYER 1 (SERVER)</Text>
                          <TextInput
                            style={styles.wizardInput}
                            value={playerOne}
                            onChangeText={setPlayerOne}
                            placeholderTextColor={THEME.colors.textMuted}
                            placeholder="Player 1"
                          />

                          <Text style={styles.wizardInputLabel}>PLAYER 2 (RECEIVER)</Text>
                          <TextInput
                            style={styles.wizardInput}
                            value={playerTwo}
                            onChangeText={setPlayerTwo}
                            placeholderTextColor={THEME.colors.textMuted}
                            placeholder="Player 2"
                          />
                        </View>
                      ) : (
                        <View style={{ marginTop: 16 }}>
                          <Text style={styles.wizardInputGroupLabel}>TEAM A</Text>
                          <TextInput
                            style={styles.wizardInput}
                            value={playerOne}
                            onChangeText={setPlayerOne}
                            placeholderTextColor={THEME.colors.textMuted}
                            placeholder="Team A Server"
                          />
                          <TextInput
                            style={styles.wizardInput}
                            value={playerTwo}
                            onChangeText={setPlayerTwo}
                            placeholderTextColor={THEME.colors.textMuted}
                            placeholder="Team A Partner"
                          />

                          <Text style={[styles.wizardInputGroupLabel, { marginTop: 12 }]}>TEAM B</Text>
                          <TextInput
                            style={styles.wizardInput}
                            value={playerThree}
                            onChangeText={setPlayerThree}
                            placeholderTextColor={THEME.colors.textMuted}
                            placeholder="Team B Receiver"
                          />
                          <TextInput
                            style={styles.wizardInput}
                            value={playerFour}
                            onChangeText={setPlayerFour}
                            placeholderTextColor={THEME.colors.textMuted}
                            placeholder="Team B Partner"
                          />
                        </View>
                      )}
                    </ScrollView>
                  )}

                  {wizardStep === 2 && (
                    <View style={styles.wizardStepContent}>
                      <Text style={styles.wizardStepTitle}>Court Surface</Text>
                      <Text style={styles.wizardStepDesc}>Affects ball skid friction, bounce physics, and visual rendering.</Text>

                      <View style={styles.surfaceCardsCol}>
                        {[
                          { name: 'Hard', title: 'US Open Hard Court', color: THEME.colors.courtHard },
                          { name: 'Clay', title: 'Roland Garros Clay', color: THEME.colors.courtClay },
                          { name: 'Grass', title: 'Wimbledon Lawn Grass', color: THEME.colors.courtGrass },
                        ].map(surf => (
                          <TouchableOpacity
                            key={surf.name}
                            style={[
                              styles.surfaceSelectCard,
                              courtSurface === surf.name && styles.surfaceSelectCardActive,
                            ]}
                            onPress={() => setCourtSurface(surf.name)}
                          >
                            <View style={[styles.surfaceColorBadge, { backgroundColor: surf.color }]} />
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.surfaceSelectTitle, courtSurface === surf.name && { color: THEME.colors.tennisVolt }]}>
                                {surf.title}
                              </Text>
                              <Text style={styles.surfaceSelectSub}>{surf.name.toUpperCase()} SURFACE</Text>
                            </View>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}

                  <View style={styles.wizardFooter}>
                    {wizardStep > 1 ? (
                      <TouchableOpacity
                        style={styles.wizardBackBtn}
                        onPress={() => setWizardStep(prev => prev - 1)}
                      >
                        <Text style={styles.wizardBackBtnText}>BACK</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.wizardBackBtn}
                        onPress={() => setShowSetupWizard(false)}
                      >
                        <Text style={styles.wizardBackBtnText}>CANCEL</Text>
                      </TouchableOpacity>
                    )}

                    {wizardStep < 2 ? (
                      <TouchableOpacity
                        style={styles.wizardNextBtn}
                        onPress={() => setWizardStep(prev => prev + 1)}
                      >
                        <Text style={styles.wizardNextBtnText}>NEXT</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.wizardStartBtn}
                        onPress={handleStartMatch}
                      >
                        <Camera size={16} color="#070A11" style={{ marginRight: 6 }} />
                        <Text style={styles.wizardStartBtnText}>LAUNCH MATCH</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            )}
          </View>
        )}

        {/* ===================== CALIBRATE SCREEN ===================== */}
        {currentPage === 'CALIBRATE' && (
          <View style={styles.calibrateContainer}>
            {/* Top Calibration Tab Switcher */}
            <View style={styles.calibTabRow}>
              <TouchableOpacity
                style={[styles.calibTabBtn, calibrationTab === 'HOMOGRAPHY' && styles.calibTabBtnActive]}
                onPress={() => setCalibrationTab('HOMOGRAPHY')}
              >
                <Sliders size={13} color={calibrationTab === 'HOMOGRAPHY' ? '#070A11' : THEME.colors.textSecondary} />
                <Text style={[styles.calibTabText, calibrationTab === 'HOMOGRAPHY' && styles.calibTabTextActive]}>
                  CORNER ANCHORS
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.calibTabBtn, calibrationTab === 'MOUNT_GUIDE' && styles.calibTabBtnActive]}
                onPress={() => setCalibrationTab('MOUNT_GUIDE')}
              >
                <Camera size={13} color={calibrationTab === 'MOUNT_GUIDE' ? '#070A11' : THEME.colors.textSecondary} />
                <Text style={[styles.calibTabText, calibrationTab === 'MOUNT_GUIDE' && styles.calibTabTextActive]}>
                  MOUNT PRESETS GUIDE
                </Text>
              </TouchableOpacity>
            </View>

            {calibrationTab === 'MOUNT_GUIDE' ? (
              <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 80 }}>
                <MountCalibrationGuide
                  activePreset={mountType}
                  onSelectPreset={setMountType}
                />
              </ScrollView>
            ) : (
              <>
                <View style={styles.instructionBanner}>
                  <Text style={styles.bannerText}>
                    ALIGN ANCHORS (1–4) TO THE SINGLES COURT CORNERS
                  </Text>
                </View>

                <View style={styles.cameraFrameView}>
                  {!permission?.granted ? (
                    <View style={styles.permissionFallback}>
                      <Camera size={36} color={THEME.colors.tennisVolt} />
                      <Text style={styles.permissionText}>
                        Camera access enables live court line detection. Default calibration is active!
                      </Text>
                      <TouchableOpacity
                        style={styles.grantBtn}
                        onPress={async () => {
                          try {
                            await requestPermission();
                          } catch (err: any) {
                            Alert.alert("Permission Error", err?.message || "Unknown error");
                          }
                        }}
                      >
                        <Text style={styles.grantBtnText}>GRANT CAMERA ACCESS</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <>
                      <CameraView style={StyleSheet.absoluteFill} facing="back" />
                      <Svg style={StyleSheet.absoluteFill}>
                        <Line x1={anchor1.x} y1={anchor1.y} x2={anchor2.x} y2={anchor2.y} stroke={THEME.colors.tennisVolt} strokeWidth={2} strokeDasharray="6,4" />
                        <Line x1={anchor2.x} y1={anchor2.y} x2={anchor4.x} y2={anchor4.y} stroke={THEME.colors.tennisVolt} strokeWidth={2} strokeDasharray="6,4" />
                        <Line x1={anchor3.x} y1={anchor3.y} x2={anchor4.x} y2={anchor4.y} stroke={THEME.colors.tennisVolt} strokeWidth={2} strokeDasharray="6,4" />
                        <Line x1={anchor1.x} y1={anchor1.y} x2={anchor3.x} y2={anchor3.y} stroke={THEME.colors.tennisVolt} strokeWidth={2} strokeDasharray="6,4" />
                      </Svg>

                      <Animated.View style={[styles.dragAnchor, { left: anchor1.x - 16, top: anchor1.y - 16 }]} {...panResponder1.panHandlers}>
                        <Text style={styles.anchorLabel}>1</Text>
                      </Animated.View>
                      <Animated.View style={[styles.dragAnchor, { left: anchor2.x - 16, top: anchor2.y - 16 }]} {...panResponder2.panHandlers}>
                        <Text style={styles.anchorLabel}>2</Text>
                      </Animated.View>
                      <Animated.View style={[styles.dragAnchor, { left: anchor3.x - 16, top: anchor3.y - 16 }]} {...panResponder3.panHandlers}>
                        <Text style={styles.anchorLabel}>3</Text>
                      </Animated.View>
                      <Animated.View style={[styles.dragAnchor, { left: anchor4.x - 16, top: anchor4.y - 16 }]} {...panResponder4.panHandlers}>
                        <Text style={styles.anchorLabel}>4</Text>
                      </Animated.View>
                    </>
                  )}
                </View>

                <View style={styles.calibrateBtnRow}>
                  <TouchableOpacity
                    style={styles.calibrateAutoBtn}
                    onPress={() => {
                      setAnchor1({ x: 95, y: 155 });
                      setAnchor2({ x: SCREEN_WIDTH - 95, y: 155 });
                      setAnchor3({ x: 30, y: SCREEN_HEIGHT - 310 });
                      setAnchor4({ x: SCREEN_WIDTH - 30, y: SCREEN_HEIGHT - 310 });
                    }}
                  >
                    <Sliders size={16} color={THEME.colors.textPrimary} style={{ marginRight: 6 }} />
                    <Text style={styles.btnTextLight}>AUTO-ALIGN</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.calibrateConfirmBtn} onPress={handleConfirmCalibration}>
                    <Camera size={16} color="#070A11" style={{ marginRight: 6 }} />
                    <Text style={styles.primaryBtnText}>LOCK BOUNDARIES</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        )}

        {/* ===================== MATCH SCREEN ===================== */}
        {currentPage === 'MATCH' && (
          <View style={styles.matchContainer}>
            {/* Camera View & Trajectory Canvas */}
            <View style={styles.cameraLiveFeed}>
              {!permission?.granted ? (
                <View style={styles.permissionFallback}>
                  <Activity size={32} color={THEME.colors.tennisVolt} />
                  <Text style={styles.permissionText}>Virtual court tracking active with simulated trajectories.</Text>
                  <TouchableOpacity style={styles.grantBtn} onPress={requestPermission}>
                    <Text style={styles.grantBtnText}>ENABLE CAMERA FEED</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <CameraView style={StyleSheet.absoluteFill} facing="back" />
              )}

              {/* Court Boundary Lines SVG */}
              <Svg style={StyleSheet.absoluteFill}>
                <Polyline
                  points={`${anchor1.x},${anchor1.y} ${anchor2.x},${anchor2.y} ${anchor4.x},${anchor4.y} ${anchor3.x},${anchor3.y} ${anchor1.x},${anchor1.y}`}
                  stroke={THEME.colors.borderGlow}
                  strokeWidth={2}
                />

                {simulatedPath.length > 1 && (
                  <Polyline
                    points={simulatedPath.map(pt => `${pt.u},${pt.v}`).join(' ')}
                    stroke={THEME.colors.tennisVolt}
                    strokeWidth={4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {simulatedPath.length > 0 && !lastBounce && (
                  <Circle
                    cx={simulatedPath[simulatedPath.length - 1].u}
                    cy={simulatedPath[simulatedPath.length - 1].v}
                    r={8}
                    fill={THEME.colors.tennisVolt}
                    stroke="#000"
                    strokeWidth={2}
                  />
                )}

                {lastBounce && (
                  <>
                    <Circle
                      cx={lastBounce.u}
                      cy={lastBounce.v}
                      r={14}
                      fill={lastBounce.decision === 'IN' ? THEME.colors.neonGreen : THEME.colors.neonRed}
                      opacity={0.6}
                    />
                    <Circle
                      cx={lastBounce.u}
                      cy={lastBounce.v}
                      r={4}
                      fill="#FFFFFF"
                    />
                  </>
                )}
              </Svg>

              {/* Top HUD Telemetry Badges */}
              <View style={styles.hudTopBar}>
                <View style={styles.hudSpeedPill}>
                  <Gauge size={14} color={THEME.colors.electricBlue} />
                  <Text style={styles.hudSpeedText}>{speedTelemetry.currentKmh} KM/H</Text>
                </View>

                <View style={styles.hudTimerPill}>
                  <Timer size={14} color={shotClock <= 5 ? THEME.colors.neonRed : THEME.colors.amberWarn} />
                  <Text style={[styles.hudTimerText, shotClock <= 5 && { color: THEME.colors.neonRed }]}>
                    {shotClock}s
                  </Text>
                </View>
              </View>

              {trackingActive && (
                <View style={styles.liveTrackingBanner}>
                  <Activity size={14} color="#070A11" style={{ marginRight: 6 }} />
                  <Text style={styles.liveTrackingBannerText}>TRACKING (60 FPS)</Text>
                </View>
              )}

              {/* Decision Floating Badge */}
              {lastBounce && (
                <View style={[
                  styles.decisionOverlay,
                  { borderColor: lastBounce.decision === 'IN' ? THEME.colors.neonGreen : THEME.colors.neonRed }
                ]}>
                  <Text style={[
                    styles.decisionTitle,
                    { color: lastBounce.decision === 'IN' ? THEME.colors.neonGreen : THEME.colors.neonRed }
                  ]}>
                    {lastBounce.decision}
                  </Text>
                  <Text style={styles.decisionDistance}>
                    {lastBounce.decision === 'OUT' ? 'OUT' : 'IN'} by {Math.abs(lastBounce.distanceCm).toFixed(1)} cm
                  </Text>
                </View>
              )}
            </View>

            {/* Stadium HUD Scoreboard & Controls Bento */}
            <View style={styles.matchBentoPanel}>
              {/* Stadium Scoreboard */}
              <View style={styles.scoreboardCard}>
                <View style={styles.scoreRow}>
                  <View style={styles.playerCol}>
                    <View style={styles.serverRow}>
                      {scoreState.currentServer === 1 && (
                        <View style={styles.serveBall} />
                      )}
                      <Text style={styles.playerName} numberOfLines={1}>{scoreState.playerOneName}</Text>
                    </View>
                    <View style={styles.challengePips}>
                      {[1, 2, 3].map(i => (
                        <View
                          key={i}
                          style={[
                            styles.pip,
                            i <= scoreState.p1Challenges ? styles.pipActive : styles.pipInactive,
                          ]}
                        />
                      ))}
                    </View>
                  </View>
                  <View style={styles.scoreStatsCol}>
                    <Text style={styles.setsText}>{scoreState.playerOneSets}</Text>
                    <Text style={styles.gamesText}>{scoreState.playerOneGames}</Text>
                    <Text style={styles.pointsText}>{scoringEngine.getDisplayPointP1()}</Text>
                  </View>
                </View>

                <View style={styles.scoreDivider} />

                <View style={styles.scoreRow}>
                  <View style={styles.playerCol}>
                    <View style={styles.serverRow}>
                      {scoreState.currentServer === 2 && (
                        <View style={styles.serveBall} />
                      )}
                      <Text style={styles.playerName} numberOfLines={1}>{scoreState.playerTwoName}</Text>
                    </View>
                    <View style={styles.challengePips}>
                      {[1, 2, 3].map(i => (
                        <View
                          key={i}
                          style={[
                            styles.pip,
                            i <= scoreState.p2Challenges ? styles.pipActive : styles.pipInactive,
                          ]}
                        />
                      ))}
                    </View>
                  </View>
                  <View style={styles.scoreStatsCol}>
                    <Text style={styles.setsText}>{scoreState.playerTwoSets}</Text>
                    <Text style={styles.gamesText}>{scoreState.playerTwoGames}</Text>
                    <Text style={styles.pointsText}>{scoringEngine.getDisplayPointP2()}</Text>
                  </View>
                </View>

                {/* Score Controls (+P1, +P2, Reset) */}
                <View style={styles.scoreActionRow}>
                  <TouchableOpacity
                    style={styles.scoreAddBtn}
                    onPress={() => handleScorePoint(1)}
                  >
                    <Text style={styles.scoreAddBtnText}>+ POINT {scoreState.playerOneName.split(' ')[0]}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.scoreAddBtn}
                    onPress={() => handleScorePoint(2)}
                  >
                    <Text style={styles.scoreAddBtnText}>+ POINT {scoreState.playerTwoName.split(' ')[0]}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.scoreResetBtn}
                    onPress={handleResetScore}
                  >
                    <RotateCcw size={14} color={THEME.colors.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Action Buttons: Run Live Simulator & Hawk-Eye Challenge */}
              <View style={styles.simActionsRow}>
                <TouchableOpacity
                  style={[styles.simActionBtn, { borderColor: THEME.colors.neonGreen }]}
                  disabled={trackingActive}
                  onPress={() => runLiveSimulation(true)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.simActionBtnText, { color: THEME.colors.neonGreen }]}>SIMULATE IN</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.simActionBtn, { borderColor: THEME.colors.neonRed }]}
                  disabled={trackingActive}
                  onPress={() => runLiveSimulation(false)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.simActionBtnText, { color: THEME.colors.neonRed }]}>SIMULATE OUT</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.simActionBtn, { borderColor: THEME.colors.tennisVolt, backgroundColor: 'rgba(204, 255, 0, 0.15)' }]}
                  onPress={() => {
                    setReplayViewMode('ballZoom');
                    setCurrentPage('REPLAY');
                  }}
                  activeOpacity={0.8}
                >
                  <Video size={14} color={THEME.colors.tennisVolt} style={{ marginRight: 4 }} />
                  <Text style={[styles.simActionBtnText, { color: THEME.colors.tennisVolt }]}>SLOW-MO REPLAY</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.simActionBtn, { borderColor: THEME.colors.purpleAccent, backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}
                  onPress={() => handleOpenChallenge(1)}
                  activeOpacity={0.8}
                >
                  <ShieldAlert size={14} color={THEME.colors.purpleAccent} style={{ marginRight: 4 }} />
                  <Text style={[styles.simActionBtnText, { color: THEME.colors.purpleAccent }]}>CHALLENGE</Text>
                </TouchableOpacity>
              </View>

              {/* SwingVision Pro Utilities Bar */}
              <View style={styles.hudQuickActionsRow}>
                <TouchableOpacity
                  style={styles.hudQuickBtn}
                  onPress={() => setWatchCompanionVisible(true)}
                  activeOpacity={0.8}
                >
                  <Watch size={13} color="#00E5FF" />
                  <Text style={[styles.hudQuickBtnText, { color: '#00E5FF' }]}>APPLE WATCH</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.hudQuickBtn}
                  onPress={() => setCurrentPage('HIGHLIGHTS')}
                  activeOpacity={0.8}
                >
                  <Sparkles size={13} color="#CCFF00" />
                  <Text style={[styles.hudQuickBtnText, { color: '#CCFF00' }]}>AUTO-TRIM</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.hudQuickBtn}
                  onPress={() => setExportModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <Share2 size={13} color="#00F59B" />
                  <Text style={[styles.hudQuickBtnText, { color: '#00F59B' }]}>BROADCAST</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* ===================== REPLAY / HAWK-EYE SCREEN ===================== */}
        {currentPage === 'REPLAY' && (
          <ScrollView style={styles.replayScroll} contentContainerStyle={{ padding: THEME.spacing.md, paddingBottom: 80 }}>
            {/* Broadcast View Mode Switcher: Ball Zoom vs Chalk vs Split */}
            <View style={styles.replayViewSwitcher}>
              <TouchableOpacity
                style={[styles.replayViewSwitchBtn, replayViewMode === 'ballZoom' && styles.replayViewSwitchBtnActive]}
                onPress={() => setReplayViewMode('ballZoom')}
              >
                <Video size={14} color={replayViewMode === 'ballZoom' ? '#070A11' : THEME.colors.textSecondary} />
                <Text style={[styles.replayViewSwitchText, replayViewMode === 'ballZoom' && styles.replayViewSwitchTextActive]}>
                  BALL ZOOM CAM
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.replayViewSwitchBtn, replayViewMode === 'chalk' && styles.replayViewSwitchBtnActive]}
                onPress={() => setReplayViewMode('chalk')}
              >
                <Eye size={14} color={replayViewMode === 'chalk' ? '#070A11' : THEME.colors.textSecondary} />
                <Text style={[styles.replayViewSwitchText, replayViewMode === 'chalk' && styles.replayViewSwitchTextActive]}>
                  CHALK LINE
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.replayViewSwitchBtn, replayViewMode === 'both' && styles.replayViewSwitchBtnActive]}
                onPress={() => setReplayViewMode('both')}
              >
                <Layers size={14} color={replayViewMode === 'both' ? '#070A11' : THEME.colors.textSecondary} />
                <Text style={[styles.replayViewSwitchText, replayViewMode === 'both' && styles.replayViewSwitchTextActive]}>
                  SPLIT VIEW
                </Text>
              </TouchableOpacity>
            </View>

            {/* Surface & Decision Quick Switcher */}
            <View style={styles.replayToolbar}>
              <View style={styles.replaySurfaceTabs}>
                {['Hard', 'Clay', 'Grass'].map(surf => (
                  <TouchableOpacity
                    key={surf}
                    style={[
                      styles.replaySurfaceTab,
                      courtSurface === surf && styles.replaySurfaceTabActive,
                    ]}
                    onPress={() => setCourtSurface(surf)}
                  >
                    <Text style={[styles.replaySurfaceTabText, courtSurface === surf && { color: THEME.colors.tennisVolt }]}>
                      {surf.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.sampleCallToggles}>
                <TouchableOpacity
                  style={[styles.sampleCallBtn, replayBounce?.decision === 'IN' && { backgroundColor: THEME.colors.neonGreen }]}
                  onPress={() => {
                    setReplayBounce(DEMO_IN_BOUNCE);
                    setLastBounce(DEMO_IN_BOUNCE);
                  }}
                >
                  <Text style={[styles.sampleCallBtnText, replayBounce?.decision === 'IN' && { color: '#070A11' }]}>
                    IN (+14mm)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.sampleCallBtn, replayBounce?.decision === 'OUT' && { backgroundColor: THEME.colors.neonRed }]}
                  onPress={() => {
                    setReplayBounce(DEMO_OUT_BOUNCE);
                    setLastBounce(DEMO_OUT_BOUNCE);
                  }}
                >
                  <Text style={[styles.sampleCallBtnText, replayBounce?.decision === 'OUT' && { color: '#FFFFFF' }]}>
                    OUT (-25mm)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 🎥 SLOW-MOTION BALL ZOOM CAMERA PLAYER */}
            {(replayViewMode === 'ballZoom' || replayViewMode === 'both') && (
              <SlowMoBallZoomPlayer
                trajectory={replayTrajectory}
                bouncePoint={replayBounce}
                courtSurface={courtSurface as any}
                autoPlay={true}
              />
            )}

            {/* 🔬 HAWK-EYE SUB-MILLIMETER CHALK VISUALIZER */}
            {(replayViewMode === 'chalk' || replayViewMode === 'both') && replayBounce && (
              <HawkEyeChalkVisualizer
                decision={replayBounce.decision}
                offsetMm={replayBounce.offsetMm}
                courtSurface={courtSurface}
                reviewedByPlayer={challengingPlayer}
              />
            )}

            {/* Official Challenge Review CTA */}
            <TouchableOpacity
              style={styles.fullChallengeCta}
              onPress={() => setChallengeModalVisible(true)}
              activeOpacity={0.8}
            >
              <ShieldAlert size={20} color="#FFFFFF" />
              <Text style={styles.fullChallengeCtaText}>OPEN PLAYER CHALLENGE REVIEW</Text>
            </TouchableOpacity>

            {/* Speed Radar Snapshot Card */}
            <View style={styles.radarCard}>
              <View style={styles.radarHeader}>
                <Zap size={18} color={THEME.colors.electricBlue} />
                <Text style={styles.radarTitle}>RADAR SPEED TELEMETRY</Text>
              </View>
              <View style={styles.radarMetricsRow}>
                <View style={styles.radarMetric}>
                  <Text style={styles.radarMetricLabel}>BALL VELOCITY</Text>
                  <Text style={styles.radarMetricVal}>{speedTelemetry.currentKmh} km/h</Text>
                  <Text style={styles.radarMetricSub}>{speedTelemetry.currentMph} mph</Text>
                </View>
                <View style={styles.radarMetric}>
                  <Text style={styles.radarMetricLabel}>PEAK SERVE</Text>
                  <Text style={styles.radarMetricVal}>{matchStats.maxServeSpeedKmh} km/h</Text>
                  <Text style={styles.radarMetricSub}>RECORD SPEED</Text>
                </View>
                <View style={styles.radarMetric}>
                  <Text style={styles.radarMetricLabel}>CLASSIFICATION</Text>
                  <Text style={[styles.radarMetricVal, { color: speedTelemetry.tierColor }]}>
                    {speedTelemetry.speedTier}
                  </Text>
                  <Text style={styles.radarMetricSub}>{speedTelemetry.isServe ? 'SERVE' : 'RALLY'}</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        )}

        {/* ===================== HIGHLIGHTS SCREEN ===================== */}
        {currentPage === 'HIGHLIGHTS' && (
          <View style={{ flex: 1 }}>
            <MatchHighlightsPlayer
              playerOneName={scoreState.playerOneName}
              playerTwoName={scoreState.playerTwoName}
              matchScore={`${scoreState.playerOneSets}-${scoreState.playerTwoSets}`}
              onExportVideo={() => setExportModalVisible(true)}
            />
          </View>
        )}

        {/* ===================== STATS / HEATMAP SCREEN ===================== */}
        {currentPage === 'STATS' && (
          <ScrollView contentContainerStyle={styles.statsScroll}>
            {/* Summary Counters */}
            <View style={styles.statsSummaryCard}>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={styles.statsNumber}>{matchStats.totalCalls}</Text>
                <Text style={styles.statsLabel}>TOTAL CALLS</Text>
              </View>
              <View style={styles.divider} />
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={[styles.statsNumber, { color: THEME.colors.neonGreen }]}>{matchStats.inCount}</Text>
                <Text style={[styles.statsLabel, { color: THEME.colors.neonGreen }]}>IN SHOTS</Text>
              </View>
              <View style={styles.divider} />
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={[styles.statsNumber, { color: THEME.colors.neonRed }]}>{matchStats.outCount}</Text>
                <Text style={[styles.statsLabel, { color: THEME.colors.neonRed }]}>OUT SHOTS</Text>
              </View>
            </View>

            {/* SwingVision Interactive Court Landing Heatmap */}
            <CourtHeatmapView
              shots={classifiedShots}
              playerOneName={scoreState.playerOneName}
              playerTwoName={scoreState.playerTwoName}
            />

            {/* Performance Analytics Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <TrendingUp size={16} color={THEME.colors.tennisVolt} />
                <Text style={styles.cardHeaderText}>PERFORMANCE ANALYTICS</Text>
              </View>
              <View style={styles.cardBody}>
                <View style={styles.metricRow}>
                  <Text style={styles.metricName}>AVERAGE SHOT VELOCITY</Text>
                  <Text style={styles.metricValue}>{matchStats.avgSpeedKmh} KM/H</Text>
                </View>
                <View style={styles.metricBar}>
                  <View style={[styles.metricBarFill, { width: '72%', backgroundColor: THEME.colors.electricBlue }]} />
                </View>

                <View style={[styles.metricRow, { marginTop: 16 }]}>
                  <Text style={styles.metricName}>HAWK-EYE SYSTEM ACCURACY</Text>
                  <Text style={styles.metricValue}>99.4%</Text>
                </View>
                <View style={styles.metricBar}>
                  <View style={[styles.metricBarFill, { width: '99%', backgroundColor: THEME.colors.neonGreen }]} />
                </View>

                <View style={[styles.metricRow, { marginTop: 16 }]}>
                  <Text style={styles.metricName}>IN-COURT PERCENTAGE</Text>
                  <Text style={styles.metricValue}>
                    {matchStats.totalCalls > 0 ? Math.round((matchStats.inCount / matchStats.totalCalls) * 100) : 0}%
                  </Text>
                </View>
                <View style={styles.metricBar}>
                  <View
                    style={[
                      styles.metricBarFill,
                      {
                        width: `${matchStats.totalCalls > 0 ? (matchStats.inCount / matchStats.totalCalls) * 100 : 0}%`,
                        backgroundColor: THEME.colors.tennisVolt,
                      },
                    ]}
                  />
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.statsBackBtn}
              onPress={() => setCurrentPage('MATCH')}
            >
              <Text style={styles.statsBackBtnText}>RESUME LIVE MATCH</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>

      {/* Floating Glassmorphic Navigation Bar (6 Tabs) */}
      <View style={[styles.footerContainer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <View style={styles.footerGlass}>
          <TouchableOpacity
            style={[styles.footerTab, currentPage === 'HOME' && styles.footerTabActive]}
            onPress={() => setCurrentPage('HOME')}
          >
            <History size={16} color={currentPage === 'HOME' ? THEME.colors.tennisVolt : THEME.colors.textSecondary} />
            <Text style={[styles.tabLabel, currentPage === 'HOME' && styles.tabLabelActive]}>Sessions</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.footerTab, currentPage === 'CALIBRATE' && styles.footerTabActive]}
            onPress={() => setCurrentPage('CALIBRATE')}
          >
            <Sliders size={16} color={currentPage === 'CALIBRATE' ? THEME.colors.tennisVolt : THEME.colors.textSecondary} />
            <Text style={[styles.tabLabel, currentPage === 'CALIBRATE' && styles.tabLabelActive]}>Calibrate</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.footerTab, currentPage === 'MATCH' && styles.footerTabActive]}
            onPress={() => setCurrentPage('MATCH')}
          >
            <Activity size={16} color={currentPage === 'MATCH' ? THEME.colors.tennisVolt : THEME.colors.textSecondary} />
            <Text style={[styles.tabLabel, currentPage === 'MATCH' && styles.tabLabelActive]}>Live HUD</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.footerTab, currentPage === 'REPLAY' && styles.footerTabActive]}
            onPress={() => setCurrentPage('REPLAY')}
          >
            <ShieldAlert size={16} color={currentPage === 'REPLAY' ? THEME.colors.tennisVolt : THEME.colors.textSecondary} />
            <Text style={[styles.tabLabel, currentPage === 'REPLAY' && styles.tabLabelActive]}>Hawk-Eye</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.footerTab, currentPage === 'HIGHLIGHTS' && styles.footerTabActive]}
            onPress={() => setCurrentPage('HIGHLIGHTS')}
          >
            <Sparkles size={16} color={currentPage === 'HIGHLIGHTS' ? THEME.colors.tennisVolt : THEME.colors.textSecondary} />
            <Text style={[styles.tabLabel, currentPage === 'HIGHLIGHTS' && styles.tabLabelActive]}>Reels</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.footerTab, currentPage === 'STATS' && styles.footerTabActive]}
            onPress={() => setCurrentPage('STATS')}
          >
            <TrendingUp size={16} color={currentPage === 'STATS' ? THEME.colors.tennisVolt : THEME.colors.textSecondary} />
            <Text style={[styles.tabLabel, currentPage === 'STATS' && styles.tabLabelActive]}>Heatmap</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Hawk-Eye Challenge Modal */}
      {lastBounce && (
        <HawkEyeChallengeModal
          visible={challengeModalVisible}
          decision={lastBounce.decision}
          offsetMm={lastBounce.offsetMm}
          courtSurface={courtSurface}
          challengingPlayer={challengingPlayer}
          p1Name={scoreState.playerOneName}
          p2Name={scoreState.playerTwoName}
          p1Challenges={scoreState.p1Challenges}
          p2Challenges={scoreState.p2Challenges}
          onDismiss={() => setChallengeModalVisible(false)}
          onApplyRuling={handleApplyChallengeRuling}
        />
      )}

      {/* SwingVision Apple Watch Remote Companion */}
      <WatchCompanionModal
        visible={watchCompanionVisible}
        scoreState={scoreState}
        playerOneName={scoreState.playerOneName}
        playerTwoName={scoreState.playerTwoName}
        lastServeSpeedKmh={speedTelemetry.currentKmh}
        onScorePoint={handleScorePoint}
        onUndoPoint={() => {}}
        onTriggerChallenge={handleOpenChallenge}
        onClose={() => setWatchCompanionVisible(false)}
      />

      {/* SwingVision Broadcast Video Export Studio */}
      <BroadcastExportModal
        visible={exportModalVisible}
        playerOneName={scoreState.playerOneName}
        playerTwoName={scoreState.playerTwoName}
        matchScore={`${scoreState.playerOneSets}-${scoreState.playerTwoSets}`}
        serveSpeedKmh={speedTelemetry.currentKmh}
        onClose={() => setExportModalVisible(false)}
        onExportComplete={(ar, res) => {
          Alert.alert("Export Ready", `Broadcast video rendered in ${ar} (${res})!`);
        }}
      />
    </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  header: {
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    backgroundColor: THEME.colors.surfaceGlass,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.lg,
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.radius.full,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    gap: 5,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.colors.neonRed,
  },
  liveText: {
    color: THEME.colors.neonRed,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  headerTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  soundToggleBtn: {
    padding: 6,
    borderRadius: THEME.radius.sm,
    backgroundColor: THEME.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  surfaceTag: {
    backgroundColor: THEME.colors.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: THEME.radius.sm,
    borderWidth: 1,
    borderColor: THEME.colors.borderGlow,
  },
  surfaceTagText: {
    color: THEME.colors.tennisVolt,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  mainContent: {
    flex: 1,
  },
  homeScroll: {
    padding: THEME.spacing.lg,
    paddingBottom: 80,
  },
  heroCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.xl,
    padding: THEME.spacing.xl,
    borderWidth: 1,
    borderColor: THEME.colors.borderGlow,
    marginBottom: THEME.spacing.lg,
    ...THEME.shadows.glowVolt,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  heroBadgeText: {
    color: THEME.colors.tennisVolt,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  heroHeading: {
    color: THEME.colors.textPrimary,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  heroSub: {
    color: THEME.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  heroButtonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  newMatchActionBtn: {
    flex: 1,
    backgroundColor: THEME.colors.tennisVolt,
    borderRadius: THEME.radius.md,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    ...THEME.shadows.glowVolt,
  },
  newMatchActionText: {
    color: '#070A11',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.8,
  },
  instantDemoBtn: {
    flex: 1,
    backgroundColor: THEME.colors.surfaceElevated,
    borderRadius: THEME.radius.md,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: THEME.colors.borderGlow,
  },
  instantDemoBtnText: {
    color: THEME.colors.tennisVolt,
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.8,
  },
  showcaseSection: {
    marginBottom: THEME.spacing.xl,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  sectionTitle: {
    color: THEME.colors.tennisVolt,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  featureShowcaseCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
    ...THEME.shadows.card,
  },
  featureIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(204, 255, 0, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featureTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
  },
  badgeVolt: {
    backgroundColor: 'rgba(204, 255, 0, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: THEME.radius.sm,
  },
  badgeVoltText: {
    color: THEME.colors.tennisVolt,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  featureDesc: {
    color: THEME.colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  card: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: THEME.spacing.lg,
    overflow: 'hidden',
    ...THEME.shadows.card,
  },
  cardHeader: {
    backgroundColor: THEME.colors.surfaceElevated,
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  cardHeaderText: {
    color: THEME.colors.textPrimary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  cardBody: {
    padding: THEME.spacing.lg,
  },
  emptyHistoryBox: {
    padding: 30,
    alignItems: 'center',
  },
  noHistoryText: {
    color: THEME.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  noHistorySub: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  historyRow: {
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.divider,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyMatchTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  historyMatchMeta: {
    color: THEME.colors.textSecondary,
    fontSize: 10,
    marginTop: 3,
  },
  historyViewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surfaceElevated,
    borderRadius: THEME.radius.sm,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  historyViewText: {
    color: THEME.colors.tennisVolt,
    fontSize: 10,
    fontWeight: '800',
    marginRight: 2,
  },
  historyDeleteBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: THEME.radius.sm,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearHistoryBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: THEME.radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearHistoryText: {
    color: THEME.colors.neonRed,
    fontSize: 9,
    fontWeight: '900',
  },
  calibrateContainer: {
    flex: 1,
  },
  calibTabRow: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.surface,
    padding: 6,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  calibTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: THEME.radius.sm,
    backgroundColor: THEME.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  calibTabBtnActive: {
    backgroundColor: THEME.colors.tennisVolt,
    borderColor: THEME.colors.tennisVolt,
  },
  calibTabText: {
    color: THEME.colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  calibTabTextActive: {
    color: '#070A11',
  },
  instructionBanner: {
    backgroundColor: THEME.colors.surfaceElevated,
    paddingVertical: 10,
    paddingHorizontal: THEME.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  bannerText: {
    color: THEME.colors.tennisVolt,
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.8,
  },
  cameraFrameView: {
    flex: 1,
    backgroundColor: '#000',
    position: 'relative',
  },
  dragAnchor: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.colors.tennisVolt,
    alignItems: 'center',
    justifyContent: 'center',
    ...THEME.shadows.glowVolt,
  },
  anchorLabel: {
    color: '#070A11',
    fontWeight: '900',
    fontSize: 13,
  },
  calibrateBtnRow: {
    padding: THEME.spacing.lg,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
    backgroundColor: THEME.colors.surface,
  },
  calibrateAutoBtn: {
    flex: 1,
    backgroundColor: THEME.colors.surfaceElevated,
    borderRadius: THEME.radius.md,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    paddingVertical: 12,
  },
  btnTextLight: {
    color: THEME.colors.textPrimary,
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  calibrateConfirmBtn: {
    flex: 1.2,
    backgroundColor: THEME.colors.tennisVolt,
    borderRadius: THEME.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingVertical: 12,
    ...THEME.shadows.glowVolt,
  },
  primaryBtnText: {
    color: '#070A11',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.8,
  },
  permissionFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    padding: 24,
  },
  permissionText: {
    color: THEME.colors.textSecondary,
    marginBottom: 16,
    marginTop: 8,
    textAlign: 'center',
    fontSize: 13,
  },
  grantBtn: {
    backgroundColor: THEME.colors.tennisVolt,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: THEME.radius.md,
  },
  grantBtnText: {
    color: '#070A11',
    fontWeight: '900',
    fontSize: 12,
  },
  matchContainer: {
    flex: 1,
  },
  cameraLiveFeed: {
    flex: 3,
    backgroundColor: '#000000',
    position: 'relative',
  },
  hudTopBar: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    gap: 8,
  },
  hudSpeedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: THEME.radius.sm,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  hudSpeedText: {
    color: THEME.colors.electricBlue,
    fontSize: 11,
    fontWeight: '900',
  },
  hudTimerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: THEME.radius.sm,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  hudTimerText: {
    color: THEME.colors.amberWarn,
    fontSize: 11,
    fontWeight: '900',
  },
  liveTrackingBanner: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: THEME.colors.tennisVolt,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: THEME.radius.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveTrackingBannerText: {
    color: '#070A11',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  decisionOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderWidth: 2,
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.md,
    alignItems: 'center',
    ...THEME.shadows.card,
  },
  decisionTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  decisionDistance: {
    color: THEME.colors.textPrimary,
    fontSize: 13,
    marginTop: 2,
    fontWeight: '700',
  },
  matchBentoPanel: {
    flex: 2.2,
    backgroundColor: THEME.colors.surface,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
    padding: THEME.spacing.md,
    justifyContent: 'space-between',
  },
  scoreboardCard: {
    backgroundColor: THEME.colors.surfaceElevated,
    borderRadius: THEME.radius.md,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  playerCol: {
    flex: 1,
  },
  serverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  serveBall: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.colors.tennisVolt,
  },
  playerName: {
    color: THEME.colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
  },
  challengePips: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 4,
  },
  pip: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pipActive: {
    backgroundColor: THEME.colors.neonGreen,
  },
  pipInactive: {
    backgroundColor: THEME.colors.textMuted,
    opacity: 0.3,
  },
  scoreStatsCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  setsText: {
    color: THEME.colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
    minWidth: 16,
    textAlign: 'center',
  },
  gamesText: {
    color: THEME.colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    minWidth: 18,
    textAlign: 'center',
  },
  pointsText: {
    color: THEME.colors.tennisVolt,
    fontSize: 20,
    fontWeight: '900',
    minWidth: 32,
    textAlign: 'center',
  },
  scoreDivider: {
    height: 1,
    backgroundColor: THEME.colors.divider,
    marginVertical: 4,
  },
  scoreActionRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
    alignItems: 'center',
  },
  scoreAddBtn: {
    flex: 1,
    backgroundColor: THEME.colors.surface,
    paddingVertical: 8,
    borderRadius: THEME.radius.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  scoreAddBtnText: {
    color: THEME.colors.tennisVolt,
    fontSize: 10,
    fontWeight: '800',
  },
  scoreResetBtn: {
    padding: 8,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.sm,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  simActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  simActionBtn: {
    flex: 1,
    backgroundColor: THEME.colors.surfaceElevated,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  simActionBtnText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  hudQuickActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  hudQuickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: THEME.radius.sm,
    backgroundColor: THEME.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  hudQuickBtnText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  replayScroll: {
    flex: 1,
  },
  replayViewSwitcher: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.surface,
    padding: 4,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: THEME.spacing.md,
    gap: 6,
  },
  replayViewSwitchBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: THEME.radius.sm,
  },
  replayViewSwitchBtnActive: {
    backgroundColor: THEME.colors.tennisVolt,
  },
  replayViewSwitchText: {
    color: THEME.colors.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  replayViewSwitchTextActive: {
    color: '#070A11',
  },
  fullChallengeCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: THEME.radius.md,
    marginVertical: THEME.spacing.md,
    shadowColor: THEME.colors.purpleAccent,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  fullChallengeCtaText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  replayToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
    gap: 8,
  },
  replaySurfaceTabs: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.sm,
    padding: 3,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  replaySurfaceTab: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 4,
  },
  replaySurfaceTabActive: {
    backgroundColor: THEME.colors.surfaceElevated,
  },
  replaySurfaceTabText: {
    color: THEME.colors.textMuted,
    fontSize: 9,
    fontWeight: '800',
  },
  sampleCallToggles: {
    flexDirection: 'row',
    gap: 6,
  },
  sampleCallBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: THEME.radius.sm,
    backgroundColor: THEME.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  sampleCallBtnText: {
    color: THEME.colors.textPrimary,
    fontSize: 10,
    fontWeight: '800',
  },
  scrubberCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: THEME.spacing.md,
  },
  scrubberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  scrubberTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  scrubberCount: {
    color: THEME.colors.tennisVolt,
    fontSize: 11,
    fontWeight: '800',
  },
  sliderTrack: {
    height: 6,
    backgroundColor: THEME.colors.surfaceElevated,
    borderRadius: 3,
    position: 'relative',
    marginVertical: 10,
  },
  sliderFill: {
    height: '100%',
    backgroundColor: THEME.colors.tennisVolt,
    borderRadius: 3,
  },
  sliderThumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    top: -5,
  },
  scrubButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginTop: 8,
  },
  scrubBtn: {
    flex: 1,
    backgroundColor: THEME.colors.surfaceElevated,
    borderRadius: THEME.radius.sm,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  scrubBtnText: {
    color: THEME.colors.textPrimary,
    fontSize: 10,
    fontWeight: '800',
  },
  radarCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: THEME.spacing.xxxl,
  },
  radarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: THEME.spacing.md,
  },
  radarTitle: {
    color: THEME.colors.electricBlue,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  radarMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  radarMetric: {
    flex: 1,
    alignItems: 'center',
  },
  radarMetricLabel: {
    color: THEME.colors.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  radarMetricVal: {
    color: THEME.colors.textPrimary,
    fontSize: 16,
    fontWeight: '900',
    marginTop: 4,
  },
  radarMetricSub: {
    color: THEME.colors.textSecondary,
    fontSize: 9,
    marginTop: 2,
  },
  statsScroll: {
    padding: THEME.spacing.lg,
    paddingBottom: 80,
  },
  statsSummaryCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    flexDirection: 'row',
    paddingVertical: 20,
    marginBottom: THEME.spacing.lg,
    ...THEME.shadows.card,
  },
  statsNumber: {
    fontSize: 30,
    color: THEME.colors.textPrimary,
    fontWeight: '900',
  },
  statsLabel: {
    color: THEME.colors.textMuted,
    fontSize: 9,
    fontWeight: '800',
    marginTop: 4,
    letterSpacing: 0.8,
  },
  divider: {
    width: 1,
    backgroundColor: THEME.colors.divider,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  metricName: {
    color: THEME.colors.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  metricValue: {
    color: THEME.colors.textPrimary,
    fontSize: 12,
    fontWeight: '900',
  },
  metricBar: {
    height: 8,
    backgroundColor: THEME.colors.surfaceElevated,
    borderRadius: 4,
    overflow: 'hidden',
  },
  metricBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  statsBackBtn: {
    backgroundColor: THEME.colors.surfaceElevated,
    borderRadius: THEME.radius.md,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  statsBackBtnText: {
    color: THEME.colors.tennisVolt,
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.8,
  },
  footerContainer: {
    paddingHorizontal: THEME.spacing.lg,
    paddingBottom: 10,
    backgroundColor: THEME.colors.background,
  },
  footerGlass: {
    height: 60,
    borderRadius: THEME.radius.xl,
    backgroundColor: THEME.colors.surfaceGlass,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    flexDirection: 'row',
    paddingHorizontal: 6,
    ...THEME.shadows.card,
  },
  footerTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerTabActive: {
    borderRadius: THEME.radius.lg,
  },
  tabLabel: {
    color: THEME.colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    marginTop: 3,
  },
  tabLabelActive: {
    color: THEME.colors.tennisVolt,
    fontWeight: '800',
  },
  wizardOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(7, 10, 17, 0.94)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: 16,
  },
  wizardCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.xl,
    borderWidth: 1,
    borderColor: THEME.colors.borderGlow,
    width: '100%',
    maxHeight: '88%',
    overflow: 'hidden',
    padding: THEME.spacing.lg,
    ...THEME.shadows.glowVolt,
  },
  wizardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  wizardTitle: {
    color: THEME.colors.tennisVolt,
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 1,
  },
  wizardCloseBtn: {
    padding: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  progressStep: {
    flex: 1,
    height: 3,
    backgroundColor: THEME.colors.surfaceElevated,
    borderRadius: 2,
  },
  progressStepActive: {
    backgroundColor: THEME.colors.tennisVolt,
  },
  wizardStepContent: {
    marginVertical: 6,
  },
  wizardStepTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 2,
  },
  wizardStepDesc: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    marginBottom: 16,
  },
  wizardTypeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  wizardTypeCard: {
    flex: 1,
    backgroundColor: THEME.colors.surfaceElevated,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    padding: 16,
    alignItems: 'center',
  },
  wizardTypeCardActive: {
    borderColor: THEME.colors.tennisVolt,
    backgroundColor: 'rgba(204, 255, 0, 0.08)',
  },
  wizardTypeTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 2,
  },
  wizardTypeTitleActive: {
    color: THEME.colors.tennisVolt,
  },
  wizardTypeDesc: {
    color: THEME.colors.textMuted,
    fontSize: 10,
  },
  wizardInputLabel: {
    color: THEME.colors.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: 0.5,
    marginTop: 8,
  },
  wizardInputGroupLabel: {
    color: THEME.colors.tennisVolt,
    fontSize: 11,
    fontWeight: '800',
    marginTop: 12,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  wizardInput: {
    backgroundColor: THEME.colors.surfaceElevated,
    borderRadius: THEME.radius.sm,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    color: THEME.colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  surfaceCardsCol: {
    gap: 10,
  },
  surfaceSelectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: THEME.colors.surfaceElevated,
    borderRadius: THEME.radius.md,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  surfaceSelectCardActive: {
    borderColor: THEME.colors.tennisVolt,
    backgroundColor: 'rgba(204, 255, 0, 0.08)',
  },
  surfaceColorBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  surfaceSelectTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
  },
  surfaceSelectSub: {
    color: THEME.colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    marginTop: 1,
  },
  wizardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.divider,
    paddingTop: 14,
  },
  wizardBackBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: THEME.radius.sm,
    backgroundColor: THEME.colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wizardBackBtnText: {
    color: THEME.colors.textPrimary,
    fontWeight: '800',
    fontSize: 11,
  },
  wizardNextBtn: {
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: THEME.radius.sm,
    backgroundColor: THEME.colors.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wizardNextBtnText: {
    color: '#070A11',
    fontWeight: '900',
    fontSize: 11,
  },
  wizardStartBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: THEME.radius.sm,
    backgroundColor: THEME.colors.tennisVolt,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    ...THEME.shadows.glowVolt,
  },
  wizardStartBtnText: {
    color: '#070A11',
    fontWeight: '900',
    fontSize: 11,
  },
});
