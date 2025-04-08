import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post('/rewrite', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const { message, tone, style } = req.body;

  if (!message || !tone || !style) {
    return res.status(400).json({
      rewrite: "❌ Missing required parameters"
    });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `
Rewrite the user's message in the selected tone and style.  
Do not reply to the message — just rewrite it.  
If the style is "Translate", detect the target language (e.g., "french") and translate naturally into that language with the selected tone.  
Preserve the original perspective (e.g., "I" stays "I").  
Respond only with the rewritten or translated message.
Tone: ${tone}
Style: ${style}
`
        },
        {
          role: "user",
          content: message
        }
      ],
      max_tokens: 200
    });

    const rewrittenMessage = completion.choices[0].message.content.trim();
    res.json({ rewrite: rewrittenMessage });
  } catch (error) {
    console.error("OpenAI Error:", error);
    res.status(500).json({
      rewrite: `❌ Error: ${error.message}`
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 TypeTuned backend running on port ${PORT}`);
});
