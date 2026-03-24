const express = require('express');
const app = express();

// ── Explicit CORS — allow ALL origins (required for browser requests) ──
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204); // preflight
  next();
});

app.use(express.json({ limit: '25mb' }));

const API_KEY = process.env.ANTHROPIC_API_KEY;

// Health check — open your proxy URL in browser to confirm alive
app.get('/', (req, res) => {
  res.json({
    status: '✅ AgroSmart AI Proxy is running!',
    apiKeySet: !!API_KEY,
    time: new Date().toISOString(),
  });
});

app.post('/api/chat', async (req, res) => {
  if (!API_KEY) {
    return res.status(500).json({
      error: { message: 'ANTHROPIC_API_KEY not set on server. Add it as an environment variable.' }
    });
  }
  try {
    console.log('📨 Request:', req.body?.model, '| msgs:', req.body?.messages?.length);
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    if (!response.ok) console.error('❌ Anthropic error:', response.status, data?.error?.message);
    else console.log('✅ OK — output tokens:', data?.usage?.output_tokens);
    res.status(response.status).json(data);
  } catch (err) {
    console.error('❌ Proxy error:', err.message);
    res.status(500).json({ error: { message: `Proxy error: ${err.message}` } });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 AgroSmart Proxy on port ${PORT} | API key set: ${!!API_KEY}`);
});
