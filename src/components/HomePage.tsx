import React from 'react';
import {
  Sparkles,
  ShieldCheck,
  Zap,
  Scissors,
  FileText,
  Mic,
  VolumeX,
  Layers,
  Wand2,
  RefreshCw,
  Gauge,
  Sliders,
  ArrowRight,
  Mail,
  CheckCircle2,
  Lock,
  Terminal,
  Download,
  Github,
} from 'lucide-react';
import { ToolTab } from '../types';

interface HomePageProps {
  onNavigate: (tab: ToolTab) => void;
  hasAudio: boolean;
  onOpenSetup?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, hasAudio, onOpenSetup }) => {
  return (
    <div className="space-y-12 pb-16">
      {/* 1. Hero & Developer Introduction */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 p-6 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          {/* Left Hero Narrative */}
          <div className="space-y-5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Submind Audio Studio • Engineered by Asfand Mustafa</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              High Performance{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Audio Engineering
              </span>{' '}
              In Your Browser
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Welcome! I am <strong className="text-white font-bold">Asfand Mustafa</strong>, the developer behind{' '}
              <span className="text-indigo-300 font-semibold">Submind Audio Studio</span>. I engineered this platform
              to give podcasters, video creators, audio engineers, and developers an ultra-fast, 100% private,
              and completely free workstation that processes audio locally using modern Web Audio DSP and Google Gemini AI.
            </p>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => onNavigate('directory')}
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xl shadow-indigo-600/30 transition-all cursor-pointer hover:scale-105"
              >
                <span>Explore All 10 Free Tools</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onNavigate('silence')}
                className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
              >
                <Scissors className="w-4 h-4 text-indigo-400" />
                <span>Launch Silence Remover</span>
              </button>

              {onOpenSetup && (
                <button
                  onClick={onOpenSetup}
                  className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-indigo-950/70 hover:bg-indigo-900 text-indigo-300 text-xs font-semibold border border-indigo-500/40 transition-all cursor-pointer shadow-md"
                >
                  <Download className="w-4 h-4 text-indigo-400" />
                  <span>Download Setup Files</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Developer Spotlight Card */}
          <div className="w-full lg:w-80 bg-slate-950/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 flex-shrink-0">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center text-white font-black text-xl shadow-lg ring-2 ring-indigo-400/40">
                  AM
                </div>
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-950" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>Asfand Mustafa</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400/20" />
                </h3>
                <p className="text-xs text-indigo-400 font-medium">Software & Audio Engineer</p>
                <p className="text-[11px] text-slate-400">Creator of Submind Studio</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-slate-500" />
                  <span>Stack</span>
                </span>
                <span className="font-mono text-slate-200 font-semibold">React, DSP, Gemini</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Security</span>
                </span>
                <span className="text-emerald-400 font-semibold">100% On-Device</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <span>Contact</span>
                </span>
                <a
                  href="mailto:asfandmustafa3@gmail.com"
                  className="text-indigo-400 hover:underline font-mono text-[11px]"
                >
                  asfandmustafa3@gmail.com
                </a>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <a
                href="mailto:asfandmustafa3@gmail.com"
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5 text-indigo-400" />
                <span>Contact</span>
              </a>
              {onOpenSetup && (
                <button
                  onClick={onOpenSetup}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 text-xs font-semibold border border-indigo-500/40 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Setup Files</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Core Pillars: What This Page & Platform Offers */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
            Bottom Line & Architecture
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            What Submind Audio Studio Offers
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            A comprehensive, zero-cost audio workstation engineered from the ground up for high-fidelity signal processing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-3 relative overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">100% Local & Zero Uploads</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your sensitive recordings, private podcast cuts, and vocal tracks never touch third-party servers. All digital signal processing happens directly in your browser using the Web Audio API.
            </p>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-3 relative overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Zero Wait Time & Instant Export</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              No subscription paywalls, no artificial file size limits, and no audio throttling. Export your polished tracks to 16/24/32-bit WAV, MP3, OGG, or Premiere EDL timelines in milliseconds.
            </p>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-3 relative overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Gemini 3.7 AI Intelligence</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Integrates state-of-the-art Gemini 3.7 Flash models for verbatim audio speech-to-text, executive summaries, meeting action items, and vocal filler word detection.
            </p>
          </div>
        </div>
      </section>

      {/* 3. GitHub Setup & Desktop Download Section */}
      <section className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-semibold border border-indigo-500/30">
              <Github className="w-3.5 h-3.5" />
              <span>Open Source & Local Desktop Setup</span>
            </div>
            <h3 className="text-xl font-bold text-white">
              Install & Run On Your Own Device
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Download automated setup scripts for Windows, macOS, or Linux. Run Submind Audio Studio offline on your machine with full digital audio workstation performance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {onOpenSetup && (
              <button
                onClick={onOpenSetup}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer hover:scale-105"
              >
                <Download className="w-4 h-4" />
                <span>Open Setup & Download Hub</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 4. The 10 Essential Tools Deep Dive */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
              Suite Capabilities
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              10 Professional Audio Utilities in One Place
            </h2>
          </div>

          <button
            onClick={() => onNavigate('directory')}
            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
          >
            <span>View All Tools</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              id: 'silence' as ToolTab,
              icon: Scissors,
              title: 'Silence Remover',
              tag: 'FLAGSHIP',
              desc: 'Auto-detect silent gaps with dB threshold controls and micro-fades. Speed up or delete pauses in 1 click.',
              color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
            },
            {
              id: 'noise' as ToolTab,
              icon: VolumeX,
              title: 'Noise Canceller & Gate',
              tag: 'DSP AUDIO',
              desc: 'Spectral gating, high-pass rumble removal, hiss suppression, and vocal presence enhancement.',
              color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
            },
            {
              id: 'transcribe' as ToolTab,
              icon: FileText,
              title: 'AI Audio to Text',
              tag: 'GEMINI 3.7',
              desc: 'Generate accurate verbatim transcripts, executive summaries, action items, and filler word detection.',
              color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
            },
            {
              id: 'recorder' as ToolTab,
              icon: Mic,
              title: 'Studio Voice Recorder',
              tag: 'HQ CAPTURE',
              desc: 'High-sample-rate microphone capture with real-time waveform visualizers and instant tool forwarding.',
              color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
            },
            {
              id: 'trimmer' as ToolTab,
              icon: Sliders,
              title: 'Precision Audio Trimmer',
              tag: 'TIMELINE',
              desc: 'Cut start and end markers with millisecond accuracy, interactive playheads, and zoomable waveforms.',
              color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
            },
            {
              id: 'merger' as ToolTab,
              icon: Layers,
              title: 'Multi-Track Audio Merger',
              tag: 'MIXER',
              desc: 'Combine and sequence multiple audio tracks with volume balancing and crossfading into a single file.',
              color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
            },
            {
              id: 'speed' as ToolTab,
              icon: Gauge,
              title: 'Speed & Pitch Shaper',
              tag: 'DSP RESAMPLING',
              desc: 'Change audio tempo from 0.25x to 4.0x with optional pitch lock or creative vinyl pitch drops.',
              color: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
            },
            {
              id: 'compressor' as ToolTab,
              icon: Wand2,
              title: 'Dynamic Range Compressor',
              tag: 'MASTERING',
              desc: 'Even out spoken volume levels with broadcast threshold, knee, attack, release, and makeup gain.',
              color: 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20',
            },
            {
              id: 'converter' as ToolTab,
              icon: RefreshCw,
              title: 'Format Converter',
              tag: 'UNIVERSAL',
              desc: 'Convert any audio file between WAV (16/24/32-bit), MP3, OGG, FLAC, and WebM instantly.',
              color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
            },
          ].map((tool) => (
            <div
              key={tool.id}
              onClick={() => onNavigate(tool.id)}
              className="bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${tool.color}`}>
                    <tool.icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {tool.tag}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                    {tool.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{tool.desc}</p>
                </div>
              </div>

              <div className="pt-4 mt-2 border-t border-slate-800/60 flex items-center justify-between text-xs font-semibold text-slate-400 group-hover:text-indigo-400 transition-colors">
                <span>Launch Tool</span>
                <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Three Step Easy Workflow */}
      <section className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-lg font-bold text-white">How Submind Studio Works</h2>
          <p className="text-xs text-slate-400">Zero software installation • Works straight in your browser</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto font-mono font-bold text-sm">
              1
            </div>
            <h3 className="text-xs font-bold text-white">Upload or Record</h3>
            <p className="text-[11px] text-slate-400">
              Drag & drop any audio/video file or record live through your microphone.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-10 h-10 rounded-full bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center mx-auto font-mono font-bold text-sm">
              2
            </div>
            <h3 className="text-xs font-bold text-white">Apply AI or DSP Tools</h3>
            <p className="text-[11px] text-slate-400">
              Remove pauses, eliminate noise, transcribe with Gemini AI, or adjust tempo.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-10 h-10 rounded-full bg-pink-600/20 text-pink-400 border border-pink-500/30 flex items-center justify-center mx-auto font-mono font-bold text-sm">
              3
            </div>
            <h3 className="text-xs font-bold text-white">Export In Seconds</h3>
            <p className="text-[11px] text-slate-400">
              Download lossless 16/24/32-bit WAV, MP3, Markdown notes, or Premiere EDL.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
