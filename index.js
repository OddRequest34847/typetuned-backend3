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

  let prompt = "";

  if (shouldTranslate) {
    prompt = `
You are a tone and translation assistant.

1. First, rewrite the user's message in its original language, using the selected tone.
2. Then, translate that rewritten version into "${language}", applying the tone in that language.
3. Respond using this format:

<original>
[rewritten message only]
</original>
<translated>
[translated version only]
</translated>

Do not include any introductions, explanations, or extra formatting. Respond only in that exact format.
    `.trim();
  } else {
    prompt = `
You are a tone and style rewriting assistant.

Rewrite the user's message using the selected tone "${tone}" and style "${style}".

- Maintain the original perspective.
- Return only the rewritten message.
- Do not include greetings or explanations.
    `.trim();
  }

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

    if (shouldTranslate && output) {
      const originalMatch = output.match(/<original>([\s\S]*?)<\/original>/);
      const translatedMatch = output.match(/<translated>([\s\S]*?)<\/translated>/);

      return res.json({
        original: originalMatch?.[1]?.trim() ?? "",
        translated: translatedMatch?.[1]?.trim() ?? ""
      });
    }

    res.json({ rewrite: output });
  } catch (error) {
    console.error('OpenAI error:', error);
    res.status(500).json({ rewrite: `❌ ${error.message}` });
  }
});

app.listen(port, () => {
  console.log(`🚀 TypeTuned backend running at http://localhost:${port}`);
});
