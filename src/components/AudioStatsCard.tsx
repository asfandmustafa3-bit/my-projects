import React from 'react';
import { AudioStats, AudioFileMeta } from '../types';
import { formatTime } from '../utils/audioProcessor';
import { Clock, Scissors, Zap, Award, Sparkles, Download, ArrowUpRight } from 'lucide-react';

interface AudioStatsCardProps {
  stats: AudioStats;
  fileMeta: AudioFileMeta | null;
  onOpenExport: () => void;
}

export const AudioStatsCard: React.FC<AudioStatsCardProps> = ({
  stats,
  fileMeta,
  onOpenExport,
}) => {
  return (
    <div
      id="audio-stats-banner"
      className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-2xl p-5 shadow-xl"
    >
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
        {/* Left: Highlight Metric */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex flex-col items-center justify-center shadow-lg shadow-emerald-500/20 font-bold shrink-0">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-white tracking-tight">
                {stats.timeSaved.toFixed(1)}s Saved
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold px-2 py-0.5 rounded-full">
                -{stats.timeSavedPercent.toFixed(1)}%
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Reduced from <span className="font-mono text-slate-300">{formatTime(stats.originalDuration)}</span> to{' '}
              <span className="font-mono font-bold text-indigo-300">{formatTime(stats.processedDuration)}</span>
            </p>
          </div>
        </div>

        {/* Center: Breakdown Cards */}
        <div className="grid grid-cols-3 gap-3 w-full lg:w-auto">
          {/* Silences Detected */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl px-3.5 py-2.5 text-center">
            <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400 font-medium mb-0.5">
              <Scissors className="w-3 h-3 text-red-400" /> Cuts
            </div>
            <div className="text-base font-bold text-white font-mono">{stats.silenceCount}</div>
          </div>

          {/* Speech Blocks */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl px-3.5 py-2.5 text-center">
            <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400 font-medium mb-0.5">
              <Sparkles className="w-3 h-3 text-indigo-400" /> Speech
            </div>
            <div className="text-base font-bold text-white font-mono">{stats.speechCount}</div>
          </div>

          {/* Avg Pause */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl px-3.5 py-2.5 text-center">
            <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400 font-medium mb-0.5">
              <Clock className="w-3 h-3 text-amber-400" /> Avg Pause
            </div>
            <div className="text-base font-bold text-white font-mono">
              {stats.averageSilenceDuration.toFixed(1)}s
            </div>
          </div>
        </div>

        {/* Right: Quick Export Call-to-action */}
        <button
          id="export-cta-btn"
          onClick={onOpenExport}
          className="w-full lg:w-auto flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 active:scale-95 transition-all shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Export Cleaned Audio</span>
        </button>
      </div>

      {/* Visual Timeline Comparison Bar */}
      <div className="mt-4 pt-4 border-t border-slate-800/60">
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5 font-mono">
          <span>Duration Reduction Comparison</span>
          <span className="text-emerald-400 font-bold">
            {stats.processedDuration.toFixed(1)}s / {stats.originalDuration.toFixed(1)}s
          </span>
        </div>
        <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800 flex">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-l-full transition-all duration-300"
            style={{ width: `${Math.max(5, (stats.processedDuration / Math.max(1, stats.originalDuration)) * 100)}%` }}
            title="Cleaned Audio Duration"
          ></div>
          <div
            className="h-full bg-red-500/50 rounded-r-full transition-all duration-300 relative"
            style={{ width: `${Math.max(0, (stats.timeSaved / Math.max(1, stats.originalDuration)) * 100)}%` }}
            title="Dead Air Removed"
          ></div>
        </div>
      </div>
    </div>
  );
};
