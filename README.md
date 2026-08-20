# Submind Audio Studio

> **High-Performance In-Browser AI Audio Suite & Digital Signal Processor**  
> *Engineered by **Asfand Mustafa** ([asfandmustafa3@gmail.com](mailto:asfandmustafa3@gmail.com))*

Submind Audio Studio is a fast, 100% private in-browser digital audio workstation (DAW) and audio engineering suite. All audio signal processing, silence detection, noise cancellation, compression, trimming, pitch-shifting, and merging execute **100% locally on your device** via the Web Audio API and WebAssembly.

---

## 🌟 Key Features

1. **AI Audio Transcription & Smart Notes** (Verbatim speech-to-text, executive summaries, takeaways, action items, filler word metrics with Gemini 3.7 Flash).
2. **Intelligent Silence Cutter & Speed-Up Engine** (Auto-detect vocal pauses, bulk trim or accelerate silence with micro-fades).
3. **Studio Voice Recorder & Real-Time Waveform** (HQ microphone recording with live visualizer, clipping detection, and instant tool routing).
4. **DSP Noise Remover & Voice Enhancer** (Spectral noise gating, high-pass rumble elimination, hiss filter, vocal warmth presence boost).
5. **Precision Audio Trimmer & Cutter** (Interactive dual-handle time-selection cutter).
6. **Speed & Pitch Shaper** (0.25x to 4.0x tempo adjustment with pitch preservation).
7. **Multi-Track Audio Merger** (Seamlessly combine multiple recordings with volume balancing and crossfades).
8. **Lossless Dynamic Range Compressor** (Custom threshold, attack, release, and makeup gain).
9. **Universal Format Converter** (Export to WAV, MP3, OGG, FLAC, and WebM).
10. **Neural Text-to-Speech Synthesizer** (High-quality voice generation with adjustable pitch, rate, and presets).

---

## 🚀 Quick Setup & Installation on Your Device

### Option 1: One-Click Automated Setup (Recommended)

#### Windows
Double click `setup-windows.bat` or run:
```cmd
setup-windows.bat
```

#### macOS / Linux
Run:
```bash
chmod +x setup-mac-linux.sh
./setup-mac-linux.sh
```

---

### Option 2: Manual Terminal Setup

1. **Clone the GitHub Repository:**
   ```bash
   git clone https://github.com/asfandmustafa/silenttrim-ai.git
   cd silenttrim-ai
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment (Optional for Gemini AI Transcription):**
   ```bash
   cp .env.example .env
   # Add your GEMINI_API_KEY in .env (if using AI speech transcription)
   ```

4. **Start the Application:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Production Build:**
   ```bash
   npm run build
   npm start
   ```

---

## 🔒 Privacy & Security

- **100% Client-Side DSP**: Your audio recordings and media files never leave your computer for signal processing, cutting, noise reduction, or formatting.
- **Zero Cloud Storage**: No audio files are saved on external servers.

---

## 👨‍💻 Developer & Author

- **Author**: **Asfand Mustafa**
- **Email**: [asfandmustafa3@gmail.com](mailto:asfandmustafa3@gmail.com)
- **License**: MIT
