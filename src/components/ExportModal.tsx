import React, { useState } from 'react';
import {
  X,
  Download,
  FileAudio,
  FileSpreadsheet,
  Film,
  CheckCircle,
  FileCode,
  Sparkles,
  Sliders,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AudioSegment, DetectionSettings, AudioStats } from '../types';
import {
  renderProcessedAudio,
  audioBufferToWav,
  exportEdlOrCsv,
  formatTime,
} from '../utils/audioProcessor';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  audioBuffer: AudioBuffer | null;
  segments: AudioSegment[];
  settings: DetectionSettings;
  stats: AudioStats;
  fileName: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  audioBuffer,
  segments,
  settings,
  stats,
  fileName,
}) => {
  const [format, setFormat] = useState<'wav' | 'edl' | 'csv' | 'audacity' | 'json'>('wav');
  const [bitDepth, setBitDepth] = useState<16 | 24 | 32>(16);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  if (!isOpen || !audioBuffer) return null;

  const baseFileName = fileName.replace(/\.[^/.]+$/, '') || 'cleaned-audio';

  const handleDownload = async () => {
    setIsExporting(true);
    setProgress(20);

    try {
      if (format === 'wav') {
        setProgress(45);
        // Render processed audio buffer
        const processedBuffer = await renderProcessedAudio(audioBuffer, segments, settings);
        setProgress(75);

        // Convert to WAV Blob
        const wavBlob = audioBufferToWav(processedBuffer, { bitDepth });
        setProgress(95);

        // Trigger Download
        const url = URL.createObjectURL(wavBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${baseFileName}-silence-removed.wav`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // Text/Data exports (EDL, CSV, Audacity, JSON)
        setProgress(60);
        const fileContent = exportEdlOrCsv(segments, format, fileName);
        setProgress(90);

        let mimeType = 'text/plain';
        let extension = 'txt';
        if (format === 'csv') {
          mimeType = 'text/csv';
          extension = 'csv';
        } else if (format === 'json') {
          mimeType = 'application/json';
          extension = 'json';
        } else if (format === 'edl') {
          mimeType = 'text/plain';
          extension = 'edl';
        }

        const blob = new Blob([fileContent], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${baseFileName}-silence-cuts.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      setProgress(100);

      // Trigger Celebration Confetti!
      confetti({
        particleCount: 75,
        spread: 60,
        origin: { y: 0.6 },
      });

      setTimeout(() => {
        setIsExporting(false);
        onClose();
      }, 700);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export audio.');
      setIsExporting(false);
    }
  };

  return (
    <div
      id="export-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        id="export-modal-content"
        className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Export Audio / Data</h3>
              <p className="text-xs text-slate-400">Save cleaned audio or timeline markers</p>
            </div>
          </div>
          <button
            id="close-export-modal-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Recap */}
        <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800/80 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-400 block">Cleaned Duration</span>
            <span className="font-mono font-bold text-emerald-400 text-sm">
              {formatTime(stats.processedDuration)}
            </span>
          </div>
          <div className="text-center">
            <span className="text-slate-400 block">Dead Air Trimmed</span>
            <span className="font-mono font-bold text-white text-sm">
              {stats.timeSaved.toFixed(1)}s (-{stats.timeSavedPercent.toFixed(0)}%)
            </span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block">Cuts Applied</span>
            <span className="font-mono font-bold text-red-400 text-sm">
              {stats.silenceCount} silences
            </span>
          </div>
        </div>

        {/* Format Selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Choose Output Format
          </label>
          <div className="grid grid-cols-2 gap-2">
            {/* Cleaned WAV Audio */}
            <button
              id="export-format-wav"
              type="button"
              onClick={() => setFormat('wav')}
              className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                format === 'wav'
                  ? 'bg-indigo-950/70 border-indigo-500 text-white ring-1 ring-indigo-500/50'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileAudio className="w-4 h-4 text-indigo-400 mt-0.5" />
              <div>
                <span className="text-xs font-bold block">WAV Audio (Lossless)</span>
                <span className="text-[10px] text-slate-400">High-fidelity master file</span>
              </div>
            </button>

            {/* EDL for Premiere / DaVinci */}
            <button
              id="export-format-edl"
              type="button"
              onClick={() => setFormat('edl')}
              className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                format === 'edl'
                  ? 'bg-indigo-950/70 border-indigo-500 text-white ring-1 ring-indigo-500/50'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Film className="w-4 h-4 text-amber-400 mt-0.5" />
              <div>
                <span className="text-xs font-bold block">EDL Timeline Track</span>
                <span className="text-[10px] text-slate-400">Premiere & DaVinci Resolve</span>
              </div>
            </button>

            {/* CSV Data */}
            <button
              id="export-format-csv"
              type="button"
              onClick={() => setFormat('csv')}
              className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                format === 'csv'
                  ? 'bg-indigo-950/70 border-indigo-500 text-white ring-1 ring-indigo-500/50'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400 mt-0.5" />
              <div>
                <span className="text-xs font-bold block">CSV Timestamps</span>
                <span className="text-[10px] text-slate-400">Excel / Sheets timestamps</span>
              </div>
            </button>

            {/* Audacity / JSON */}
            <button
              id="export-format-audacity"
              type="button"
              onClick={() => setFormat('audacity')}
              className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                format === 'audacity'
                  ? 'bg-indigo-950/70 border-indigo-500 text-white ring-1 ring-indigo-500/50'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCode className="w-4 h-4 text-violet-400 mt-0.5" />
              <div>
                <span className="text-xs font-bold block">Audacity Labels (.txt)</span>
                <span className="text-[10px] text-slate-400">Import directly as track</span>
              </div>
            </button>
          </div>
        </div>

        {/* WAV Settings (Bit depth) */}
        {format === 'wav' && (
          <div className="space-y-2 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
            <span className="text-xs font-semibold text-slate-300 block">Bit Depth Resolution:</span>
            <div className="flex items-center gap-2">
              {[16, 24, 32].map((bits) => (
                <button
                  key={bits}
                  type="button"
                  onClick={() => setBitDepth(bits as 16 | 24 | 32)}
                  className={`flex-1 py-1.5 text-xs font-mono rounded-lg border font-medium transition-colors ${
                    bitDepth === bits
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {bits}-bit {bits === 16 ? '(Standard)' : bits === 24 ? '(Studio)' : '(Float)'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Progress bar if exporting */}
        {isExporting && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-indigo-300 font-medium">
              <span>Rendering and compiling audio...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-200"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            id="start-export-btn"
            type="button"
            onClick={handleDownload}
            disabled={isExporting}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 active:scale-95 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download Cleaned File</span>
          </button>
        </div>
      </div>
    </div>
  );
};
