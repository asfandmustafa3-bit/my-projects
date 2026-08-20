import express from 'express';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Lazy initialize Gemini API client
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIClient;
}

// Health check endpoints for Cloud Run and local monitoring
app.get(['/api/health', '/healthz', '/_ah/health'], (req, res) => {
  res.status(200).json({ status: 'ok', hasGeminiKey: Boolean(process.env.GEMINI_API_KEY) });
});

// AI Audio Transcribe, Summarize & Note-taking Endpoint
app.post('/api/ai/transcribe', async (req, res) => {
  try {
    const { audioBase64, mimeType = 'audio/wav', promptInstruction } = req.body;
    const ai = getGenAI();

    if (!ai) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured on the server. Please add your key in Settings > Secrets.',
      });
    }

    if (!audioBase64) {
      return res.status(400).json({ error: 'Missing audioBase64 data in request body.' });
    }

    // Robustly clean base64 string
    let cleanBase64 = String(audioBase64);
    if (cleanBase64.includes('base64,')) {
      cleanBase64 = cleanBase64.split('base64,')[1];
    } else {
      cleanBase64 = cleanBase64.replace(/^data:[^;]+;base64,/, '');
    }
    cleanBase64 = cleanBase64.trim().replace(/[\r\n\s]/g, '');

    // Normalize MIME type
    let normalizedMime = mimeType ? String(mimeType).split(';')[0].trim().toLowerCase() : 'audio/wav';
    if (!normalizedMime.startsWith('audio/')) {
      normalizedMime = 'audio/wav';
    }

    const systemInstruction = `You are Submind AI, an expert speech recognition and audio analysis intelligence engine.
Analyze the provided audio recording thoroughly.
Key Directives:
1. Provide an accurate, high-fidelity verbatim transcription of all spoken words.
2. Structure speech naturally with clear sentence boundaries, proper punctuation, and capitalization.
3. If the speaker stutters, pauses, or says names, transcribe them cleanly and professionally without excessive chopping or repetitive fragments.
4. Extract an insightful executive summary, actionable takeaways, and vocal pacing metrics.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: normalizedMime,
            },
          },
          {
            text: promptInstruction || 'Transcribe this audio recording verbatim and generate structured meeting notes, takeaways, action items, and speech analysis.',
          },
        ],
      },
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            transcript: {
              type: Type.STRING,
              description: 'Full verbatim transcript of the audio with clean paragraph breaks and speaker tags if multiple speakers are present.',
            },
            summary: {
              type: Type.STRING,
              description: 'Concise executive summary of what was discussed.',
            },
            keyPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'List of main takeaways, topics, or bullet points.',
            },
            actionItems: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Action items, tasks, or follow-ups extracted from the conversation.',
            },
            fillerWords: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING },
                  count: { type: Type.INTEGER },
                  suggestion: { type: Type.STRING },
                },
                required: ['word', 'count'],
              },
              description: 'Detected vocal disfluencies and filler words.',
            },
            sentiment: {
              type: Type.STRING,
              description: 'Tone, mood, or speech pacing analysis (e.g. Confident, Conversational, Technical, Educational).',
            },
            estimatedWordsCount: {
              type: Type.INTEGER,
              description: 'Total number of spoken words transcribed.',
            },
          },
          required: ['transcript', 'summary', 'keyPoints'],
        },
      },
    });

    const responseText = response.text?.trim() || '{}';
    const parsedData = JSON.parse(responseText);

    res.json({
      success: true,
      data: parsedData,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error in /api/ai/transcribe:', err);
    res.status(500).json({
      error: err.message || 'Failed to process audio with Gemini AI.',
    });
  }
});

// AI Audio Quality & Noise Analysis Endpoint
app.post('/api/ai/analyze-audio', async (req, res) => {
  try {
    const { transcript, duration, silenceCount, avgDb } = req.body;
    const ai = getGenAI();

    if (!ai) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured.',
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: `Provide an audio mastering recommendation for this recording:
- Duration: ${duration}s
- Detected Pauses / Silences: ${silenceCount}
- Average Volume Level: ${avgDb} dB
- Transcript / Context: ${transcript || 'Podcast / Speech voice recording'}

Recommend ideal noise reduction threshold, EQ adjustments for vocal warmth/clarity, and recommended pacing.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            vocalClarityRating: { type: Type.STRING },
            recommendedThresholdDb: { type: Type.NUMBER },
            recommendedHighPassHz: { type: Type.NUMBER },
            voiceEnhanceTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            pacingFeedback: { type: Type.STRING },
          },
          required: ['vocalClarityRating', 'voiceEnhanceTips'],
        },
      },
    });

    const text = response.text?.trim() || '{}';
    res.json({ success: true, data: JSON.parse(text) });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error in /api/ai/analyze-audio:', err);
    res.status(500).json({ error: err.message || 'Audio analysis failed.' });
  }
});

// Start Express Server with Vite integration
async function startServer() {
  const distPath = path.resolve(process.cwd(), 'dist');
  const indexPath = path.join(distPath, 'index.html');
  const hasDistBuild = fs.existsSync(indexPath);
  const isDev = process.env.NODE_ENV === 'development' || (!hasDistBuild && process.env.NODE_ENV !== 'production');

  if (isDev) {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.warn('Vite dev server failed to load, falling back to static build:', e);
      if (hasDistBuild) {
        app.use(express.static(distPath));
        app.get('*', (req, res) => {
          res.sendFile(indexPath);
        });
      }
    }
  } else {
    // Production: Serve pre-compiled static files from dist
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
    }
    app.get('*', (req, res) => {
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(200).send('Submind Audio Studio is running.');
      }
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Submind Audio Studio server listening on 0.0.0.0:${PORT} (NODE_ENV=${process.env.NODE_ENV || 'production'})`);
  });

  server.on('error', (err) => {
    console.error('Express server listen error:', err);
  });

  // Graceful shutdown handling
  process.on('SIGTERM', () => {
    console.log('SIGTERM received. Closing HTTP server gracefully.');
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
  });
}

startServer();
