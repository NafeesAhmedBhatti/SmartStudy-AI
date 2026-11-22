module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: { message: 'Method not allowed' } });

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: { message: 'GEMINI_API_KEY not configured on Vercel.' } });
  }

  try {
    const messages = req.body?.messages || [];
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

    if (contents.length === 0) {
      contents.push({ role: 'user', parts: [{ text: systemInstruction || 'Proceed.' }] });
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
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await r.json();
      if (r.ok && json?.candidates?.[0]?.content?.parts?.[0]?.text) {
        return res.status(200).json({
          choices: [{ message: { content: json.candidates[0].content.parts[0].text } }]
        });
      }
      lastErr = json?.error?.message || `HTTP ${r.status}`;
    }

    return res.status(500).json({ error: { message: lastErr } });
  } catch (e) {
    return res.status(500).json({ error: { message: e.message } });
  }
};
