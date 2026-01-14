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

// Google Generative AI Configuration
import { GoogleGenerativeAI } from '@google/generative-ai';
const GEMINI_API_KEY = process.env.VITE_GOOGLE_API_KEY || process.env.GEMINI_API_KEY; 

console.log("--- SERVER CONFIG ---");
console.log(`🔑 GEMINI Key detection: ${GEMINI_API_KEY ? '✅ Found' : '❌ MISSING'} (First 4 chars: ${GEMINI_API_KEY ? GEMINI_API_KEY.substring(0,4) : 'N/A'})`);

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;


// Obtener rutas para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const KEY_FILE = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, 'google-vision-key.json');
console.log(`🗣️ TTS Key File path: ${KEY_FILE}`);
console.log(`   Exists? ${fs.existsSync(KEY_FILE) ? '✅ YES' : '❌ NO'}`);

// Cliente de Google TTS (GLOBAL)
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

// 📂 API: CHAT - Using Gemini API 2.5 Flash Lite
app.post('/api/chat', async (req, res) => {
    console.log("📩 Request to /api/chat received");
    
    const API_KEY = process.env.VITE_GOOGLE_API_KEY;
    if (!API_KEY) {
        console.error("❌ Chat failed: API Key missing.");
        return res.status(500).json({ reply: "Configuration Error: API Key Missing on Server." });
    }

    try {
        const { message, systemPrompt } = req.body;
        console.log(`💬 Processing message: "${message.substring(0, 50)}..."`);
        
        // Gemini API endpoint (NOT Vertex AI)
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${API_KEY}`;
        
        // Prepare request body
        const requestBody = {
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            text: systemPrompt + "\n\nRemember: Use **bold** for English phrases.\n\nUser: " + message
                        }
                    ]
                }
            ],
            generationConfig: {
                temperature: 0.7,
                topP: 0.95,
                topK: 40,
                maxOutputTokens: 1024,
            }
        };
        
        console.log('🚀 Calling Gemini API 2.0 Flash...');
        
        // Make request to Gemini API
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Gemini API Error:', errorText);
            throw new Error(`Gemini API Error: ${response.status} - ${errorText}`);
        }
        
        // Parse response
        const data = await response.json();
        
        // Extract text from response
        let fullText = '';
        if (data.candidates && data.candidates[0]?.content?.parts) {
            const parts = data.candidates[0].content.parts;
            for (const part of parts) {
                if (part.text) {
                    fullText += part.text;
                }
            }
        }
        
        if (!fullText) {
            throw new Error('No response text generated');
        }
        
        console.log(`🤖 AI Reply generated (${fullText.length} chars) via Gemini API`);
        res.json({ reply: fullText });

    } catch (error) {
        console.error("❌ AI Chat Internal Error:", error);
        res.status(500).json({ reply: `Server Error: ${error.message}` });
    }
});

// ... (initClient)

app.post('/api/synthesize', async (req, res) => {
  console.log("🔈 Request to /api/synthesize received");
  if (!client) {
    console.error("❌ TTS Failed: Google Client not initialized.");
    return res.status(500).json({ error: 'Server TTS not configured' });
  }

  const text = req.body.text; 
  console.log(`📝 Synthesizing text: "${text.substring(0, 30)}..." [Lang: ${req.body.languageCode}]`);

  // ... (rest of logic)
  // VOICE PERSONAS CONFIGURATION (Google Cloud Neural2)
  // Using DIVERSE regional variants for maximum distinction
  const VOICE_PERSONAS = {
      'orbit': { // Male, Bold/Energetic - Deep authoritative
          en: 'en-US-Neural2-J', // Male, deep/authoritative
          es: 'es-US-Neural2-B', // Male US Spanish, standard
          esLang: 'es-US'
      },
      'nova': { // Female, Warm/Friendly - PREMIUM PROFESSIONAL
          en: 'en-US-Neural2-C', // Female, professional/warm
          es: 'es-US-Neural2-A', // Female US Spanish, natural/warm
          esLang: 'es-US'
      },
      'echo': { // Male, Soft/Calm - Gentle
          en: 'en-US-Neural2-A', // Male, soft/calm
          es: 'es-US-Neural2-C', // Male US Spanish, calm
          esLang: 'es-US'
      },
      'shimmer': { // Female, Bright/Clear - Energetic
          en: 'en-US-Neural2-H', // Female, bright/clear
          es: 'es-ES-Neural2-C', // Female European Spanish, bright
          esLang: 'es-ES'
      }
  };

  const voiceId = req.body.voiceId || 'orbit'; // Default to Orbit
  const selectedPersona = VOICE_PERSONAS[voiceId] || VOICE_PERSONAS['orbit'];
  
  console.log(`🎙️ Voice Persona: ${voiceId} [En: ${selectedPersona.en}, Es: ${selectedPersona.es}]`);

  const languageCode = req.body.languageCode || 'es-US'; 

  if (!text) {
    return res.status(400).send('Falta el texto');
  }

  try {
      let request;
      
      // CASE 1: ENGLISH ONLY REQUEST
      if (languageCode === 'en-US') {
          request = {
            input: { text: text }, 
            voice: { 
                languageCode: 'en-US', 
                name: selectedPersona.en
            },
            audioConfig: { audioEncoding: 'MP3' },
            enableTimePointing: ['TIMEPOINT_TYPE_UNSPECIFIED', 'SSML_MARK'] // Request all types
          };
      } 
      // CASE 2: BILINGUAL / DEFAULT MODE (Spanish Base with English switches)
      else {
          // 1. Clean up Text
          let cleanText = text.replace(/[*]{3,}/g, '**')
          cleanText = cleanText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

          // 2. Build SSML
          let ssml = `<speak>`;
          const segments = cleanText.split(/(\*\*.*?\*\*)/g);
          
          segments.forEach(segment => {
              if (segment.startsWith('**') && segment.endsWith('**')) {
                  // English Content
                  const content = segment.replace(/\*\*/g, '').trim();
                  if (content) {
                      ssml += `<voice name="${selectedPersona.en}" languageCode="en-US"><prosody rate="0.9">${content}</prosody></voice> `;
                  }
              } else {
                  // Spanish Content
                  const content = segment.trim();
                  if (content) {
                       ssml += `<voice name="${selectedPersona.es}" languageCode="${selectedPersona.esLang}">${content}</voice> `;
                  }
              }
          });
          ssml += `</speak>`;

          request = {
            input: { ssml: ssml },
            // Base voice must be Spanish Neural2 to support switching
            voice: { 
                languageCode: selectedPersona.esLang, 
                name: selectedPersona.es 
            },
            audioConfig: { audioEncoding: 'MP3' },
            enableTimePointing: ['TIMEPOINT_TYPE_UNSPECIFIED', 'SSML_MARK'] // Request all types
          };
      }

      const [response] = await client.synthesizeSpeech(request);
      
      // Return both audio and visemes
      const audioBase64 = response.audioContent.toString('base64');
      const timepoints = response.timepoints || [];
      
      console.log(`✅ TTS Success: ${timepoints.length} timepoints generated`);
      console.log(`📦 Audio size: ${audioBase64.length} chars (base64)`);
      
      res.setHeader('Content-Type', 'application/json');
      res.json({
        audio: audioBase64,
        visemes: timepoints,
        duration: response.audioContent.length
      });

  } catch (err) {
    console.error('ERROR en Google Cloud TTS:', err);
    res.status(500).send(err.message);
  }
});

// ... (imports remain)
import multer from 'multer';

// ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    // SANITIZACIÓN ROBUSTA: Convertir a nombre seguro (sin tildes, espacios ni caracteres raros)
    // "Examen de Práctica.pdf" -> "examen-de-practica.pdf"
    const safeName = file.originalname
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Quitar tildes
        .replace(/[^a-zA-Z0-9.]/g, '-')  // Reemplazar raros por guiones
        .replace(/-+/g, '-')             // Evitar guiones múltiples
        .toLowerCase();

    cb(null, Date.now() + '-' + safeName)
  }
})

const upload = multer({ storage: storage })

// Servir archivos estáticos (PDFs)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// ... (TTS logic remains)

// 📂 API: DESCARGAR ARCHIVO (Forzado)
app.get('/api/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filepath = path.join(uploadDir, filename);
    
    // Buscar nombre original bonito en la DB
    let downloadName = filename;
    try {
        if (fs.existsSync(DB_FILE)) {
             const db = JSON.parse(fs.readFileSync(DB_FILE));
             const record = db.find(f => f.systemFilename === filename);
             if (record) {
                 downloadName = record.originalName;
             }
        }
    } catch (e) {}

    // Verificamos si existe antes de intentar descargar
    if (fs.existsSync(filepath)) {
        // res.download(path, [filename], [callback])
        // El segundo argumento es el nombre que verá el usuario final
        res.download(filepath, downloadName, (err) => {
            if (err && !res.headersSent) {
               console.error("Download error:", err.message);
               res.status(404).send("File not found or download error");
            }
        }); 
    } else {
        res.status(404).send('Archivo no encontrado');
    }
});

// 📂 API: SUBIR ARCHIVOS (Múltiples)
app.post('/api/upload', upload.array('files'), (req, res) => {
  const { examId } = req.body;
  if (!req.files || req.files.length === 0 || !examId) {
    return res.status(400).send('Falta archivos o ID del examen');
  }
  
  // Guardar registro para cada archivo
  req.files.forEach(file => {
    // El nombre en disco (file.filename) ya viene corregido por el storage engine de arriba
    // El originalName también deberíamos guardarlo corregido o confiar en el del disco sin el timestamp
    
    // Para simplificar y consistencia, usamos el nombre del archivo en disco quitando el timestamp si queremos el original
    // O mejor, usamos file.originalname aplicando el mismo fix por si acaso multer no lo muta en el objeto file
    let originalNameFixed = file.originalname;
    try {
        originalNameFixed = Buffer.from(file.originalname, 'latin1').toString('utf8');
    } catch (e) {}

    addFileRecord(examId, file.filename, originalNameFixed);
  });
  
  res.json({ message: `${req.files.length} archivos subidos con éxito` });
});

// 📂 API: BORRAR ARCHIVO
app.delete('/api/files/:filename', (req, res) => {
    const filename = req.params.filename;
    const filepath = path.join(uploadDir, filename);

    // 1. Borrar del registro (JSON)
    let db = [];
    if (fs.existsSync(DB_FILE)) {
        try {
            db = JSON.parse(fs.readFileSync(DB_FILE));
            const newDb = db.filter(f => f.systemFilename !== filename);
            fs.writeFileSync(DB_FILE, JSON.stringify(newDb, null, 2));
        } catch (e) {
            console.error("Error updating DB on delete:", e);
        }
    }

    // 2. Borrar archivo físico
    if (fs.existsSync(filepath)) {
        fs.unlink(filepath, (err) => {
            if (err) {
                console.error("Error deleting file:", err);
                return res.status(500).send("Error deleting file from disk");
            }
            res.json({ message: "File deleted successfully" });
        });
    } else {
        // Si no existe en disco pero ya lo borramos de la DB, cuenta como éxito
        res.json({ message: "File deleted (was missing from disk)" });
    }
});

// 📂 API: LISTAR ARCHIVOS
app.get('/api/files/:examId', (req, res) => {
  const { examId } = req.params;
  const files = getFilesForExam(examId);
  res.json(files);
});

// Simple In-Memory Database for File Mapping (Persisted to JSON for restarts)
const DB_FILE = path.join(__dirname, 'file_db.json');
const getFilesForExam = (examId) => {
  try {
    if (!fs.existsSync(DB_FILE)) return [];
    const data = JSON.parse(fs.readFileSync(DB_FILE));
    return data.filter(f => f.examId === examId);
  } catch (e) { return [] }
}

const addFileRecord = (examId, systemFilename, originalName) => {
  let data = [];
  try {
    if (fs.existsSync(DB_FILE)) data = JSON.parse(fs.readFileSync(DB_FILE));
  } catch(e) {}
  
  data.push({
    id: Date.now().toString() + '-' + Math.floor(Math.random() * 10000),
    examId,
    systemFilename,
    originalName,
    uploadDate: new Date()
  });
  
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Función de Limpieza de Fantasmas 👻
const cleanupInvalidRecords = () => {
  if (!fs.existsSync(DB_FILE)) return;
  
  try {
    const db = JSON.parse(fs.readFileSync(DB_FILE));
    const initialCount = db.length;
    
    // Filtramos solo los archivos que SÍ existen en disco
    const validFiles = db.filter(file => {
       const filepath = path.join(uploadDir, file.systemFilename);
       return fs.existsSync(filepath);
    });
    
    if (validFiles.length < initialCount) {
        console.log(`🧹 Limpieza: Se eliminaron ${initialCount - validFiles.length} archivos fantasmas de la base de datos.`);
        fs.writeFileSync(DB_FILE, JSON.stringify(validFiles, null, 2));
    }
  } catch (e) {
    console.error("Error durante la limpieza:", e);
  }
}

app.listen(port, () => {
  cleanupInvalidRecords(); // <--- Ejecutar limpieza al inicio
  console.log(`🚀 Servidor con Voz Premium y Archivos corriendo en http://localhost:${port}`);
});
