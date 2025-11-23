# NoFluff

**AI-powered YouTube video highlight extractor that finds the most important moments in any video.**

NoFluff analyzes YouTube videos using OpenAI Whisper for transcription and GPT-4o-mini for intelligent highlight detection. It extracts exactly 20 seconds of the most engaging, informative, and narrative-defining moments from any YouTube video.

## Features

- 🎥 **Smart Video Analysis**: AI identifies key moments automatically
- 🗣️ **High-Quality Transcription**: OpenAI Whisper for accurate audio-to-text
- 🎯 **Intelligent Highlights**: GPT-4o-mini finds the most important segments
- ⚡ **Seamless Playback**: Custom video player with highlight timeline
- 🎨 **Modern UI**: Clean, dark theme with smooth animations

## Prerequisites

Before running NoFluff, make sure you have:

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **yt-dlp** installed and accessible in your PATH
- **OpenAI API key** with Whisper and GPT access

### Install yt-dlp

**macOS (using Homebrew):**
```bash
brew install yt-dlp
```

**Other platforms:**
Follow the installation guide at [yt-dlp.github.io](https://github.com/yt-dlp/yt-dlp#installation)

## Setup

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd nofluff
   npm install
   ```

2. **Create environment file:**
   ```bash
   cp .env.example .env
   ```
   
   Add your OpenAI API key to `.env`:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   PORT=3001
   ```

3. **Start the backend server:**
   ```bash
   node server.js
   ```

4. **In a new terminal, start the frontend:**
   ```bash
   npm start
   ```

5. **Open your browser:**
   Navigate to `http://localhost:3000`

## Usage

1. **Paste a YouTube URL** into the input field
2. **Click "Extract Highlights"** - NoFluff will:
   - Download the video's audio using yt-dlp
   - Transcribe it with OpenAI Whisper
   - Analyze the content with GPT-4o-mini
   - Extract the most important 20 seconds
3. **Watch your highlights** with the custom timeline player
4. **Navigate between segments** using the timeline or player controls

## Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express
- **AI**: OpenAI Whisper (transcription), GPT-4o-mini (analysis)
- **Video**: YouTube IFrame API, yt-dlp
- **Audio Processing**: OpenAI API multipart upload

## Project Structure

```
├── src/
│   ├── components/         # React components
│   ├── services/          # API calls and video services
│   ├── types/             # TypeScript interfaces
│   └── utils/             # Utility functions
├── public/                # Static assets
├── server.js              # Backend Express server
└── package.json           # Dependencies and scripts
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m "Add feature"`
4. Push to the branch: `git push origin feature-name`
5. Create a Pull Request

## License

MIT License - see the [LICENSE](LICENSE) file for details.

---

**Made with ❤️ for creators who value quality over quantity.**