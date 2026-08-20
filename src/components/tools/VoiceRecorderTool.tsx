import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Play,
  Pause,
  RotateCcw,
  Download,
  Send,
  Sparkles,
  Volume2,
  FileText,
  Scissors,
  VolumeX,
} from 'lucide-react';
import { decodeAudioFile, getAudioContext } from '../../utils/audioProcessor';
import { ToolTab } from '../../types';

interface VoiceRecorderToolProps {
  onAudioRecorded: (buffer: AudioBuffer, blob: Blob, fileName: string) => void;
  onNavigateToTool: (tool: ToolTab) => void;
}

export const VoiceRecorderTool: React.FC<VoiceRecorderToolProps> = ({
  onAudioRecorded,
  onNavigateToTool,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedBuffer, setRecordedBuffer] = useState<AudioBuffer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  // Live Canvas Visualizer Loop
  const drawVisualizer = () => {
    if (!analyserRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const barWidth = (canvas.width / bufferLength) * 2.5;
    let barHeight;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      barHeight = (dataArray[i] / 255) * canvas.height;

      // Gradient color from indigo to cyan
      const grad = ctx.createLinearGradient(0, canvas.height, 0, 0);
      grad.addColorStop(0, '#6366f1');
      grad.addColorStop(1, '#38bdf8');

      ctx.fillStyle = grad;
      ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

      x += barWidth + 1;
    }

    animFrameRef.current = requestAnimationFrame(drawVisualizer);
  };

  const startRecording = async () => {
    try {
      setMicPermissionDenied(false);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      streamRef.current = stream;
      const ctx = getAudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      source.connect(analyser);
      analyserRef.current = analyser;

      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(audioBlob);

        try {
          const buffer = await decodeAudioFile(audioBlob);
          setRecordedBuffer(buffer);
        } catch (err) {
          console.error('Error decoding recorded audio:', err);
        }

        // Stop stream tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }
      };

      mediaRecorder.start(100);
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);

      // Start timer
      timerIntervalRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      // Start Visualizer
      drawVisualizer();
    } catch (err) {
      console.error('Microphone access denied:', err);
      setMicPermissionDenied(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);

      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    }
  };

  const handlePlayPreview = () => {
    if (!recordedBuffer) return;
    const ctx = getAudioContext();

    if (isPlaying) {
      if (sourceNodeRef.current) {
        try {
          sourceNodeRef.current.stop();
        } catch (_) {}
      }
      setIsPlaying(false);
      return;
    }

    const source = ctx.createBufferSource();
    source.buffer = recordedBuffer;
    source.connect(ctx.destination);
    source.onended = () => setIsPlaying(false);
    source.start(0);

    sourceNodeRef.current = source;
    setIsPlaying(true);
  };

  const handleSendToTool = (tool: ToolTab) => {
    if (!recordedBuffer || !recordedBlob) return;
    onAudioRecorded(recordedBuffer, recordedBlob, `Voice_Recording_${new Date().toISOString().slice(0, 10)}.wav`);
    onNavigateToTool(tool);
  };

  const handleDownloadWav = () => {
    if (!recordedBlob) return;
    const url = URL.createObjectURL(recordedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voice_recording_${Date.now()}.webm`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-yellow-950/60 border border-amber-500/30 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-600/30 border border-amber-500/40 flex items-center justify-center text-amber-300">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Voice Recorder & Live Transcribe</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-semibold">
                High Fidelity
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Record voice notes directly in your browser with real-time frequency visualizer.
            </p>
          </div>
        </div>
      </div>

      {micPermissionDenied && (
        <div className="bg-rose-950/40 border border-rose-500/40 rounded-2xl p-4 text-xs text-rose-300">
          <strong>Microphone permission denied:</strong> Please grant microphone permissions in your browser bar to use the voice recorder.
        </div>
      )}

      {/* Recording Stage */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col items-center justify-center space-y-6 text-center shadow-xl">
        {/* Timer Display */}
        <div className="space-y-1">
          <span className="text-4xl sm:text-5xl font-mono font-black text-white tracking-wider">
            {formatTime(recordingTime)}
          </span>
          <p className="text-xs text-slate-400 font-medium">
            {isRecording ? (
              <span className="text-rose-400 font-bold flex items-center justify-center gap-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Live Recording Audio...
              </span>
            ) : recordedBuffer ? (
              'Recording Completed'
            ) : (
              'Ready to Record Voice Note'
            )}
          </p>
        </div>

        {/* Live Audio Visualizer Canvas */}
        <div className="w-full max-w-lg h-24 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-center relative p-2 shadow-inner">
          <canvas
            ref={canvasRef}
            width={500}
            height={90}
            className="w-full h-full"
          />
          {!isRecording && !recordedBuffer && (
            <span className="absolute text-xs text-slate-600 font-semibold select-none">
              Audio Frequency Spectrum
            </span>
          )}
        </div>

        {/* Main Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-xl shadow-rose-600/30 transition-all cursor-pointer hover:scale-105"
            >
              <Mic className="w-5 h-5" />
              <span>{recordedBuffer ? 'Record New Voice' : 'Start Recording'}</span>
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 shadow-xl transition-all cursor-pointer"
            >
              <Square className="w-4 h-4 text-rose-500 fill-rose-500" />
              <span>Stop & Save Recording</span>
            </button>
          )}

          {recordedBuffer && !isRecording && (
            <>
              <button
                onClick={handlePlayPreview}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
              >
                {isPlaying ? <Pause className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4 text-amber-400" />}
                <span>{isPlaying ? 'Pause' : 'Play Recording'}</span>
              </button>

              <button
                onClick={handleDownloadWav}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4 text-slate-400" />
                <span>Save WebM</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Quick 1-Click Studio Actions when Audio is recorded */}
      {recordedBuffer && !isRecording && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Process Recording In Studio Tools</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => handleSendToTool('silence')}
              className="p-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Scissors className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white group-hover:text-indigo-300">
                    Cut Dead Air & Silence
                  </p>
                  <p className="text-[10px] text-slate-400">Remove pauses automatically</p>
                </div>
              </div>
              <Send className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-transform group-hover:translate-x-1" />
            </button>

            <button
              onClick={() => handleSendToTool('transcribe')}
              className="p-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white group-hover:text-emerald-300">
                    AI Speech to Text
                  </p>
                  <p className="text-[10px] text-slate-400">Transcribe & extract notes</p>
                </div>
              </div>
              <Send className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-transform group-hover:translate-x-1" />
            </button>

            <button
              onClick={() => handleSendToTool('noise')}
              className="p-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
                  <VolumeX className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white group-hover:text-teal-300">
                    Clean Background Noise
                  </p>
                  <p className="text-[10px] text-slate-400">Filter hum & hiss</p>
                </div>
              </div>
              <Send className="w-4 h-4 text-slate-500 group-hover:text-teal-400 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
