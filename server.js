const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const textToSpeech = require('@google-cloud/text-to-speech');
const fs = require('fs');
const util = require('util');
const path = require('path');
require('dotenv').config();

const app = express();
const port = 3001; // El servidor correrá en el puerto 3001

app.use(cors());
app.use(bodyParser.json());

// Verifica si existen las credenciales
const KEY_FILE = process.env.GOOGLE_APPLICATION_CREDENTIALS || './google-vision-key.json';

// Cliente de Google TTS
let client;
try {
  if (fs.existsSync(KEY_FILE)) {
    client = new textToSpeech.TextToSpeechClient({
      keyFilename: KEY_FILE
    });
    console.log('✅ Cliente de Google Cloud TTS inicializado correctamente.');
  } else {
    console.warn('⚠️ ADVERTENCIA: No se encontró el archivo de credenciales de Google Cloud.');
    console.warn(`   Por favor coloca tu archivo JSON en: ${path.resolve(KEY_FILE)}`);
  }
} catch (error) {
  console.error('❌ Error al inicializar el cliente TTS:', error);
}

app.post('/api/synthesize', async (req, res) => {
  if (!client) {
    return res.status(500).json({ error: 'Servidor no configurado con credenciales de Google.' });
  }

  const text = req.body.text;
  const isMale = req.body.gender === 'male';

  if (!text) {
    return res.status(400).send('Falta el texto');
  }

  // Configuración de la solicitud a Google
  const request = {
    input: { text: text },
    // Seleccionamos voces NEURAL2 (Las más humanas)
    voice: { 
      languageCode: 'en-US', 
      // J = Hombre Natural, F = Mujer Natural
      name: isMale ? 'en-US-Neural2-J' : 'en-US-Neural2-F',
      ssmlGender: isMale ? 'MALE' : 'FEMALE' 
    },
    audioConfig: { audioEncoding: 'MP3' },
  };

  try {
    const [response] = await client.synthesizeSpeech(request);
    // Enviamos el audio binario directamente al frontend
    res.set('Content-Type', 'audio/mpeg');
    res.send(response.audioContent);
  } catch (err) {
    console.error('ERROR en Google Cloud TTS:', err);
    res.status(500).send(err);
  }
});

app.listen(port, () => {
  console.log(`🚀 Servidor de Voz Premium corriendo en http://localhost:${port}`);
  console.log('   (Recuerda tener tu archivo google-vision-key.json en la raíz del proyecto)');
});
