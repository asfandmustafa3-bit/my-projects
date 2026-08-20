export type ToolTab =
  | 'home'
  | 'directory'
  | 'silence'
  | 'transcribe'
  | 'recorder'
  | 'noise'
  | 'trimmer'
  | 'speed'
  | 'merger'
  | 'compressor'
  | 'converter'
  | 'tts';

export interface AudioSegment {
  id: string;
  start: number; // in seconds
  end: number; // in seconds
  duration: number; // in seconds
  isSilence: boolean;
  enabled: boolean; // if true and isSilence, it gets removed/processed
  avgDb: number;
  peakDb: number;
}

export type ProcessingMode = 'cut' | 'shorten' | 'speed';

export interface DetectionSettings {
  thresholdDb: number; // default: -34 dB (range -60 to -10)
  minDurationMs: number; // default: 350 ms (range 100 to 2500)
  paddingMs: number; // default: 80 ms (range 0 to 300)
  mode: ProcessingMode; // 'cut' | 'shorten' | 'speed'
  shortenToMs: number; // default: 200 ms (range 50 to 800)
  speedMultiplier: number; // default: 3x (range 1.5 to 8)
  normalizeAudio: boolean; // normalize speech gain
}

export interface AudioStats {
  originalDuration: number;
  processedDuration: number;
  timeSaved: number;
  timeSavedPercent: number;
  silenceCount: number;
  speechCount: number;
  silenceTotalSeconds: number;
  averageSilenceDuration: number;
}

export interface AudioFileMeta {
  name: string;
  size: number;
  type: string;
  sampleRate: number;
  numberOfChannels: number;
  duration: number;
}

// AI Transcriber & Note Types
export interface TranscriptionResult {
  transcript: string;
  summary: string;
  keyPoints: string[];
  actionItems?: string[];
  fillerWords?: { word: string; count: number; suggestion?: string }[];
  sentiment?: string;
  estimatedWordsCount?: number;
}

// Noise Reduction Settings
export interface NoiseSettings {
  noiseGateThreshold: number; // in dB e.g. -45 dB
  highPassFilterHz: number; // e.g. 80 Hz (low rumble cutoff)
  lowPassFilterHz: number; // e.g. 12000 Hz (high hiss cutoff)
  vocalBoostDb: number; // vocal presence boost +0 to +6 dB
  hissReduction: boolean;
  rumbleFilter: boolean;
}

// Audio Trimmer Settings
export interface TrimmerSettings {
  trimStart: number; // in seconds
  trimEnd: number; // in seconds
  fadeInDuration: number; // in seconds
  fadeOutDuration: number; // in seconds
}

// Speed & Pitch Settings
export interface SpeedSettings {
  playbackRate: number; // 0.25 to 3.0
  pitchShiftSemitones: number; // -12 to +12
  preservePitch: boolean;
}

// Merger Track
export interface MergerTrack {
  id: string;
  file: File | Blob;
  name: string;
  duration: number;
  buffer: AudioBuffer;
}

// Compressor Settings
export interface CompressorSettings {
  threshold: number; // -40 to 0 dB
  knee: number; // 0 to 40 dB
  ratio: number; // 1 to 20
  attack: number; // 0 to 1 sec
  release: number; // 0 to 1 sec
  makeupGain: number; // 0 to 20 dB
}
