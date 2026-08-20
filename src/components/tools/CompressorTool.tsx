import React, { useState, useEffect } from 'react';
import {
  Wand2,
  Sliders,
  Play,
  Pause,
  Download,
  RotateCcw,
  Sparkles,
  Activity,
} from 'lucide-react';
import { CompressorSettings, AudioFileMeta } from '../../types';
import {
  applyAudioCompressor,
  audioBufferToWav,
  getAudioContext,
} from '../../utils/audioProcessor';

interface CompressorToolProps {
  audioBuffer: AudioBuffer | null;
  fileMeta: AudioFileMeta | null;
}

export const CompressorTool: React.FC<CompressorToolProps> = ({
  audioBuffer,
  fileMeta,
}) => {
  const [settings, setSettings] = useState<CompressorSettings>({
    threshold: -24,
    knee: 12,
    ratio: 4,
    attack: 0.003,
    release: 0.25,
    makeupGain: 4,
  });

  const [compressedBuffer, setCompressedBuffer] = useState<AudioBuffer | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sourceNode, setSourceNode] = useState<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    if (!audioBuffer) return;
    let isMounted = true;
    setIsProcessing(true);

    applyAudioCompressor(audioBuffer, settings)
      .then((buf) => {
        if (isMounted) {
          setCompressedBuffer(buf);
          setIsProcessing(false);
        }
      })
      .catch((err) => {
        console.error('Compressor error:', err);
        if (isMounted) setIsProcessing(false);
      });

    return () => {
      isMounted = false;
    };
  }, [audioBuffer, settings]);

  const handlePlayToggle = () => {
    if (!compressedBuffer) return;
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
    source.buffer = compressedBuffer;
    source.connect(ctx.destination);
    source.onended = () => setIsPlaying(false);
    source.start(0);

    setSourceNode(source);
    setIsPlaying(true);
  };

  const handleDownload = () => {
    if (!compressedBuffer) return;
    const blob = audioBufferToWav(compressedBuffer, '16bit');
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileMeta?.name ? fileMeta.name.replace(/\.[^/.]+$/, '') : 'audio'}_compressed.wav`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-rose-950/60 via-slate-900 to-pink-950/60 border border-rose-500/30 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600/30 border border-rose-500/40 flex items-center justify-center text-rose-300">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Dynamic Range Compressor & Limiter</span>
                <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full font-semibold">
                  Studio Leveling
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Smooth out quiet whisperings and loud peaks for consistent podcast loudness.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePlayToggle}
              disabled={!compressedBuffer}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
            >
              {isPlaying ? <Pause className="w-4 h-4 text-rose-400" /> : <Play className="w-4 h-4 text-rose-400" />}
              <span>{isPlaying ? 'Pause' : 'Play Compressed'}</span>
            </button>

            <button
              id="export-compressor-btn"
              onClick={handleDownload}
              disabled={!compressedBuffer || isProcessing}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 disabled:opacity-50 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export Compressed Audio</span>
            </button>
          </div>
        </div>
      </div>

      {/* Compressor Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Threshold */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-white">Threshold</label>
            <span className="text-xs font-mono font-bold text-rose-400 bg-slate-950 px-2 py-1 rounded border border-slate-800">
              {settings.threshold} dB
            </span>
          </div>
          <input
            type="range"
            min="-50"
            max="0"
            step="1"
            value={settings.threshold}
            onChange={(e) => setSettings({ ...settings, threshold: Number(e.target.value) })}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
          />
          <p className="text-[10px] text-slate-500">Volume level where compression kicks in</p>
        </div>

        {/* Ratio */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-white">Compression Ratio</label>
            <span className="text-xs font-mono font-bold text-rose-400 bg-slate-950 px-2 py-1 rounded border border-slate-800">
              {settings.ratio}:1
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="20"
            step="0.5"
            value={settings.ratio}
            onChange={(e) => setSettings({ ...settings, ratio: Number(e.target.value) })}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
          />
          <p className="text-[10px] text-slate-500">Amount of attenuation applied over threshold</p>
        </div>

        {/* Makeup Gain */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-white">Makeup Gain</label>
            <span className="text-xs font-mono font-bold text-rose-400 bg-slate-950 px-2 py-1 rounded border border-slate-800">
              +{settings.makeupGain} dB
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="18"
            step="0.5"
            value={settings.makeupGain}
            onChange={(e) => setSettings({ ...settings, makeupGain: Number(e.target.value) })}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
          />
          <p className="text-[10px] text-slate-500">Boosts overall loudness after peak control</p>
        </div>

        {/* Release Time */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-white">Release Time</label>
            <span className="text-xs font-mono font-bold text-rose-400 bg-slate-950 px-2 py-1 rounded border border-slate-800">
              {(settings.release * 1000).toFixed(0)} ms
            </span>
          </div>
          <input
            type="range"
            min="0.05"
            max="1"
            step="0.05"
            value={settings.release}
            onChange={(e) => setSettings({ ...settings, release: Number(e.target.value) })}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
          />
          <p className="text-[10px] text-slate-500">Recovery speed of gain reduction</p>
        </div>
      </div>
    </div>
  );
};
