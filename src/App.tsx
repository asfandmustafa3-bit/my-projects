import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  AudioSegment,
  DetectionSettings,
  AudioStats,
  AudioFileMeta,
  ToolTab,
} from './types';
import {
  getAudioContext,
  detectSilence,
  calculateStats,
  renderProcessedAudio,
  decodeAudioFile,
  generateSampleAudio,
} from './utils/audioProcessor';
import { Header } from './components/Header';
import { ToolsNavigation } from './components/ToolsNavigation';
import { AudioUploader } from './components/AudioUploader';
import { WaveformTimeline } from './components/WaveformTimeline';
import { AudioPlayerControls } from './components/AudioPlayerControls';
import { SilenceSettingsPanel } from './components/SilenceSettingsPanel';
import { SegmentsList } from './components/SegmentsList';
import { AudioStatsCard } from './components/AudioStatsCard';
import { ExportModal } from './components/ExportModal';

// Home & Directory Hub
import { HomePage } from './components/HomePage';
import { FreeToolsDirectory } from './components/tools/FreeToolsDirectory';
import { VoiceRecorderTool } from './components/tools/VoiceRecorderTool';
import { TranscribeTool } from './components/tools/TranscribeTool';
import { NoiseRemoverTool } from './components/tools/NoiseRemoverTool';
import { TrimmerTool } from './components/tools/TrimmerTool';
import { SpeedChangerTool } from './components/tools/SpeedChangerTool';
import { MergerTool } from './components/tools/MergerTool';
import { CompressorTool } from './components/tools/CompressorTool';
import { ConverterTool } from './components/tools/ConverterTool';
import { TextToSpeechTool } from './components/tools/TextToSpeechTool';

import { Loader2, Music, Scissors, Sparkles, Upload, FileAudio } from 'lucide-react';

const DEFAULT_SETTINGS: DetectionSettings = {
  thresholdDb: -34,
  minDurationMs: 350,
  paddingMs: 80,
  mode: 'cut',
  shortenToMs: 200,
  speedMultiplier: 3.0,
  normalizeAudio: true,
};

export default function App() {
  // Current active tool in Submind Suite (defaults to Home Landing)
  const [activeTab, setActiveTab] = useState<ToolTab>('home');

  // Audio state
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [rawAudioBlob, setRawAudioBlob] = useState<Blob | null>(null);
  const [processedBuffer, setProcessedBuffer] = useState<AudioBuffer | null>(null);
  const [fileMeta, setFileMeta] = useState<AudioFileMeta | null>(null);

  // Settings & Segments
  const [settings, setSettings] = useState<DetectionSettings>(DEFAULT_SETTINGS);
  const [segments, setSegments] = useState<AudioSegment[]>([]);
  const [stats, setStats] = useState<AudioStats>({
    originalDuration: 0,
    processedDuration: 0,
    timeSaved: 0,
    timeSavedPercent: 0,
    silenceCount: 0,
    speechCount: 0,
    silenceTotalSeconds: 0,
    averageSilenceDuration: 0,
  });

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [previewMode, setPreviewMode] = useState<'original' | 'processed'>('processed');
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [volume, setVolume] = useState(0.9);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);

  // UI Modals & Loading
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Loading...');

  // Audio Node Refs
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const startOffsetRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);

  // 1. Detect silence whenever audioBuffer or detection settings change
  useEffect(() => {
    if (!audioBuffer) {
      setSegments([]);
      setProcessedBuffer(null);
      return;
    }

    const detected = detectSilence(audioBuffer, settings);
    setSegments(detected);
  }, [audioBuffer, settings.thresholdDb, settings.minDurationMs, settings.paddingMs]);

  // 2. Recompute stats & re-render processed audio buffer whenever segments or processing mode change
  useEffect(() => {
    if (!audioBuffer) return;

    const newStats = calculateStats(audioBuffer.duration, segments, settings);
    setStats(newStats);

    // Pre-render processed audio buffer for instant high-fidelity playback
    let isCancelled = false;
    renderProcessedAudio(audioBuffer, segments, settings)
      .then((buf) => {
        if (!isCancelled) {
          setProcessedBuffer(buf);
        }
      })
      .catch((err) => console.error('Failed to render processed audio buffer:', err));

    return () => {
      isCancelled = true;
    };
  }, [
    audioBuffer,
    segments,
    settings.mode,
    settings.shortenToMs,
    settings.speedMultiplier,
    settings.normalizeAudio,
  ]);

  // Handle Gain / Volume change
  useEffect(() => {
    if (gainNodeRef.current) {
      const ctx = getAudioContext();
      gainNodeRef.current.gain.setValueAtTime(isMuted ? 0 : volume, ctx.currentTime);
    }
  }, [volume, isMuted]);

  // Handle Playback rate change
  useEffect(() => {
    if (sourceNodeRef.current) {
      const ctx = getAudioContext();
      sourceNodeRef.current.playbackRate.setValueAtTime(playbackRate, ctx.currentTime);
    }
  }, [playbackRate]);

  // Stop playback when component unmounts or audio buffer changes
  const stopAudio = useCallback(() => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      } catch (_) {}
      sourceNodeRef.current = null;
    }
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  // Update current playback time tracker
  const updatePlayhead = useCallback(() => {
    if (!isPlaying) return;
    const ctx = getAudioContext();
    const elapsed = (ctx.currentTime - startTimeRef.current) * playbackRate;
    const current = startOffsetRef.current + elapsed;

    const activeBuf = previewMode === 'processed' && processedBuffer ? processedBuffer : audioBuffer;
    const maxDur = activeBuf ? activeBuf.duration : 0;

    if (current >= maxDur) {
      if (isLooping) {
        seekTo(0);
      } else {
        stopAudio();
        setCurrentTime(maxDur);
      }
    } else {
      setCurrentTime(current);
      animFrameRef.current = requestAnimationFrame(updatePlayhead);
    }
  }, [isPlaying, playbackRate, previewMode, processedBuffer, audioBuffer, isLooping, stopAudio]);

  useEffect(() => {
    if (isPlaying) {
      animFrameRef.current = requestAnimationFrame(updatePlayhead);
    }
    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying, updatePlayhead]);

  // Play audio from specific time offset
  const playAudio = useCallback(
    (offset = currentTime) => {
      const ctx = getAudioContext();
      stopAudio();

      const activeBuf = previewMode === 'processed' && processedBuffer ? processedBuffer : audioBuffer;
      if (!activeBuf) return;

      const boundedOffset = Math.max(0, Math.min(offset, activeBuf.duration - 0.05));

      const source = ctx.createBufferSource();
      const gain = ctx.createGain();

      source.buffer = activeBuf;
      source.playbackRate.setValueAtTime(playbackRate, ctx.currentTime);
      gain.gain.setValueAtTime(isMuted ? 0 : volume, ctx.currentTime);

      source.connect(gain);
      gain.connect(ctx.destination);

      sourceNodeRef.current = source;
      gainNodeRef.current = gain;

      startTimeRef.current = ctx.currentTime;
      startOffsetRef.current = boundedOffset;
      setCurrentTime(boundedOffset);

      source.onended = () => {
        // Handled in updatePlayhead
      };

      source.start(0, boundedOffset);
      setIsPlaying(true);
    },
    [previewMode, processedBuffer, audioBuffer, playbackRate, isMuted, volume, currentTime, stopAudio]
  );

  const handleTogglePlay = () => {
    if (isPlaying) {
      stopAudio();
    } else {
      playAudio(currentTime);
    }
  };

  const seekTo = (time: number) => {
    const activeBuf = previewMode === 'processed' && processedBuffer ? processedBuffer : audioBuffer;
    const maxDur = activeBuf ? activeBuf.duration : 0;
    const boundedTime = Math.max(0, Math.min(time, maxDur));

    if (isPlaying) {
      playAudio(boundedTime);
    } else {
      setCurrentTime(boundedTime);
    }
  };

  const seekRelative = (deltaSeconds: number) => {
    seekTo(currentTime + deltaSeconds);
  };

  // Toggle individual segment processing state
  const handleToggleSegment = (id: string) => {
    setSegments((prev) =>
      prev.map((seg) => (seg.id === id ? { ...seg, enabled: !seg.enabled } : seg))
    );
  };

  // Bulk toggle segments
  const handleBulkToggle = (action: 'enable-all' | 'disable-all' | 'enable-long') => {
    setSegments((prev) =>
      prev.map((seg) => {
        if (!seg.isSilence) return seg;
        if (action === 'enable-all') return { ...seg, enabled: true };
        if (action === 'disable-all') return { ...seg, enabled: false };
        if (action === 'enable-long') return { ...seg, enabled: seg.duration >= 0.5 };
        return seg;
      })
    );
  };

  // Audio file loader handler
  const handleAudioLoaded = (buffer: AudioBuffer, file: File | Blob) => {
    stopAudio();
    setAudioBuffer(buffer);
    setRawAudioBlob(file);
    setCurrentTime(0);

    const isFile = file instanceof File;
    setFileMeta({
      name: isFile ? file.name : 'Sample Voice Audio',
      size: file.size,
      type: file.type || 'audio/wav',
      sampleRate: buffer.sampleRate,
      numberOfChannels: buffer.numberOfChannels,
      duration: buffer.duration,
    });
  };

  const handleResetFile = () => {
    stopAudio();
    setAudioBuffer(null);
    setRawAudioBlob(null);
    setProcessedBuffer(null);
    setSegments([]);
    setFileMeta(null);
    setCurrentTime(0);
  };

  const handleQuickLoadSample = (presetId = 'podcast-interview') => {
    setIsLoading(true);
    setLoadingMessage('Synthesizing speech sample...');
    setTimeout(() => {
      const { buffer, fileName } = generateSampleAudio(presetId);
      const fakeBlob = new Blob([new ArrayBuffer(1024)], { type: 'audio/wav' });
      handleAudioLoaded(buffer, fakeBlob);
      if (fileMeta) {
        setFileMeta((prev) => (prev ? { ...prev, name: fileName } : null));
      }
      setIsLoading(false);
    }, 150);
  };

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in text input or textarea
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'SELECT'
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        seekRelative(e.shiftKey ? -10 : -3);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        seekRelative(e.shiftKey ? 10 : 3);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* App Header */}
      <Header
        hasAudio={Boolean(audioBuffer)}
        onResetFile={handleResetFile}
        fileName={fileMeta?.name}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      {/* Submind Suite Tool Navigation Bar */}
      <ToolsNavigation
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        hasAudio={Boolean(audioBuffer)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <p className="text-sm font-semibold text-slate-200">{loadingMessage}</p>
            </div>
          </div>
        )}

        {/* Global File Banner if Audio is loaded */}
        {audioBuffer && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <FileAudio className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white line-clamp-1">{fileMeta?.name || 'Active Audio Track'}</p>
                <p className="text-[11px] text-slate-400 font-mono">
                  {audioBuffer.duration.toFixed(1)}s • {audioBuffer.sampleRate} Hz •{' '}
                  {audioBuffer.numberOfChannels === 2 ? 'Stereo' : 'Mono'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleResetFile}
                className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                Upload Different File
              </button>
            </div>
          </div>
        )}

        {/* Tab -1: Home Page (About Developer Asfand & Suite Value Offering) */}
        {activeTab === 'home' && (
          <HomePage
            onNavigate={setActiveTab}
            hasAudio={Boolean(audioBuffer)}
          />
        )}

        {/* Tab 0: Free Tools Directory Catalog */}
        {activeTab === 'directory' && (
          <FreeToolsDirectory
            onSelectTool={setActiveTab}
            hasAudio={Boolean(audioBuffer)}
          />
        )}

        {/* Tab 1: Silence Remover (Flagship Tool) */}
        {activeTab === 'silence' && (
          <>
            {!audioBuffer ? (
              <AudioUploader
                onAudioLoaded={handleAudioLoaded}
                onSelectSample={handleQuickLoadSample}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
                onSetLoadingMessage={setLoadingMessage}
              />
            ) : (
              <div className="space-y-6">
                {/* Real-time Stats & Time Saved Banner */}
                <AudioStatsCard
                  stats={stats}
                  fileMeta={fileMeta}
                  onOpenExport={() => setIsExportModalOpen(true)}
                />

                {/* Interactive Visual Waveform & Timeline */}
                <WaveformTimeline
                  audioBuffer={audioBuffer}
                  segments={segments}
                  settings={settings}
                  currentTime={currentTime}
                  isPlaying={isPlaying}
                  onSeek={seekTo}
                  onToggleSegment={handleToggleSegment}
                />

                {/* Player Controls */}
                <AudioPlayerControls
                  isPlaying={isPlaying}
                  currentTime={currentTime}
                  totalDuration={audioBuffer.duration}
                  processedDuration={stats.processedDuration}
                  previewMode={previewMode}
                  playbackRate={playbackRate}
                  volume={volume}
                  isMuted={isMuted}
                  isLooping={isLooping}
                  onTogglePlay={handleTogglePlay}
                  onSeekRelative={seekRelative}
                  onChangePreviewMode={setPreviewMode}
                  onChangePlaybackRate={setPlaybackRate}
                  onChangeVolume={setVolume}
                  onToggleMute={() => setIsMuted((prev) => !prev)}
                  onToggleLoop={() => setIsLooping((prev) => !prev)}
                />

                {/* Settings & Segments Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Detection Settings Panel */}
                  <div className="lg:col-span-6">
                    <SilenceSettingsPanel
                      settings={settings}
                      onChangeSettings={setSettings}
                      onResetDefaults={() => setSettings(DEFAULT_SETTINGS)}
                    />
                  </div>

                  {/* Segments Inspector List */}
                  <div className="lg:col-span-6">
                    <SegmentsList
                      segments={segments}
                      currentTime={currentTime}
                      onSeek={seekTo}
                      onToggleSegment={handleToggleSegment}
                      onBulkToggle={handleBulkToggle}
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Tab 2: AI Transcribe & Smart Notes */}
        {activeTab === 'transcribe' && (
          <div>
            {!audioBuffer ? (
              <div className="space-y-6">
                <AudioUploader
                  onAudioLoaded={handleAudioLoaded}
                  onSelectSample={handleQuickLoadSample}
                  isLoading={isLoading}
                  setIsLoading={setIsLoading}
                  onSetLoadingMessage={setLoadingMessage}
                />
              </div>
            ) : (
              <TranscribeTool
                audioBuffer={audioBuffer}
                audioBlob={rawAudioBlob}
                fileMeta={fileMeta}
              />
            )}
          </div>
        )}

        {/* Tab 2.5: Voice Recorder & Live Waveform */}
        {activeTab === 'recorder' && (
          <div>
            <VoiceRecorderTool
              onAudioRecorded={(buffer, blob, name) => {
                handleAudioLoaded(buffer, blob);
                if (fileMeta) {
                  setFileMeta((prev) => (prev ? { ...prev, name } : null));
                }
              }}
              onNavigateToTool={setActiveTab}
            />
          </div>
        )}

        {/* Tab 3: Noise Remover & Voice Enhancer */}
        {activeTab === 'noise' && (
          <div>
            {!audioBuffer ? (
              <AudioUploader
                onAudioLoaded={handleAudioLoaded}
                onSelectSample={handleQuickLoadSample}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
                onSetLoadingMessage={setLoadingMessage}
              />
            ) : (
              <NoiseRemoverTool audioBuffer={audioBuffer} fileMeta={fileMeta} />
            )}
          </div>
        )}

        {/* Tab 4: Audio Trimmer & Cutter */}
        {activeTab === 'trimmer' && (
          <div>
            {!audioBuffer ? (
              <AudioUploader
                onAudioLoaded={handleAudioLoaded}
                onSelectSample={handleQuickLoadSample}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
                onSetLoadingMessage={setLoadingMessage}
              />
            ) : (
              <TrimmerTool audioBuffer={audioBuffer} fileMeta={fileMeta} />
            )}
          </div>
        )}

        {/* Tab 5: Speed & Pitch Changer */}
        {activeTab === 'speed' && (
          <div>
            {!audioBuffer ? (
              <AudioUploader
                onAudioLoaded={handleAudioLoaded}
                onSelectSample={handleQuickLoadSample}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
                onSetLoadingMessage={setLoadingMessage}
              />
            ) : (
              <SpeedChangerTool audioBuffer={audioBuffer} fileMeta={fileMeta} />
            )}
          </div>
        )}

        {/* Tab 6: Audio Merger */}
        {activeTab === 'merger' && (
          <div>
            <MergerTool />
          </div>
        )}

        {/* Tab 7: Compressor & Limiter */}
        {activeTab === 'compressor' && (
          <div>
            {!audioBuffer ? (
              <AudioUploader
                onAudioLoaded={handleAudioLoaded}
                onSelectSample={handleQuickLoadSample}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
                onSetLoadingMessage={setLoadingMessage}
              />
            ) : (
              <CompressorTool audioBuffer={audioBuffer} fileMeta={fileMeta} />
            )}
          </div>
        )}

        {/* Tab 8: Format Converter */}
        {activeTab === 'converter' && (
          <div>
            {!audioBuffer ? (
              <AudioUploader
                onAudioLoaded={handleAudioLoaded}
                onSelectSample={handleQuickLoadSample}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
                onSetLoadingMessage={setLoadingMessage}
              />
            ) : (
              <ConverterTool audioBuffer={audioBuffer} fileMeta={fileMeta} />
            )}
          </div>
        )}

        {/* Tab 9: Text to Speech (TTS) */}
        {activeTab === 'tts' && (
          <div>
            <TextToSpeechTool
              onLoadAudioToStudio={(buf, name) => {
                handleAudioLoaded(buf, new Blob([new ArrayBuffer(1024)], { type: 'audio/wav' }));
                setActiveTab('silence');
              }}
            />
          </div>
        )}
      </main>

      {/* Export Modal for Silence Remover */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        audioBuffer={audioBuffer}
        segments={segments}
        settings={settings}
        stats={stats}
        fileName={fileMeta?.name || 'audio'}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-xs text-slate-500 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
            <span className="font-semibold text-slate-300">
              Submind Audio Studio • Built by <strong className="text-white font-bold">Asfand</strong>
            </span>
            <span className="hidden sm:inline text-slate-700">•</span>
            <a
              href="mailto:asfandmustafa3@gmail.com"
              className="text-indigo-400 hover:underline font-mono text-[11px]"
            >
              asfandmustafa3@gmail.com
            </a>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
            <span className="flex items-center gap-1 text-emerald-400 font-sans font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              100% In-Browser Privacy
            </span>
            <span>•</span>
            <span>Web Audio DSP</span>
            <span>•</span>
            <span>Gemini 3.7 Flash</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
