# 🎓 SmartStudy AI — Intelligent Study Platform

Your personal AI-powered study companion. Upload your notes (PDF, DOCX, TXT, or Images with OCR) and transform them into clear explanations, interactive quizzes, spaced-repetition flashcards, visual mind maps, YouTube video study notes, and personalized study schedules — all in one responsive web & mobile app.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-smartstudy--ai--mu.vercel.app-10B981?style=for-the-badge&logo=vercel&logoColor=white)](https://smartstudy-ai-mu.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-SmartStudy--AI-181717?style=for-the-badge&logo=github)](https://github.com/NafeesAhmedBhatti/SmartStudy-AI)

**🌐 Live App:** [https://smartstudy-ai-mu.vercel.app](https://smartstudy-ai-mu.vercel.app)

---

## ✨ Key Features

- **🤖 AI Tutor & Study Chat** — Ask questions directly or switch into **Essay Helper** (*Outline, Thesis, Improve, Paraphrase*) and **YouTube Video Summarizer** (auto-fetches video transcripts & creates structured notes).
- **🧠 AI Study Tools** — Upload PDF, DOCX, TXT, or images (with Tesseract OCR) and generate:
  - **Explain** — Simple, structured breakdowns with examples
  - **Quiz** — Interactive MCQs, True/False, and practice questions
  - **Mind Map** — Visual topic mind maps
  - **Flashcards** — Spaced-repetition study cards
  - **Key Points & Summaries** — Exam-ready concise notes
- **📅 Smart Study Planner** — AI-generated weekly study schedules, interactive Day/Week views, and subject tracking.
- **✅ Tasks & Reminders** — Priority-based task manager with reminder date/time scheduling.
- **🔍 Global Command Search (`Ctrl + K`)** — Instant search across pages, uploaded notes, and tasks.
- **🌗 Full Light & Dark Mode** — Smooth, high-contrast Day & Night theme switching across every page.
- **📱 Mobile-First & PWA Ready** — Clean responsive mobile UI with 4×2 study tool grid, bottom navigation, and installable PWA support.
- **📊 Analytics & Gamification** — Track XP, study streaks, quiz scores, and achievements.

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| **Frontend** | React 19, Vite 6, Framer Motion, Recharts, KaTeX, Lucide Icons |
| **Backend / Serverless** | Vercel Serverless Functions (`api/chat.js`, `api/youtube-transcript.js`) & Node.js (`server.js`) |
| **AI Engine** | Google Gemini API (proxied securely via `/api/chat`) |
| **File & Media Parsing** | `pdfjs-dist` (PDF), `mammoth` (DOCX), `tesseract.js` (OCR), `youtube-transcript` |
| **Export & Persistence** | `jsPDF` (PDF Export), LocalStorage (client-side persistence) |
| **Deployment** | Vercel (Production CI/CD) |

---

## 📁 Project Structure

```text
SmartStudy-AI/
├── api/
│   ├── chat.js                 # Vercel Serverless Gemini AI proxy
│   └── youtube-transcript.js   # Vercel Serverless YouTube transcript fetcher
├── src/
│   ├── App.jsx                 # Core React application, pages & UI components
│   ├── main.jsx                # Entry point
│   └── vite-env.d.ts           # TypeScript declarations
├── public/
│   ├── icon-192.svg            # PWA icon
│   ├── icon-512.svg            # PWA icon
│   ├── manifest.json           # PWA manifest
│   └── sw.js                   # Service worker
├── index.html                  # HTML entry template
├── server.js                   # Local Node.js production server
├── vercel.json                 # Vercel routing & build config
├── vite.config.js              # Vite configuration
└── package.json                # Dependencies & scripts
```

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js 18+ and npm
- A free Gemini API Key from [Google AI Studio](https://aistudio.google.com/)

### Installation & Run

```bash
git clone https://github.com/NafeesAhmedBhatti/SmartStudy-AI.git
cd SmartStudy-AI
npm install
```

Create a `.env` file in the root directory:

```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000
```

Build and start the local server:

```bash
npm run build
node server.js
```

Open **`http://localhost:3000`** in your browser.

---

## 👨‍💻 Author

**Nafees Ahmed Bhatti** — *AI Engineer · Generative AI Developer · Full Stack Developer*

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Nafees%20Ahmed%20Bhatti-0A66C2?style=flat-square&logo=linkedin)](https://www.linkedin.com/in/nafees-ahmed-bhatti/)
[![GitHub](https://img.shields.io/badge/GitHub-NafeesAhmedBhatti-181717?style=flat-square&logo=github)](https://github.com/NafeesAhmedBhatti)

---

## 📜 License

This project is open source and available under the [MIT License](LICENSE).
