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
You are not starting a conversation. Rewrite the user's message using the selected tone and style — no greetings, no introductions.
If the style is "Translate", translate the message into the target language (e.g., "french") and apply the tone in that language.
Keep the message in the same perspective (first person stays first person, etc).
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
