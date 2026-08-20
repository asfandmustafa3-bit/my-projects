import React from 'react';
import {
  Home,
  Grid,
  Scissors,
  FileText,
  Mic,
  Volume2,
  Sliders,
  Gauge,
  Layers,
  Sparkles,
  RefreshCw,
  MessageSquareQuote,
  Wand2,
} from 'lucide-react';
import { ToolTab } from '../types';

interface ToolsNavigationProps {
  activeTab: ToolTab;
  onSelectTab: (tab: ToolTab) => void;
  hasAudio: boolean;
}

interface TabItem {
  id: ToolTab;
  label: string;
  badge?: string;
  icon: React.ElementType;
  color: string;
}

const TABS: TabItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: Home,
    color: 'text-indigo-400',
  },
  {
    id: 'directory',
    label: 'All Free Tools',
    badge: '10 Tools',
    icon: Grid,
    color: 'text-indigo-300',
  },
  {
    id: 'silence',
    label: 'Remove Silence',
    badge: 'Popular',
    icon: Scissors,
    color: 'text-indigo-400',
  },
  {
    id: 'transcribe',
    label: 'AI Transcribe',
    badge: 'Gemini AI',
    icon: FileText,
    color: 'text-purple-400',
  },
  {
    id: 'recorder',
    label: 'Voice Recorder',
    badge: 'Live',
    icon: Mic,
    color: 'text-amber-400',
  },
  {
    id: 'noise',
    label: 'Noise Remover',
    badge: 'DSP',
    icon: Volume2,
    color: 'text-teal-400',
  },
  {
    id: 'trimmer',
    label: 'Audio Trimmer',
    icon: Sliders,
    color: 'text-amber-400',
  },
  {
    id: 'speed',
    label: 'Speed & Pitch',
    icon: Gauge,
    color: 'text-cyan-400',
  },
  {
    id: 'merger',
    label: 'Audio Merger',
    icon: Layers,
    color: 'text-blue-400',
  },
  {
    id: 'compressor',
    label: 'Compressor',
    icon: Wand2,
    color: 'text-rose-400',
  },
  {
    id: 'converter',
    label: 'Converter',
    icon: RefreshCw,
    color: 'text-violet-400',
  },
  {
    id: 'tts',
    label: 'Text to Speech',
    icon: MessageSquareQuote,
    color: 'text-pink-400',
  },
];

export const ToolsNavigation: React.FC<ToolsNavigationProps> = ({
  activeTab,
  onSelectTab,
  hasAudio,
}) => {
  return (
    <div className="w-full bg-slate-900/90 border-b border-slate-800/80 sticky top-[57px] z-30 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-1 overflow-x-auto py-2.5 scrollbar-none no-scrollbar">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-1 ring-indigo-400/40 font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : tab.color}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-800 text-indigo-300 border border-slate-700'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
