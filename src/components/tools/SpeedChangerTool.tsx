import React, { useState } from 'react';
import {
  Gauge,
  Play,
  Pause,
  Download,
  RotateCcw,
  Sparkles,
  Zap,
  Music,
} from 'lucide-react';
import { SpeedSettings, AudioFileMeta } from '../../types';
import {
  applySpeedPitch,
  audioBufferToWav,
  getAudioContext,
} from '../../utils/audioProcessor';

interface SpeedChangerToolProps {
  audioBuffer: AudioBuffer | null;
  fileMeta: AudioFileMeta | null;
}

const SPEED_PRESETS = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

export const SpeedChangerTool: React.FC<SpeedChangerToolProps> = ({
  audioBuffer,
  fileMeta,
}) => {
  const [playbackRate, setPlaybackRate] = useState(1.25);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sourceNode, setSourceNode] = useState<AudioBufferSourceNode | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const duration = audioBuffer?.duration || 0;
  const newEstimatedDuration = duration > 0 ? duration / playbackRate : 0;

  const handlePlayToggle = () => {
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
    source.playbackRate.value = playbackRate;
    source.connect(ctx.destination);
    source.onended = () => setIsPlaying(false);
    source.start(0);

    setSourceNode(source);
    setIsPlaying(true);
  };

  const handleDownload = async () => {
    if (!audioBuffer) return;
    setIsExporting(true);
    try {
      const resampledBuffer = await applySpeedPitch(audioBuffer, { playbackRate });
      const blob = audioBufferToWav(resampledBuffer, '16bit');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileMeta?.name ? fileMeta.name.replace(/\.[^/.]+$/, '') : 'audio'}_${playbackRate}x.wav`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error rendering speed audio:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-cyan-950/60 via-slate-900 to-blue-950/60 border border-cyan-500/30 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-600/30 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Audio Speed & Tempo Changer</span>
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full font-semibold">
                  0.25x – 3.0x
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Speed up long meetings and podcasts or slow down audio for transcription.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePlayToggle}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
            >
              {isPlaying ? <Pause className="w-4 h-4 text-cyan-400" /> : <Play className="w-4 h-4 text-cyan-400" />}
              <span>{isPlaying ? 'Pause' : 'Test Playback'}</span>
            </button>

            <button
              id="export-speed-btn"
              onClick={handleDownload}
              disabled={isExporting || !audioBuffer}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/30 disabled:opacity-50 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export at {playbackRate}x</span>
            </button>
          </div>
        </div>
      </div>

      {/* Speed Slider Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Playback Speed Multiplier</h3>
            <p className="text-xs text-slate-400">
              New Duration: <span className="text-cyan-400 font-mono font-bold">{newEstimatedDuration.toFixed(1)}s</span>{' '}
              <span className="text-slate-500">(Original: {duration.toFixed(1)}s)</span>
            </p>
          </div>

          <span className="text-2xl font-mono font-black text-cyan-400 bg-slate-950 px-4 py-1.5 rounded-xl border border-slate-800 shadow-inner">
            {playbackRate.toFixed(2)}x
          </span>
        </div>

        {/* Range Slider */}
        <input
          type="range"
          min="0.25"
          max="3.0"
          step="0.05"
          value={playbackRate}
          onChange={(e) => {
            const val = Number(e.target.value);
            setPlaybackRate(val);
            if (sourceNode && isPlaying) {
              sourceNode.playbackRate.value = val;
            }
          }}
          className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
        />

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <span className="text-xs text-slate-500 mr-2">Presets:</span>
          {SPEED_PRESETS.map((preset) => (
            <button
              key={preset}
              onClick={() => {
                setPlaybackRate(preset);
                if (sourceNode && isPlaying) {
                  sourceNode.playbackRate.value = preset;
                }
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                playbackRate === preset
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/25'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {preset}x
            </button>
          ))}
          <button
            onClick={() => {
              setPlaybackRate(1.0);
              if (sourceNode && isPlaying) {
                sourceNode.playbackRate.value = 1.0;
              }
            }}
            className="ml-auto text-xs text-slate-400 hover:text-white flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset to 1.0x</span>
          </button>
        </div>
      </div>
    </div>
  );
};
