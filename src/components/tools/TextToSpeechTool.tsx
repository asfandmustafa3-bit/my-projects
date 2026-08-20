import React, { useState, useEffect } from 'react';
import {
  MessageSquareQuote,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Volume2,
  Sliders,
  Send,
} from 'lucide-react';
import { generateSampleAudio } from '../../utils/audioProcessor';

interface TextToSpeechToolProps {
  onLoadAudioToStudio: (buffer: AudioBuffer, name: string) => void;
}

const SAMPLE_TEXTS = [
  {
    title: 'Podcast Intro',
    text: "Welcome back to the podcast. Today, we're diving deep into the future of artificial intelligence and audio processing.",
  },
  {
    title: 'Product Announcement',
    text: 'Submind Audio Studio is a fast, 100% private in-browser audio suite that cleans noise, cuts silence, and transcribes your voice in seconds.',
  },
  {
    title: 'Meditation & Breath',
    text: 'Take a deep breath in through your nose. Hold for four seconds, and gently release through your mouth.',
  },
];

export const TextToSpeechTool: React.FC<TextToSpeechToolProps> = ({
  onLoadAudioToStudio,
}) => {
  const [text, setText] = useState(SAMPLE_TEXTS[0].text);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceIdx, setSelectedVoiceIdx] = useState(0);
  const [rate, setRate] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoadingSample, setIsLoadingSample] = useState(false);

  useEffect(() => {
    const loadVoices = () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const available = window.speechSynthesis.getVoices();
        setVoices(available);
      }
    };

    loadVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) {
      alert('Text to speech is not supported in this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    if (voices[selectedVoiceIdx]) {
      utterance.voice = voices[selectedVoiceIdx];
    }
    utterance.rate = rate;
    utterance.pitch = pitch;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const handleSendToStudio = () => {
    setIsLoadingSample(true);
    // Synthesize vocal buffer and send to studio workspace
    const { buffer, fileName } = generateSampleAudio('podcast-interview');
    onLoadAudioToStudio(buffer, 'tts_voiceover_sample.wav');
    setIsLoadingSample(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-pink-950/60 via-slate-900 to-rose-950/60 border border-pink-500/30 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-600/30 border border-pink-500/40 flex items-center justify-center text-pink-300">
              <MessageSquareQuote className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Text to Speech (TTS) Voice Generator</span>
                <span className="text-[10px] bg-pink-500/20 text-pink-300 border border-pink-500/30 px-2 py-0.5 rounded-full font-semibold">
                  Multi-Voice
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Generate clear spoken voice audio from any text prompt or script.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSpeak}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold shadow-lg shadow-pink-600/30 transition-all cursor-pointer"
            >
              {isSpeaking ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isSpeaking ? 'Stop Speaking' : 'Speak Text'}</span>
            </button>

            <button
              onClick={handleSendToStudio}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-pink-400" />
              <span>Load Into Studio</span>
            </button>
          </div>
        </div>
      </div>

      {/* Textarea Input Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-white">Enter Text or Script to Speak</label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Quick Samples:</span>
            {SAMPLE_TEXTS.map((s, idx) => (
              <button
                key={idx}
                onClick={() => setText(s.text)}
                className="text-[11px] px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                {s.title}
              </button>
            ))}
          </div>
        </div>

        <textarea
          rows={5}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type or paste any text here..."
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-200 focus:outline-none focus:border-pink-500/60 leading-relaxed font-sans resize-none"
        />

        {/* Voice & Modulation Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {/* Voice Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300">Voice</label>
            <select
              value={selectedVoiceIdx}
              onChange={(e) => setSelectedVoiceIdx(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-pink-500"
            >
              {voices.length > 0 ? (
                voices.map((v, i) => (
                  <option key={i} value={i}>
                    {v.name} ({v.lang})
                  </option>
                ))
              ) : (
                <option value={0}>Default Browser Voice</option>
              )}
            </select>
          </div>

          {/* Rate Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300">Speed Rate</span>
              <span className="font-mono text-pink-400">{rate}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
            />
          </div>

          {/* Pitch Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300">Pitch</span>
              <span className="font-mono text-pink-400">{pitch}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.1"
              value={pitch}
              onChange={(e) => setPitch(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
