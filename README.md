# 🎓 INU4100 English Companion App (American English File 1B)

Una aplicación web interactiva y moderna diseñada para dominar el contenido del curso **INU4100 - Inglés Elemental II**. Esta herramienta actúa como un compañero de estudio inteligente, combinando teoría, práctica y simulación de examen.

![Estado del Proyecto](https://img.shields.io/badge/Estado-Activo-success)
![Tech Stack](https://img.shields.io/badge/Stack-React_|_Vite_|_Node.js-blue)

## ✨ Características Principales

### 📚 1. Diccionario Inteligente (Study Guide)

- Base de datos completa basada en **Files 7-12** del libro _American English File 1B_.
- **Categorías:** Básico, Verbos (Regulares/Irregulares), Vocabulario (Casa, Comida, Tecnología), Gramática y Frases Útiles.
- **Soporte TTS (Text-to-Speech):** Escucha la pronunciación de cualquier palabra o frase al instante.

### 🎮 2. Gamificación (Vocabulary Games)

- **Flash Cards:** Tarjetas de memoria rápidas para repaso.
- **Matching Game:** Juego de emparejar términos contra el reloj.
- **Quiz Mode:** Preguntas de selección múltiple para validar conocimientos.

### 🗣️ 3. Simulador de Speaking

- Simula una entrevista oral real del examen.
- Preguntas aleatorias de temas clave (Last Summer, Future Plans, Shopping).
- **Feedback Visual:** Indicadores de cuándo hablar y cuándo escuchar.

### 🎧 4. Práctica de Listening & Writing

- **Listening:** Videos integrados con controles de velocidad y ejercicios de comprensión.
- **Writing:** Tareas de escritura cronometradas (15 min) simulando condiciones de examen (Email, Blog Post, Description).

### 🤖 5. Voz Premium (Google Cloud AI) - _Opcional_

- Integración experimental con **Google Cloud Text-to-Speech** para pronunciación nativa de nivel humano (Neural2).
- Servidor backend ligero en Node.js para gestionar las peticiones de forma segura.

---

## 🚀 Instalación y Uso Local

Sigue estos pasos para correr el proyecto en tu computadora:

### 1. Clonar el Repositorio

```bash
git clone https://github.com/TU_USUARIO/english-study-app.git
cd english-study-app
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Iniciar la Aplicación (Frontend)

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`.

---

## ☁️ Configuración de Voz Premium (Opcional)

Por defecto, la app usa la voz del navegador (**Microsoft Sabina** o **Google US English**). Si deseas activar la calidad de estudio con Google Cloud:

1. Obtén tu archivo de credenciales `google-vision-key.json` desde Google Cloud Console.
2. Coloca el archivo en la carpeta raíz del proyecto.
3. Inicia el servidor de voz en una **nueva terminal**:
   ```bash
   node server.js
   ```
4. En la app, abre configuración (⚙️) y activa **"Usar Voz Premium (Google Cloud)"**.

---

## 🛠️ Tecnologías Usadas

- **Frontend:** React.js, Vite
- **Estilos:** CSS3 Moderno (Glassmorphism, Grid/Flexbox)
- **Iconos:** Lucide React
- **Navegación:** React Router DOM
- **Backend (Opcional):** Express.js, Google Cloud TTS Client

---

## 📝 Notas del Desarrollador

Este proyecto fue creado para facilitar el estudio del examen final de INU4100.
**¡Mucho éxito en el examen! 🍀**
