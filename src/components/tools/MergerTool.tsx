import React, { useState } from 'react';
import {
  Layers,
  Upload,
  ArrowUp,
  ArrowDown,
  Trash2,
  Download,
  Play,
  Pause,
  Clock,
  Music,
  Plus,
  Loader2,
} from 'lucide-react';
import { MergerTrack } from '../../types';
import {
  decodeAudioFile,
  mergeAudioBuffers,
  audioBufferToWav,
  getAudioContext,
} from '../../utils/audioProcessor';

export const MergerTool: React.FC = () => {
  const [tracks, setTracks] = useState<MergerTrack[]>([]);
  const [crossfade, setCrossfade] = useState(0.5);
  const [isMerging, setIsMerging] = useState(false);
  const [mergedBuffer, setMergedBuffer] = useState<AudioBuffer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sourceNode, setSourceNode] = useState<AudioBufferSourceNode | null>(null);

  const totalDuration = tracks.reduce((acc, t) => acc + t.duration, 0);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const buffer = await decodeAudioFile(file);
        const newTrack: MergerTrack = {
          id: Math.random().toString(36).substring(2, 9),
          file,
          name: file.name,
          duration: buffer.duration,
          buffer,
        };
        setTracks((prev) => [...prev, newTrack]);
      } catch (err) {
        console.error('Error loading audio file:', err);
      }
    }
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= tracks.length) return;
    const newTracks = [...tracks];
    const temp = newTracks[index];
    newTracks[index] = newTracks[targetIdx];
    newTracks[targetIdx] = temp;
    setTracks(newTracks);
  };

  const handleRemove = (id: string) => {
    setTracks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleMergeAndExport = async () => {
    if (tracks.length === 0) return;
    setIsMerging(true);
    try {
      const audioBuffers = tracks.map((t) => t.buffer);
      const combined = await mergeAudioBuffers(audioBuffers, crossfade);
      setMergedBuffer(combined);

      const blob = audioBufferToWav(combined, '16bit');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `submind_merged_${tracks.length}_tracks.wav`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error merging audio tracks:', err);
    } finally {
      setIsMerging(false);
    }
  };

  const handlePlayPreview = async () => {
    if (tracks.length === 0) return;
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

    let bufferToPlay = mergedBuffer;
    if (!bufferToPlay) {
      bufferToPlay = await mergeAudioBuffers(
        tracks.map((t) => t.buffer),
        crossfade
      );
      setMergedBuffer(bufferToPlay);
    }

    const source = ctx.createBufferSource();
    source.buffer = bufferToPlay;
    source.connect(ctx.destination);
    source.onended = () => setIsPlaying(false);
    source.start(0);

    setSourceNode(source);
    setIsPlaying(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/60 border border-blue-500/30 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-300">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Multi-Track Audio Merger</span>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-semibold">
                  Crossfade Transitions
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Join, sequence, and crossfade multiple voice clips and music stems seamlessly.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {tracks.length > 0 && (
              <button
                onClick={handlePlayPreview}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
              >
                {isPlaying ? <Pause className="w-4 h-4 text-blue-400" /> : <Play className="w-4 h-4 text-blue-400" />}
                <span>{isPlaying ? 'Pause Preview' : 'Preview Merge'}</span>
              </button>
            )}

            <button
              id="export-merge-btn"
              onClick={handleMergeAndExport}
              disabled={tracks.length === 0 || isMerging}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isMerging ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Merging Tracks...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Merge & Download ({tracks.length})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Upload Zone */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <label className="border-2 border-dashed border-slate-700 hover:border-blue-500/60 rounded-xl p-6 flex flex-col items-center justify-center gap-3 text-center cursor-pointer transition-colors bg-slate-950/40">
          <input
            type="file"
            multiple
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Plus className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Click or Drag to Add Audio Tracks</p>
            <p className="text-xs text-slate-400 mt-1">Supports MP3, WAV, M4A, OGG, FLAC</p>
          </div>
        </label>

        {/* Tracks List */}
        {tracks.length > 0 && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
              <span className="font-semibold text-slate-200">
                Audio Queue ({tracks.length} tracks)
              </span>
              <span>Total Duration: {totalDuration.toFixed(1)}s</span>
            </div>

            <div className="space-y-2">
              {tracks.map((track, idx) => (
                <div
                  key={track.id}
                  className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl p-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center text-xs font-bold font-mono">
                      {idx + 1}
                    </span>
                    <Music className="w-4 h-4 text-blue-400" />
                    <div>
                      <p className="text-xs font-semibold text-white line-clamp-1">{track.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {track.duration.toFixed(1)}s
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleMove(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white disabled:opacity-30"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMove(idx, 'down')}
                      disabled={idx === tracks.length - 1}
                      className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white disabled:opacity-30"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleRemove(track.id)}
                      className="p-1.5 rounded-lg bg-rose-950/40 text-rose-400 hover:bg-rose-900/60"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Crossfade Transition Setting */}
      {tracks.length > 1 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs font-bold text-white">Crossfade Transition Duration</label>
              <p className="text-[11px] text-slate-400">Overlapping blend between sequential tracks</p>
            </div>
            <span className="text-xs font-mono font-bold text-blue-400 bg-slate-950 px-2 py-1 rounded border border-slate-800">
              {crossfade.toFixed(2)}s
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="3"
            step="0.1"
            value={crossfade}
            onChange={(e) => setCrossfade(Number(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>
      )}
    </div>
  );
};
