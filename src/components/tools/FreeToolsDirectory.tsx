import React, { useState } from 'react';
import {
  Search,
  Scissors,
  FileText,
  Mic,
  VolumeX,
  Gauge,
  Layers,
  Wand2,
  RefreshCw,
  MessageSquareQuote,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Lock,
  Cpu,
  CheckCircle2,
} from 'lucide-react';
import { ToolTab } from '../../types';

interface FreeToolsDirectoryProps {
  onSelectTool: (tool: ToolTab) => void;
  hasAudio: boolean;
}

interface ToolCardItem {
  id: ToolTab;
  title: string;
  category: 'ai' | 'edit' | 'audio' | 'convert';
  badge: string;
  badgeColor: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  formats: string[];
  features: string[];
  popular?: boolean;
}

const TOOLS: ToolCardItem[] = [
  {
    id: 'silence',
    title: 'Audio Silence Remover',
    category: 'edit',
    badge: 'Popular',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    description:
      'Automatically detect and cut awkward pauses, dead air, and speech gaps from podcasts, lectures, and voiceovers.',
    icon: <Scissors className="w-5 h-5 text-indigo-400" />,
    iconBg: 'bg-indigo-500/10 border-indigo-500/30',
    formats: ['MP3', 'WAV', 'M4A', 'OGG', 'EDL', 'CSV'],
    features: ['3 Processing Modes', 'EDL/Premiere Export', 'Visual Waveform'],
    popular: true,
  },
  {
    id: 'transcribe',
    title: 'AI Audio to Text Transcriber',
    category: 'ai',
    badge: 'Gemini AI',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    description:
      'Transcribe voice recordings into accurate text, extract executive summaries, key takeaways, and count filler words.',
    icon: <FileText className="w-5 h-5 text-emerald-400" />,
    iconBg: 'bg-emerald-500/10 border-emerald-500/30',
    formats: ['WAV', 'MP3', 'M4A', 'Markdown', 'TXT'],
    features: ['55+ Languages', 'Key Takeaways', 'Filler Word Counter'],
    popular: true,
  },
  {
    id: 'recorder',
    title: 'Voice Recorder & Live Waveform',
    category: 'ai',
    badge: 'New',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    description:
      'Record high-fidelity microphone voice notes directly in your browser with real-time frequency visualizer and instant studio export.',
    icon: <Mic className="w-5 h-5 text-amber-400" />,
    iconBg: 'bg-amber-500/10 border-amber-500/30',
    formats: ['Mic In', 'WAV', 'WebM'],
    features: ['Real-time Visualizer', 'Zero Lag', 'Direct Studio Loading'],
    popular: true,
  },
  {
    id: 'noise',
    title: 'AI Audio Noise Remover',
    category: 'audio',
    badge: 'DSP Clean',
    badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
    description:
      'Eliminate background air conditioner hum, microphone hiss, fan rumble, and boost vocal clarity in seconds.',
    icon: <VolumeX className="w-5 h-5 text-teal-400" />,
    iconBg: 'bg-teal-500/10 border-teal-500/30',
    formats: ['MP3', 'WAV', 'M4A', 'FLAC'],
    features: ['Adaptive Noise Gate', 'Rumble High-Pass', 'A/B Live Preview'],
    popular: true,
  },
  {
    id: 'trimmer',
    title: 'Precision Audio Trimmer & Cutter',
    category: 'edit',
    badge: 'Lossless',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    description:
      'Cut, trim, crop, and loop audio tracks with millisecond precision and smooth cosine fade-ins and fade-outs.',
    icon: <Scissors className="w-5 h-5 text-amber-400" />,
    iconBg: 'bg-amber-500/10 border-amber-500/30',
    formats: ['WAV', 'MP3', 'M4A'],
    features: ['Millisecond Snapping', 'Cosine Fades', 'Loop Preview'],
  },
  {
    id: 'speed',
    title: 'Audio Speed & Tempo Changer',
    category: 'edit',
    badge: '0.25x – 3x',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    description:
      'Speed up long podcast episodes or slow down fast speech for language learning without distorting original pitch.',
    icon: <Gauge className="w-5 h-5 text-cyan-400" />,
    iconBg: 'bg-cyan-500/10 border-cyan-500/30',
    formats: ['WAV', 'MP3'],
    features: ['Real-time Speed Adjust', 'One-Click Presets', 'Instant Rendering'],
  },
  {
    id: 'merger',
    title: 'Multi-Track Audio Merger',
    category: 'convert',
    badge: 'Multi-File',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    description:
      'Join, sequence, and seamlessly blend multiple voice notes, music stems, and sound effects with custom crossfade transitions.',
    icon: <Layers className="w-5 h-5 text-blue-400" />,
    iconBg: 'bg-blue-500/10 border-blue-500/30',
    formats: ['MP3', 'WAV', 'M4A', 'FLAC', 'OGG'],
    features: ['Drag & Reorder', 'Crossfade Overlap', 'Batch Queue'],
  },
  {
    id: 'compressor',
    title: 'Audio Compressor & Limiter',
    category: 'audio',
    badge: 'Studio',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    description:
      'Level uneven voice recordings, tame loud microphone peaks, and boost quiet whispers for broadcast-standard loudness.',
    icon: <Wand2 className="w-5 h-5 text-rose-400" />,
    iconBg: 'bg-rose-500/10 border-rose-500/30',
    formats: ['WAV', 'MP3'],
    features: ['Threshold & Ratio', 'Makeup Gain', 'Broadcast Standard'],
  },
  {
    id: 'converter',
    title: 'Audio & Video Format Converter',
    category: 'convert',
    badge: 'Fast',
    badgeColor: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    description:
      'Extract pristine audio from MP4/MOV/WebM video files and convert between WAV, MP3, FLAC, M4A, and OGG formats.',
    icon: <RefreshCw className="w-5 h-5 text-violet-400" />,
    iconBg: 'bg-violet-500/10 border-violet-500/30',
    formats: ['MP4', 'MOV', 'MP3', 'WAV', 'FLAC', 'M4A'],
    features: ['Video to Audio Extraction', 'Zero Quality Loss', 'Bitrate Controls'],
  },
  {
    id: 'tts',
    title: 'Text to Speech (TTS) Generator',
    category: 'ai',
    badge: 'Multi-Voice',
    badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    description:
      'Generate natural spoken voiceovers from scripts, notes, or prompts and directly import them into any studio tool.',
    icon: <MessageSquareQuote className="w-5 h-5 text-pink-400" />,
    iconBg: 'bg-pink-500/10 border-pink-500/30',
    formats: ['Text Script', 'Spoken Voice', 'WAV'],
    features: ['Multiple Accents', 'Pitch Modulation', 'Direct Studio Import'],
  },
];

const CATEGORIES = [
  { id: 'all', label: 'All Free Tools' },
  { id: 'ai', label: 'AI & Speech' },
  { id: 'edit', label: 'Audio Editing' },
  { id: 'audio', label: 'Noise & Mastering' },
  { id: 'convert', label: 'Convert & Merge' },
];

export const FreeToolsDirectory: React.FC<FreeToolsDirectoryProps> = ({
  onSelectTool,
  hasAudio,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredTools = TOOLS.filter((tool) => {
    const matchesSearch =
      tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.formats.some((f) => f.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      activeCategory === 'all' || tool.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Directory Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-6 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>100% Free Online AI Audio Studio</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Free Online Audio & AI Tools{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              Without Limits
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Professional browser-based audio editing, AI transcription, noise removal, and dead-air cutting.
            Zero sign-up required, zero file size limits, and 100% private on-device processing.
          </p>

          {/* Privacy & Speed Highlights */}
          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-400 font-medium">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>100% Private On-Device</span>
            </div>
            <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
              <Zap className="w-4 h-4" />
              <span>Zero Wait Times</span>
            </div>
            <div className="flex items-center gap-1.5 text-indigo-400 font-semibold">
              <Lock className="w-4 h-4" />
              <span>No Sign-Up Needed</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
              <Cpu className="w-4 h-4" />
              <span>Web Audio DSP Engine</span>
            </div>
          </div>
        </div>

        {/* Search Bar & Category Filters */}
        <div className="relative z-10 mt-8 space-y-4">
          <div className="relative w-full max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search any audio tool (e.g., 'remove noise', 'transcribe', 'cut silence', 'mp3')..."
              className="w-full bg-slate-950/90 border border-slate-700/80 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg bg-slate-800"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tools Grid */}
      <div>
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
            Available Free Audio Tools ({filteredTools.length})
          </h2>
          {hasAudio && (
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Audio track loaded & ready</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTools.map((tool) => (
            <div
              key={tool.id}
              onClick={() => onSelectTool(tool.id)}
              className="group relative bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 transition-all duration-200 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-0.5 flex flex-col justify-between cursor-pointer"
            >
              <div className="space-y-4">
                {/* Card Header: Icon & Badge */}
                <div className="flex items-start justify-between">
                  <div
                    className={`w-11 h-11 rounded-xl border flex items-center justify-center transition-transform group-hover:scale-105 ${tool.iconBg}`}
                  >
                    {tool.icon}
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${tool.badgeColor}`}
                  >
                    {tool.badge}
                  </span>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors flex items-center gap-1.5">
                    <span>{tool.title}</span>
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mt-2 line-clamp-3">
                    {tool.description}
                  </p>
                </div>

                {/* Feature Bullet Points */}
                <div className="space-y-1.5 pt-1">
                  {tool.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-[11px] text-slate-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/60" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card Footer: Formats & CTA */}
              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-1.5 overflow-hidden">
                  {tool.formats.slice(0, 3).map((fmt, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 font-semibold"
                    >
                      {fmt}
                    </span>
                  ))}
                  {tool.formats.length > 3 && (
                    <span className="text-[10px] font-mono text-slate-500">
                      +{tool.formats.length - 3}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-xs font-bold text-indigo-400 group-hover:text-indigo-300 transition-colors">
                  <span>Open Tool</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
