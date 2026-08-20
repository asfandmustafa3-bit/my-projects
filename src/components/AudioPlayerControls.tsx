import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Sparkles,
  Layers,
  Repeat,
} from 'lucide-react';
import { formatTime } from '../utils/audioProcessor';

interface AudioPlayerControlsProps {
  isPlaying: boolean;
  currentTime: number;
  totalDuration: number;
  processedDuration: number;
  previewMode: 'original' | 'processed';
  playbackRate: number;
  volume: number;
  isMuted: boolean;
  isLooping: boolean;
  onTogglePlay: () => void;
  onSeekRelative: (seconds: number) => void;
  onChangePreviewMode: (mode: 'original' | 'processed') => void;
  onChangePlaybackRate: (rate: number) => void;
  onChangeVolume: (vol: number) => void;
  onToggleMute: () => void;
  onToggleLoop: () => void;
}

export const AudioPlayerControls: React.FC<AudioPlayerControlsProps> = ({
  isPlaying,
  currentTime,
  totalDuration,
  processedDuration,
  previewMode,
  playbackRate,
  volume,
  isMuted,
  isLooping,
  onTogglePlay,
  onSeekRelative,
  onChangePreviewMode,
  onChangePlaybackRate,
  onChangeVolume,
  onToggleMute,
  onToggleLoop,
}) => {
  const speeds = [0.75, 1.0, 1.25, 1.5, 2.0];

  return (
    <div
      id="audio-player-controls-container"
      className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4"
    >
      {/* Left: Original vs Processed Mode Switcher */}
      <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 w-full md:w-auto justify-center">
        <button
          id="preview-original-btn"
          onClick={() => onChangePreviewMode('original')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
            previewMode === 'original'
              ? 'bg-slate-800 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Original Audio</span>
          <span className="font-mono text-[11px] opacity-70">({formatTime(totalDuration)})</span>
        </button>

        <button
          id="preview-processed-btn"
          onClick={() => onChangePreviewMode('processed')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
            previewMode === 'processed'
              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 ring-1 ring-indigo-400/40'
              : 'text-indigo-300 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
          <span>Cleaned Audio</span>
          <span className="font-mono text-[11px] bg-indigo-950/80 px-1.5 py-0.5 rounded text-indigo-200">
            {formatTime(processedDuration)}
          </span>
        </button>
      </div>

      {/* Center: Play, Pause & Seek Controls */}
      <div className="flex items-center gap-3">
        <button
          id="seek-backward-btn"
          onClick={() => onSeekRelative(-5)}
          className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          title="Rewind 5 seconds"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          id="play-pause-btn"
          onClick={onTogglePlay}
          className="w-13 h-13 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 active:scale-95 transition-all"
          title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
        >
          {isPlaying ? (
            <Pause className="w-6 h-6 fill-current" />
          ) : (
            <Play className="w-6 h-6 fill-current ml-0.5" />
          )}
        </button>

        <button
          id="seek-forward-btn"
          onClick={() => onSeekRelative(5)}
          className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          title="Forward 5 seconds"
        >
          <RotateCw className="w-4 h-4" />
        </button>

        {/* Timecode readout */}
        <div className="flex flex-col ml-2 min-w-[120px]">
          <span className="font-mono text-base font-bold text-white tracking-tight">
            {formatTime(currentTime, true)}
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            / {formatTime(previewMode === 'processed' ? processedDuration : totalDuration, true)}
          </span>
        </div>
      </div>

      {/* Right: Speed, Volume & Loop */}
      <div className="flex items-center gap-3 w-full md:w-auto justify-center md:justify-end">
        {/* Speed Selector */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
          {speeds.map((s) => (
            <button
              key={s}
              id={`speed-btn-${s}`}
              onClick={() => onChangePlaybackRate(s)}
              className={`px-2 py-1 text-xs font-mono rounded-lg transition-colors ${
                playbackRate === s
                  ? 'bg-slate-800 text-indigo-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Loop Toggle */}
        <button
          id="loop-toggle-btn"
          onClick={onToggleLoop}
          className={`p-2 rounded-xl border transition-colors ${
            isLooping
              ? 'bg-indigo-950/70 border-indigo-500/50 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title={isLooping ? 'Looping enabled' : 'Loop playback'}
        >
          <Repeat className="w-4 h-4" />
        </button>

        {/* Volume & Mute */}
        <div className="flex items-center gap-2">
          <button
            id="mute-btn"
            onClick={onToggleMute}
            className="text-slate-400 hover:text-white transition-colors"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-red-400" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <input
            id="volume-slider"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={(e) => onChangeVolume(parseFloat(e.target.value))}
            className="w-18 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>
      </div>
    </div>
  );
};
