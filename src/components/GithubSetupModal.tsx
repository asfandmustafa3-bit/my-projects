import React, { useState } from 'react';
import {
  Download,
  Github,
  Terminal,
  Check,
  Copy,
  X,
  FileCode,
  Laptop,
  Apple,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  FolderDown,
  Layers,
} from 'lucide-react';

interface GithubSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GithubSetupModal: React.FC<GithubSetupModalProps> = ({ isOpen, onClose }) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'windows' | 'mac' | 'manual'>('windows');

  if (!isOpen) return null;

  const copyToClipboard = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const downloadFile = (filename: string, content: string, mime = 'text/plain') => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const windowsScript = `@echo off
TITLE Submind Audio Studio - Automated Setup & Installer
COLOR 0A

echo ===================================================================
echo             SUBMIND AUDIO STUDIO - DESKTOP SETUP
echo             Engineered by Asfand Mustafa
echo ===================================================================
echo.

echo [1/4] Checking Node.js environment...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js (v18+) from: https://nodejs.org/
    pause
    exit /b 1
)

echo [2/4] Installing project dependencies...
call npm install

echo [3/4] Building production bundles...
call npm run build

echo [4/4] Starting Submind Audio Studio on your device...
echo URL: http://localhost:3000
start http://localhost:3000
call npm run dev
pause`;

  const macLinuxScript = `#!/usr/bin/env bash
# Submind Audio Studio - Desktop Setup
# Engineered by Asfand Mustafa

set -e
echo "==================================================================="
echo "            SUBMIND AUDIO STUDIO - DESKTOP SETUP"
echo "            Engineered by Asfand Mustafa"
echo "==================================================================="

if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed! Please install via https://nodejs.org"
    exit 1
fi

echo "[1/3] Installing dependencies..."
npm install

echo "[2/3] Building production bundle..."
npm run build || true

echo "[3/3] Launching Submind Audio Studio..."
if which xdg-open > /dev/null; then
    (sleep 2 && xdg-open "http://localhost:3000") &
elif which open > /dev/null; then
    (sleep 2 && open "http://localhost:3000") &
fi

npm run dev`;

  const gitCloneCmd = `git clone https://github.com/asfandmustafa/silenttrim-ai.git
cd silenttrim-ai
npm install
npm run dev`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Github className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Download & Install On Your Device</span>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-semibold">
                  GitHub Setup
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Run Submind Audio Studio locally on your computer with 100% offline privacy
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Quick 1-Click Installers Highlight */}
          <div className="bg-gradient-to-r from-indigo-950/60 via-slate-900 to-purple-950/60 border border-indigo-500/30 rounded-2xl p-5 shadow-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                  Automated 1-Click Installer Scripts
                </span>
                <h3 className="text-sm font-bold text-white mt-0.5">
                  Download Pre-Packaged Setup Files
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Engineered by <strong className="text-white">Asfand Mustafa</strong> for effortless desktop setup.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => downloadFile('setup-windows.bat', windowsScript, 'text/plain')}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-colors cursor-pointer"
                >
                  <Laptop className="w-3.5 h-3.5" />
                  <span>Download .BAT (Windows)</span>
                </button>
                <button
                  onClick={() => downloadFile('setup-mac-linux.sh', macLinuxScript, 'text/plain')}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                >
                  <Apple className="w-3.5 h-3.5" />
                  <span>Download .SH (Mac/Linux)</span>
                </button>
              </div>
            </div>
          </div>

          {/* OS Selector Tabs */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('windows')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'windows'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>Windows (1-Click)</span>
              </button>
              <button
                onClick={() => setActiveTab('mac')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'mac'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Apple className="w-3.5 h-3.5" />
                <span>macOS / Linux</span>
              </button>
              <button
                onClick={() => setActiveTab('manual')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'manual'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Git Clone Terminal</span>
              </button>
            </div>

            {/* Tab 1: Windows Instructions */}
            {activeTab === 'windows' && (
              <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800 space-y-4 text-xs">
                <div className="space-y-2">
                  <h4 className="font-bold text-white flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center text-[10px] font-bold">
                      1
                    </span>
                    <span>Download `setup-windows.bat`</span>
                  </h4>
                  <p className="text-slate-400 text-[11px] pl-6">
                    Click the button below to download the automated Windows batch installer.
                  </p>
                  <div className="pl-6">
                    <button
                      onClick={() => downloadFile('setup-windows.bat', windowsScript, 'text/plain')}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-xs font-semibold cursor-pointer transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download `setup-windows.bat`</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2 border-t border-slate-900 pt-3">
                  <h4 className="font-bold text-white flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center text-[10px] font-bold">
                      2
                    </span>
                    <span>Run the script inside your project folder</span>
                  </h4>
                  <p className="text-slate-400 text-[11px] pl-6">
                    Double-click `setup-windows.bat`. It will automatically check Node.js, install dependencies, compile the DSP engine, and open <strong>http://localhost:3000</strong>.
                  </p>
                </div>
              </div>
            )}

            {/* Tab 2: macOS / Linux */}
            {activeTab === 'mac' && (
              <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800 space-y-4 text-xs">
                <div className="space-y-2">
                  <h4 className="font-bold text-white flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center text-[10px] font-bold">
                      1
                    </span>
                    <span>Download `setup-mac-linux.sh`</span>
                  </h4>
                  <div className="pl-6">
                    <button
                      onClick={() => downloadFile('setup-mac-linux.sh', macLinuxScript, 'text/plain')}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-xs font-semibold cursor-pointer transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download `setup-mac-linux.sh`</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2 border-t border-slate-900 pt-3">
                  <h4 className="font-bold text-white flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center text-[10px] font-bold">
                      2
                    </span>
                    <span>Make executable & run</span>
                  </h4>
                  <div className="pl-6 bg-slate-900 rounded-xl p-3 font-mono text-[11px] text-slate-300 flex items-center justify-between border border-slate-800">
                    <code>chmod +x setup-mac-linux.sh && ./setup-mac-linux.sh</code>
                    <button
                      onClick={() => copyToClipboard('chmod +x setup-mac-linux.sh && ./setup-mac-linux.sh', 'sh-cmd')}
                      className="p-1 text-slate-400 hover:text-white"
                    >
                      {copiedSection === 'sh-cmd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Git Clone Terminal */}
            {activeTab === 'manual' && (
              <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold">Copy terminal commands:</span>
                  <button
                    onClick={() => copyToClipboard(gitCloneCmd, 'git-all')}
                    className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-semibold"
                  >
                    {copiedSection === 'git-all' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSection === 'git-all' ? 'Copied!' : 'Copy Commands'}</span>
                  </button>
                </div>
                <pre className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 font-mono text-[11px] leading-relaxed overflow-x-auto">
                  {gitCloneCmd}
                </pre>
              </div>
            )}
          </div>

          {/* Privacy & Author Badge */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>100% On-Device Signal Processing</span>
            </div>
            <div className="text-slate-300 font-medium">
              Author: <strong className="text-white">Asfand Mustafa</strong>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-950/50">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
