import textToSpeech from '@google-cloud/text-to-speech';

// Inicializar el cliente de Google TTS con las credenciales de Vercel
// Vercel inyecta process.env.GOOGLE_CREDENTIALS con el contenido del JSON
let client;

try {
  if (process.env.GOOGLE_CREDENTIALS) {
    // Caso Producción (Vercel): Usamos la variable de entorno
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
    client = new textToSpeech.TextToSpeechClient({
      credentials: credentials
    });
    console.log('✅ Cliente TTS inicializado con GOOGLE_CREDENTIALS');
  } else {
    // Caso Local o Fallback: Intenta buscar credenciales locales por defecto
    // o espera que GOOGLE_APPLICATION_CREDENTIALS apunte a un archivo
    client = new textToSpeech.TextToSpeechClient();
  }
} catch (error) {
  console.error('❌ Error inicializando cliente TTS:', error);
}

export default async function handler(req, res) {
  // Configurar CORS para permitir peticiones desde tu app
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Responder a OPTIONS (pre-flight check)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!client) {
    return res.status(500).json({ error: 'Configuración de credenciales fallida en el servidor.' });
  }

  const { text, gender } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Falta el texto' });
  }

  const isMale = gender === 'male';

  const request = {
    input: { text: text },
    voice: { 
      languageCode: 'en-US', 
      name: isMale ? 'en-US-Neural2-J' : 'en-US-Neural2-F', // Voces Neurales Premium
      ssmlGender: isMale ? 'MALE' : 'FEMALE' 
    },
    audioConfig: { audioEncoding: 'MP3' },
  };

  try {
    const [response] = await client.synthesizeSpeech(request);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.status(200).send(response.audioContent);
  } catch (err) {
    console.error('ERROR en Google Cloud TTS API:', err);
    res.status(500).json({ error: 'Error sintetizando audio: ' + err.message });
  }
}
