import React from 'react';
import {
  Code2,
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
  MessageSquareQuote,
  Gauge,
  Sliders,
  ArrowRight,
  Mail,
  CheckCircle2,
  Cpu,
  Lock,
  Globe,
  Star,
  Terminal,
} from 'lucide-react';
import { ToolTab } from '../types';

interface HomePageProps {
  onNavigate: (tab: ToolTab) => void;
  hasAudio: boolean;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, hasAudio }) => {
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
              <span>Submind Audio Studio • Developed by Asfand</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              High Performance{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Audio Engineering
              </span>{' '}
              In Your Browser
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Welcome! I am <strong className="text-white font-bold">Asfand</strong>, the developer behind{' '}
              <span className="text-indigo-300 font-semibold">Submind Audio Studio</span>. I designed this platform
              to give podcasters, video creators, audio engineers, and students a fast, 100% private, and free studio
              suite that processes audio locally using modern Web Audio DSP and Google Gemini AI.
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
            </div>
          </div>

          {/* Right Developer Spotlight Card */}
          <div className="w-full lg:w-80 bg-slate-950/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 flex-shrink-0">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center text-white font-black text-xl shadow-lg ring-2 ring-indigo-400/40">
                  A
                </div>
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-950" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>Asfand</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400/20" />
                </h3>
                <p className="text-xs text-indigo-400 font-medium">Software & Audio Developer</p>
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
                <span className="text-emerald-400 font-semibold">100% Client-Side</span>
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

            <a
              href="mailto:asfandmustafa3@gmail.com"
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5 text-indigo-400" />
              <span>Get In Touch</span>
            </a>
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
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Engineered with privacy, precision, and speed in mind. Here is what this suite brings to your workflow:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Pillar 1 */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">100% In-Browser Privacy</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your audio is processed strictly inside your device’s Web Audio memory. No server uploads, no data retention, and zero cloud leaks.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Scissors className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Automated Silence Cutting</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Detect pauses down to the millisecond. Cut dead air, shorten gaps, or speed up quiet sections with instant NLE timeline export (EDL/CSV).
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Gemini 3.7 AI Transcriptions</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Convert speech to text in 55+ languages, generate structured meeting summaries, extract action items, and audit filler words.
            </p>
          </div>

          {/* Pillar 4 */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Full DSP Studio Toolkit</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Comprehensive noise removal, dynamic compression, multi-track merging, audio/video format conversion, speed modulation, and TTS.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Featured Tools Grid with Quick Launch */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Featured Studio Tools</h2>
            <p className="text-xs text-slate-400">Directly jump into any audio utility below</p>
          </div>
          <button
            onClick={() => onNavigate('directory')}
            className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
          >
            <span>View All 10 Tools</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Tool 1 */}
          <div
            onClick={() => onNavigate('silence')}
            className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 space-y-3 transition-all cursor-pointer group hover:shadow-lg hover:shadow-indigo-500/5"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Scissors className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Flagship
              </span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                Audio Silence Remover
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Auto-cut awkward pauses, hesitations, and dead air with waveform timeline.
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-indigo-400 pt-2 border-t border-slate-800">
              <span>Open Silence Remover</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </div>

          {/* Tool 2 */}
          <div
            onClick={() => onNavigate('transcribe')}
            className="bg-slate-900 border border-slate-800 hover:border-purple-500/50 rounded-2xl p-5 space-y-3 transition-all cursor-pointer group hover:shadow-lg hover:shadow-purple-500/5"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Gemini AI
              </span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                AI Transcriber & Notes
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Accurate speech-to-text, key summary takeaways, and filler word detection.
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-purple-400 pt-2 border-t border-slate-800">
              <span>Open Transcriber</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </div>

          {/* Tool 3 */}
          <div
            onClick={() => onNavigate('recorder')}
            className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-5 space-y-3 transition-all cursor-pointer group hover:shadow-lg hover:shadow-amber-500/5"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Mic className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Live Mic
              </span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                Voice Recorder & Waveform
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Capture microphone voice notes with real-time frequency visualizer.
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-amber-400 pt-2 border-t border-slate-800">
              <span>Open Voice Recorder</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </div>

          {/* Tool 4 */}
          <div
            onClick={() => onNavigate('noise')}
            className="bg-slate-900 border border-slate-800 hover:border-teal-500/50 rounded-2xl p-5 space-y-3 transition-all cursor-pointer group hover:shadow-lg hover:shadow-teal-500/5"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
                <VolumeX className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                DSP Clean
              </span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-teal-300 transition-colors">
                AI Noise Remover
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Filter air conditioning hum, mic hiss, fan rumble, and boost vocal clarity.
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-teal-400 pt-2 border-t border-slate-800">
              <span>Open Noise Remover</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </div>

          {/* Tool 5 */}
          <div
            onClick={() => onNavigate('merger')}
            className="bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-5 space-y-3 transition-all cursor-pointer group hover:shadow-lg hover:shadow-blue-500/5"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Multi-Stem
              </span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">
                Audio Merger & Crossfade
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Sequence and blend multiple audio tracks with smooth crossfade overlaps.
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-blue-400 pt-2 border-t border-slate-800">
              <span>Open Audio Merger</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </div>

          {/* Tool 6 */}
          <div
            onClick={() => onNavigate('converter')}
            className="bg-slate-900 border border-slate-800 hover:border-violet-500/50 rounded-2xl p-5 space-y-3 transition-all cursor-pointer group hover:shadow-lg hover:shadow-violet-500/5"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center">
                <RefreshCw className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                Video/Audio
              </span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-violet-300 transition-colors">
                Format & Video Converter
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Convert WAV, MP3, FLAC, M4A, and extract audio from MP4/MOV videos.
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-violet-400 pt-2 border-t border-slate-800">
              <span>Open Format Converter</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </div>
      </section>

      {/* 4. Three Step Easy Workflow */}
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
