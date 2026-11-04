import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import Svg, { Rect, Line, Circle, Polyline } from 'react-native-svg';
import {
  Share2,
  Video,
  Download,
  Smartphone,
  Tv,
  Check,
  Sliders,
  Sparkles,
  Zap,
  Eye,
  X,
  Layers,
} from 'lucide-react-native';
import { THEME } from '../../theme/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export type ExportAspectRatio = '9:16' | '16:9';
export type ExportResolution = '1080p' | '4k' | '720p';

interface BroadcastExportModalProps {
  visible: boolean;
  playerOneName: string;
  playerTwoName: string;
  matchScore: string;
  serveSpeedKmh?: number;
  onClose: () => void;
  onExportComplete?: (aspectRatio: ExportAspectRatio, resolution: ExportResolution) => void;
}

export const BroadcastExportModal: React.FC<BroadcastExportModalProps> = ({
  visible,
  playerOneName,
  playerTwoName,
  matchScore,
  serveSpeedKmh = 196,
  onClose,
  onExportComplete,
}) => {
  const [aspectRatio, setAspectRatio] = useState<ExportAspectRatio>('9:16');
  const [resolution, setResolution] = useState<ExportResolution>('1080p');

  // Overlay Switches
  const [includeScorebug, setIncludeScorebug] = useState(true);
  const [includeSpeedRadar, setIncludeSpeedRadar] = useState(true);
  const [includeTrajectoryTracer, setIncludeTrajectoryTracer] = useState(true);
  const [includeChalkPip, setIncludeChalkPip] = useState(true);
  const [includeWatermark, setIncludeWatermark] = useState(true);

  // Render Export State
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const handleStartExport = () => {
    setIsExporting(true);
    setExportProgress(10);

    let current = 10;
    const interval = setInterval(() => {
      current += 30;
      if (current >= 100) {
        clearInterval(interval);
        setExportProgress(100);
        setTimeout(() => {
          setIsExporting(false);
          setExportProgress(0);
          if (onExportComplete) onExportComplete(aspectRatio, resolution);
          onClose();
        }, 300);
      } else {
        setExportProgress(current);
      }
    }, 200);
  };

  // Preview dimensions based on aspect ratio
  const previewWidth = aspectRatio === '9:16' ? 140 : 220;
  const previewHeight = aspectRatio === '9:16' ? 240 : 130;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Share2 size={16} color="#00F59B" />
              <Text style={styles.titleText}>SWINGVISION BROADCAST EXPORT</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={16} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Live Visual Preview Frame */}
            <View style={styles.previewContainer}>
              <View
                style={[
                  styles.previewFrame,
                  { width: previewWidth, height: previewHeight },
                ]}
              >
                {/* SVG Court & Trajectory Visualizer */}
                <Svg width={previewWidth} height={previewHeight}>
                  <Rect
                    x={0}
                    y={0}
                    width={previewWidth}
                    height={previewHeight}
                    fill="#0A2540"
                  />
                  {/* Court Lines */}
                  <Line
                    x1={previewWidth * 0.2}
                    y1={previewHeight * 0.2}
                    x2={previewWidth * 0.8}
                    y2={previewHeight * 0.2}
                    stroke="#FFFFFF"
                    strokeWidth={1.5}
                  />
                  <Line
                    x1={previewWidth * 0.2}
                    y1={previewHeight * 0.5}
                    x2={previewWidth * 0.8}
                    y2={previewHeight * 0.5}
                    stroke="#FFFFFF"
                    strokeWidth={2}
                  />
                  <Line
                    x1={previewWidth * 0.2}
                    y1={previewHeight * 0.8}
                    x2={previewWidth * 0.8}
                    y2={previewHeight * 0.8}
                    stroke="#FFFFFF"
                    strokeWidth={1.5}
                  />

                  {/* 3D Trajectory Ribbon Tracer */}
                  {includeTrajectoryTracer && (
                    <Polyline
                      points={`${previewWidth * 0.3},${previewHeight * 0.8} ${previewWidth * 0.5},${previewHeight * 0.45} ${previewWidth * 0.7},${previewHeight * 0.22}`}
                      fill="none"
                      stroke="#CCFF00"
                      strokeWidth={2.5}
                    />
                  )}

                  {/* Impact Dot */}
                  <Circle
                    cx={previewWidth * 0.7}
                    cy={previewHeight * 0.22}
                    r={4}
                    fill="#00F59B"
                    stroke="#FFFFFF"
                    strokeWidth={1.5}
                  />
                </Svg>

                {/* Overlaid TV Scorebug */}
                {includeScorebug && (
                  <View style={styles.previewScorebug}>
                    <Text style={styles.previewScorebugText} numberOfLines={1}>
                      {playerOneName.split(' ')[0]} v {playerTwoName.split(' ')[0]} • {matchScore}
                    </Text>
                  </View>
                )}

                {/* Overlaid Speed Radar Tag */}
                {includeSpeedRadar && (
                  <View style={styles.previewRadarPill}>
                    <Zap size={8} color="#CCFF00" />
                    <Text style={styles.previewRadarText}>{serveSpeedKmh} KM/H</Text>
                  </View>
                )}

                {/* Overlaid Chalk Zoom PIP Inset */}
                {includeChalkPip && (
                  <View style={styles.previewChalkPip}>
                    <Text style={styles.previewPipText}>CHALK: +14mm IN</Text>
                  </View>
                )}

                {/* Watermark Banner */}
                {includeWatermark && (
                  <View style={styles.previewWatermark}>
                    <Text style={styles.previewWatermarkText}>SWINGVISION AI</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Aspect Ratio Selector */}
            <Text style={styles.sectionHeading}>ASPECT RATIO FORMAT</Text>
            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={[
                  styles.optionCard,
                  aspectRatio === '9:16' && styles.optionCardActive,
                ]}
                onPress={() => setAspectRatio('9:16')}
              >
                <Smartphone
                  size={16}
                  color={aspectRatio === '9:16' ? '#070A11' : '#94A3B8'}
                />
                <Text
                  style={[
                    styles.optionCardText,
                    aspectRatio === '9:16' && styles.optionCardTextActive,
                  ]}
                >
                  9:16 Vertical
                </Text>
                <Text
                  style={[
                    styles.optionCardSub,
                    aspectRatio === '9:16' && styles.optionCardSubActive,
                  ]}
                >
                  TikTok / Reels / Shorts
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionCard,
                  aspectRatio === '16:9' && styles.optionCardActive,
                ]}
                onPress={() => setAspectRatio('16:9')}
              >
                <Tv
                  size={16}
                  color={aspectRatio === '16:9' ? '#070A11' : '#94A3B8'}
                />
                <Text
                  style={[
                    styles.optionCardText,
                    aspectRatio === '16:9' && styles.optionCardTextActive,
                  ]}
                >
                  16:9 Widescreen
                </Text>
                <Text
                  style={[
                    styles.optionCardSub,
                    aspectRatio === '16:9' && styles.optionCardSubActive,
                  ]}
                >
                  YouTube & TV Match Replay
                </Text>
              </TouchableOpacity>
            </View>

            {/* Resolution Selector */}
            <Text style={styles.sectionHeading}>RENDER RESOLUTION</Text>
            <View style={styles.resolutionRow}>
              {(['1080p', '4k', '720p'] as const).map(res => {
                const isSelected = resolution === res;
                return (
                  <TouchableOpacity
                    key={res}
                    style={[
                      styles.resPill,
                      isSelected && styles.resPillActive,
                    ]}
                    onPress={() => setResolution(res)}
                  >
                    <Text
                      style={[
                        styles.resPillText,
                        isSelected && styles.resPillTextActive,
                      ]}
                    >
                      {res === '4k' ? '4K Ultra HD (60fps)' : res === '1080p' ? '1080p Full HD' : '720p Fast Share'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Overlays Customization Toggles */}
            <Text style={styles.sectionHeading}>TV BROADCAST OVERLAYS</Text>
            <View style={styles.togglesCard}>
              <TouchableOpacity
                style={styles.toggleRow}
                onPress={() => setIncludeScorebug(prev => !prev)}
              >
                <View style={styles.toggleLabelRow}>
                  <Sliders size={13} color="#94A3B8" />
                  <Text style={styles.toggleLabel}>Broadcast TV Scorebug</Text>
                </View>
                <View
                  style={[
                    styles.checkbox,
                    includeScorebug && styles.checkboxActive,
                  ]}
                >
                  {includeScorebug && <Check size={12} color="#070A11" />}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.toggleRow}
                onPress={() => setIncludeSpeedRadar(prev => !prev)}
              >
                <View style={styles.toggleLabelRow}>
                  <Zap size={13} color="#CCFF00" />
                  <Text style={styles.toggleLabel}>Dynamic Speed Radar Badge</Text>
                </View>
                <View
                  style={[
                    styles.checkbox,
                    includeSpeedRadar && styles.checkboxActive,
                  ]}
                >
                  {includeSpeedRadar && <Check size={12} color="#070A11" />}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.toggleRow}
                onPress={() => setIncludeTrajectoryTracer(prev => !prev)}
              >
                <View style={styles.toggleLabelRow}>
                  <Sparkles size={13} color="#00F59B" />
                  <Text style={styles.toggleLabel}>3D Trajectory Ribbon Tracer</Text>
                </View>
                <View
                  style={[
                    styles.checkbox,
                    includeTrajectoryTracer && styles.checkboxActive,
                  ]}
                >
                  {includeTrajectoryTracer && <Check size={12} color="#070A11" />}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.toggleRow}
                onPress={() => setIncludeChalkPip(prev => !prev)}
              >
                <View style={styles.toggleLabelRow}>
                  <Eye size={13} color="#00E5FF" />
                  <Text style={styles.toggleLabel}>Chalk Zoom Inset Window (PIP)</Text>
                </View>
                <View
                  style={[
                    styles.checkbox,
                    includeChalkPip && styles.checkboxActive,
                  ]}
                >
                  {includeChalkPip && <Check size={12} color="#070A11" />}
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Export Action CTA */}
          <View style={styles.footer}>
            {isExporting ? (
              <View style={styles.exportProgressBox}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressText}>RENDERING 60 FPS CLIP...</Text>
                  <Text style={styles.progressPct}>{exportProgress}%</Text>
                </View>
                <View style={styles.progressBarTrack}>
                  <View style={[styles.progressBarFill, { width: `${exportProgress}%` }]} />
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.exportActionBtn}
                onPress={handleStartExport}
              >
                <Download size={16} color="#070A11" />
                <Text style={styles.exportActionText}>
                  RENDER & EXPORT BROADCAST VIDEO
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#070A11',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    padding: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#00F59B',
    letterSpacing: 0.8,
  },
  closeBtn: {
    padding: 6,
  },
  previewContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: '#020617',
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  previewFrame: {
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    borderColor: '#334155',
  },
  previewScorebug: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(7, 10, 17, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  previewScorebugText: {
    fontSize: 7,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  previewRadarPill: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(204, 255, 0, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#CCFF00',
  },
  previewRadarText: {
    fontSize: 7,
    fontWeight: '900',
    color: '#CCFF00',
  },
  previewChalkPip: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0, 229, 255, 0.2)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#00E5FF',
  },
  previewPipText: {
    fontSize: 7,
    fontWeight: '800',
    color: '#00E5FF',
  },
  previewWatermark: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    opacity: 0.6,
  },
  previewWatermarkText: {
    fontSize: 6,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  sectionHeading: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginTop: 10,
    marginBottom: 8,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  optionCard: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
    alignItems: 'center',
  },
  optionCardActive: {
    backgroundColor: '#CCFF00',
    borderColor: '#CCFF00',
  },
  optionCardText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E2E8F0',
    marginTop: 6,
  },
  optionCardTextActive: {
    color: '#070A11',
  },
  optionCardSub: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },
  optionCardSubActive: {
    color: '#1E293B',
    fontWeight: '600',
  },
  resolutionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  resPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  resPillActive: {
    borderColor: '#00F59B',
    backgroundColor: 'rgba(0, 245, 155, 0.15)',
  },
  resPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },
  resPillTextActive: {
    color: '#00F59B',
  },
  togglesCard: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  toggleLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: '#00F59B',
  },
  footer: {
    marginTop: 8,
    paddingBottom: 10,
  },
  exportActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#00F59B',
    paddingVertical: 14,
    borderRadius: 12,
  },
  exportActionText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#070A11',
    letterSpacing: 0.5,
  },
  exportProgressBox: {
    backgroundColor: '#0F172A',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#00F59B',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00F59B',
    letterSpacing: 0.5,
  },
  progressPct: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1E293B',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#00F59B',
  },
});
