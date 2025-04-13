const express = from ('express');
const cors = from ('cors');
const bodyParser = from ('body-parser');
const { OpenAI } = from ('openai');
dotenv.config();

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
Rewrite the user's message using the selected tone and style.
Do not answer the message — instead, perform the transformation described by the selected style (e.g., Rewrite, Translate, Make It Poetic).
If the style is "Translate", detect the target language from quotes or parentheses at the end of the message (e.g., "french" or (french)), and translate the message naturally into that language using the same tone.
Preserve the user's original perspective (e.g., "I" stays "I").
Do not include greetings, intros, or meta explanations — just output the rewritten or translated message.
Tone: ${tone}
Style: ${style}
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      temperature: 1.0, // 🎨 Adds randomness and variety
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
