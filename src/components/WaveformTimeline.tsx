import React, { useRef, useEffect, useState, useCallback } from 'react';
import { AudioSegment, DetectionSettings } from '../types';
import { formatTime } from '../utils/audioProcessor';
import { ZoomIn, ZoomOut, Maximize2, Scissors, Volume2, ShieldCheck, RefreshCw } from 'lucide-react';

interface WaveformTimelineProps {
  audioBuffer: AudioBuffer | null;
  segments: AudioSegment[];
  settings: DetectionSettings;
  currentTime: number;
  isPlaying: boolean;
  onSeek: (time: number) => void;
  onToggleSegment: (segmentId: string) => void;
}

export const WaveformTimeline: React.FC<WaveformTimelineProps> = ({
  audioBuffer,
  segments,
  settings,
  currentTime,
  isPlaying,
  onSeek,
  onToggleSegment,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const minimapCanvasRef = useRef<HTMLCanvasElement>(null);

  const [zoomLevel, setZoomLevel] = useState<number>(1); // 1x to 10x
  const [scrollLeft, setScrollLeft] = useState<number>(0);
  const [hoverInfo, setHoverInfo] = useState<{
    time: number;
    segment: AudioSegment | null;
    x: number;
    y: number;
  } | null>(null);

  // Precomputed waveform peaks cache
  const peaksRef = useRef<{ min: Float32Array; max: Float32Array } | null>(null);

  // Compute peaks when audioBuffer changes
  useEffect(() => {
    if (!audioBuffer) {
      peaksRef.current = null;
      return;
    }

    const length = audioBuffer.length;
    const sampleRate = audioBuffer.sampleRate;
    const numChannels = audioBuffer.numberOfChannels;
    // Precompute 4000 peak points for smooth rendering at any zoom
    const totalBuckets = 4000;
    const bucketSize = Math.max(1, Math.floor(length / totalBuckets));
    const minPeaks = new Float32Array(totalBuckets);
    const maxPeaks = new Float32Array(totalBuckets);

    const ch0 = audioBuffer.getChannelData(0);
    const ch1 = numChannels > 1 ? audioBuffer.getChannelData(1) : null;

    for (let b = 0; b < totalBuckets; b++) {
      const start = b * bucketSize;
      const end = Math.min(start + bucketSize, length);
      let minVal = 0;
      let maxVal = 0;

      for (let i = start; i < end; i++) {
        let val = ch0[i];
        if (ch1) val = (val + ch1[i]) * 0.5;
        if (val < minVal) minVal = val;
        if (val > maxVal) maxVal = val;
      }
      minPeaks[b] = minVal;
      maxPeaks[b] = maxVal;
    }

    peaksRef.current = { min: minPeaks, max: maxPeaks };
  }, [audioBuffer]);

  // Keep playhead in view when playing and zoomed in
  useEffect(() => {
    if (!isPlaying || zoomLevel <= 1 || !containerRef.current || !audioBuffer) return;

    const totalDuration = audioBuffer.duration;
    const containerWidth = containerRef.current.clientWidth;
    const fullTrackWidth = containerWidth * zoomLevel;
    const playheadPx = (currentTime / totalDuration) * fullTrackWidth;

    const currentScroll = containerRef.current.scrollLeft;
    const viewMargin = containerWidth * 0.2;

    if (playheadPx < currentScroll + viewMargin || playheadPx > currentScroll + containerWidth - viewMargin) {
      containerRef.current.scrollLeft = Math.max(0, playheadPx - containerWidth * 0.3);
    }
  }, [currentTime, isPlaying, zoomLevel, audioBuffer]);

  // Draw main Waveform Canvas
  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !audioBuffer || !peaksRef.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const totalDuration = audioBuffer.duration;
    const midY = height / 2;
    const waveHeight = height * 0.76;

    // 1. Draw segment background highlights (Silence vs Speech)
    segments.forEach((seg) => {
      const segStartPx = (seg.start / totalDuration) * width;
      const segEndPx = (seg.end / totalDuration) * width;
      const segWidth = Math.max(1.5, segEndPx - segStartPx);

      if (seg.isSilence) {
        if (seg.enabled) {
          // Highlighted as Cut silence (Red/Amber)
          ctx.fillStyle = 'rgba(239, 68, 68, 0.16)';
          ctx.fillRect(segStartPx, 0, segWidth, height);

          // Top border indicator
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(segStartPx, 0, segWidth, 3);

          // Diagonal subtle stripes pattern for cut area
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.12)';
          ctx.lineWidth = 1;
          const stripeGap = 12;
          for (let x = segStartPx - height; x < segEndPx; x += stripeGap) {
            ctx.beginPath();
            ctx.moveTo(Math.max(segStartPx, x), 0);
            ctx.lineTo(Math.min(segEndPx, x + height), height);
            ctx.stroke();
          }

          // Cut badge if segment is wide enough
          if (segWidth > 45) {
            ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
            const badgeW = 34;
            const badgeH = 16;
            const badgeX = segStartPx + (segWidth - badgeW) / 2;
            const badgeY = 6;
            ctx.beginPath();
            ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 3);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 9px JetBrains Mono, monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(settings.mode === 'cut' ? 'CUT' : settings.mode === 'shorten' ? 'TRIM' : 'SPEED', badgeX + badgeW / 2, badgeY + badgeH / 2);
          }
        } else {
          // Disabled silence (kept)
          ctx.fillStyle = 'rgba(100, 116, 139, 0.15)';
          ctx.fillRect(segStartPx, 0, segWidth, height);
          ctx.fillStyle = '#64748b';
          ctx.fillRect(segStartPx, 0, segWidth, 2);
        }
      } else {
        // Speech region subtle green/indigo background
        ctx.fillStyle = 'rgba(99, 102, 241, 0.05)';
        ctx.fillRect(segStartPx, 0, segWidth, height);
        ctx.fillStyle = '#6366f1';
        ctx.fillRect(segStartPx, 0, segWidth, 2);
      }
    });

    // 2. Draw Center Line
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(width, midY);
    ctx.stroke();

    // 3. Draw Waveform Peaks
    const peaks = peaksRef.current;
    const numBuckets = peaks.min.length;
    const barWidth = 2;
    const barGap = 1;
    const totalBars = Math.floor(width / (barWidth + barGap));

    for (let i = 0; i < totalBars; i++) {
      const x = i * (barWidth + barGap);
      const timeAtBar = (x / width) * totalDuration;

      // Find if this timestamp is in a cut silence segment
      const currentSegment = segments.find((s) => timeAtBar >= s.start && timeAtBar <= s.end);
      const isCut = currentSegment?.isSilence && currentSegment.enabled;

      // Sample bucket
      const bucketIdx = Math.min(numBuckets - 1, Math.floor((i / totalBars) * numBuckets));
      const minVal = peaks.min[bucketIdx];
      const maxVal = peaks.max[bucketIdx];

      const topY = midY - maxVal * (waveHeight / 2);
      const bottomY = midY - minVal * (waveHeight / 2);
      const barH = Math.max(2, bottomY - topY);

      if (isCut) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.45)';
      } else if (currentSegment?.isSilence) {
        ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
      } else {
        // Active vibrant speech
        const grad = ctx.createLinearGradient(0, topY, 0, bottomY);
        grad.addColorStop(0, '#818cf8');
        grad.addColorStop(0.5, '#6366f1');
        grad.addColorStop(1, '#4f46e5');
        ctx.fillStyle = grad;
      }

      ctx.beginPath();
      ctx.roundRect(x, topY, barWidth, barH, 1);
      ctx.fill();
    }

    // 4. Draw Time Ruler Ticks at bottom
    ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const tickInterval = zoomLevel > 4 ? 0.5 : zoomLevel > 2 ? 1 : totalDuration > 60 ? 10 : 2;
    for (let t = 0; t <= totalDuration; t += tickInterval) {
      const x = (t / totalDuration) * width;
      ctx.fillStyle = 'rgba(148, 163, 184, 0.3)';
      ctx.fillRect(x, height - 12, 1, 6);

      ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
      ctx.fillText(formatTime(t), x, height - 22);
    }

    // 5. Draw Playhead
    const playheadPx = (currentTime / totalDuration) * width;
    ctx.shadowColor = 'rgba(239, 68, 68, 0.6)';
    ctx.shadowBlur = 8;
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playheadPx, 0);
    ctx.lineTo(playheadPx, height);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Playhead handle
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(playheadPx - 6, 0);
    ctx.lineTo(playheadPx + 6, 0);
    ctx.lineTo(playheadPx, 10);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }, [audioBuffer, segments, settings, currentTime, zoomLevel]);

  // Draw Minimap Overview
  const drawMinimap = useCallback(() => {
    const canvas = minimapCanvasRef.current;
    if (!canvas || !audioBuffer || !peaksRef.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const totalDuration = audioBuffer.duration;
    const midY = height / 2;

    // Draw silences in minimap
    segments.forEach((seg) => {
      const segStartPx = (seg.start / totalDuration) * width;
      const segEndPx = (seg.end / totalDuration) * width;
      const segWidth = Math.max(1, segEndPx - segStartPx);

      if (seg.isSilence && seg.enabled) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.fillRect(segStartPx, 0, segWidth, height);
      } else {
        ctx.fillStyle = 'rgba(99, 102, 241, 0.2)';
        ctx.fillRect(segStartPx, 0, segWidth, height);
      }
    });

    // Mini waveform
    const peaks = peaksRef.current;
    const numBuckets = peaks.min.length;
    for (let x = 0; x < width; x += 2) {
      const bucketIdx = Math.min(numBuckets - 1, Math.floor((x / width) * numBuckets));
      const maxVal = peaks.max[bucketIdx];
      const h = maxVal * (height * 0.7);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fillRect(x, midY - h / 2, 1.5, Math.max(1, h));
    }

    // Viewport box in minimap
    if (zoomLevel > 1 && containerRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      const fullWidth = containerWidth * zoomLevel;
      const viewStartRatio = containerRef.current.scrollLeft / fullWidth;
      const viewWidthRatio = containerWidth / fullWidth;

      ctx.fillStyle = 'rgba(99, 102, 241, 0.25)';
      ctx.strokeStyle = '#818cf8';
      ctx.lineWidth = 1.5;
      ctx.fillRect(viewStartRatio * width, 0, viewWidthRatio * width, height);
      ctx.strokeRect(viewStartRatio * width, 0, viewWidthRatio * width, height);
    }

    // Playhead in minimap
    const playheadPx = (currentTime / totalDuration) * width;
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(playheadPx - 1, 0, 2, height);

    ctx.restore();
  }, [audioBuffer, segments, currentTime, zoomLevel]);

  // Request Animation Frame loop for smooth canvas updating
  useEffect(() => {
    drawWaveform();
    drawMinimap();
  }, [drawWaveform, drawMinimap]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !audioBuffer) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickRatio = Math.max(0, Math.min(1, clickX / rect.width));
    const seekTime = clickRatio * audioBuffer.duration;

    onSeek(seekTime);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !audioBuffer) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = (x / rect.width) * audioBuffer.duration;
    const seg = segments.find((s) => time >= s.start && time <= s.end) || null;

    setHoverInfo({
      time,
      segment: seg,
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleMouseLeave = () => {
    setHoverInfo(null);
  };

  const handleMinimapClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!minimapCanvasRef.current || !audioBuffer || !containerRef.current) return;
    const rect = minimapCanvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickRatio = Math.max(0, Math.min(1, clickX / rect.width));

    const totalDuration = audioBuffer.duration;
    const seekTime = clickRatio * totalDuration;
    onSeek(seekTime);

    if (zoomLevel > 1) {
      const containerWidth = containerRef.current.clientWidth;
      const fullWidth = containerWidth * zoomLevel;
      const targetScroll = clickRatio * fullWidth - containerWidth / 2;
      containerRef.current.scrollLeft = Math.max(0, targetScroll);
    }
  };

  return (
    <div id="waveform-timeline-section" className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-sm">
      {/* Top Toolbar: Zoom & Segment Indicators */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
            Visual Waveform
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1 bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded-md font-medium">
              <Volume2 className="w-3 h-3 text-indigo-400" /> Speech ({segments.filter((s) => !s.isSilence).length})
            </span>
            <span className="flex items-center gap-1 bg-red-950/60 border border-red-500/30 text-red-300 px-2 py-0.5 rounded-md font-medium">
              <Scissors className="w-3 h-3 text-red-400" /> Silences ({segments.filter((s) => s.isSilence && s.enabled).length})
            </span>
          </div>
        </div>

        {/* Zoom & View Controls */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
          <button
            id="zoom-out-btn"
            onClick={() => setZoomLevel((prev) => Math.max(1, prev - 1))}
            disabled={zoomLevel <= 1}
            className="p-1.5 text-slate-400 hover:text-white disabled:opacity-40 rounded-lg hover:bg-slate-800 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono font-medium text-slate-300 px-2 min-w-[36px] text-center">
            {zoomLevel}x
          </span>
          <button
            id="zoom-in-btn"
            onClick={() => setZoomLevel((prev) => Math.min(8, prev + 1))}
            disabled={zoomLevel >= 8}
            className="p-1.5 text-slate-400 hover:text-white disabled:opacity-40 rounded-lg hover:bg-slate-800 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            id="zoom-fit-btn"
            onClick={() => setZoomLevel(1)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors text-xs font-medium flex items-center gap-1"
            title="Reset Zoom / Fit to Screen"
          >
            <Maximize2 className="w-3.5 h-3.5" /> Fit
          </button>
        </div>
      </div>

      {/* Main Interactive Scrollable Waveform Container */}
      <div
        ref={containerRef}
        id="waveform-scroll-viewport"
        onScroll={(e) => setScrollLeft(e.currentTarget.scrollLeft)}
        className="w-full overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950/90 relative cursor-pointer select-none"
        style={{ height: '180px' }}
      >
        <div style={{ width: `${zoomLevel * 100}%`, height: '100%' }}>
          <canvas
            ref={canvasRef}
            id="main-waveform-canvas"
            className="w-full h-full block"
            onClick={handleCanvasClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          />
        </div>
      </div>

      {/* Minimap Overview Bar */}
      {audioBuffer && (
        <div className="mt-2.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium mb-1">
            <span>Audio Overview (Click to jump anywhere)</span>
            <span className="font-mono text-slate-300">Total: {formatTime(audioBuffer.duration, true)}</span>
          </div>
          <div
            id="minimap-container"
            className="w-full h-8 bg-slate-950 rounded-lg border border-slate-800 overflow-hidden cursor-pointer relative"
          >
            <canvas
              ref={minimapCanvasRef}
              id="minimap-canvas"
              className="w-full h-full block"
              onClick={handleMinimapClick}
            />
          </div>
        </div>
      )}

      {/* Floating Hover Information Box */}
      {hoverInfo && hoverInfo.segment && (
        <div
          className="fixed pointer-events-none z-50 bg-slate-900/95 border border-slate-700 text-slate-200 text-xs px-2.5 py-1.5 rounded-lg shadow-2xl backdrop-blur-md"
          style={{
            left: `${Math.min(window.innerWidth - 180, hoverInfo.x + 12)}px`,
            top: `${hoverInfo.y - 45}px`,
          }}
        >
          <div className="flex items-center gap-1.5 font-mono font-semibold">
            {hoverInfo.segment.isSilence ? (
              <span className="text-red-400 flex items-center gap-1">
                <Scissors className="w-3 h-3" /> Silence ({hoverInfo.segment.duration.toFixed(2)}s)
              </span>
            ) : (
              <span className="text-indigo-400 flex items-center gap-1">
                <Volume2 className="w-3 h-3" /> Speech ({hoverInfo.segment.duration.toFixed(2)}s)
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Time: {formatTime(hoverInfo.time, true)} | Level: {hoverInfo.segment.avgDb} dB
          </div>
        </div>
      )}

      {/* Quick Action Hint */}
      <div className="mt-3 flex flex-wrap items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2.5">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-red-500"></span> Red areas = Auto-detected dead air & pauses
          </span>
          <span className="text-slate-600">•</span>
          <span>Click anywhere to play from that point</span>
        </div>
        <div className="text-slate-400 font-mono text-[11px]">
          Current Time: <span className="text-indigo-400 font-bold">{formatTime(currentTime, true)}</span>
        </div>
      </div>
    </div>
  );
};
