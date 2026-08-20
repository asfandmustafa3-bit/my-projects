import { AudioSegment, DetectionSettings, AudioStats } from '../types';

let sharedAudioCtx: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    sharedAudioCtx = new AudioCtx();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

/**
 * Decodes audio File or Blob into an AudioBuffer using the Web Audio API
 */
export async function decodeAudioFile(file: File | Blob): Promise<AudioBuffer> {
  const ctx = getAudioContext();
  const arrayBuffer = await file.arrayBuffer();
  // Clone arrayBuffer because decodeAudioData can detach it in some browsers
  const clonedBuffer = arrayBuffer.slice(0);
  return await ctx.decodeAudioData(clonedBuffer);
}

/**
 * Detects silent intervals in an AudioBuffer based on user parameters
 */
export function detectSilence(
  audioBuffer: AudioBuffer,
  settings: DetectionSettings
): AudioSegment[] {
  const sampleRate = audioBuffer.sampleRate;
  const numChannels = audioBuffer.numberOfChannels;
  const totalDuration = audioBuffer.duration;
  const length = audioBuffer.length;

  if (totalDuration <= 0 || length <= 0) {
    return [];
  }

  // Frame size: ~20ms
  const frameSamples = Math.floor(sampleRate * 0.02);
  const totalFrames = Math.floor(length / frameSamples);

  // Extract channel data
  const channelData: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) {
    channelData.push(audioBuffer.getChannelData(c));
  }

  // Compute RMS energy in dB for each frame
  const frameDbs = new Float32Array(totalFrames);
  const framePeaks = new Float32Array(totalFrames);

  for (let f = 0; f < totalFrames; f++) {
    const startIdx = f * frameSamples;
    const endIdx = Math.min(startIdx + frameSamples, length);
    let sumSquares = 0;
    let peak = 0;
    const count = (endIdx - startIdx) * numChannels;

    for (let c = 0; c < numChannels; c++) {
      const data = channelData[c];
      for (let i = startIdx; i < endIdx; i++) {
        const val = data[i];
        const absVal = Math.abs(val);
        if (absVal > peak) peak = absVal;
        sumSquares += val * val;
      }
    }

    const rms = Math.sqrt(sumSquares / Math.max(1, count));
    // Convert to dB
    const db = rms > 0.000001 ? 20 * Math.log10(rms) : -100;
    const peakDb = peak > 0.000001 ? 20 * Math.log10(peak) : -100;

    frameDbs[f] = Math.max(-100, db);
    framePeaks[f] = Math.max(-100, peakDb);
  }

  // Detect raw silence intervals where frameDb < settings.thresholdDb
  const threshold = settings.thresholdDb;
  const rawSilences: { startFrame: number; endFrame: number; avgDb: number; peakDb: number }[] = [];

  let inSilence = false;
  let silenceStartFrame = 0;
  let silenceDbSum = 0;
  let silencePeakMax = -100;

  for (let f = 0; f < totalFrames; f++) {
    const isSilent = frameDbs[f] < threshold;

    if (isSilent) {
      if (!inSilence) {
        inSilence = true;
        silenceStartFrame = f;
        silenceDbSum = frameDbs[f];
        silencePeakMax = framePeaks[f];
      } else {
        silenceDbSum += frameDbs[f];
        if (framePeaks[f] > silencePeakMax) silencePeakMax = framePeaks[f];
      }
    } else {
      if (inSilence) {
        inSilence = false;
        const framesCount = f - silenceStartFrame;
        rawSilences.push({
          startFrame: silenceStartFrame,
          endFrame: f,
          avgDb: silenceDbSum / framesCount,
          peakDb: silencePeakMax,
        });
      }
    }
  }

  // Handle ending in silence
  if (inSilence) {
    const framesCount = totalFrames - silenceStartFrame;
    rawSilences.push({
      startFrame: silenceStartFrame,
      endFrame: totalFrames,
      avgDb: silenceDbSum / Math.max(1, framesCount),
      peakDb: silencePeakMax,
    });
  }

  const minDurationSec = settings.minDurationMs / 1000;
  const paddingSec = settings.paddingMs / 1000;

  // Filter raw silences by minimum duration and apply padding buffer
  const validSilenceIntervals: { start: number; end: number; avgDb: number; peakDb: number }[] = [];

  for (const raw of rawSilences) {
    const rawStartSec = (raw.startFrame * frameSamples) / sampleRate;
    const rawEndSec = (raw.endFrame * frameSamples) / sampleRate;
    const rawDuration = rawEndSec - rawStartSec;

    if (rawDuration >= minDurationSec) {
      // Add padding: shrink the silence interval so speech has buffer
      let paddedStart = rawStartSec + paddingSec;
      let paddedEnd = rawEndSec - paddingSec;

      // If silence is near start or end of entire file, don't pad beyond edges
      if (rawStartSec < 0.05) paddedStart = 0;
      if (rawEndSec > totalDuration - 0.05) paddedEnd = totalDuration;

      if (paddedEnd - paddedStart >= 0.05) {
        validSilenceIntervals.push({
          start: Math.max(0, paddedStart),
          end: Math.min(totalDuration, paddedEnd),
          avgDb: raw.avgDb,
          peakDb: raw.peakDb,
        });
      }
    }
  }

  // Combine into a full continuous track of segments (Speech & Silence)
  const segments: AudioSegment[] = [];
  let currentTime = 0;
  let segmentId = 1;

  for (const sil of validSilenceIntervals) {
    // If there's speech before this silence
    if (sil.start > currentTime + 0.01) {
      const speechDuration = sil.start - currentTime;
      segments.push({
        id: `seg-${segmentId++}`,
        start: currentTime,
        end: sil.start,
        duration: speechDuration,
        isSilence: false,
        enabled: false,
        avgDb: -18,
        peakDb: -6,
      });
    }

    // Add silence segment
    const silDuration = sil.end - Math.max(currentTime, sil.start);
    if (silDuration > 0.01) {
      segments.push({
        id: `seg-${segmentId++}`,
        start: Math.max(currentTime, sil.start),
        end: sil.end,
        duration: silDuration,
        isSilence: true,
        enabled: true, // Enabled by default to be cut/shortened
        avgDb: Math.round(sil.avgDb * 10) / 10,
        peakDb: Math.round(sil.peakDb * 10) / 10,
      });
    }

    currentTime = Math.max(currentTime, sil.end);
  }

  // Add trailing speech if any
  if (currentTime < totalDuration - 0.01) {
    segments.push({
      id: `seg-${segmentId++}`,
      start: currentTime,
      end: totalDuration,
      duration: totalDuration - currentTime,
      isSilence: false,
      enabled: false,
      avgDb: -18,
      peakDb: -6,
    });
  }

  return segments;
}

/**
 * Calculates time saved and audio statistics
 */
export function calculateStats(
  originalDuration: number,
  segments: AudioSegment[],
  settings: DetectionSettings
): AudioStats {
  if (originalDuration <= 0) {
    return {
      originalDuration: 0,
      processedDuration: 0,
      timeSaved: 0,
      timeSavedPercent: 0,
      silenceCount: 0,
      speechCount: 0,
      silenceTotalSeconds: 0,
      averageSilenceDuration: 0,
    };
  }

  let silenceTotalSeconds = 0;
  let silenceCount = 0;
  let speechCount = 0;
  let processedDuration = 0;

  for (const seg of segments) {
    if (seg.isSilence) {
      silenceTotalSeconds += seg.duration;
      silenceCount++;

      if (!seg.enabled) {
        // Kept as is
        processedDuration += seg.duration;
      } else {
        // Cut or modified
        if (settings.mode === 'cut') {
          // 0 seconds added
        } else if (settings.mode === 'shorten') {
          const shortenedSec = settings.shortenToMs / 1000;
          processedDuration += Math.min(seg.duration, shortenedSec);
        } else if (settings.mode === 'speed') {
          processedDuration += seg.duration / Math.max(1, settings.speedMultiplier);
        }
      }
    } else {
      speechCount++;
      processedDuration += seg.duration;
    }
  }

  const timeSaved = Math.max(0, originalDuration - processedDuration);
  const timeSavedPercent = originalDuration > 0 ? (timeSaved / originalDuration) * 100 : 0;
  const averageSilenceDuration = silenceCount > 0 ? silenceTotalSeconds / silenceCount : 0;

  return {
    originalDuration,
    processedDuration,
    timeSaved,
    timeSavedPercent,
    silenceCount,
    speechCount,
    silenceTotalSeconds,
    averageSilenceDuration,
  };
}

/**
 * Renders the cleaned AudioBuffer with smooth micro-crossfades to prevent clicks
 */
export async function renderProcessedAudio(
  audioBuffer: AudioBuffer,
  segments: AudioSegment[],
  settings: DetectionSettings
): Promise<AudioBuffer> {
  const sampleRate = audioBuffer.sampleRate;
  const numChannels = audioBuffer.numberOfChannels;
  const ctx = getAudioContext();

  // Determine segments to keep
  interface OutputPiece {
    sourceStartSample: number;
    sourceEndSample: number;
    speed: number;
    isSilence: boolean;
  }

  const pieces: OutputPiece[] = [];

  for (const seg of segments) {
    const startSample = Math.floor(seg.start * sampleRate);
    const endSample = Math.min(audioBuffer.length, Math.floor(seg.end * sampleRate));

    if (!seg.isSilence) {
      // Speech segment - always keep 100%
      pieces.push({
        sourceStartSample: startSample,
        sourceEndSample: endSample,
        speed: 1.0,
        isSilence: false,
      });
    } else {
      // Silence segment
      if (!seg.enabled) {
        // User turned off removal for this silence, keep it normal
        pieces.push({
          sourceStartSample: startSample,
          sourceEndSample: endSample,
          speed: 1.0,
          isSilence: true,
        });
      } else {
        if (settings.mode === 'cut') {
          // Skip completely
        } else if (settings.mode === 'shorten') {
          const maxSamples = Math.floor((settings.shortenToMs / 1000) * sampleRate);
          const actualSamples = Math.min(endSample - startSample, maxSamples);
          pieces.push({
            sourceStartSample: startSample,
            sourceEndSample: startSample + actualSamples,
            speed: 1.0,
            isSilence: true,
          });
        } else if (settings.mode === 'speed') {
          pieces.push({
            sourceStartSample: startSample,
            sourceEndSample: endSample,
            speed: Math.max(1, settings.speedMultiplier),
            isSilence: true,
          });
        }
      }
    }
  }

  // Calculate total output length
  let totalOutputSamples = 0;
  for (const p of pieces) {
    const sourceLen = p.sourceEndSample - p.sourceStartSample;
    const outLen = Math.floor(sourceLen / p.speed);
    totalOutputSamples += outLen;
  }

  if (totalOutputSamples <= 0) {
    // Return empty buffer or tiny buffer
    return ctx.createBuffer(numChannels, sampleRate, sampleRate);
  }

  // Create destination AudioBuffer
  const outputBuffer = ctx.createBuffer(numChannels, totalOutputSamples, sampleRate);

  // Crossfade length: ~5ms to avoid pops
  const crossfadeSamples = Math.min(Math.floor(sampleRate * 0.005), 256);

  for (let c = 0; c < numChannels; c++) {
    const srcData = audioBuffer.getChannelData(c);
    const dstData = outputBuffer.getChannelData(c);
    let dstIdx = 0;

    for (let pIdx = 0; pIdx < pieces.length; pIdx++) {
      const p = pieces[pIdx];
      const sourceLen = p.sourceEndSample - p.sourceStartSample;

      if (p.speed === 1.0) {
        // Direct copy with micro-fade at transitions
        for (let i = 0; i < sourceLen && dstIdx < totalOutputSamples; i++) {
          let sampleVal = srcData[p.sourceStartSample + i];

          // Fade-in at the very start of a piece (if after a cut)
          if (pIdx > 0 && i < crossfadeSamples) {
            const gain = 0.5 * (1 - Math.cos((Math.PI * i) / crossfadeSamples));
            sampleVal *= gain;
          }
          // Fade-out at the very end of a piece
          if (pIdx < pieces.length - 1 && i >= sourceLen - crossfadeSamples) {
            const rem = sourceLen - 1 - i;
            const gain = 0.5 * (1 - Math.cos((Math.PI * rem) / crossfadeSamples));
            sampleVal *= gain;
          }

          dstData[dstIdx++] = sampleVal;
        }
      } else {
        // Resample/speed up silence piece
        const outLen = Math.floor(sourceLen / p.speed);
        for (let i = 0; i < outLen && dstIdx < totalOutputSamples; i++) {
          const srcPos = p.sourceStartSample + i * p.speed;
          const idx0 = Math.floor(srcPos);
          const idx1 = Math.min(idx0 + 1, audioBuffer.length - 1);
          const frac = srcPos - idx0;

          let sampleVal = srcData[idx0] * (1 - frac) + srcData[idx1] * frac;

          if (pIdx > 0 && i < crossfadeSamples) {
            const gain = 0.5 * (1 - Math.cos((Math.PI * i) / crossfadeSamples));
            sampleVal *= gain;
          }
          if (pIdx < pieces.length - 1 && i >= outLen - crossfadeSamples) {
            const rem = outLen - 1 - i;
            const gain = 0.5 * (1 - Math.cos((Math.PI * rem) / crossfadeSamples));
            sampleVal *= gain;
          }

          dstData[dstIdx++] = sampleVal;
        }
      }
    }
  }

  // Audio Normalization if requested
  if (settings.normalizeAudio) {
    let peak = 0;
    for (let c = 0; c < numChannels; c++) {
      const data = outputBuffer.getChannelData(c);
      for (let i = 0; i < outputBuffer.length; i++) {
        const absVal = Math.abs(data[i]);
        if (absVal > peak) peak = absVal;
      }
    }

    if (peak > 0.001) {
      const targetPeak = 0.94; // -0.5 dB
      const gain = targetPeak / peak;
      for (let c = 0; c < numChannels; c++) {
        const data = outputBuffer.getChannelData(c);
        for (let i = 0; i < outputBuffer.length; i++) {
          data[i] *= gain;
        }
      }
    }
  }

  return outputBuffer;
}

/**
 * Converts an AudioBuffer to a WAV Blob (16-bit PCM standard)
 */
export function audioBufferToWav(
  buffer: AudioBuffer,
  options?: { bitDepth?: 16 | 24 | 32 } | '16bit' | '24bit' | '32bit'
): Blob {
  let bitDepth: 16 | 24 | 32 = 16;
  if (typeof options === 'string') {
    if (options === '24bit') bitDepth = 24;
    else if (options === '32bit') bitDepth = 32;
    else bitDepth = 16;
  } else if (options?.bitDepth) {
    bitDepth = options.bitDepth;
  }
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const length = buffer.length;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = length * blockAlign;
  const bufferSize = 44 + dataSize;

  const arrayBuffer = new ArrayBuffer(bufferSize);
  const view = new DataView(arrayBuffer);

  // Write RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');

  // Write "fmt " sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, bitDepth === 32 ? 3 : 1, true); // 1 = PCM, 3 = IEEE Float
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);

  // Write "data" sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Interleave channels & write samples
  const channels: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) {
    channels.push(buffer.getChannelData(c));
  }

  let offset = 44;
  if (bitDepth === 16) {
    for (let i = 0; i < length; i++) {
      for (let c = 0; c < numChannels; c++) {
        let sample = channels[c][i];
        // Clip sample
        sample = Math.max(-1, Math.min(1, sample));
        // Scale to 16-bit integer
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        view.setInt16(offset, intSample, true);
        offset += 2;
      }
    }
  } else if (bitDepth === 24) {
    for (let i = 0; i < length; i++) {
      for (let c = 0; c < numChannels; c++) {
        let sample = channels[c][i];
        sample = Math.max(-1, Math.min(1, sample));
        const intSample = sample < 0 ? sample * 0x800000 : sample * 0x7fffff;
        const intVal = Math.floor(intSample);
        view.setUint8(offset, intVal & 0xff);
        view.setUint8(offset + 1, (intVal >> 8) & 0xff);
        view.setUint8(offset + 2, (intVal >> 16) & 0xff);
        offset += 3;
      }
    }
  } else if (bitDepth === 32) {
    for (let i = 0; i < length; i++) {
      for (let c = 0; c < numChannels; c++) {
        view.setFloat32(offset, channels[c][i], true);
        offset += 4;
      }
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Resamples an AudioBuffer to 16kHz mono WAV for high-speed speech transcription
 */
export function resampleTo16kMonoWavBlob(buffer: AudioBuffer): Blob {
  const targetSampleRate = 16000;
  const numChannels = buffer.numberOfChannels;
  const totalTargetSamples = Math.max(1, Math.floor(buffer.duration * targetSampleRate));

  // Mix down channels to mono float32
  const monoData = new Float32Array(buffer.length);
  for (let c = 0; c < numChannels; c++) {
    const channel = buffer.getChannelData(c);
    for (let i = 0; i < buffer.length; i++) {
      monoData[i] += channel[i] / numChannels;
    }
  }

  // Linear interpolation resampling
  const resampled = new Float32Array(totalTargetSamples);
  const ratio = buffer.length / totalTargetSamples;
  for (let i = 0; i < totalTargetSamples; i++) {
    const srcIndex = i * ratio;
    const i0 = Math.floor(srcIndex);
    const i1 = Math.min(i0 + 1, buffer.length - 1);
    const frac = srcIndex - i0;
    resampled[i] = monoData[i0] * (1 - frac) + monoData[i1] * frac;
  }

  // Create 16-bit PCM WAV Blob
  const byteLength = 44 + totalTargetSamples * 2;
  const arrayBuffer = new ArrayBuffer(byteLength);
  const view = new DataView(arrayBuffer);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + totalTargetSamples * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, 1, true); // AudioFormat PCM = 1
  view.setUint16(22, 1, true); // NumChannels = 1
  view.setUint32(24, targetSampleRate, true); // SampleRate = 16000
  view.setUint32(28, targetSampleRate * 2, true); // ByteRate = 16000 * 1 * 2
  view.setUint16(32, 2, true); // BlockAlign = 1 * 2
  view.setUint16(34, 16, true); // BitsPerSample = 16
  writeString(view, 36, 'data');
  view.setUint32(40, totalTargetSamples * 2, true);

  let offset = 44;
  for (let i = 0; i < totalTargetSamples; i++) {
    const s = Math.max(-1, Math.min(1, resampled[i]));
    const intSample = s < 0 ? s * 0x8000 : s * 0x7fff;
    view.setInt16(offset, intSample, true);
    offset += 2;
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

/**
 * Formats seconds into MM:SS.ms or MM:SS
 */
export function formatTime(seconds: number, includeMs = false): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);

  const formattedMins = mins.toString();
  const formattedSecs = secs < 10 ? `0${secs}` : secs.toString();

  if (includeMs) {
    const formattedMs = ms < 10 ? `0${ms}` : ms.toString();
    return `${formattedMins}:${formattedSecs}.${formattedMs}`;
  }
  return `${formattedMins}:${formattedSecs}`;
}

/**
 * Exports Cut Timeline Data to CSV, EDL, Audacity labels, or JSON
 */
export function exportEdlOrCsv(
  segments: AudioSegment[],
  format: 'csv' | 'edl' | 'audacity' | 'json',
  originalFileName: string
): string {
  const silenceSegments = segments.filter((s) => s.isSilence && s.enabled);

  if (format === 'json') {
    return JSON.stringify(
      {
        fileName: originalFileName,
        exportedAt: new Date().toISOString(),
        totalSegments: segments.length,
        silenceCutCount: silenceSegments.length,
        cuts: silenceSegments.map((s, idx) => ({
          index: idx + 1,
          startSec: s.start,
          endSec: s.end,
          durationSec: s.duration,
          avgDb: s.avgDb,
        })),
        allSegments: segments,
      },
      null,
      2
    );
  }

  if (format === 'csv') {
    const rows = ['Index,Type,Start (s),End (s),Duration (s),Avg dB,Action'];
    segments.forEach((s, idx) => {
      rows.push(
        `${idx + 1},${s.isSilence ? 'Silence' : 'Speech'},${s.start.toFixed(3)},${s.end.toFixed(3)},${s.duration.toFixed(3)},${s.avgDb},${s.isSilence && s.enabled ? 'Remove' : 'Keep'}`
      );
    });
    return rows.join('\n');
  }

  if (format === 'audacity') {
    // Audacity label track: StartTime\tEndTime\tLabelName
    return silenceSegments
      .map(
        (s, idx) =>
          `${s.start.toFixed(6)}\t${s.end.toFixed(6)}\tSilence Cut #${idx + 1}`
      )
      .join('\n');
  }

  if (format === 'edl') {
    // Standard CMX 3600 EDL for Premiere / DaVinci Resolve
    const lines = [
      `TITLE: ${originalFileName.replace(/[^a-zA-Z0-9_-]/g, '_')}_SILENCE_CUTS`,
      'FCM: NON-DROP FRAME',
      '',
    ];

    let eventNum = 1;
    const speechSegments = segments.filter((s) => !s.isSilence || !s.enabled);

    speechSegments.forEach((seg) => {
      const startTc = secondsToTimecode(seg.start);
      const endTc = secondsToTimecode(seg.end);
      const outStartTc = secondsToTimecode(seg.start);
      const outEndTc = secondsToTimecode(seg.end);

      const numStr = eventNum.toString().padStart(3, '0');
      lines.push(`${numStr}  AX       AA/V  C        ${startTc} ${endTc} ${outStartTc} ${outEndTc}`);
      lines.push(`* FROM CLIP NAME: ${originalFileName}`);
      lines.push('');
      eventNum++;
    });

    return lines.join('\n');
  }

  return '';
}

function secondsToTimecode(sec: number, fps = 30): string {
  const totalFrames = Math.floor(sec * fps);
  const frames = totalFrames % fps;
  const totalSeconds = Math.floor(sec);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const hours = Math.floor(totalSeconds / 3600);

  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}:${pad(frames)}`;
}

/**
 * Generates rich synthetic audio samples with natural pauses to test the silence remover instantly
 */
export async function generateSyntheticSample(
  sampleType: 'podcast' | 'lecture' | 'interview'
): Promise<{ buffer: AudioBuffer; fileName: string }> {
  const ctx = getAudioContext();
  const sampleRate = 44100;

  // Let's create realistic audio tracks with modulated formant pulses and pauses
  interface SpeechPhrase {
    duration: number; // in seconds
    pauseAfter: number; // in seconds
    baseFreq: number;
    speed: number;
  }

  let phrases: SpeechPhrase[] = [];
  let fileName = 'sample-audio.wav';

  if (sampleType === 'podcast') {
    fileName = 'podcast-host-interview.wav';
    phrases = [
      { duration: 2.8, pauseAfter: 1.8, baseFreq: 140, speed: 1.2 }, // "Welcome back to episode 42..." (awkward 1.8s pause)
      { duration: 3.4, pauseAfter: 2.2, baseFreq: 135, speed: 1.1 }, // "Today we're talking about silence detection..." (2.2s dead air)
      { duration: 2.6, pauseAfter: 1.5, baseFreq: 155, speed: 1.3 }, // "Let me think about that question for a second..." (1.5s pause)
      { duration: 4.1, pauseAfter: 2.5, baseFreq: 130, speed: 1.0 }, // "It really saves a lot of editing time..." (2.5s pause)
      { duration: 3.0, pauseAfter: 0.5, baseFreq: 145, speed: 1.2 }, // "Let's wrap up this segment."
    ];
  } else if (sampleType === 'lecture') {
    fileName = 'university-lecture-pauses.wav';
    phrases = [
      { duration: 3.2, pauseAfter: 2.8, baseFreq: 120, speed: 0.9 }, // Professor speaking then flipping slides (2.8s gap)
      { duration: 4.0, pauseAfter: 3.2, baseFreq: 125, speed: 0.9 }, // Explaining formula, then long drink of water (3.2s gap)
      { duration: 3.5, pauseAfter: 2.4, baseFreq: 118, speed: 1.0 }, // Reviewing blackboard notes (2.4s gap)
      { duration: 3.8, pauseAfter: 0.8, baseFreq: 122, speed: 1.0 }, // Concluding remarks
    ];
  } else {
    fileName = 'voiceover-script-take.wav';
    phrases = [
      { duration: 2.2, pauseAfter: 1.6, baseFreq: 160, speed: 1.1 }, // Take 1
      { duration: 2.5, pauseAfter: 2.0, baseFreq: 165, speed: 1.2 }, // Take 2
      { duration: 3.0, pauseAfter: 1.9, baseFreq: 158, speed: 1.1 }, // Take 3
      { duration: 2.8, pauseAfter: 0.5, baseFreq: 162, speed: 1.1 }, // Final read
    ];
  }

  let totalDuration = 0;
  for (const p of phrases) {
    totalDuration += p.duration + p.pauseAfter;
  }

  const totalSamples = Math.floor(totalDuration * sampleRate);
  const buffer = ctx.createBuffer(2, totalSamples, sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  let currentSampleOffset = 0;

  for (const p of phrases) {
    const phraseSamples = Math.floor(p.duration * sampleRate);
    const pauseSamples = Math.floor(p.pauseAfter * sampleRate);

    // Synthesize human-like speech syllables with vibrato, formant harmonics, and envelope
    for (let i = 0; i < phraseSamples; i++) {
      const t = i / sampleRate;
      // Syllable rhythm envelope (~3-4 syllables per second)
      const syllableEnv = Math.pow(Math.sin(2 * Math.PI * 3.5 * t * p.speed), 2);
      // Main phrase envelope (gentle attack and decay)
      const phraseEnv = Math.sin((Math.PI * i) / phraseSamples);

      // Pitch variation (prosody inflection)
      const pitchMod = Math.sin(2 * Math.PI * 1.2 * t) * 15;
      const freq0 = p.baseFreq + pitchMod;

      // Harmonics (rich vocal tract simulation)
      const h1 = Math.sin(2 * Math.PI * freq0 * t) * 0.45;
      const h2 = Math.sin(2 * Math.PI * (freq0 * 2.02) * t) * 0.25;
      const h3 = Math.sin(2 * Math.PI * (freq0 * 3.01) * t) * 0.15;
      const h4 = Math.sin(2 * Math.PI * (freq0 * 4.98) * t) * 0.08;

      // Subtle noise for unvoiced consonants (s, t, sh)
      const breathNoise = (Math.random() * 2 - 1) * 0.03 * (syllableEnv < 0.2 ? 1.5 : 0.2);

      const speechSample = (h1 + h2 + h3 + h4 + breathNoise) * syllableEnv * phraseEnv * 0.65;

      const idx = currentSampleOffset + i;
      if (idx < totalSamples) {
        left[idx] = speechSample;
        right[idx] = speechSample * 0.98; // slight stereo field
      }
    }

    // Silence interval (room tone / ambient noise floor at ~ -55dB to test realistic thresholding)
    for (let i = 0; i < pauseSamples; i++) {
      const idx = currentSampleOffset + phraseSamples + i;
      if (idx < totalSamples) {
        const roomNoise = (Math.random() * 2 - 1) * 0.0012; // ~ -58 dB noise floor
        left[idx] = roomNoise;
        right[idx] = roomNoise;
      }
    }

    currentSampleOffset += phraseSamples + pauseSamples;
  }

  return { buffer, fileName };
}

/**
 * Synchronous/quick sample generator for test audio presets
 */
export function generateSampleAudio(
  presetId = 'podcast'
): { buffer: AudioBuffer; fileName: string } {
  const ctx = getAudioContext();
  const sampleRate = 44100;
  const isLecture = presetId.includes('lecture');
  const isInterview = presetId.includes('interview');

  const duration = isLecture ? 14 : isInterview ? 16 : 12;
  const totalSamples = Math.floor(duration * sampleRate);
  const buffer = ctx.createBuffer(2, totalSamples, sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  const baseFreq = isLecture ? 125 : isInterview ? 150 : 135;

  // Generate 4-5 speech bursts with realistic pauses in between
  const segments = [
    { start: 0.5, end: 3.2 },
    { start: 5.0, end: 8.4 },
    { start: 10.2, end: 13.0 },
  ];

  for (let s of segments) {
    const startIdx = Math.floor(s.start * sampleRate);
    const endIdx = Math.floor(s.end * sampleRate);
    const len = endIdx - startIdx;

    for (let i = 0; i < len; i++) {
      const t = i / sampleRate;
      const syllableEnv = Math.pow(Math.sin(2 * Math.PI * 3.5 * t), 2);
      const env = Math.sin((Math.PI * i) / len);
      const sample =
        (Math.sin(2 * Math.PI * baseFreq * t) * 0.45 +
          Math.sin(2 * Math.PI * baseFreq * 2 * t) * 0.25) *
        syllableEnv *
        env *
        0.7;

      const idx = startIdx + i;
      if (idx < totalSamples) {
        left[idx] = sample;
        right[idx] = sample * 0.95;
      }
    }
  }

  // Ambient room tone in pauses
  for (let i = 0; i < totalSamples; i++) {
    if (Math.abs(left[i]) < 0.0001) {
      const noise = (Math.random() * 2 - 1) * 0.001;
      left[i] = noise;
      right[i] = noise;
    }
  }

  return {
    buffer,
    fileName: isLecture
      ? 'lecture_sample.wav'
      : isInterview
      ? 'podcast_interview_sample.wav'
      : 'voiceover_sample.wav',
  };
}

/**
 * Converts a Blob or File to Base64
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const res = reader.result as string;
      resolve(res);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Applies Digital Signal Processing Noise Reduction (High-pass rumble filter, Spectral noise gate, High-cut hiss reducer, and vocal presence boost)
 */
export async function applyNoiseReduction(
  audioBuffer: AudioBuffer,
  settings: {
    noiseGateThreshold: number;
    highPassFilterHz: number;
    lowPassFilterHz: number;
    vocalBoostDb: number;
    hissReduction: boolean;
    rumbleFilter: boolean;
  }
): Promise<AudioBuffer> {
  const sampleRate = audioBuffer.sampleRate;
  const numChannels = audioBuffer.numberOfChannels;
  const length = audioBuffer.length;

  // Use OfflineAudioContext for real-time Web Audio graph rendering
  const offlineCtx = new OfflineAudioContext(numChannels, length, sampleRate);
  const source = offlineCtx.createBufferSource();
  source.buffer = audioBuffer;

  let lastNode: AudioNode = source;

  // 1. Low-Rumble High-Pass Filter (removes mic handling noise / AC sub-rumble below 80-100Hz)
  if (settings.rumbleFilter && settings.highPassFilterHz > 20) {
    const highpass = offlineCtx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = settings.highPassFilterHz;
    highpass.Q.value = 0.707;
    lastNode.connect(highpass);
    lastNode = highpass;
  }

  // 2. High-Frequency Hiss Low-Pass Filter
  if (settings.hissReduction && settings.lowPassFilterHz < 20000) {
    const lowpass = offlineCtx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = settings.lowPassFilterHz;
    lowpass.Q.value = 0.707;
    lastNode.connect(lowpass);
    lastNode = lowpass;
  }

  // 3. Vocal Presence EQ peaking filter (adds clarity around 3kHz)
  if (settings.vocalBoostDb > 0) {
    const vocalPeaking = offlineCtx.createBiquadFilter();
    vocalPeaking.type = 'peaking';
    vocalPeaking.frequency.value = 3000;
    vocalPeaking.Q.value = 1.2;
    vocalPeaking.gain.value = settings.vocalBoostDb;
    lastNode.connect(vocalPeaking);
    lastNode = vocalPeaking;
  }

  lastNode.connect(offlineCtx.destination);
  source.start(0);

  const filteredBuffer = await offlineCtx.startRendering();

  // 4. In-Memory Adaptive Noise Gate
  const gateLinear = Math.pow(10, settings.noiseGateThreshold / 20);
  const resultCtx = getAudioContext();
  const resultBuffer = resultCtx.createBuffer(numChannels, length, sampleRate);

  const windowSize = Math.floor(sampleRate * 0.015); // 15ms gate envelope
  const attackSamples = Math.floor(sampleRate * 0.005); // 5ms attack
  const releaseSamples = Math.floor(sampleRate * 0.035); // 35ms release

  for (let c = 0; c < numChannels; c++) {
    const src = filteredBuffer.getChannelData(c);
    const dst = resultBuffer.getChannelData(c);

    let gateGain = 1.0;

    for (let i = 0; i < length; i += windowSize) {
      const end = Math.min(i + windowSize, length);
      let sumSq = 0;
      for (let j = i; j < end; j++) {
        sumSq += src[j] * src[j];
      }
      const rms = Math.sqrt(sumSq / (end - i));

      // Target gain
      const targetGain = rms < gateLinear ? 0.05 : 1.0;

      for (let j = i; j < end; j++) {
        if (targetGain > gateGain) {
          gateGain += (targetGain - gateGain) / Math.max(1, attackSamples);
        } else {
          gateGain += (targetGain - gateGain) / Math.max(1, releaseSamples);
        }
        dst[j] = src[j] * gateGain;
      }
    }
  }

  return resultBuffer;
}

/**
 * Trims an AudioBuffer with fade-in and fade-out
 */
export async function applyAudioTrim(
  audioBuffer: AudioBuffer,
  settings: {
    trimStart: number;
    trimEnd: number;
    fadeInDuration: number;
    fadeOutDuration: number;
  }
): Promise<AudioBuffer> {
  const sampleRate = audioBuffer.sampleRate;
  const numChannels = audioBuffer.numberOfChannels;
  const ctx = getAudioContext();

  const startSample = Math.max(0, Math.floor(settings.trimStart * sampleRate));
  const endSample = Math.min(audioBuffer.length, Math.floor(settings.trimEnd * sampleRate));
  const trimmedLength = Math.max(1, endSample - startSample);

  const outputBuffer = ctx.createBuffer(numChannels, trimmedLength, sampleRate);

  const fadeInSamples = Math.floor(settings.fadeInDuration * sampleRate);
  const fadeOutSamples = Math.floor(settings.fadeOutDuration * sampleRate);

  for (let c = 0; c < numChannels; c++) {
    const src = audioBuffer.getChannelData(c);
    const dst = outputBuffer.getChannelData(c);

    for (let i = 0; i < trimmedLength; i++) {
      let sample = src[startSample + i];

      // Fade-in
      if (fadeInSamples > 0 && i < fadeInSamples) {
        sample *= 0.5 * (1 - Math.cos((Math.PI * i) / fadeInSamples));
      }

      // Fade-out
      if (fadeOutSamples > 0 && i >= trimmedLength - fadeOutSamples) {
        const rem = trimmedLength - 1 - i;
        sample *= 0.5 * (1 - Math.cos((Math.PI * rem) / fadeOutSamples));
      }

      dst[i] = sample;
    }
  }

  return outputBuffer;
}

/**
 * Changes Audio Speed / Playback Tempo
 */
export async function applySpeedPitch(
  audioBuffer: AudioBuffer,
  settings: { playbackRate: number }
): Promise<AudioBuffer> {
  const sampleRate = audioBuffer.sampleRate;
  const numChannels = audioBuffer.numberOfChannels;
  const ctx = getAudioContext();
  const rate = Math.max(0.25, Math.min(4.0, settings.playbackRate));

  const outputLength = Math.floor(audioBuffer.length / rate);
  const outputBuffer = ctx.createBuffer(numChannels, outputLength, sampleRate);

  for (let c = 0; c < numChannels; c++) {
    const src = audioBuffer.getChannelData(c);
    const dst = outputBuffer.getChannelData(c);

    for (let i = 0; i < outputLength; i++) {
      const srcPos = i * rate;
      const idx0 = Math.floor(srcPos);
      const idx1 = Math.min(idx0 + 1, audioBuffer.length - 1);
      const frac = srcPos - idx0;

      dst[i] = src[idx0] * (1 - frac) + src[idx1] * frac;
    }
  }

  return outputBuffer;
}

/**
 * Merges multiple AudioBuffers into a single continuous track with crossfades
 */
export async function mergeAudioBuffers(
  tracks: AudioBuffer[],
  crossfadeSec = 0.5
): Promise<AudioBuffer> {
  if (tracks.length === 0) {
    const ctx = getAudioContext();
    return ctx.createBuffer(2, 44100, 44100);
  }
  if (tracks.length === 1) {
    return tracks[0];
  }

  const sampleRate = tracks[0].sampleRate;
  const numChannels = Math.max(...tracks.map((t) => t.numberOfChannels), 2);
  const crossfadeSamples = Math.floor(crossfadeSec * sampleRate);

  // Compute total output length with overlapping crossfades
  let totalLength = 0;
  for (let i = 0; i < tracks.length; i++) {
    totalLength += tracks[i].length;
    if (i > 0 && crossfadeSamples > 0) {
      totalLength -= crossfadeSamples;
    }
  }

  const ctx = getAudioContext();
  const outputBuffer = ctx.createBuffer(numChannels, Math.max(1, totalLength), sampleRate);

  for (let c = 0; c < numChannels; c++) {
    const dst = outputBuffer.getChannelData(c);
    let dstOffset = 0;

    for (let tIdx = 0; tIdx < tracks.length; tIdx++) {
      const track = tracks[tIdx];
      const src = track.getChannelData(Math.min(c, track.numberOfChannels - 1));
      const trackLen = track.length;

      if (tIdx === 0) {
        // First track copy
        for (let i = 0; i < trackLen; i++) {
          dst[dstOffset + i] = src[i];
        }
        dstOffset += trackLen;
      } else {
        // Apply crossfade with previous track end
        const xFade = Math.min(crossfadeSamples, trackLen);
        const overlapStart = dstOffset - xFade;

        // Crossfade region
        for (let i = 0; i < xFade; i++) {
          const fadeOutGain = 0.5 * (1 + Math.cos((Math.PI * i) / xFade));
          const fadeInGain = 0.5 * (1 - Math.cos((Math.PI * i) / xFade));

          dst[overlapStart + i] = dst[overlapStart + i] * fadeOutGain + src[i] * fadeInGain;
        }

        // Remaining track portion
        for (let i = xFade; i < trackLen; i++) {
          dst[overlapStart + i] = src[i];
        }

        dstOffset = overlapStart + trackLen;
      }
    }
  }

  return outputBuffer;
}

/**
 * Applies Studio Compressor / Limiter
 */
export async function applyAudioCompressor(
  audioBuffer: AudioBuffer,
  settings: {
    threshold: number;
    knee: number;
    ratio: number;
    attack: number;
    release: number;
    makeupGain: number;
  }
): Promise<AudioBuffer> {
  const sampleRate = audioBuffer.sampleRate;
  const numChannels = audioBuffer.numberOfChannels;
  const length = audioBuffer.length;

  const offlineCtx = new OfflineAudioContext(numChannels, length, sampleRate);
  const source = offlineCtx.createBufferSource();
  source.buffer = audioBuffer;

  const compressor = offlineCtx.createDynamicsCompressor();
  compressor.threshold.value = settings.threshold;
  compressor.knee.value = settings.knee;
  compressor.ratio.value = settings.ratio;
  compressor.attack.value = settings.attack;
  compressor.release.value = settings.release;

  const gain = offlineCtx.createGain();
  const makeupLinear = Math.pow(10, settings.makeupGain / 20);
  gain.gain.value = makeupLinear;

  source.connect(compressor);
  compressor.connect(gain);
  gain.connect(offlineCtx.destination);

  source.start(0);
  return await offlineCtx.startRendering();
}
