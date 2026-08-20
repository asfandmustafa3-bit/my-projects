import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Mic,
  FileAudio,
  Radio,
  Sparkles,
  StopCircle,
  ArrowRight,
  Headphones,
} from 'lucide-react';
import { getAudioContext, generateSyntheticSample } from '../utils/audioProcessor';

export interface AudioUploaderProps {
  onAudioLoaded: (buffer: AudioBuffer, fileMeta: { name: string; size: number; type: string } | Blob) => void;
  onSelectSample?: (type: 'podcast' | 'lecture' | 'interview') => void;
  isLoading?: boolean;
  setIsLoading?: (val: boolean) => void;
  onSetLoadingMessage?: (msg: string) => void;
}

export const AudioUploader: React.FC<AudioUploaderProps> = ({
  onAudioLoaded,
  onSelectSample,
  isLoading = false,
  setIsLoading,
  onSetLoadingMessage,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [micLevel, setMicLevel] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Recording references
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordIntervalRef = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const safeSetLoading = (loading: boolean, msg?: string) => {
    if (typeof setIsLoading === 'function') {
      setIsLoading(loading);
    }
    if (msg && typeof onSetLoadingMessage === 'function') {
      onSetLoadingMessage(msg);
    }
  };

  // Handle Drag Events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file: File) => {
    safeSetLoading(true, `Decoding audio file "${file.name}"...`);

    try {
      const ctx = getAudioContext();
      const arrayBuffer = await file.arrayBuffer();
      const decodedBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));

      onAudioLoaded(decodedBuffer, {
        name: file.name,
        size: file.size,
        type: file.type || 'audio/wav',
      });
    } catch (err) {
      console.error('Error decoding audio file:', err);
      alert('Could not decode this audio file. Please ensure it is a valid MP3, WAV, M4A, AAC, or MP4 audio track.');
    } finally {
      safeSetLoading(false);
    }
  };

  // Handle Synthetic Sample Loading
  const handleLoadSample = async (sampleType: 'podcast' | 'lecture' | 'interview') => {
    if (onSelectSample) {
      onSelectSample(sampleType);
      return;
    }

    safeSetLoading(true);
    const titles = {
      podcast: 'Podcast Interview with Pauses',
      lecture: 'University Lecture with Dead Air',
      interview: 'Voiceover Script with Pauses',
    };
    safeSetLoading(true, `Generating sample audio "${titles[sampleType]}"...`);

    try {
      const { buffer, fileName } = await generateSyntheticSample(sampleType);
      onAudioLoaded(buffer, {
        name: fileName,
        size: buffer.length * buffer.numberOfChannels * 2,
        type: 'audio/wav',
      });
    } catch (err) {
      console.error('Failed to load sample audio:', err);
    } finally {
      safeSetLoading(false);
    }
  };

  // Start in-browser microphone recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioCtx = getAudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Monitor volume level
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateMicMeter = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setMicLevel(Math.min(100, Math.round((avg / 128) * 100)));
        animFrameRef.current = requestAnimationFrame(updateMicMeter);
      };
      updateMicMeter();

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        safeSetLoading(true, 'Processing recorded microphone audio...');

        try {
          const ctx = getAudioContext();
          const arrayBuffer = await audioBlob.arrayBuffer();
          const decoded = await ctx.decodeAudioData(arrayBuffer);
          onAudioLoaded(decoded, {
            name: `Mic-Recording-${new Date().toLocaleTimeString().replace(/:/g, '-')}.wav`,
            size: audioBlob.size,
            type: 'audio/wav',
          });
        } catch (err) {
          console.error('Error decoding recording:', err);
          alert('Failed to process microphone audio recording.');
        } finally {
          safeSetLoading(false);
        }
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingSeconds(0);

      recordIntervalRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access denied or error:', err);
      alert('Could not access microphone. Please ensure microphone permissions are granted in browser.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    if (recordIntervalRef.current) {
      clearInterval(recordIntervalRef.current);
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    setIsRecording(false);
  };

  useEffect(() => {
    return () => {
      if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div id="audio-uploader-container" className="space-y-6">
      {/* Drag and Drop Zone */}
      <div
        id="drop-zone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isRecording && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all cursor-pointer group ${
          isDragging
            ? 'border-indigo-500 bg-indigo-950/40 scale-[1.01]'
            : 'border-slate-800 bg-slate-900/50 hover:bg-slate-900/90 hover:border-slate-700'
        }`}
      >
        <input
          ref={fileInputRef}
          id="audio-file-input"
          type="file"
          accept="audio/*,video/mp4,video/webm"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform shadow-lg shadow-indigo-500/10">
            <Upload className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-white mb-1">
              Drop your audio file here or <span className="text-indigo-400 underline decoration-indigo-500/50 underline-offset-4">browse files</span>
            </h3>
            <p className="text-xs text-slate-400">
              Supports MP3, WAV, M4A, AAC, FLAC, OGG, WebM, and MP4 audio
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              id="record-mic-btn"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (isRecording) {
                  stopRecording();
                } else {
                  startRecording();
                }
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md cursor-pointer ${
                isRecording
                  ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              {isRecording ? (
                <>
                  <StopCircle className="w-4 h-4" />
                  <span>Stop Recording ({recordingSeconds}s)</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 text-red-400" />
                  <span>Record from Mic</span>
                </>
              )}
            </button>
          </div>

          {/* Live Mic Meter while recording */}
          {isRecording && (
            <div className="mt-4 p-3 bg-slate-950 rounded-xl border border-red-500/40 text-left">
              <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5 font-mono">
                <span className="flex items-center gap-1.5 text-red-400">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span> Live Recording...
                </span>
                <span>{recordingSeconds}s</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 transition-all duration-75"
                  style={{ width: `${micLevel}%` }}
                ></div>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Speak into your mic with natural pauses, then click Stop.</p>
            </div>
          )}
        </div>
      </div>

      {/* Instant Demo Samples Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Or try with instant pre-loaded sample audio:
          </span>
          <span className="text-[11px] text-slate-500">No file upload required</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Sample 1: Podcast */}
          <button
            id="sample-podcast-btn"
            type="button"
            onClick={() => handleLoadSample('podcast')}
            className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/80 transition-all text-left group cursor-pointer"
          >
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
              <Radio className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-200 group-hover:text-white">Podcast Interview</h4>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Has ~8.5s of dead air pauses</p>
            </div>
          </button>

          {/* Sample 2: Lecture */}
          <button
            id="sample-lecture-btn"
            type="button"
            onClick={() => handleLoadSample('lecture')}
            className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/80 transition-all text-left group cursor-pointer"
          >
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition-colors">
              <Headphones className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-200 group-hover:text-white">Lecture Presentation</h4>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Contains long gaps between slides</p>
            </div>
          </button>

          {/* Sample 3: Voiceover */}
          <button
            id="sample-voiceover-btn"
            type="button"
            onClick={() => handleLoadSample('interview')}
            className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/80 transition-all text-left group cursor-pointer"
          >
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
              <FileAudio className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-200 group-hover:text-white">Voiceover Script</h4>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Spaced out line rehearsal takes</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
