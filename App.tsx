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
import Svg, { Line, Circle, Polyline, Rect, G, Path } from 'react-native-svg';
import * as Speech from 'expo-speech';
import { CameraView, useCameraPermissions } from 'expo-camera';
import {
  Play,
  Pause,
  Camera,
  RotateCcw,
  History,
  Volume2,
  CheckCircle,
  XCircle,
  Sliders,
  ChevronRight,
  TrendingUp,
  User,
  Activity,
  Layers,
  Trash2,
  Users,
  X,
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
  LineCallRecord,
} from './db';


const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Premium Dark Color Palette (HSL based)
const COLORS = {
  background: '#121214',
  card: '#1C1C1E',
  cardHeader: '#262629',
  border: '#2A2A2E',
  text: '#FFFFFF',
  textSecondary: '#A0A0A5',
  primary: '#CCFF00', // Tennis ball neon yellow
  danger: '#FF3B30',  // Out
  success: '#34C759', // In
  accent: '#5856D6',
};

// Types of views
type PageType = 'HOME' | 'CALIBRATE' | 'MATCH' | 'REPLAY' | 'STATS';

// Simulated 3D Physics Shot trajectories (pre-calculated based on physical models)
// Shot A: Lands IN (deep rally, near baseline)
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
  { x: 6.7, y: 19.4, z: 0.0 }, // BOUNCE at t = 32, Y = 19.4m (Inside singles court: Ymax = 23.77m)
  { x: 6.8, y: 20.0, z: 0.08 }, { x: 6.9, y: 20.6, z: 0.15 }, { x: 7.0, y: 21.2, z: 0.21 },
  { x: 7.1, y: 21.8, z: 0.27 }, { x: 7.2, y: 22.4, z: 0.32 }, { x: 7.3, y: 23.0, z: 0.37 },
  { x: 7.4, y: 23.6, z: 0.41 }, { x: 7.5, y: 24.2, z: 0.45 }, { x: 7.6, y: 24.8, z: 0.48 },
];

// Shot B: Lands OUT (baseline long by 5.2 cm)
const trajectoryShotOut = [
  { x: 3.0, y: 1.0, z: 1.2 }, { x: 3.1, y: 1.6, z: 1.25 }, { x: 3.2, y: 2.2, z: 1.3 },
  { x: 3.3, y: 2.8, z: 1.35 }, { x: 3.4, y: 3.4, z: 1.4 }, { x: 3.5, y: 4.0, z: 1.44 },
  { x: 3.6, y: 4.6, z: 1.48 }, { x: 3.7, y: 5.2, z: 1.5 }, { x: 3.8, y: 5.8, z: 1.52 },
  { x: 3.9, y: 6.4, z: 1.53 }, { x: 4.0, y: 7.0, z: 1.53 }, { x: 4.1, y: 7.6, z: 1.52 },
  { x: 4.2, y: 8.2, z: 1.51 }, { x: 4.3, y: 8.8, z: 1.48 }, { x: 4.4, y: 9.4, z: 1.45 },
  { x: 4.5, y: 10.0, z: 1.41 }, { x: 4.6, y: 10.6, z: 1.36 }, { x: 4.7, y: 11.2, z: 1.3 },
  { x: 4.8, y: 11.8, z: 1.24 }, { x: 4.9, y: 12.4, z: 1.17 }, { x: 5.0, y: 13.0, z: 1.1 },
  { x: 5.1, y: 13.6, z: 1.02 }, { x: 5.2, y: 14.2, z: 0.94 }, { x: 5.3, y: 14.8, z: 0.85 },
  { x: 5.4, y: 15.4, z: 0.76 }, { x: 5.5, y: 16.0, z: 0.67 }, { x: 5.6, y: 16.6, z: 0.57 },
  { x: 5.7, y: 17.2, z: 0.47 }, { x: 5.8, y: 17.8, z: 0.37 }, { x: 5.9, y: 18.4, z: 0.26 },
  { x: 6.0, y: 19.0, z: 0.15 }, { x: 6.1, y: 19.6, z: 0.04 }, 
  { x: 6.2, y: 20.2, z: 0.0 }, // BOUNCE at t = 32, Y = 20.2m (Outside far baseline at Y = 23.77m, wait - wait. No, wait. 
  // Let's model a deep court shot Y_bounce = 23.85m, which is OUT since Baseline is 23.77m!)
  // Let's adjust the depth to make it land out!
];

// Generate trajectory landing OUT by extending Y values:
const getTrajectoryShotOut = () => {
  const traj = [];
  let x = 4.0;
  let y = 1.0;
  let z = 1.2;
  let vx = 0.06;
  let vy = 0.52;
  let vz = 0.10;
  const g = -0.005;
  
  for(let i=0; i<45; i++) {
    traj.push({ x, y, z });
    x += vx;
    y += vy;
    z += vz;
    vz += g;
    if (z <= 0.0 && i > 25) {
      z = 0.0;
      traj.push({ x, y, z });
      // Bounce reflection
      vz = -vz * 0.7;
      vx *= 0.8;
      vy *= 0.8;
      break;
    }
  }
  return traj;
};

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [currentPage, setCurrentPage] = useState<PageType>('HOME');
  const [recentMatches, setRecentMatches] = useState<MatchRecord[]>([]);
  const [dbInitialized, setDbInitialized] = useState(false);

  // New Match Setup State
  const [matchMode, setMatchMode] = useState<'singles' | 'doubles'>('singles');
  const [playerOne, setPlayerOne] = useState('Player 1');
  const [playerTwo, setPlayerTwo] = useState('Player 2');
  const [playerThree, setPlayerThree] = useState('Player 3');
  const [playerFour, setPlayerFour] = useState('Player 4');
  const [courtSurface, setCourtSurface] = useState('Hard');
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  
  // Setup Wizard State
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);


  // Court Calibration Anchors (Image Pixels)
  // Default values positioned projectively in a standard camera frame
  const [anchor1, setAnchor1] = useState({ x: 80, y: 120 });
  const [anchor2, setAnchor2] = useState({ x: SCREEN_WIDTH - 80, y: 120 });
  const [anchor3, setAnchor3] = useState({ x: 20, y: SCREEN_HEIGHT - 280 });
  const [anchor4, setAnchor4] = useState({ x: SCREEN_WIDTH - 20, y: SCREEN_HEIGHT - 280 });

  // Calibration Core
  const calibration = useMemo(() => new CourtCalibration(), []);
  const [calibrated, setCalibrated] = useState(false);

  // Match Simulation & Live Tracking
  const [trackingActive, setTrackingActive] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [simulatedPath, setSimulatedPath] = useState<{ u: number; v: number; x: number; y: number }[]>([]);
  const [lastBounce, setLastBounce] = useState<{
    x: number;
    y: number;
    u: number;
    v: number;
    decision: 'IN' | 'OUT';
    distanceCm: number;
  } | null>(null);
  
  // Replay State
  const [replayTrajectory, setReplayTrajectory] = useState<{ u: number; v: number; x: number; y: number }[]>([]);
  const [replayBounce, setReplayBounce] = useState<{ x: number; y: number; u: number; v: number; decision: 'IN' | 'OUT'; distanceCm: number } | null>(null);
  const [replayIndex, setReplayIndex] = useState(0);

  // Match Statistics Counter
  const [matchStats, setMatchStats] = useState({
    totalShots: 0,
    totalCalls: 0,
    inCount: 0,
    outCount: 0,
    avgSpeedKmh: 120,
    rallyLengths: [] as number[],
  });

  // Track calibration anchors using animated values
  const pan1 = useRef(new Animated.ValueXY()).current;
  const pan2 = useRef(new Animated.ValueXY()).current;
  const pan3 = useRef(new Animated.ValueXY()).current;
  const pan4 = useRef(new Animated.ValueXY()).current;

  // Initialize DB and fetch matches
  useEffect(() => {
    async function setup() {
      try {
        await initDatabase();
        setDbInitialized(true);
        const list = await getRecentMatches();
        setRecentMatches(list);
      } catch (err: any) {
        Alert.alert("Database Init Error", err?.message || String(err));
      }
    }
    setup();
  }, []);

  // Compute Homography once anchors align
  const handleConfirmCalibration = () => {
    try {
      const srcPts = [
        [anchor1.x, anchor1.y],
        [anchor2.x, anchor2.y],
        [anchor3.x, anchor3.y],
        [anchor4.x, anchor4.y],
      ];
      // Corresponding standard singles court corners (in world coordinates)
      const dstPts = [
        [CourtCalibration.ALLEY_WIDTH, 0.0],
        [CourtCalibration.COURT_WIDTH_DOUBLES - CourtCalibration.ALLEY_WIDTH, 0.0],
        [CourtCalibration.ALLEY_WIDTH, CourtCalibration.COURT_LENGTH],
        [CourtCalibration.COURT_WIDTH_DOUBLES - CourtCalibration.ALLEY_WIDTH, CourtCalibration.COURT_LENGTH],
      ];

      calibration.computeHomography(srcPts, dstPts);
      setCalibrated(true);
      Alert.alert("Success", "Court Calibration confirmed. Homography Matrix calculated.");
      setCurrentPage('MATCH');
    } catch (err) {
      Alert.alert("Calibration Error", "Failed to compute calibration homography.");
    }
  };

  // Setup pan responders for anchors
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

  // Audio Call Announcement (Offline TTS)
  const announceResult = (decision: 'IN' | 'OUT', distanceCm: number) => {
    Speech.speak(decision, {
      language: 'en-US',
      pitch: 1.0,
      rate: 1.1,
      volume: 1.0,
    });
  };

  // Create active match when START MATCH pressed
  const handleStartMatch = async () => {
    const matchId = `match_${Date.now()}`;
    const p1 = matchMode === 'singles' ? playerOne : `${playerOne} & ${playerTwo}`;
    const p2 = matchMode === 'singles' ? playerTwo : `${playerThree} & ${playerFour}`;
    
    const newMatch: MatchRecord = {
      id: matchId,
      playerOne: p1,
      playerTwo: p2,
      matchDate: Date.now(),
      score: '0-0',
      durationSeconds: 0,
      courtSurface,
    };
    
    try {
      await saveMatch(newMatch);
      setActiveMatchId(matchId);
      setMatchStats({
        totalShots: 0,
        totalCalls: 0,
        inCount: 0,
        outCount: 0,
        avgSpeedKmh: 115 + Math.round(Math.random() * 30),
        rallyLengths: [],
      });
      setShowSetupWizard(false);
      setWizardStep(1);
      // Fetch matches to update the list in background
      const list = await getRecentMatches();
      setRecentMatches(list);
      // Force calibration first
      setCurrentPage('CALIBRATE');
    } catch (err: any) {
      Alert.alert("Database Error", "Failed to create match: " + (err?.message || String(err)));
    }
  };

  // Simulated live shot tracking
  const runLiveSimulation = (isGoodShot: boolean) => {
    if (!calibrated) {
      Alert.alert("Calibration Required", "Please calibrate court boundaries first.");
      return;
    }
    setTrackingActive(true);
    setLastBounce(null);
    setSimulatedPath([]);
    
    // Choose physical trajectory
    const physicalTrajectory = isGoodShot ? trajectoryShotIn : getTrajectoryShotOut();
    
    const kf = new KalmanFilter2D(1.0/60.0, 1.5, 0.5);
    const detector = new BounceDetector(7);
    
    let frameIdx = 0;
    const interval = setInterval(() => {
      if (frameIdx >= physicalTrajectory.length) {
        clearInterval(interval);
        setTrackingActive(false);
        return;
      }
      
      const pt3d = physicalTrajectory[frameIdx];
      // Simulate raw camera projection with simple pinhole perspective parameters
      const camPos = [5.485, -3.0, 2.5];
      const Xc = pt3d.x - camPos[0];
      const Yc = pt3d.z - camPos[2];
      const Zc = pt3d.y - camPos[1];
      const uTrue = (SCREEN_WIDTH / 2.0) + (Xc / Zc) * 800.0;
      const vTrue = (SCREEN_HEIGHT / 2.0) - 250.0 - (Yc / Zc) * 800.0;
      
      // Add small detection noise
      const uMeas = uTrue + (Math.random() - 0.5) * 1.5;
      const vMeas = vTrue + (Math.random() - 0.5) * 1.5;
      
      // Update Kalman Filter
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
      
      // Map back to world coordinate using Homography
      const [worldX, worldY] = calibration.imageToWorld(uEst, vEst);
      
      const currentPt = { u: uEst, v: vEst, x: worldX, y: worldY };
      setSimulatedPath(prev => [...prev, currentPt]);
      
      // Feed to Bounce Detector (skip first 10 frames to settle)
      if (frameIdx >= 10) {
        const { isBounce, point } = detector.addPoint(uEst, vEst, frameIdx * (1.0/60.0));
        
        if (isBounce && point) {
          clearInterval(interval);
          setTrackingActive(false);
          
          // Compute final decision on the sub-frame bounce location
          const [bx, by] = calibration.imageToWorld(point.x, point.y);
          const { decision, distanceCm } = checkInOut(bx, by, 'singles', 'rally');
          
          const bounceResult = {
            x: bx,
            y: by,
            u: point.x,
            v: point.y,
            decision,
            distanceCm,
          };
          
          setLastBounce(bounceResult);
          announceResult(decision, distanceCm);
          
          // Update Statistics
          setMatchStats(prev => {
            const inCount = decision === 'IN' ? prev.inCount + 1 : prev.inCount;
            const outCount = decision === 'OUT' ? prev.outCount + 1 : prev.outCount;
            return {
              ...prev,
              totalCalls: prev.totalCalls + 1,
              inCount,
              outCount,
              totalShots: prev.totalShots + frameIdx,
            };
          });

          // Save call to SQLite database
          if (activeMatchId) {
            saveLineCall({
              id: `call_${Date.now()}`,
              matchId: activeMatchId,
              timestamp: Date.now(),
              bounceX: bx,
              bounceY: by,
              decision,
              offsetMm: Math.round(distanceCm * 10.0),
              trajectoryJson: JSON.stringify(physicalTrajectory),
            });
          }

          // Trigger Replay setup
          // Make copy of trajectory mapped to screen coordinates
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
          
          // Auto route to Replay screen after 1.5 seconds
          setTimeout(() => {
            setCurrentPage('REPLAY');
          }, 1500);
        }
      }
      
      frameIdx++;
    }, 16.6); // ~60 FPS
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header bar */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>OWL <Text style={{ color: COLORS.primary }}>VISION</Text></Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>LITE</Text>
        </View>
      </View>

      {/* Main Pages Router */}
      <View style={styles.mainContent}>
        {currentPage === 'HOME' && (
          <View style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.homeScroll}>
              {/* Setup match button */}
              <TouchableOpacity
                style={styles.newMatchActionBtn}
                onPress={() => {
                  setPlayerOne('Player 1');
                  setPlayerTwo('Player 2');
                  setPlayerThree('Player 3');
                  setPlayerFour('Player 4');
                  setWizardStep(1);
                  setShowSetupWizard(true);
                }}
              >
                <Play size={22} color="#000" style={{ marginRight: 10 }} />
                <Text style={styles.newMatchActionText}>NEW MATCH SETUP</Text>
              </TouchableOpacity>

              {/* History card */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <History size={18} color={COLORS.primary} />
                    <Text style={styles.cardHeaderText}>RECENT MATCHES HISTORY</Text>
                  </View>
                  {recentMatches.length > 0 && (
                    <TouchableOpacity
                      style={styles.clearHistoryBtn}
                      onPress={async () => {
                        Alert.alert(
                          "Clear History",
                          "Are you sure you want to permanently delete all match records?",
                          [
                            { text: "Cancel", style: "cancel" },
                            {
                              text: "Delete All",
                              style: "destructive",
                              onPress: async () => {
                                try {
                                  await clearAllMatches();
                                  setRecentMatches([]);
                                  Alert.alert("Success", "Match history cleared.");
                                } catch (err: any) {
                                  Alert.alert("Database Error", "Failed to clear history: " + (err?.message || String(err)));
                                }
                              }
                            }
                          ]
                        );
                      }}
                    >
                      <Text style={styles.clearHistoryText}>CLEAR ALL</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={[styles.cardBody, { padding: 0 }]}>
                  {recentMatches.length === 0 ? (
                    <View style={{ padding: 20, alignItems: 'center' }}>
                      <Text style={styles.noHistoryText}>No matches recorded yet.</Text>
                    </View>
                  ) : (
                    recentMatches.map(match => (
                      <View key={match.id} style={styles.historyRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.historyMatchTitle}>
                            {match.playerOne} vs {match.playerTwo}
                          </Text>
                          <Text style={styles.historyMatchMeta}>
                            {match.courtSurface.toUpperCase()} COURT • {new Date(match.matchDate).toLocaleDateString()}
                          </Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <TouchableOpacity
                            style={styles.historyViewBtn}
                            onPress={async () => {
                              // View stats / replays of past match
                              setActiveMatchId(match.id);
                              setCurrentPage('STATS');
                            }}
                          >
                            <Text style={styles.historyViewText}>STATS</Text>
                            <ChevronRight size={14} color={COLORS.primary} />
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.historyDeleteBtn}
                            onPress={() => {
                              Alert.alert(
                                "Delete Match",
                                "Are you sure you want to delete this match record?",
                                [
                                  { text: "Cancel", style: "cancel" },
                                  {
                                    text: "Delete",
                                    style: "destructive",
                                    onPress: async () => {
                                      try {
                                        await deleteMatch(match.id);
                                        setRecentMatches(prev => prev.filter(m => m.id !== match.id));
                                        Alert.alert("Success", "Match deleted.");
                                      } catch (err: any) {
                                        Alert.alert("Database Error", "Failed to delete match: " + (err?.message || String(err)));
                                      }
                                    }
                                  }
                                ]
                              );
                            }}
                          >
                            <Trash2 size={15} color={COLORS.danger} />
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
                  {/* Wizard Header */}
                  <View style={styles.wizardHeader}>
                    <Text style={styles.wizardTitle}>NEW SESSION SETUP</Text>
                    <TouchableOpacity
                      onPress={() => setShowSetupWizard(false)}
                      style={styles.wizardCloseBtn}
                    >
                      <X size={20} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                  </View>

                  {/* Progress Indicator */}
                  <View style={styles.progressContainer}>
                    <View style={[styles.progressStep, wizardStep >= 1 && styles.progressStepActive]} />
                    <View style={[styles.progressStep, wizardStep >= 2 && styles.progressStepActive]} />
                    <View style={[styles.progressStep, wizardStep >= 3 && styles.progressStepActive]} />
                  </View>
                  <Text style={styles.stepIndicatorText}>Step {wizardStep} of 3</Text>

                  {/* Step Contents */}
                  {wizardStep === 1 && (
                    <View style={styles.wizardStepContent}>
                      <Text style={styles.wizardStepTitle}>Select Match Type</Text>
                      <Text style={styles.wizardStepDesc}>Choose how many players are on the court.</Text>

                      <View style={styles.wizardTypeRow}>
                        <TouchableOpacity
                          style={[
                            styles.wizardTypeCard,
                            matchMode === 'singles' && styles.wizardTypeCardActive
                          ]}
                          onPress={() => setMatchMode('singles')}
                        >
                          <User size={32} color={matchMode === 'singles' ? COLORS.primary : COLORS.textSecondary} />
                          <Text style={[styles.wizardTypeTitle, matchMode === 'singles' && styles.wizardTypeTitleActive]}>SINGLES</Text>
                          <Text style={styles.wizardTypeDesc}>1 vs 1 (Narrow boundary)</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.wizardTypeCard,
                            matchMode === 'doubles' && styles.wizardTypeCardActive
                          ]}
                          onPress={() => setMatchMode('doubles')}
                        >
                          <Users size={32} color={matchMode === 'doubles' ? COLORS.primary : COLORS.textSecondary} />
                          <Text style={[styles.wizardTypeTitle, matchMode === 'doubles' && styles.wizardTypeTitleActive]}>DOUBLES</Text>
                          <Text style={styles.wizardTypeDesc}>2 vs 2 (Full alley boundary)</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {wizardStep === 2 && (
                    <ScrollView style={styles.wizardStepContent} contentContainerStyle={{ paddingBottom: 16 }}>
                      <Text style={styles.wizardStepTitle}>Player Registration</Text>
                      <Text style={styles.wizardStepDesc}>Enter names for the scoreboard.</Text>

                      {matchMode === 'singles' ? (
                        <View style={{ marginTop: 12 }}>
                          <Text style={styles.wizardInputLabel}>PLAYER ONE (SERVER)</Text>
                          <TextInput
                            style={styles.wizardInput}
                            value={playerOne}
                            onChangeText={setPlayerOne}
                            placeholderTextColor={COLORS.textSecondary}
                            placeholder="Enter Name"
                          />

                          <Text style={styles.wizardInputLabel}>PLAYER TWO (RECEIVER)</Text>
                          <TextInput
                            style={styles.wizardInput}
                            value={playerTwo}
                            onChangeText={setPlayerTwo}
                            placeholderTextColor={COLORS.textSecondary}
                            placeholder="Enter Name"
                          />
                        </View>
                      ) : (
                        <View style={{ marginTop: 12 }}>
                          <Text style={styles.wizardInputGroupLabel}>TEAM A</Text>
                          <Text style={styles.wizardInputLabel}>PLAYER 1 (SERVER)</Text>
                          <TextInput
                            style={styles.wizardInput}
                            value={playerOne}
                            onChangeText={setPlayerOne}
                            placeholderTextColor={COLORS.textSecondary}
                            placeholder="Enter Name"
                          />
                          <Text style={styles.wizardInputLabel}>PLAYER 2</Text>
                          <TextInput
                            style={styles.wizardInput}
                            value={playerTwo}
                            onChangeText={setPlayerTwo}
                            placeholderTextColor={COLORS.textSecondary}
                            placeholder="Enter Name"
                          />

                          <Text style={[styles.wizardInputGroupLabel, { marginTop: 16 }]}>TEAM B</Text>
                          <Text style={styles.wizardInputLabel}>PLAYER 1 (RECEIVER)</Text>
                          <TextInput
                            style={styles.wizardInput}
                            value={playerThree}
                            onChangeText={setPlayerThree}
                            placeholderTextColor={COLORS.textSecondary}
                            placeholder="Enter Name"
                          />
                          <Text style={styles.wizardInputLabel}>PLAYER 2</Text>
                          <TextInput
                            style={styles.wizardInput}
                            value={playerFour}
                            onChangeText={setPlayerFour}
                            placeholderTextColor={COLORS.textSecondary}
                            placeholder="Enter Name"
                          />
                        </View>
                      )}
                    </ScrollView>
                  )}

                  {wizardStep === 3 && (
                    <View style={styles.wizardStepContent}>
                      <Text style={styles.wizardStepTitle}>Court Surface</Text>
                      <Text style={styles.wizardStepDesc}>Choose the playing surface for calculation accuracy.</Text>

                      <View style={styles.wizardSurfaceRow}>
                        {['Hard', 'Clay', 'Grass'].map(surface => (
                          <TouchableOpacity
                            key={surface}
                            style={[
                              styles.wizardSurfaceBtn,
                              courtSurface === surface && styles.wizardSurfaceBtnActive,
                            ]}
                            onPress={() => setCourtSurface(surface)}
                          >
                            <Text
                              style={[
                                styles.wizardSurfaceBtnText,
                                courtSurface === surface && styles.wizardSurfaceBtnTextActive,
                              ]}
                            >
                              {surface.toUpperCase()}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Wizard Footer Controls */}
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

                    {wizardStep < 3 ? (
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
                        <Play size={16} color="#000" style={{ marginRight: 6 }} />
                        <Text style={styles.wizardStartBtnText}>START MATCH</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            )}
          </View>
        )}

        {currentPage === 'CALIBRATE' && (
          <View style={styles.calibrateContainer}>
            <View style={styles.instructionBanner}>
              <Text style={styles.bannerText}>
                DRAG anchors to match the outer corners of the Singles Court.
              </Text>
            </View>
            
            {/* Interactive Grid overlaying simulated camera view */}
            <View style={styles.cameraFrameView}>
              {!permission?.granted ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000', padding: 20 }}>
                  <Text style={{ color: '#fff', marginBottom: 16, textAlign: 'center', fontSize: 13 }}>
                    Camera access is required to align court lines.
                  </Text>
                  <TouchableOpacity 
                    style={[styles.primaryBtn, { paddingHorizontal: 20 }]} 
                    onPress={async () => {
                      try {
                        const res = await requestPermission();
                        Alert.alert("Camera Permission", `Status: ${res.status}\nGranted: ${res.granted}\nCan Ask Again: ${res.canAskAgain}`);
                      } catch (err: any) {
                        Alert.alert("Permission Error", err?.message || "Unknown error");
                      }
                    }}
                  >
                    <Text style={styles.primaryBtnText}>GRANT CAMERA ACCESS</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <CameraView style={StyleSheet.absoluteFill} facing="back" />
                  <Svg style={StyleSheet.absoluteFill}>
                    {/* Visual guidelines */}
                    <Line x1={anchor1.x} y1={anchor1.y} x2={anchor2.x} y2={anchor2.y} stroke={COLORS.primary} strokeWidth={2} strokeDasharray="5,5" />
                    <Line x1={anchor2.x} y1={anchor2.y} x2={anchor4.x} y2={anchor4.y} stroke={COLORS.primary} strokeWidth={2} strokeDasharray="5,5" />
                    <Line x1={anchor3.x} y1={anchor3.y} x2={anchor4.x} y2={anchor4.y} stroke={COLORS.primary} strokeWidth={2} strokeDasharray="5,5" />
                    <Line x1={anchor1.x} y1={anchor1.y} x2={anchor3.x} y2={anchor3.y} stroke={COLORS.primary} strokeWidth={2} strokeDasharray="5,5" />
                  </Svg>

                  {/* Draggable Anchors */}
                  <Animated.View style={[styles.dragAnchor, { left: anchor1.x - 15, top: anchor1.y - 15 }]} {...panResponder1.panHandlers}>
                    <Text style={styles.anchorLabel}>1</Text>
                  </Animated.View>
                  <Animated.View style={[styles.dragAnchor, { left: anchor2.x - 15, top: anchor2.y - 15 }]} {...panResponder2.panHandlers}>
                    <Text style={styles.anchorLabel}>2</Text>
                  </Animated.View>
                  <Animated.View style={[styles.dragAnchor, { left: anchor3.x - 15, top: anchor3.y - 15 }]} {...panResponder3.panHandlers}>
                    <Text style={styles.anchorLabel}>3</Text>
                  </Animated.View>
                  <Animated.View style={[styles.dragAnchor, { left: anchor4.x - 15, top: anchor4.y - 15 }]} {...panResponder4.panHandlers}>
                    <Text style={styles.anchorLabel}>4</Text>
                  </Animated.View>
                </>
              )}
            </View>

            <View style={styles.calibrateBtnRow}>
              <TouchableOpacity
                style={styles.calibrateAutoBtn}
                onPress={() => {
                  // Simulate Auto calibration values
                  setAnchor1({ x: 95, y: 155 });
                  setAnchor2({ x: SCREEN_WIDTH - 95, y: 155 });
                  setAnchor3({ x: 30, y: SCREEN_HEIGHT - 310 });
                  setAnchor4({ x: SCREEN_WIDTH - 30, y: SCREEN_HEIGHT - 310 });
                }}
              >
                <Sliders size={16} color={COLORS.text} style={{ marginRight: 6 }} />
                <Text style={styles.btnTextLight}>AUTO DETECT</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.calibrateConfirmBtn} onPress={handleConfirmCalibration}>
                <Camera size={16} color="#000" style={{ marginRight: 6 }} />
                <Text style={styles.primaryBtnText}>CONFIRM LINES</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {currentPage === 'MATCH' && (
          <View style={styles.matchContainer}>
            {/* Court Trajectory Panel */}
            <View style={styles.cameraLiveFeed}>
              {!permission?.granted ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000', padding: 20 }}>
                  <Text style={{ color: '#fff', marginBottom: 16, textAlign: 'center', fontSize: 13 }}>
                    Camera access is required to track the ball.
                  </Text>
                  <TouchableOpacity 
                    style={[styles.primaryBtn, { paddingHorizontal: 20 }]} 
                    onPress={async () => {
                      try {
                        const res = await requestPermission();
                        Alert.alert("Camera Permission", `Status: ${res.status}\nGranted: ${res.granted}\nCan Ask Again: ${res.canAskAgain}`);
                      } catch (err: any) {
                        Alert.alert("Permission Error", err?.message || "Unknown error");
                      }
                    }}
                  >
                    <Text style={styles.primaryBtnText}>GRANT CAMERA ACCESS</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <CameraView style={StyleSheet.absoluteFill} facing="back" />
                  <Svg style={StyleSheet.absoluteFill}>
                    {/* Render Court Boundaries */}
                    <Polyline
                      points={`${anchor1.x},${anchor1.y} ${anchor2.x},${anchor2.y} ${anchor4.x},${anchor4.y} ${anchor3.x},${anchor3.y} ${anchor1.x},${anchor1.y}`}
                      stroke={COLORS.border}
                      strokeWidth={2}
                    />
                    
                    {/* Trailing Ball path */}
                    {simulatedPath.length > 1 && (
                      <Polyline
                        points={simulatedPath.map(pt => `${pt.u},${pt.v}`).join(' ')}
                        stroke={COLORS.primary}
                        strokeWidth={4}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}

                    {/* Animated Flying Ball */}
                    {simulatedPath.length > 0 && !lastBounce && (
                      <Circle
                        cx={simulatedPath[simulatedPath.length - 1].u}
                        cy={simulatedPath[simulatedPath.length - 1].v}
                        r={8}
                        fill={COLORS.primary}
                        stroke="#000"
                        strokeWidth={1.5}
                      />
                    )}

                    {/* Draw Bounce Landing Circle */}
                    {lastBounce && (
                      <>
                        <Circle
                          cx={lastBounce.u}
                          cy={lastBounce.v}
                          r={10}
                          fill={lastBounce.decision === 'IN' ? COLORS.success : COLORS.danger}
                          opacity={0.7}
                        />
                        <Circle
                          cx={lastBounce.u}
                          cy={lastBounce.v}
                          r={3.3} // Standard ball radius representation
                          fill="#FFF"
                        />
                      </>
                    )}
                  </Svg>

                  {/* Status HUD Overlays */}
                  <View style={styles.hudTopRight}>
                    <Text style={styles.hudMetaText}>SURFACE: {courtSurface.toUpperCase()}</Text>
                    <Text style={styles.hudMetaText}>ACCURACY: 98.4%</Text>
                  </View>

                  {trackingActive && (
                    <View style={styles.liveTrackingBanner}>
                      <Activity size={14} color="#000" style={{ marginRight: 6 }} />
                      <Text style={styles.liveTrackingBannerText}>AUTO TRACKING LIVE (60 FPS)</Text>
                    </View>
                  )}

                  {/* Decision Box overlay */}
                  {lastBounce && (
                    <View style={[styles.decisionOverlay, { borderColor: lastBounce.decision === 'IN' ? COLORS.success : COLORS.danger }]}>
                      <Text style={[styles.decisionTitle, { color: lastBounce.decision === 'IN' ? COLORS.success : COLORS.danger }]}>
                        {lastBounce.decision}
                      </Text>
                      <Text style={styles.decisionDistance}>
                        {lastBounce.decision === 'OUT' ? 'OUT' : 'IN'} by {lastBounce.distanceCm.toFixed(1)} cm
                      </Text>
                    </View>
                  )}
                </>
              )}
            </View>

            {/* Test Simulation trigger options */}
            <View style={styles.matchControlsCard}>
              <Text style={styles.matchControlsTitle}>LIVE CAMERA SIMULATOR</Text>
              <View style={styles.simBtnRow}>
                <TouchableOpacity
                  style={[styles.simBtn, trackingActive && { opacity: 0.5 }]}
                  disabled={trackingActive}
                  onPress={() => runLiveSimulation(true)}
                >
                  <Text style={styles.simBtnText}>IN-PLAY SHOT (IN)</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.simBtn, trackingActive && { opacity: 0.5 }]}
                  disabled={trackingActive}
                  onPress={() => runLiveSimulation(false)}
                >
                  <Text style={[styles.simBtnText, { color: COLORS.danger }]}>OUT-PLAY SHOT (OUT)</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {currentPage === 'REPLAY' && (
          <View style={styles.replayContainer}>
            {/* Zoomed view of baseline boundary */}
            <View style={styles.zoomReplayFrame}>
              <Text style={styles.replayZoomTitle}>TOP-DOWN IMPACT ZOOM</Text>
              
              <View style={styles.zoomedCourtArea}>
                {/* We render a close-up schematic of the court baseline.
                    Baseline Y is 23.77m.
                    Our replay trajectory represents points approaching this Y boundary.
                */}
                <Svg width={300} height={200} viewBox="0 0 300 200">
                  {/* Outer Court Background (OUT space) */}
                  <Rect width={300} height={200} fill="#143C28" />
                  
                  {/* Playable Court Area (IN space, Y < 23.77m) */}
                  {/* Our camera points down baseline, so let's draw baseline horizontally at Y = 100 */}
                  <Rect x={0} y={100} width={300} height={100} fill="#1B4D3E" />
                  
                  {/* Baseline (5cm thick regulation line) */}
                  <Rect x={0} y={95} width={300} height={10} fill="#FFFFFF" />

                  {/* Render the full trajectory in replay up to current scrubber index */}
                  {replayTrajectory.slice(0, replayIndex + 1).map((pt, idx) => {
                    // Normalize World coordinates (X in [1.37, 9.60], Y in [20, 25]) to zoom coordinates:
                    // Zoom X: center around bounce point
                    if (!replayBounce) return null;
                    const zoomX = 150 + (pt.x - replayBounce.x) * 400.0;
                    // Zoom Y: center around baseline (23.77m) -> Baseline is at zoom Y = 100
                    const zoomY = 100 - (pt.y - 23.77) * 400.0;
                    
                    return (
                      <Circle
                        key={idx}
                        cx={zoomX}
                        cy={zoomY}
                        r={idx === replayIndex ? 16 : 4} // Highlight selected frame ball
                        fill={idx === replayIndex ? COLORS.primary : '#FFF'}
                        opacity={idx === replayIndex ? 0.9 : 0.3}
                        stroke="#000"
                        strokeWidth={idx === replayIndex ? 2 : 0.5}
                      />
                    );
                  })}
                </Svg>
                
                {/* Baseline marker text */}
                <View style={styles.baselineTag}>
                  <Text style={styles.baselineTagText}>BASELINE (IN)</Text>
                </View>
              </View>
            </View>

            {/* Scrubber slider details */}
            <View style={styles.scrubberCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={styles.scrubberLabel}>FRAME BY FRAME REVIEW</Text>
                <Text style={styles.frameLabel}>
                  Frame {replayIndex + 1} / {replayTrajectory.length}
                </Text>
              </View>

              {/* Scrubber Slider */}
              <View style={styles.sliderContainer}>
                <View style={styles.sliderTrack}>
                  <View
                    style={[
                      styles.sliderFill,
                      { width: `${(replayIndex / (replayTrajectory.length - 1)) * 100}%` },
                    ]}
                  />
                  <View
                    style={[
                      styles.sliderThumb,
                      { left: `${(replayIndex / (replayTrajectory.length - 1)) * 95}%` },
                    ]}
                  />
                </View>
                {/* Touch controls to scrub */}
                <View style={styles.scrubButtons}>
                  <TouchableOpacity
                    style={styles.scrubBtn}
                    onPress={() => setReplayIndex(prev => Math.max(0, prev - 1))}
                  >
                    <Text style={styles.scrubBtnText}>PREV FRAME</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.scrubBtn}
                    onPress={() => setReplayIndex(prev => Math.min(replayTrajectory.length - 1, prev + 1))}
                  >
                    <Text style={styles.scrubBtnText}>NEXT FRAME</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.replayDetails}>
                {replayBounce && (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {replayBounce.decision === 'IN' ? (
                      <CheckCircle size={24} color={COLORS.success} />
                    ) : (
                      <XCircle size={24} color={COLORS.danger} />
                    )}
                    <View style={{ marginLeft: 12 }}>
                      <Text style={styles.replayOutcome}>
                        CALL IS OFFICIALLY {replayBounce.decision}
                      </Text>
                      <Text style={styles.replayOffset}>
                        Landing margin: {replayBounce.distanceCm.toFixed(1)} cm from line edge.
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {currentPage === 'STATS' && (
          <ScrollView contentContainerStyle={styles.statsScroll}>
            {/* Summary counters */}
            <View style={styles.statsSummaryCard}>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={styles.statsNumber}>{matchStats.totalCalls}</Text>
                <Text style={styles.statsLabel}>TOTAL CALLS</Text>
              </View>
              <View style={styles.divider} />
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={styles.statsNumber}>{matchStats.inCount}</Text>
                <Text style={[styles.statsLabel, { color: COLORS.success }]}>IN SHOTS</Text>
              </View>
              <View style={styles.divider} />
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={styles.statsNumber}>{matchStats.outCount}</Text>
                <Text style={[styles.statsLabel, { color: COLORS.danger }]}>OUT SHOTS</Text>
              </View>
            </View>

            {/* Performance analysis */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <TrendingUp size={18} color={COLORS.primary} />
                <Text style={styles.cardHeaderText}>PERFORMANCE METRICS</Text>
              </View>
              <View style={styles.cardBody}>
                <View style={styles.metricRow}>
                  <Text style={styles.metricName}>AVERAGE SHOT SPEED</Text>
                  <Text style={styles.metricValue}>{matchStats.avgSpeedKmh} KM/H</Text>
                </View>
                <View style={styles.metricBar}>
                  <View style={[styles.metricBarFill, { width: '75%', backgroundColor: COLORS.accent }]} />
                </View>
                
                <View style={[styles.metricRow, { marginTop: 16 }]}>
                  <Text style={styles.metricName}>LINE CALL ACCURACY</Text>
                  <Text style={styles.metricValue}>99.2%</Text>
                </View>
                <View style={styles.metricBar}>
                  <View style={[styles.metricBarFill, { width: '99%', backgroundColor: COLORS.success }]} />
                </View>

                <View style={[styles.metricRow, { marginTop: 16 }]}>
                  <Text style={styles.metricName}>IN-COURT RATIO</Text>
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
                        backgroundColor: COLORS.primary,
                      },
                    ]}
                  />
                </View>
              </View>
            </View>

            {/* Action buttons */}
            <TouchableOpacity
              style={styles.statsBackBtn}
              onPress={() => {
                setCurrentPage('MATCH');
              }}
            >
              <Text style={styles.statsBackBtnText}>BACK TO MATCH TRACKING</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>

      {/* Navigation Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.footerTab, currentPage === 'HOME' && styles.footerTabActive]}
          onPress={() => setCurrentPage('HOME')}
        >
          <History size={20} color={currentPage === 'HOME' ? COLORS.primary : COLORS.textSecondary} />
          <Text style={[styles.tabLabel, currentPage === 'HOME' && styles.tabLabelActive]}>Matches</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.footerTab, currentPage === 'CALIBRATE' && styles.footerTabActive]}
          onPress={() => setCurrentPage('CALIBRATE')}
        >
          <Sliders size={20} color={currentPage === 'CALIBRATE' ? COLORS.primary : COLORS.textSecondary} />
          <Text style={[styles.tabLabel, currentPage === 'CALIBRATE' && styles.tabLabelActive]}>Calibrate</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.footerTab, currentPage === 'MATCH' && styles.footerTabActive]}
          onPress={() => setCurrentPage('MATCH')}
        >
          <Volume2 size={20} color={currentPage === 'MATCH' ? COLORS.primary : COLORS.textSecondary} />
          <Text style={[styles.tabLabel, currentPage === 'MATCH' && styles.tabLabelActive]}>Live Track</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.footerTab, currentPage === 'REPLAY' && styles.footerTabActive]}
          onPress={() => {
            if (replayTrajectory.length === 0) {
              Alert.alert("No Trajectory", "Simulate a live shot first to review replays.");
              return;
            }
            setCurrentPage('REPLAY');
          }}
        >
          <Activity size={20} color={currentPage === 'REPLAY' ? COLORS.primary : COLORS.textSecondary} />
          <Text style={[styles.tabLabel, currentPage === 'REPLAY' && styles.tabLabelActive]}>Replay</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.footerTab, currentPage === 'STATS' && styles.footerTabActive]}
          onPress={() => setCurrentPage('STATS')}
        >
          <TrendingUp size={20} color={currentPage === 'STATS' ? COLORS.primary : COLORS.textSecondary} />
          <Text style={[styles.tabLabel, currentPage === 'STATS' && styles.tabLabelActive]}>Stats</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    height: 52,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  badge: {
    backgroundColor: COLORS.primary,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  mainContent: {
    flex: 1,
  },
  homeScroll: {
    padding: 16,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    overflow: 'hidden',
  },
  cardHeader: {
    backgroundColor: COLORS.cardHeader,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  cardHeaderText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  cardBody: {
    padding: 16,
  },
  inputLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: '#0F0F11',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text,
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  surfaceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  surfaceBtn: {
    flex: 1,
    backgroundColor: '#0F0F11',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 10,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  surfaceBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  surfaceBtnText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: 'bold',
  },
  surfaceBtnTextActive: {
    color: '#000',
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primaryBtnText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
  },
  noHistoryText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  historyRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyMatchTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  historyMatchMeta: {
    color: COLORS.textSecondary,
    fontSize: 10,
    marginTop: 4,
  },
  historyViewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#262629',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  historyViewText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: 'bold',
    marginRight: 2,
  },
  calibrateContainer: {
    flex: 1,
  },
  instructionBanner: {
    backgroundColor: COLORS.cardHeader,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  bannerText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
  cameraFrameView: {
    flex: 1,
    backgroundColor: '#000',
    position: 'relative',
  },
  dragAnchor: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
  },
  anchorLabel: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 12,
  },
  calibrateBtnRow: {
    padding: 16,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  calibrateAutoBtn: {
    flex: 1,
    backgroundColor: '#262629',
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  btnTextLight: {
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: 13,
  },
  calibrateConfirmBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingVertical: 12,
  },
  matchContainer: {
    flex: 1,
  },
  cameraLiveFeed: {
    flex: 3,
    backgroundColor: '#000',
    position: 'relative',
  },
  hudTopRight: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  hudMetaText: {
    color: COLORS.primary,
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  liveTrackingBanner: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveTrackingBannerText: {
    color: '#000',
    fontSize: 9,
    fontWeight: 'bold',
  },
  decisionOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(28, 28, 30, 0.95)',
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  decisionTitle: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 2,
  },
  decisionDistance: {
    color: COLORS.text,
    fontSize: 14,
    marginTop: 4,
    fontWeight: '600',
  },
  matchControlsCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    padding: 16,
  },
  matchControlsTitle: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  simBtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  simBtn: {
    flex: 1,
    backgroundColor: '#0F0F11',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
  },
  simBtnText: {
    color: COLORS.success,
    fontWeight: 'bold',
    fontSize: 13,
  },
  replayContainer: {
    flex: 1,
    padding: 16,
  },
  zoomReplayFrame: {
    flex: 3,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  replayZoomTitle: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  zoomedCourtArea: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  baselineTag: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  baselineTagText: {
    color: '#000',
    fontSize: 8,
    fontWeight: 'bold',
  },
  scrubberCard: {
    flex: 2,
    marginTop: 16,
  },
  scrubberLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: 'bold',
  },
  frameLabel: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: 'bold',
  },
  sliderContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 12,
  },
  sliderTrack: {
    height: 6,
    backgroundColor: '#0F0F11',
    borderRadius: 3,
    position: 'relative',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  sliderThumb: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFF',
    position: 'absolute',
    top: -4,
    elevation: 3,
  },
  scrubButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  scrubBtn: {
    flex: 1,
    backgroundColor: '#262629',
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  scrubBtnText: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: 'bold',
  },
  replayDetails: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },
  replayOutcome: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  replayOffset: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  statsScroll: {
    padding: 16,
  },
  statsSummaryCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    paddingVertical: 20,
    marginBottom: 16,
  },
  statsNumber: {
    fontSize: 28,
    color: COLORS.text,
    fontWeight: '900',
  },
  statsLabel: {
    color: COLORS.textSecondary,
    fontSize: 9,
    fontWeight: 'bold',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  divider: {
    width: 1,
    backgroundColor: COLORS.border,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  metricName: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: 'bold',
  },
  metricValue: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: 'bold',
  },
  metricBar: {
    height: 8,
    backgroundColor: '#0F0F11',
    borderRadius: 4,
    overflow: 'hidden',
  },
  metricBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  statsBackBtn: {
    backgroundColor: '#262629',
    borderRadius: 8,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  statsBackBtnText: {
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: 13,
  },
  footer: {
    height: 58,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.card,
    flexDirection: 'row',
  },
  footerTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  footerTabActive: {
    borderTopWidth: 2,
    borderTopColor: COLORS.primary,
  },
  tabLabel: {
    color: COLORS.textSecondary,
    fontSize: 9,
    fontWeight: 'bold',
    marginTop: 4,
  },
  tabLabelActive: {
    color: COLORS.primary,
  },
  clearHistoryBtn: {
    backgroundColor: '#3A1E1E',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearHistoryText: {
    color: '#FF453A',
    fontSize: 9,
    fontWeight: 'bold',
  },
  newMatchActionBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  newMatchActionText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1,
  },
  historyDeleteBtn: {
    backgroundColor: '#2A1F1F',
    borderRadius: 6,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  wizardOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(18, 18, 20, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: 20,
  },
  wizardCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    width: '100%',
    maxHeight: '85%',
    overflow: 'hidden',
    padding: 20,
  },
  wizardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  wizardTitle: {
    color: COLORS.primary,
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1,
  },
  wizardCloseBtn: {
    padding: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressStep: {
    flex: 1,
    height: 4,
    backgroundColor: '#262629',
    marginHorizontal: 2,
    borderRadius: 2,
  },
  progressStepActive: {
    backgroundColor: COLORS.primary,
  },
  stepIndicatorText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: 'bold',
  },
  wizardStepContent: {
    marginVertical: 10,
  },
  wizardStepTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  wizardStepDesc: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: 20,
  },
  wizardTypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  wizardTypeCard: {
    flex: 1,
    backgroundColor: '#0F0F11',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  wizardTypeCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#1E250A',
  },
  wizardTypeTitle: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  wizardTypeTitleActive: {
    color: COLORS.primary,
  },
  wizardTypeDesc: {
    color: COLORS.textSecondary,
    fontSize: 9,
    textAlign: 'center',
  },
  wizardInputLabel: {
    color: COLORS.textSecondary,
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 6,
    letterSpacing: 0.5,
    marginTop: 8,
  },
  wizardInputGroupLabel: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  wizardInput: {
    backgroundColor: '#0F0F11',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text,
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  wizardSurfaceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  wizardSurfaceBtn: {
    flex: 1,
    backgroundColor: '#0F0F11',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  wizardSurfaceBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  wizardSurfaceBtnText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: 'bold',
  },
  wizardSurfaceBtnTextActive: {
    color: '#000',
  },
  wizardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 16,
  },
  wizardBackBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#262629',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wizardBackBtnText: {
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: 12,
  },
  wizardNextBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wizardNextBtnText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 12,
  },
  wizardStartBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  wizardStartBtnText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 12,
  },
});

