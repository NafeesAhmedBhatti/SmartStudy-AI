const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { YoutubeTranscript } = require('youtube-transcript');

const PORT = 3000;
const DIST = path.join(__dirname, 'dist');

// Load .env manually without requiring extra packages
let GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
try {
  const envFile = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
  for (const line of envFile.split(/\r?\n/)) {
    const match = line.match(/^GEMINI_API_KEY=(.+)$/);
    if (match) GEMINI_API_KEY = match[1].trim();
  }
} catch {}

function httpsPostJson(url, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      },
      timeout: 30000
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, json: JSON.parse(body) }); }
        catch { resolve({ status: res.statusCode, json: { raw: body } }); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
    req.write(data);
    req.end();
  });
}

async function callGeminiChat(messages) {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured in .env');

  let systemInstruction = '';
  const contents = [];

  for (const m of messages) {
    if (m.role === 'system') {
      systemInstruction += (systemInstruction ? '\n\n' : '') + (m.content || '');
    } else {
      contents.push({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: String(m.content || '') }]
      });
    }
  }

  // Gemini requires at least one message in contents (Study Tools preset prompts pass empty history)
  if (contents.length === 0) {
    contents.push({
      role: 'user',
      parts: [{ text: systemInstruction || 'Proceed.' }]
    });
    systemInstruction = '';
  }

  const payload = { contents };
  if (systemInstruction) {
    payload.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  const models = ['gemini-3.5-flash-lite', 'gemini-3.8-flash'];
  let lastErr = 'Unknown AI error';

  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
    const resp = await httpsPostJson(url, payload);
    if (resp.status === 200 && resp.json?.candidates?.[0]?.content?.parts?.[0]?.text) {
      return resp.json.candidates[0].content.parts[0].text;
    }
    lastErr = resp.json?.error?.message || `HTTP ${resp.status}`;
  }

  throw new Error(lastErr);
}

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
'.map': 'application/json',
	  '.pdf': 'application/pdf',
	};

// ── YouTube Transcript Fetcher ────────────────────────────────
function httpsGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers, timeout: 10000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return httpsGet(res.headers.location, headers).then(resolve).catch(reject);
      }
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve(body));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

async function fetchVideoTitle(videoId) {
  try {
    const body = await httpsGet(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
    const info = JSON.parse(body);
    return info.title || 'YouTube Video';
  } catch { return 'YouTube Video'; }
}

async function fetchYouTubeTranscript(videoId) {
  let title = await fetchVideoTitle(videoId);

  try {
    const segments = await YoutubeTranscript.fetchTranscript(videoId);
    const transcript = segments.map(s => s.text).join(' ');
    return { title, transcript, hasRealTranscript: transcript.length > 20 };
  } catch (e) {
    const msg = e.message || '';
    if (msg.includes('disabled') || msg.includes('not found') || msg.includes('Could not find')) {
      return { title, transcript: '', hasRealTranscript: false, reason: 'No captions available.' };
    }
    return { title, transcript: '', hasRealTranscript: false, reason: msg };
  }
}

// ── HTTP Server ────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
    res.writeHead(204);
    return res.end();
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  // AI Chat Proxy API endpoint (Gemini)
  if (url.pathname === '/api/chat' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const parsed = JSON.parse(body || '{}');
        const reply = await callGeminiChat(parsed.messages || []);
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ choices: [{ message: { content: reply } }] }));
      } catch (e) {
        console.error('AI Chat Error:', e.message);
        res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ error: { message: e.message } }));
      }
    });
    return;
  }

  // YouTube transcript API endpoint
  if (url.pathname === '/api/youtube-transcript' && req.method === 'GET') {
    const videoId = url.searchParams.get('videoId');
    if (!videoId) {
      res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      return res.end(JSON.stringify({ error: 'Missing videoId parameter' }));
    }

    try {
      const result = await fetchYouTubeTranscript(videoId);
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify(result));
    } catch (e) {
      console.error('YouTube transcript error:', e.message);
      res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify({ error: `Failed to fetch transcript: ${e.message}` }));
    }
    return;
  }

  // Download route for project zip
  if (url.pathname === '/download/project') {
const zipPath = path.join(__dirname, 'ai-study-assistant-FULL.zip');
      try {
      const stat = fs.statSync(zipPath);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="ai-study-assistant-FULL.zip"');
      res.setHeader('Content-Length', stat.size);
      res.writeHead(200);
      fs.createReadStream(zipPath).pipe(res);
    } catch {
      res.writeHead(404);
      res.end('File not found');
    }
    return;
  }

  // Static file serving
  let filePath = path.join(DIST, req.url === '/' ? 'index.html' : req.url);

  // SPA fallback
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST, 'index.html');
  }

  const ext = path.extname(filePath);
  const mime = MIME[ext] || 'application/octet-stream';

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Content-Type', mime);

  try {
    const data = fs.readFileSync(filePath);
    res.writeHead(200);
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`SmartStudy AI serving on port ${PORT}`);
});