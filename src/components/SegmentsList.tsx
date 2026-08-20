import React, { useState } from 'react';
import { AudioSegment } from '../types';
import { formatTime } from '../utils/audioProcessor';
import {
  Scissors,
  Volume2,
  Play,
  CheckSquare,
  Square,
  Filter,
  Check,
  X,
  Sparkles,
} from 'lucide-react';

interface SegmentsListProps {
  segments: AudioSegment[];
  currentTime: number;
  onSeek: (time: number) => void;
  onToggleSegment: (segmentId: string) => void;
  onBulkToggle: (enableAll: boolean) => void;
}

export const SegmentsList: React.FC<SegmentsListProps> = ({
  segments,
  currentTime,
  onSeek,
  onToggleSegment,
  onBulkToggle,
}) => {
  const [filter, setFilter] = useState<'all' | 'silence' | 'speech'>('silence');

  const silenceSegments = segments.filter((s) => s.isSilence);
  const speechSegments = segments.filter((s) => !s.isSilence);

  const displayedSegments = segments.filter((s) => {
    if (filter === 'silence') return s.isSilence;
    if (filter === 'speech') return !s.isSilence;
    return true;
  });

  return (
    <div
      id="segments-list-container"
      className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col h-full"
    >
      {/* Header & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3.5 mb-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>Detected Segments</span>
            <span className="bg-slate-800 text-slate-300 text-xs px-2 py-0.5 rounded-full font-mono font-medium">
              {segments.length}
            </span>
          </h3>
          <p className="text-xs text-slate-400">Click any row to jump or toggle individual cuts</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            id="filter-silence-btn"
            onClick={() => setFilter('silence')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              filter === 'silence'
                ? 'bg-red-950/80 text-red-300 border border-red-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Silences ({silenceSegments.length})
          </button>
          <button
            id="filter-speech-btn"
            onClick={() => setFilter('speech')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              filter === 'speech'
                ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Speech ({speechSegments.length})
          </button>
          <button
            id="filter-all-btn"
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({segments.length})
          </button>
        </div>
      </div>

      {/* Bulk Action Controls */}
      {silenceSegments.length > 0 && filter !== 'speech' && (
        <div className="flex items-center justify-between bg-slate-950/60 px-3 py-2 rounded-xl border border-slate-800/80 mb-3 text-xs">
          <span className="text-slate-400 font-medium">Bulk Selection:</span>
          <div className="flex items-center gap-2">
            <button
              id="cut-all-btn"
              onClick={() => onBulkToggle(true)}
              className="text-red-400 hover:text-red-300 font-semibold px-2 py-0.5 hover:bg-red-950/40 rounded transition-colors"
            >
              Cut All
            </button>
            <span className="text-slate-600">|</span>
            <button
              id="keep-all-btn"
              onClick={() => onBulkToggle(false)}
              className="text-slate-400 hover:text-slate-200 font-medium px-2 py-0.5 hover:bg-slate-800 rounded transition-colors"
            >
              Keep All
            </button>
          </div>
        </div>
      )}

      {/* Segments Scrollable List */}
      <div className="flex-1 overflow-y-auto max-h-[340px] space-y-1.5 pr-1">
        {displayedSegments.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            No segments found matching the selected filter.
          </div>
        ) : (
          displayedSegments.map((seg, index) => {
            const isActive = currentTime >= seg.start && currentTime <= seg.end;

            return (
              <div
                key={seg.id}
                id={`segment-row-${seg.id}`}
                onClick={() => onSeek(seg.start)}
                className={`group flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                  isActive
                    ? 'border-indigo-500 bg-indigo-950/40 ring-1 ring-indigo-500/30'
                    : seg.isSilence
                    ? seg.enabled
                      ? 'border-red-900/40 bg-red-950/15 hover:bg-red-950/30'
                      : 'border-slate-800/80 bg-slate-950/40 hover:bg-slate-800/40'
                    : 'border-slate-800/80 bg-slate-950/40 hover:bg-slate-800/40'
                }`}
              >
                {/* Left: Icon & Time Range */}
                <div className="flex items-center gap-2.5">
                  <div
                    className={`p-1.5 rounded-lg ${
                      seg.isSilence
                        ? seg.enabled
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-slate-800 text-slate-400'
                        : 'bg-indigo-500/20 text-indigo-400'
                    }`}
                  >
                    {seg.isSilence ? (
                      <Scissors className="w-3.5 h-3.5" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-200">
                        {formatTime(seg.start, true)} → {formatTime(seg.end, true)}
                      </span>
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping"></span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span>Duration: <strong className="text-slate-300 font-mono">{seg.duration.toFixed(2)}s</strong></span>
                      <span>•</span>
                      <span>Level: <strong className="text-slate-300 font-mono">{seg.avgDb} dB</strong></span>
                    </div>
                  </div>
                </div>

                {/* Right: Action Button */}
                <div className="flex items-center gap-2">
                  {seg.isSilence ? (
                    <button
                      id={`toggle-seg-${seg.id}`}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSegment(seg.id);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        seg.enabled
                          ? 'bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
                      }`}
                    >
                      {seg.enabled ? (
                        <>
                          <Scissors className="w-3 h-3 text-red-400" />
                          <span>Cut</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Kept</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <span className="text-[11px] font-medium text-indigo-400 bg-indigo-950/60 border border-indigo-500/20 px-2 py-0.5 rounded">
                      Speech
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
