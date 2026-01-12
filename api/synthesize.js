import textToSpeech from '@google-cloud/text-to-speech';

// Inicializar cliente usando credenciales de variable de entorno (para Vercel)
// O usando archivo local (si fallara la env var, aunque en prod usaremos env)
const getClient = () => {
  if (process.env.GOOGLE_CREDENTIALS) {
    // En Vercel: Leemos el JSON secreto desde una variable de entorno
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
    return new textToSpeech.TextToSpeechClient({ credentials });
  } else {
    // Fallback: Si no hay variable, intentamos inicialización estándar (buscará archivo local si existe)
    return new textToSpeech.TextToSpeechClient();
  }
};

export default async function handler(req, res) {
  // Configurar CORS para permitir que tu app llame a esta función
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Manejar preflight request de navegador
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { text, gender } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const client = getClient();
    
    const request = {
      input: { text: text },
      voice: { 
        languageCode: 'en-US', 
        name: gender === 'male' ? 'en-US-Neural2-J' : 'en-US-Neural2-F',
        ssmlGender: gender === 'male' ? 'MALE' : 'FEMALE' 
      },
      audioConfig: { audioEncoding: 'MP3' },
    };

    const [response] = await client.synthesizeSpeech(request);
    
    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(response.audioContent);

  } catch (error) {
    console.error('Google Cloud TTS Error:', error);
    res.status(500).json({ error: 'Error generating speech', details: error.message });
  }
}
