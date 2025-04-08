import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post('/rewrite', async (req, res) => {
  const { message, tone, style } = req.body;

  if (!message || !tone || !style) {
    return res.status(400).json({ rewrite: "❌ Missing required parameters" });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Rewrite the user's message in a ${tone} tone and ${style} style.`
        },
        {
          role: "user",
          content: message
        }
      ],
      max_tokens: 200
    });

    const rewritten = completion.choices[0].message.content.trim();
    res.json({ rewrite: rewritten });
  } catch (error) {
    res.status(500).json({ rewrite: `❌ Server error: ${error.message}` });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 TypeTuned backend running on port ${PORT}`);
});
