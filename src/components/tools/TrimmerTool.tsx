import React, { useState, useEffect, useRef } from 'react';
import {
  Sliders,
  Scissors,
  Play,
  Pause,
  Download,
  RotateCcw,
  Volume2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { TrimmerSettings, AudioFileMeta } from '../../types';
import {
  applyAudioTrim,
  audioBufferToWav,
  getAudioContext,
} from '../../utils/audioProcessor';

interface TrimmerToolProps {
  audioBuffer: AudioBuffer | null;
  fileMeta: AudioFileMeta | null;
}

export const TrimmerTool: React.FC<TrimmerToolProps> = ({
  audioBuffer,
  fileMeta,
}) => {
  const duration = audioBuffer?.duration || 10;

  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(duration);
  const [fadeIn, setFadeIn] = useState(0.05);
  const [fadeOut, setFadeOut] = useState(0.05);

  const [isPlaying, setIsPlaying] = useState(false);
  const [sourceNode, setSourceNode] = useState<AudioBufferSourceNode | null>(null);
  const [isRendering, setIsRendering] = useState(false);

  // Update trimEnd when a new audioBuffer is loaded
  useEffect(() => {
    if (audioBuffer) {
      setTrimStart(0);
      setTrimEnd(audioBuffer.duration);
    }
  }, [audioBuffer]);

  const selectedDuration = Math.max(0, trimEnd - trimStart);

  const handlePlaySelection = () => {
    if (!audioBuffer) return;
    const ctx = getAudioContext();

    if (isPlaying) {
      if (sourceNode) {
        try {
          sourceNode.stop();
        } catch (_) {}
      }
      setIsPlaying(false);
      return;
    }

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);

    source.onended = () => setIsPlaying(false);
    source.start(0, trimStart, selectedDuration);

    setSourceNode(source);
    setIsPlaying(true);
  };

  const handleDownloadTrimmed = async () => {
    if (!audioBuffer) return;
    setIsRendering(true);
    try {
      const trimmedBuffer = await applyAudioTrim(audioBuffer, {
        trimStart,
        trimEnd,
        fadeInDuration: fadeIn,
        fadeOutDuration: fadeOut,
      });

      const blob = audioBufferToWav(trimmedBuffer, '16bit');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileMeta?.name ? fileMeta.name.replace(/\.[^/.]+$/, '') : 'audio'}_trimmed.wav`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error trimming audio:', err);
    } finally {
      setIsRendering(false);
    }
  };

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = (sec % 60).toFixed(2);
    return `${mins}:${Number(s) < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-orange-950/60 border border-amber-500/30 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600/30 border border-amber-500/40 flex items-center justify-center text-amber-300">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Precision Audio Trimmer & Cutter</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-semibold">
                  Millisecond Accurate
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Cut, trim, crop, and add smooth fade-ins and fade-outs to any audio track.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePlaySelection}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
            >
              {isPlaying ? <Pause className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4 text-amber-400" />}
              <span>{isPlaying ? 'Stop Preview' : 'Play Selection'}</span>
            </button>
            <button
              id="export-trim-btn"
              onClick={handleDownloadTrimmed}
              disabled={isRendering || selectedDuration <= 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-600/30 disabled:opacity-50 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export Trimmed WAV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Visual Scrubber Timeline */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="text-slate-400">
              Selected Duration:{' '}
              <span className="text-amber-400 font-mono font-bold">
                {selectedDuration.toFixed(2)}s
              </span>
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">
              Original: <span className="text-slate-200 font-mono">{duration.toFixed(2)}s</span>
            </span>
          </div>

          <button
            onClick={() => {
              setTrimStart(0);
              setTrimEnd(duration);
            }}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Selection</span>
          </button>
        </div>

        {/* Visual Timeline Track */}
        <div className="relative w-full h-16 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex items-center px-2">
          {/* Active Crop Range Overlay */}
          <div
            className="absolute top-0 bottom-0 bg-amber-500/20 border-x-2 border-amber-400"
            style={{
              left: `${(trimStart / Math.max(1, duration)) * 100}%`,
              width: `${(selectedDuration / Math.max(1, duration)) * 100}%`,
            }}
          />

          {/* Time markers */}
          <div className="w-full flex justify-between text-[10px] text-slate-600 font-mono select-none pointer-events-none">
            <span>0:00</span>
            <span>{formatTime(duration * 0.25)}</span>
            <span>{formatTime(duration * 0.5)}</span>
            <span>{formatTime(duration * 0.75)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Start / End Range Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Start Slider & Input */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-amber-300">Start Time</span>
              <span className="font-mono text-slate-300 font-semibold">{formatTime(trimStart)}</span>
            </div>
            <input
              type="range"
              min="0"
              max={trimEnd - 0.1}
              step="0.05"
              value={trimStart}
              onChange={(e) => setTrimStart(Math.min(Number(e.target.value), trimEnd - 0.1))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          {/* End Slider & Input */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-amber-300">End Time</span>
              <span className="font-mono text-slate-300 font-semibold">{formatTime(trimEnd)}</span>
            </div>
            <input
              type="range"
              min={trimStart + 0.1}
              max={duration}
              step="0.05"
              value={trimEnd}
              onChange={(e) => setTrimEnd(Math.max(Number(e.target.value), trimStart + 0.1))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Fade In / Out Smooth Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Fade In */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs font-bold text-white">Fade-In Duration</label>
              <p className="text-[11px] text-slate-400">Smooth volume rise at audio start</p>
            </div>
            <span className="text-xs font-mono font-bold text-amber-400 bg-slate-950 px-2 py-1 rounded border border-slate-800">
              {fadeIn.toFixed(2)}s
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="3"
            step="0.05"
            value={fadeIn}
            onChange={(e) => setFadeIn(Number(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
        </div>

        {/* Fade Out */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs font-bold text-white">Fade-Out Duration</label>
              <p className="text-[11px] text-slate-400">Gentle fade to silence at audio end</p>
            </div>
            <span className="text-xs font-mono font-bold text-amber-400 bg-slate-950 px-2 py-1 rounded border border-slate-800">
              {fadeOut.toFixed(2)}s
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="3"
            step="0.05"
            value={fadeOut}
            onChange={(e) => setFadeOut(Number(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
        </div>
      </div>
    </div>
  );
};
