import React from 'react';
import { DetectionSettings, ProcessingMode } from '../types';
import { Sliders, Sparkles, FastForward, Scissors, Clock, ShieldAlert, Volume2 } from 'lucide-react';

interface SilenceSettingsPanelProps {
  settings: DetectionSettings;
  onChangeSettings: (newSettings: DetectionSettings) => void;
  onResetDefaults: () => void;
}

export const SilenceSettingsPanel: React.FC<SilenceSettingsPanelProps> = ({
  settings,
  onChangeSettings,
  onResetDefaults,
}) => {
  const updateSetting = <K extends keyof DetectionSettings>(key: K, value: DetectionSettings[K]) => {
    onChangeSettings({
      ...settings,
      [key]: value,
    });
  };

  return (
    <div
      id="silence-detection-settings-panel"
      className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">Detection & Cut Settings</h3>
            <p className="text-xs text-slate-400">Fine-tune how silence and dead air are identified</p>
          </div>
        </div>
        <button
          id="reset-settings-btn"
          onClick={onResetDefaults}
          className="text-xs text-slate-400 hover:text-indigo-300 transition-colors font-medium hover:underline"
        >
          Reset Defaults
        </button>
      </div>

      {/* 1. Action Mode Selector */}
      <div className="space-y-2.5">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
          <span>Silence Handling Mode</span>
          <span className="text-indigo-400 font-mono text-[11px] lowercase capitalize">{settings.mode} mode</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* Cut completely */}
          <button
            id="mode-cut-btn"
            type="button"
            onClick={() => updateSetting('mode', 'cut')}
            className={`p-3 rounded-xl border text-left transition-all ${
              settings.mode === 'cut'
                ? 'bg-indigo-950/60 border-indigo-500/60 text-white shadow-lg ring-1 ring-indigo-500/40'
                : 'bg-slate-950/50 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Scissors className="w-4 h-4 text-red-400" />
              <span className="text-xs font-bold">Remove Silence</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Eliminate all dead air completely for fast snappy pacing.
            </p>
          </button>

          {/* Shorten to fixed length */}
          <button
            id="mode-shorten-btn"
            type="button"
            onClick={() => updateSetting('mode', 'shorten')}
            className={`p-3 rounded-xl border text-left transition-all ${
              settings.mode === 'shorten'
                ? 'bg-indigo-950/60 border-indigo-500/60 text-white shadow-lg ring-1 ring-indigo-500/40'
                : 'bg-slate-950/50 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold">Shorten Pauses</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Caps long silences to a maximum {settings.shortenToMs}ms for natural flow.
            </p>
          </button>

          {/* Speed up */}
          <button
            id="mode-speed-btn"
            type="button"
            onClick={() => updateSetting('mode', 'speed')}
            className={`p-3 rounded-xl border text-left transition-all ${
              settings.mode === 'speed'
                ? 'bg-indigo-950/60 border-indigo-500/60 text-white shadow-lg ring-1 ring-indigo-500/40'
                : 'bg-slate-950/50 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <FastForward className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold">Speed Up Silence</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Plays silent sections at {settings.speedMultiplier}x speed without deleting.
            </p>
          </button>
        </div>

        {/* Dynamic sub-slider depending on mode */}
        {settings.mode === 'shorten' && (
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 mt-2 flex items-center justify-between gap-4">
            <span className="text-xs text-slate-300 font-medium">Cap Pauses To:</span>
            <div className="flex items-center gap-3 flex-1 max-w-xs">
              <input
                id="shorten-duration-slider"
                type="range"
                min="50"
                max="600"
                step="25"
                value={settings.shortenToMs}
                onChange={(e) => updateSetting('shortenToMs', parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <span className="font-mono text-xs font-bold text-amber-400 min-w-[50px]">
                {settings.shortenToMs} ms
              </span>
            </div>
          </div>
        )}

        {settings.mode === 'speed' && (
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 mt-2 flex items-center justify-between gap-4">
            <span className="text-xs text-slate-300 font-medium">Silence Speed Multiplier:</span>
            <div className="flex items-center gap-3 flex-1 max-w-xs">
              <input
                id="speed-multiplier-slider"
                type="range"
                min="1.5"
                max="6"
                step="0.5"
                value={settings.speedMultiplier}
                onChange={(e) => updateSetting('speedMultiplier', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <span className="font-mono text-xs font-bold text-emerald-400 min-w-[40px]">
                {settings.speedMultiplier}x
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Silence Threshold (dB) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="threshold-slider" className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <span>Silence Threshold</span>
            <span className="text-[10px] text-slate-500">(Energy cutoff)</span>
          </label>
          <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-500/30">
            {settings.thresholdDb} dB
          </span>
        </div>
        <input
          id="threshold-slider"
          type="range"
          min="-60"
          max="-12"
          step="1"
          value={settings.thresholdDb}
          onChange={(e) => updateSetting('thresholdDb', parseInt(e.target.value))}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
        />
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <button
            type="button"
            onClick={() => updateSetting('thresholdDb', -45)}
            className="hover:text-indigo-300 text-left"
          >
            -45 dB (Clean Studio)
          </button>
          <button
            type="button"
            onClick={() => updateSetting('thresholdDb', -34)}
            className="hover:text-indigo-300 text-center font-medium text-slate-300"
          >
            -34 dB (Standard)
          </button>
          <button
            type="button"
            onClick={() => updateSetting('thresholdDb', -24)}
            className="hover:text-indigo-300 text-right"
          >
            -24 dB (Noisy Room)
          </button>
        </div>
      </div>

      {/* 3. Minimum Silence Duration (ms) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="duration-slider" className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <span>Minimum Pause Duration</span>
            <span className="text-[10px] text-slate-500">(Ignore shorter pauses)</span>
          </label>
          <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-500/30">
            {settings.minDurationMs} ms
          </span>
        </div>
        <input
          id="duration-slider"
          type="range"
          min="100"
          max="2000"
          step="25"
          value={settings.minDurationMs}
          onChange={(e) => updateSetting('minDurationMs', parseInt(e.target.value))}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
        />
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <button
            type="button"
            onClick={() => updateSetting('minDurationMs', 200)}
            className="hover:text-indigo-300 text-left"
          >
            200 ms (Fast cuts)
          </button>
          <button
            type="button"
            onClick={() => updateSetting('minDurationMs', 350)}
            className="hover:text-indigo-300 text-center font-medium text-slate-300"
          >
            350 ms (Natural)
          </button>
          <button
            type="button"
            onClick={() => updateSetting('minDurationMs', 750)}
            className="hover:text-indigo-300 text-right"
          >
            750 ms (Long pauses only)
          </button>
        </div>
      </div>

      {/* 4. Margin Padding (ms) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="padding-slider" className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <span>Buffer / Padding Margin</span>
            <span className="text-[10px] text-emerald-400">Prevents clipping words</span>
          </label>
          <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
            ±{settings.paddingMs} ms
          </span>
        </div>
        <input
          id="padding-slider"
          type="range"
          min="0"
          max="250"
          step="10"
          value={settings.paddingMs}
          onChange={(e) => updateSetting('paddingMs', parseInt(e.target.value))}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
        />
        <p className="text-[11px] text-slate-500">
          Leaves a subtle buffer before and after speech so consonants and breaths aren't abruptly cut off.
        </p>
      </div>

      {/* 5. Audio Normalization */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-indigo-400" />
          <div>
            <span className="text-xs font-bold text-white block">Volume Level Normalization</span>
            <span className="text-[11px] text-slate-400">Optimize speech peak to -0.5 dB cleanly</span>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            id="normalize-audio-toggle"
            type="checkbox"
            checked={settings.normalizeAudio}
            onChange={(e) => updateSetting('normalizeAudio', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-10 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
        </label>
      </div>
    </div>
  );
};
