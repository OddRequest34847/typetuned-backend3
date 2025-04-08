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
Your task is to rewrite the user's message using the selected tone and style.
If the style is "Translate", translate the message into the language mentioned by the user (e.g., "french") and apply the tone in that language.
Maintain the user's original perspective — if they write in first person ("I"), keep it first person.
Make the result expressive and natural, as if written by a real person using that tone.
Tone:
 ${tone}
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
