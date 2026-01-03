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

  const translatePrompt = `
You are a tone and translation assistant.

Return a JSON object with keys:
- "rewrite": the full rewritten message in the original language, using the selected tone.
- "translated": the full translation of that rewritten message into "${language}" with the same tone.

Do not skip sentences or summarize. Respond with JSON only.`.trim();

  const rewritePrompt = `
You are a tone and style rewriting assistant.

Rewrite the user's message using the selected tone "${tone}" and style "${style}".

- Maintain the original perspective.
- Return only the rewritten message.
- Do not include greetings or explanations.`.trim();

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      temperature: shouldTranslate ? 0.4 : 1.0,
      presence_penalty: shouldTranslate ? 0.0 : 0.6,
      frequency_penalty: shouldTranslate ? 0.0 : 0.3,
      ...(shouldTranslate ? { response_format: { type: 'json_object' } } : {}),
      messages: [
        { role: 'system', content: shouldTranslate ? translatePrompt : rewritePrompt },
        { role: 'user', content: message }
      ]
    });

    const output = completion.choices[0]?.message?.content?.trim();

    if (shouldTranslate && output) {
      try {
        const parsed = JSON.parse(output);
        const rewrite = (parsed.rewrite ?? parsed.original ?? '').toString().trim();
        const translated = (parsed.translated ?? parsed.translation ?? '').toString().trim();
        return res.json({ rewrite, original: rewrite, translated });
      } catch {
        const originalMatch = output.match(/<original>([\s\S]*?)<\/original>/);
        const translatedMatch = output.match(/<translated>([\s\S]*?)<\/translated>/);
        return res.json({
          rewrite: originalMatch?.[1]?.trim() ?? '',
          original: originalMatch?.[1]?.trim() ?? '',
          translated: translatedMatch?.[1]?.trim() ?? ''
        });
      }
    }

    res.json({ rewrite: output });
  } catch (error) {
    console.error('OpenAI error:', error);
    res.status(500).json({ rewrite: `❌ ${error.message}` });
  }
});

app.post('/imagine', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ error: '❌ Missing prompt' });
  }

  try {
    const response = await openai.images.generate({
      model: 'gpt-image-1',
      prompt: prompt.trim(),
      size: '1024x1024',
      response_format: 'b64_json',
    });

    const imageBase64 = response.data?.[0]?.b64_json;
    if (!imageBase64) {
      return res.status(500).json({ error: '❌ Failed to generate image' });
    }

    res.json({ image: imageBase64 });
  } catch (error) {
    console.error('OpenAI image error:', error);
    res.status(500).json({ error: `❌ ${error.message}` });
  }
});

app.listen(port, () => {
  console.log(`🚀 TypeTuned backend running at http://localhost:${port}`);
});
