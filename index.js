import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { OpenAI } from 'openai';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(cors());
app.use(bodyParser.json());

app.post('/rewrite', async (req, res) => {
  const { message, tone, style, translateToggle, language } = req.body;

  if (!message || !tone || !style) {
    return res.status(400).json({ rewrite: '❌ Missing required parameters' });
  }

  const shouldTranslate = translateToggle === true || style.toLowerCase() === 'translate';

  const prompt = `
You are a rewrite-only assistant.

- NEVER reply to the message.
- Do NOT answer questions.
- Do NOT introduce yourself, explain, or add commentary.
- Your ONLY job is to rewrite the message using the specified tone and style.

${shouldTranslate
    ? `Rewrite the message first in English using the selected tone, then translate the rewritten version fully into "${language}".`
    : `Rewrite the message using the selected style "${style}" and tone "${tone}".`
}

Always preserve the original perspective (e.g., "I" stays "I").
Return ONLY the rewritten (or rewritten and translated) message, nothing else.
`.trim();

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      temperature: 1.0,
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: message }
      ]
    });

    const output = completion.choices[0]?.message?.content?.trim();

    if (output) {
      res.json({ rewrite: output });
    } else {
      res.status(500).json({ rewrite: '❌ Failed to decode response' });
    }
  } catch (error) {
    console.error('OpenAI error:', error);
    res.status(500).json({ rewrite: `❌ ${error.message}` });
  }
});

app.listen(port, () => {
  console.log(`🚀 TypeTuned backend running at http://localhost:${port}`);
});
