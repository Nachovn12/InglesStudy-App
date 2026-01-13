
const fs = require('fs');
const path = require('path');

const UPLOADS_DIR = path.join(__dirname, '../uploads');
const DB_FILE = path.join(__dirname, '../file_db.json');
const PUBLIC_DIR = path.join(__dirname, '../public');
const MATERIALS_DIR = path.join(PUBLIC_DIR, 'materials');
const OUTPUT_JSON = path.join(PUBLIC_DIR, 'static-files.json');

// 1. Crear carpeta public/materials si no existe
if (!fs.existsSync(MATERIALS_DIR)) {
    console.log('📂 Creando carpeta public/materials...');
    fs.mkdirSync(MATERIALS_DIR, { recursive: true });
}

// 2. Leer base de datos actual
if (!fs.existsSync(DB_FILE)) {
    console.error('❌ No se encontró file_db.json. Sube archivos primero en local.');
    process.exit(1);
}

const db = JSON.parse(fs.readFileSync(DB_FILE));
const validFiles = [];

// 3. Copiar archivos y construir indice
console.log('🚚 Migrando archivos para Vercel...');

db.forEach(file => {
    const sourcePath = path.join(UPLOADS_DIR, file.systemFilename);
    const destPath = path.join(MATERIALS_DIR, file.systemFilename);

    if (fs.existsSync(sourcePath)) {
        // Copiar archivo
        fs.copyFileSync(sourcePath, destPath);
        validFiles.push(file);
        console.log(`✅ Copiado: ${file.originalName}`);
    } else {
        console.warn(`⚠️ Saltado (No existe): ${file.systemFilename}`);
    }
});

// 4. Guardar índice estático
fs.writeFileSync(OUTPUT_JSON, JSON.stringify(validFiles, null, 2));
console.log(`\n🎉 ¡Listo! ${validFiles.length} archivos preparados para Vercel.`);
console.log(`📄 Índice guardado en: ${OUTPUT_JSON}`);
