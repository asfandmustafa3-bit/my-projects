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

    // Clean base64 string if it contains data URI header
    const cleanBase64 = audioBase64.replace(/^data:audio\/[a-z0-9-]+;base64,/, '');

    const systemInstruction = `You are Submind AI, an expert audio transcriber and audio analyst.
Analyze the provided audio recording. Provide:
1. An accurate verbatim transcription of spoken words with speaker turns and approximate timestamps if identifiable.
2. A concise executive summary of the content (2-3 sentences).
3. Key bullet points and takeaways.
4. Action items or follow-ups mentioned.
5. Detected filler words (e.g. "um", "uh", "like", "you know", "sort of") and awkward pauses.
6. Audio tone and sentiment (e.g. Professional, Casual, Educational, Energetic, Serious).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType.includes('audio/') ? mimeType : 'audio/wav',
            },
          },
          {
            text: promptInstruction || 'Please transcribe this audio and provide structured notes, summary, key points, action items, and filler words detection.',
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
              description: 'Full verbatim transcript of the audio with speaker tags if multiple speakers exist.',
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
              description: 'Tone, mood, or speech pacing analysis.',
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
