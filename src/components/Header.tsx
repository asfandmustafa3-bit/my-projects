import React from 'react';
import { Sparkles, ShieldCheck, RefreshCw, Grid, Disc3, Home } from 'lucide-react';
import { ToolTab } from '../types';

interface HeaderProps {
  hasAudio: boolean;
  onResetFile: () => void;
  fileName?: string;
  activeTab: ToolTab;
  onSelectTab: (tab: ToolTab) => void;
}

export const Header: React.FC<HeaderProps> = ({
  hasAudio,
  onResetFile,
  fileName,
  activeTab,
  onSelectTab,
}) => {
  return (
    <header
      id="app-header"
      className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 py-3"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <div
          onClick={() => onSelectTab('home')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 ring-1 ring-white/20 transition-transform group-hover:scale-105">
            <Disc3 className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-white tracking-tight flex items-center gap-1.5">
                <span>Submind</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 font-black">
                  Audio Studio
                </span>
              </h1>
              <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-500/30 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-indigo-400" />
                <span>DEV: ASFAND</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Free, private in-browser AI audio suite by developer Asfand — 100% on-device
            </p>
          </div>
        </div>

        {/* Status & Action Area */}
        <div className="flex items-center gap-2.5">
          {/* Quick Home Nav */}
          <button
            onClick={() => onSelectTab('home')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              activeTab === 'home'
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/25'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            <Home className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Home</span>
          </button>

          {/* Quick Hub Nav */}
          <button
            onClick={() => onSelectTab('directory')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              activeTab === 'directory'
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/25'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            <Grid className="w-3.5 h-3.5 text-indigo-400" />
            <span>Free Tools</span>
          </button>

          {/* Privacy Guarantee Badge */}
          <div className="hidden lg:flex items-center gap-1.5 bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 px-3 py-1.5 rounded-xl text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>100% Private</span>
          </div>

          {hasAudio && (
            <button
              id="upload-new-file-btn"
              onClick={onResetFile}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Change File</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
