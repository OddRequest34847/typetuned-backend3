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
Your task is to rewrite the user's message using the selected tone and style.
${shouldTranslate
    ? `Translate the message into "${language}" and apply the tone in that language.`
    : `Use the selected style "${style}" and apply the tone "${tone}".`}
- Do NOT include greetings or intros like "Hey there".
- Keep the user's perspective (e.g., "I" stays "I").
- Return ONLY the final rewritten or translated message. Do not explain.
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      temperature: 1.0, // Safe max for variety without crashing
      messages: [
        { role: 'system', content: prompt.trim() },
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
