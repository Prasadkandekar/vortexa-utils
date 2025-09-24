// backend/index.js
import express from 'express';
import multer from 'multer';
import fs from 'fs';
import { createClient } from '@deepgram/sdk';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
app.use(express.json());

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Initialize Deepgram client
const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
const deepgram = createClient(deepgramApiKey);

// Endpoint for transcribing audio URL
app.post('/transcribe-url', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'Audio URL is required' });

    const { result, error } = await deepgram.listen.prerecorded.transcribeUrl(
      { url },
      { model: 'nova-3', language: 'en' }
    );

    if (error) return res.status(500).json({ error });

    res.json({ transcript: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint for transcribing uploaded audio file
app.post('/transcribe-file', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Audio file required' });

    const audioBuffer = fs.readFileSync(req.file.path);
    const { result } = await deepgram.listen.prerecorded.transcribe(
      { buffer: audioBuffer, mimetype: req.file.mimetype },
      { model: 'nova-3', language: 'en' }
    );

    fs.unlinkSync(req.file.path); // clean up
    res.json({ transcript: result?.channels?.[0]?.alternatives?.[0]?.transcript || '' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
