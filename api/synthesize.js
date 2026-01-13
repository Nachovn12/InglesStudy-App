import { TextToSpeechClient } from '@google-cloud/text-to-speech';

// Vercel Serverless Function for Google Cloud TTS
export default async function handler(req, res) {
  // CORS Configuration
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only Allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { text, gender, languageCode = 'es-US' } = req.body;
  if (!text) {
      return res.status(400).json({ error: 'Missing text parameter' });
  }

  try {
      // Authentication Logic
      let clientConfig = {};
      if (process.env.GOOGLE_CREDENTIALS) {
          try {
             const jsonString = process.env.GOOGLE_CREDENTIALS;
             const credentials = JSON.parse(jsonString);
             clientConfig = { credentials };
          } catch (e) {
             console.error("Failed to parse GOOGLE_CREDENTIALS env var:", e);
          }
      }
      
      const client = new TextToSpeechClient(clientConfig);
      const isMale = gender === 'male';

      // --- BILINGUAL VOICE LOGIC ---
      // Voices Configuration (Neural2 Enterprise Tier)
      const voices = {
          en: { m: 'en-US-Neural2-J', f: 'en-US-Neural2-F' },
          es: { m: 'es-US-Neural2-B', f: 'es-US-Neural2-C' }
      };

      const selectedVoices = {
          en: isMale ? voices.en.m : voices.en.f,
          es: isMale ? voices.es.m : voices.es.f
      };

      let request;

      // CASE 1: ENGLISH ONLY REQUEST
      if (languageCode === 'en-US') {
          // Force English Neural Voice for the entire text
          request = {
            input: { text: text }, 
            voice: { 
                languageCode: 'en-US', 
                name: selectedVoices.en
            },
            audioConfig: { audioEncoding: 'MP3' },
          };
      } 
      // CASE 2: BILINGUAL / DEFAULT MODE
      else {
          // Construct SSML
          // We assume text inside **asterisks** is English, everything else is Spanish.
          // 1. Clean up excessive markdown but leave ** for detection
          let cleanText = text.replace(/[*]{3,}/g, '**') 
          
          // 2. Escape XML characters just in case
          cleanText = cleanText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

          // 3. Split and assign voices
          // Regex splits by keeping the delimiters.
          const segments = cleanText.split(/(\*\*.*?\*\*)/g);
          
          let ssml = `<speak>`;
          
          segments.forEach(segment => {
              if (segment.startsWith('**') && segment.endsWith('**')) {
                  // ENGLISH (Remove asterisks)
                  const content = segment.replace(/\*\*/g, '').trim();
                  if (content) {
                      ssml += `<voice name="${selectedVoices.en}" languageCode="en-US"><prosody rate="0.9">${content}</prosody></voice> `;
                  }
              } else {
                  // SPANISH
                  const content = segment.trim();
                  if (content) {
                       ssml += `<voice name="${selectedVoices.es}" languageCode="es-US">${content}</voice> `;
                  }
              }
          });
          
          ssml += `</speak>`;

          request = {
            input: { ssml: ssml },
            // CRITICAL FIX: Base voice must be Neural2 to support Neural2 tags in SSML
            voice: { 
                languageCode: 'es-US', 
                name: selectedVoices.es 
            },
            audioConfig: { audioEncoding: 'MP3' },
          };
      }

      // Call API
      const [response] = await client.synthesizeSpeech(request);
      
      // Return Audio
      res.setHeader('Content-Type', 'audio/mpeg');
      res.status(200).send(response.audioContent);

  } catch (error) {
      console.error('Google Cloud TTS Error:', error);
      res.status(500).json({ 
          error: 'Failed to synthesize speech', 
          details: error.message 
      });
  }
}
