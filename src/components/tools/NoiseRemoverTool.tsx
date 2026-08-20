import React, { useState, useEffect } from 'react';
import {
  Volume2,
  Sliders,
  Sparkles,
  Play,
  Pause,
  Download,
  Check,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
} from 'lucide-react';
import { NoiseSettings, AudioFileMeta } from '../../types';
import {
  applyNoiseReduction,
  audioBufferToWav,
  getAudioContext,
} from '../../utils/audioProcessor';

interface NoiseRemoverToolProps {
  audioBuffer: AudioBuffer | null;
  fileMeta: AudioFileMeta | null;
}

export const NoiseRemoverTool: React.FC<NoiseRemoverToolProps> = ({
  audioBuffer,
  fileMeta,
}) => {
  const [settings, setSettings] = useState<NoiseSettings>({
    noiseGateThreshold: -42,
    highPassFilterHz: 80,
    lowPassFilterHz: 12000,
    vocalBoostDb: 3,
    hissReduction: true,
    rumbleFilter: true,
  });

  const [denoisedBuffer, setDenoisedBuffer] = useState<AudioBuffer | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playMode, setPlayMode] = useState<'denoised' | 'original'>('denoised');
  const [sourceNode, setSourceNode] = useState<AudioBufferSourceNode | null>(null);
  const [currentTime, setCurrentTime] = useState(0);

  // Auto-process when settings change or new audio loaded
  useEffect(() => {
    if (!audioBuffer) return;
    let isMounted = true;
    setIsProcessing(true);

    applyNoiseReduction(audioBuffer, settings)
      .then((buf) => {
        if (isMounted) {
          setDenoisedBuffer(buf);
          setIsProcessing(false);
        }
      })
      .catch((err) => {
        console.error('Noise reduction error:', err);
        if (isMounted) setIsProcessing(false);
      });

    return () => {
      isMounted = false;
    };
  }, [audioBuffer, settings]);

  const handlePlayToggle = (mode: 'denoised' | 'original') => {
    const ctx = getAudioContext();

    if (isPlaying) {
      if (sourceNode) {
        try {
          sourceNode.stop();
        } catch (_) {}
      }
      setIsPlaying(false);
      if (playMode === mode) return;
    }

    const targetBuffer = mode === 'denoised' ? denoisedBuffer : audioBuffer;
    if (!targetBuffer) return;

    const source = ctx.createBufferSource();
    source.buffer = targetBuffer;
    source.connect(ctx.destination);
    source.onended = () => setIsPlaying(false);
    source.start(0);

    setSourceNode(source);
    setIsPlaying(true);
    setPlayMode(mode);
  };

  const handleDownload = () => {
    if (!denoisedBuffer) return;
    const blob = audioBufferToWav(denoisedBuffer, '16bit');
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileMeta?.name ? fileMeta.name.replace(/\.[^/.]+$/, '') : 'audio'}_denoised.wav`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/60 border border-emerald-500/30 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-300">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>AI & DSP Noise Remover</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                  Zero Upload • Real-time
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Eliminate background hum, room hiss, fan noise, and enhance vocal presence.
              </p>
            </div>
          </div>

          <button
            id="download-denoised-btn"
            onClick={handleDownload}
            disabled={!denoisedBuffer || isProcessing}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 disabled:opacity-50 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Denoised Audio</span>
          </button>
        </div>
      </div>

      {/* A/B Comparison Player */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>A/B Audio Comparison</span>
          </span>
          {isProcessing && (
            <span className="text-emerald-400 text-xs animate-pulse">Rendering DSP filter...</span>
          )}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Cleaned Audio Button */}
          <div
            onClick={() => handlePlayToggle('denoised')}
            className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
              isPlaying && playMode === 'denoised'
                ? 'bg-emerald-950/50 border-emerald-500 shadow-lg shadow-emerald-500/20'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isPlaying && playMode === 'denoised'
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {isPlaying && playMode === 'denoised' ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5" />
                )}
              </div>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Denoised & Enhanced Audio</span>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-bold">
                    ACTIVE
                  </span>
                </h4>
                <p className="text-[11px] text-slate-400">Background noise stripped, clear speech</p>
              </div>
            </div>
          </div>

          {/* Original Audio Button */}
          <div
            onClick={() => handlePlayToggle('original')}
            className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
              isPlaying && playMode === 'original'
                ? 'bg-amber-950/50 border-amber-500 shadow-lg shadow-amber-500/20'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isPlaying && playMode === 'original'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {isPlaying && playMode === 'original' ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5" />
                )}
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Original Raw Audio</h4>
                <p className="text-[11px] text-slate-400">Unfiltered input source</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Noise Gate & Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Spectral Noise Gate */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs font-bold text-white flex items-center gap-2">
                <span>Noise Gate Threshold</span>
              </label>
              <p className="text-[11px] text-slate-400">Attenuates audio below this energy level</p>
            </div>
            <span className="text-sm font-mono font-bold text-emerald-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
              {settings.noiseGateThreshold} dB
            </span>
          </div>

          <input
            type="range"
            min="-60"
            max="-20"
            step="1"
            value={settings.noiseGateThreshold}
            onChange={(e) =>
              setSettings({ ...settings, noiseGateThreshold: Number(e.target.value) })
            }
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />

          <div className="flex justify-between text-[10px] text-slate-500">
            <span>-60 dB (Subtle)</span>
            <span>-42 dB (Default)</span>
            <span>-20 dB (Aggressive)</span>
          </div>
        </div>

        {/* Vocal Presence EQ */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs font-bold text-white flex items-center gap-2">
                <span>Vocal Presence Clarity Boost</span>
              </label>
              <p className="text-[11px] text-slate-400">Adds intelligibility to vocal frequencies (~3kHz)</p>
            </div>
            <span className="text-sm font-mono font-bold text-indigo-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
              +{settings.vocalBoostDb} dB
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="8"
            step="0.5"
            value={settings.vocalBoostDb}
            onChange={(e) =>
              setSettings({ ...settings, vocalBoostDb: Number(e.target.value) })
            }
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />

          <div className="flex justify-between text-[10px] text-slate-500">
            <span>0 dB (Off)</span>
            <span>+3 dB (Balanced)</span>
            <span>+8 dB (Crisp)</span>
          </div>
        </div>

        {/* Low-Rumble Filter Toggle */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-white">AC / Low-Rumble Filter (80 Hz)</h4>
            <p className="text-[11px] text-slate-400">Cuts sub-bass mic bumps and room vibrations</p>
          </div>
          <button
            onClick={() => setSettings({ ...settings, rumbleFilter: !settings.rumbleFilter })}
            className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
              settings.rumbleFilter ? 'bg-emerald-600' : 'bg-slate-800'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                settings.rumbleFilter ? 'right-1' : 'left-1'
              }`}
            />
          </button>
        </div>

        {/* High-Frequency Hiss Reducer Toggle */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-white">High Hiss Reducer (12 kHz)</h4>
            <p className="text-[11px] text-slate-400">Eliminates electronic hiss and sizzle</p>
          </div>
          <button
            onClick={() => setSettings({ ...settings, hissReduction: !settings.hissReduction })}
            className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
              settings.hissReduction ? 'bg-emerald-600' : 'bg-slate-800'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                settings.hissReduction ? 'right-1' : 'left-1'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
