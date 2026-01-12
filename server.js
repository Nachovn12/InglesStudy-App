import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import textToSpeech from '@google-cloud/text-to-speech';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const port = 3001;

app.use(cors());
app.use(bodyParser.json());

// Obtener rutas para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Verifica si existen las credenciales
const KEY_FILE = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, 'google-vision-key.json');

// Cliente de Google TTS
let client;

// Función asíncrona para iniciar el cliente
const initClient = () => {
  try {
    if (fs.existsSync(KEY_FILE)) {
      client = new textToSpeech.TextToSpeechClient({
        keyFilename: KEY_FILE
      });
      console.log('✅ Cliente de Google Cloud TTS inicializado correctamente.');
    } else {
      console.warn('⚠️ ADVERTENCIA: No se encontró el archivo de credenciales de Google Cloud.');
      console.warn(`   Por favor coloca tu archivo JSON en: ${KEY_FILE}`);
    }
  } catch (error) {
    console.error('❌ Error al inicializar el cliente TTS:', error);
  }
}

initClient();

app.post('/api/synthesize', async (req, res) => {
  if (!client) {
    return res.status(500).json({ error: 'Servidor no configurado con credenciales de Google.' });
  }

  const text = req.body.text;
  const isMale = req.body.gender === 'male';

  if (!text) {
    return res.status(400).send('Falta el texto');
  }

  const request = {
    input: { text: text },
    voice: { 
      languageCode: 'en-US', 
      name: isMale ? 'en-US-Neural2-J' : 'en-US-Neural2-F', // Voces Ultra-Realistas
      ssmlGender: isMale ? 'MALE' : 'FEMALE' 
    },
    audioConfig: { audioEncoding: 'MP3' },
  };

  try {
    const [response] = await client.synthesizeSpeech(request);
    res.set('Content-Type', 'audio/mpeg');
    res.send(response.audioContent);
  } catch (err) {
    console.error('ERROR en Google Cloud TTS:', err);
    res.status(500).send(err);
  }
});

app.listen(port, () => {
  console.log(`🚀 Servidor de Voz Premium corriendo en http://localhost:${port}`);
});
