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
