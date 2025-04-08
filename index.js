const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { OpenAI } = require('openai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(cors());
app.use(bodyParser.json());

app.post('/rewrite', async (req, res) => {
  const { message, tone, style } = req.body;

  if (!message || !tone || !style) {
    return res.status(400).json({ rewrite: '❌ Missing required parameters' });
  }

  try {
    const systemPrompt = `
Your task is to rewrite the user's message using the selected tone and style.
If the style is "Translate", translate the message into the language mentioned by the user (e.g., "french") and apply the tone in that language.
Maintain the user's original perspective — if they write in first person ("I"), keep it first person.
Tone: ${tone}
Style: ${style}
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      temperature: 1.1, // 🎨 Adds randomness and variety
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ]
    });

    const output = completion.choices[0]?.message?.content;
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
  console.log(`Server running on http://localhost:${port}`);
});
