import { useState, useContext, useEffect } from 'react'
import { LanguageContext } from '../App'
import { getTranslation } from '../translations'
import './StudyGuide.css'

function StudyGuide({ onBack }) {
  const { language } = useContext(LanguageContext)
  const t = (key) => getTranslation(language, key)
  const [activeFile, setActiveFile] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  // Audio Settings State
  const [showAudioSettings, setShowAudioSettings] = useState(false)
  const [voices, setVoices] = useState([])
  const [selectedVoiceIndex, setSelectedVoiceIndex] = useState(0)
  const [useCloudVoice, setUseCloudVoice] = useState(false) // Toggle for Cloud API
  const [cloudLoading, setCloudLoading] = useState(false)

  // Initialize Voices Robustly (Browser Voices)
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices()
      
      if (availableVoices.length === 0) {
        setTimeout(loadVoices, 100)
        return
      }

      // 1. FILTER: Allow English voices AND Sabina explicitly. Ban Raul/Rudolph.
      const filteredVoices = availableVoices.filter(v => {
        const name = v.name.toLowerCase()
        const isSabina = name.includes('sabina')
        const isEnglish = v.lang.startsWith('en') || name.includes('english') || v.lang.indexOf('en-') !== -1
        
        return (isEnglish || isSabina) && !name.includes('raul') && !name.includes('rudolph')
      })
      
      setVoices(filteredVoices)
      
      // 2. AUTO-SELECT SABINA (Default Offline)
      const sabinaIndex = filteredVoices.findIndex(v => v.name.includes('Sabina'))
      if (sabinaIndex !== -1) {
         setSelectedVoiceIndex(sabinaIndex)
      } else if (selectedVoiceIndex === 0 && filteredVoices.length > 0) {
         const bestIndex = filteredVoices.findIndex(v => v.name.includes('Google US English') || v.name.includes('Natural'))
         if (bestIndex !== -1) setSelectedVoiceIndex(bestIndex)
      }
    }

    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices
    return () => { window.speechSynthesis.onvoiceschanged = null }
  }, [])

  const playAudio = async (text) => {
    // CLOUD VOICE STRATEGY
    if (useCloudVoice) {
      setCloudLoading(true)
      try {
        // Determine URL: In production (Vercel) use relative path /api/synthesize
        // In local dev, use the dedicated node server port 3001
        const apiUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
          ? 'http://localhost:3001/api/synthesize' 
          : '/api/synthesize';

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, gender: 'male' }) // Default to Male voice
        })

        if (!response.ok) throw new Error('Cloud TTS failed')

        const blob = await response.blob()
        const audioUrl = URL.createObjectURL(blob)
        const audio = new Audio(audioUrl)
        audio.play()
      } catch (err) {
        console.error("Cloud TTS Error:", err)
        const isLocal = window.location.hostname === 'localhost';
        const msg = isLocal 
          ? "⚠️ Error Local: Asegúrate de correr 'node server.js'" 
          : "⚠️ Error Nube: Verifica que las credenciales GOOGLE_CREDENTIALS estén configuradas en Vercel.";
        
        alert(msg)
        setUseCloudVoice(false) // Fallback to local
      } finally {
        setCloudLoading(false)
      }
      return
    }

    // BROWSER VOICE STRATEGY (Fallback)
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel() 
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'en-US'
      
      if (voices.length > 0) {
        utterance.voice = voices[selectedVoiceIndex]
      }
      
      utterance.rate = 0.9 
      window.speechSynthesis.speak(utterance)
    }
  }

  // ... (Data definitions remain the same) ...


  // DICTIONARY DATABASE (Master Collection)
  const dictionary = {
    basics: {
      label: language === 'es' ? 'Básico' : 'Basics',
      icon: '1️⃣',
      sections: [
        {
          title: language === 'es' ? 'Números 1-20' : 'Numbers 1-20',
          items: [
            { en: 'One', es: 'Uno' }, { en: 'Two', es: 'Dos' }, { en: 'Three', es: 'Tres' },
            { en: 'Four', es: 'Cuatro' }, { en: 'Five', es: 'Cinco' }, { en: 'Six', es: 'Seis' },
            { en: 'Seven', es: 'Siete' }, { en: 'Eight', es: 'Ocho' }, { en: 'Nine', es: 'Nueve' },
            { en: 'Ten', es: 'Diez' }, { en: 'Eleven', es: 'Once' }, { en: 'Twelve', es: 'Doce' },
            { en: 'Thirteen', es: 'Trece' }, { en: 'Fourteen', es: 'Catorce' }, { en: 'Fifteen', es: 'Quince' },
            { en: 'Twenty', es: 'Veinte' }
          ]
        },
        {
          title: language === 'es' ? 'Números Grandes & Ordinales' : 'Big Numbers & Ordinals',
          items: [
            { en: 'Thirty', es: 'Treinta' }, { en: 'Forty', es: 'Cuarenta' }, { en: 'Fifty', es: 'Cincuenta' },
            { en: 'One Hundred', es: 'Cien' }, { en: 'One Thousand', es: 'Mil' },
            { en: 'First (1st)', es: 'Primero' }, { en: 'Second (2nd)', es: 'Segundo' }, { en: 'Third (3rd)', es: 'Tercero' }
          ]
        },
        {
          title: language === 'es' ? 'Días y Tiempo' : 'Days & Time',
          items: [
            { en: 'Monday', es: 'Lunes' }, { en: 'Tuesday', es: 'Martes' }, { en: 'Wednesday', es: 'Miércoles' },
            { en: 'Thursday', es: 'Jueves' }, { en: 'Friday', es: 'Viernes' }, { en: 'Saturday', es: 'Sábado' }, { en: 'Sunday', es: 'Domingo' },
            { en: 'Yesterday', es: 'Ayer' }, { en: 'Today', es: 'Hoy' }, { en: 'Tomorrow', es: 'Mañana' },
            { en: 'Morning', es: 'Mañana' }, { en: 'Afternoon', es: 'Tarde' }, { en: 'Night', es: 'Noche' }
          ]
        },
        {
          title: language === 'es' ? 'Expresiones de Tiempo (Pasado)' : 'Time Expressions (Past)',
          items: [
            { en: 'Yesterday', es: 'Ayer' },
            { en: 'Yesterday morning', es: 'Ayer en la mañana' },
            { en: 'Last night', es: 'Anoche' },
            { en: 'Last week', es: 'La semana pasada' },
            { en: 'Last month', es: 'El mes pasado' },
            { en: 'Last summer', es: 'El verano pasado' },
            { en: 'Three days ago', es: 'Hace tres días' },
            { en: '5 minutes ago', es: 'Hace 5 minutos' },
            { en: 'In 2017', es: 'En 2017' },
            { en: 'A year ago', es: 'Hace un año' }
          ]
        },
        {
          title: language === 'es' ? 'Preposiciones de Lugar' : 'Prepositions of Place',
          items: [
            { en: 'In', es: 'En/Dentro de' }, { en: 'On', es: 'Sobre' },
            { en: 'Under', es: 'Debajo' }, { en: 'Next to', es: 'Al lado de' },
            { en: 'Between', es: 'Entre' }, { en: 'Behind', es: 'Detrás de' },
            { en: 'In front of', es: 'En frente de' }, { en: 'Across from', es: 'Cruzando / Frente a' },
            { en: 'Above / Over', es: 'Encima (sin tocar)' }
          ]
        },
        {
          title: language === 'es' ? 'Question Words (Preguntas)' : 'Question Words',
          items: [
            { en: 'Who?', es: '¿Quién?' }, { en: 'What?', es: '¿Qué?' },
            { en: 'Where?', es: '¿Dónde?' }, { en: 'When?', es: '¿Cuándo?' },
            { en: 'Why?', es: '¿Por qué?' }, { en: 'How?', es: '¿Cómo?' },
            { en: 'How many?', es: '¿Cuántos? (Contable)' }, { en: 'How much?', es: '¿Cuánto? (Incontable)' },
            { en: 'How often?', es: '¿Con qué frecuencia?' }, { en: 'What time?', es: '¿A qué hora?' }
          ]
        }
      ]
    },
    verbs: {
      label: language === 'es' ? 'Verbos' : 'Verbs',
      icon: '🏃',
      sections: [
        {
          title: language === 'es' ? 'Verbos Irregulares (CRUCIALES)' : 'Irregular Verbs (CRITICAL)',
          items: [
            { en: 'Be → Was/Were', es: 'Ser/Estar' },
            { en: 'Go → Went', es: 'Ir' },
            { en: 'Eat → Ate', es: 'Comer' },
            { en: 'Have → Had', es: 'Tener' },
            { en: 'Get → Got', es: 'Obtener/Llegar' },
            { en: 'Buy → Bought', es: 'Comprar' },
            { en: 'See → Saw', es: 'Ver' },
            { en: 'Do → Did', es: 'Hacer' },
            { en: 'Make → Made', es: 'Hacer (crear)' },
            { en: 'Read → Read', es: 'Leer' },
            { en: 'Speak → Spoke', es: 'Hablar' },
            { en: 'Take → Took', es: 'Tomar/Llevar' },
            { en: 'Give → Gave', es: 'Dar' },
            { en: 'Know → Knew', es: 'Saber' },
            { en: 'Think → Thought', es: 'Pensar' },
            { en: 'Find → Found', es: 'Encontrar' },
            { en: 'Feel → Felt', es: 'Sentir' },
            { en: 'Sleep → Slept', es: 'Dormir' },
            { en: 'Hear → Heard', es: 'Oír' },
            { en: 'Come → Came', es: 'Venir' },
            { en: 'Say → Said', es: 'Decir' },
            { en: 'Sit → Sat', es: 'Sentarse' },
            { en: 'Wear → Wore', es: 'Usar (ropa)' },
            { en: 'Sing → Sang', es: 'Cantar' },
            { en: 'Put on → Put on', es: 'Ponerse' }
          ]
        },
        {
          title: language === 'es' ? 'Verbos Regulares (+ED)' : 'Regular Verbs (+ED)',
          items: [
            { en: 'Work → Worked', es: 'Trabajar' },
            { en: 'Play → Played', es: 'Jugar' },
            { en: 'Study → Studied', es: 'Estudiar' },
            { en: 'Watch → Watched', es: 'Mirar' },
            { en: 'Listen → Listened', es: 'Escuchar' },
            { en: 'Start → Started', es: 'Comenzar' },
            { en: 'Finish → Finished', es: 'Terminar' },
            { en: 'Live → Lived', es: 'Vivir' },
            { en: 'Want → Wanted', es: 'Querer' },
            { en: 'Need → Needed', es: 'Necesitar' },
            { en: 'Help → Helped', es: 'Ayudar' },
            { en: 'Clean → Cleaned', es: 'Limpiar' },
            { en: 'Cook → Cooked', es: 'Cocinar' },
            { en: 'Arrive → Arrived', es: 'Llegar' },
            { en: 'Stay → Stayed', es: 'Quedarse' }
          ]
        },
        {
          title: language === 'es' ? 'Expresiones con GO' : 'Expressions with GO',
          items: [
            { en: 'Go shopping', es: 'Ir de compras' },
            { en: 'Go to bed', es: 'Ir a dormir' },
            { en: 'Go home', es: 'Ir a casa' },
            { en: 'Go out', es: 'Salir (fiesta)' },
            { en: 'Go by bus/car/plane', es: 'Ir en bus/auto/avión' },
            { en: 'Go back', es: 'Regresar' },
            { en: 'Go on vacation', es: 'Ir de vacaciones' }
          ]
        },
        {
          title: language === 'es' ? 'Expresiones con HAVE' : 'Expressions with HAVE',
          items: [
            { en: 'Have breakfast', es: 'Desayunar' },
            { en: 'Have lunch', es: 'Almorzar' },
            { en: 'Have dinner', es: 'Cenar' },
            { en: 'Have a good time', es: 'Pasarlo bien' },
            { en: 'Have a drink', es: 'Tomar algo' }
          ]
        },
        {
          title: language === 'es' ? 'Expresiones con GET' : 'Expressions with GET',
          items: [
            { en: 'Get up', es: 'Levantarse' },
            { en: 'Get dressed', es: 'Vestirse' },
            { en: 'Get home', es: 'Llegar a casa' },
            { en: 'Get to the airport', es: 'Llegar al aeropuerto' },
            { en: 'Get a taxi', es: 'Tomar (conseguir) un taxi' }
          ]
        },
        {
          title: language === 'es' ? 'Verbos + TO (Infinitivos)' : 'Verbs + TO (Infinitive)',
          items: [
            { en: 'Want to', es: 'Querer' }, { en: 'Need to', es: 'Necesitar' },
            { en: 'Decide to', es: 'Decidir' }, { en: 'Hope to', es: 'Esperar' },
            { en: 'Plan to', es: 'Planear' }, { en: 'Promise to', es: 'Prometer' },
            { en: 'Forget to', es: 'Olvidar' }, { en: 'Remember to', es: 'Recordar' },
            { en: 'Would like to', es: 'Gustaría' }, { en: 'Learn to', es: 'Aprender a' }
          ]
        }
      ]
    },
    vocab: {
      label: language === 'es' ? 'Vocabulario' : 'Vocabulary',
      icon: '🏠',
      sections: [
        {
          title: language === 'es' ? 'La Casa: Habitaciones & Partes' : 'House: Rooms & Parts',
          items: [
            { en: 'Kitchen', es: 'Cocina' }, { en: 'Bedroom', es: 'Dormitorio' },
            { en: 'Bathroom', es: 'Baño' }, { en: 'Living room', es: 'Sala de estar' },
            { en: 'Dining room', es: 'Comedor' }, { en: 'Garage', es: 'Garaje' },
            { en: 'Yard', es: 'Patio' }, { en: 'Balcony', es: 'Balcón' },
            { en: 'Ceiling', es: 'Techo' }, { en: 'Floor', es: 'Piso' },
            { en: 'Stairs', es: 'Escaleras' }, { en: 'Wall', es: 'Pared' },
            { en: 'Study / Office', es: 'Estudio/Oficina' }
          ]
        },
        {
          title: language === 'es' ? 'Muebles (Furniture)' : 'Furniture',
          items: [
            { en: 'Bed', es: 'Cama' }, { en: 'Chair', es: 'Silla' },
            { en: 'Table', es: 'Mesa' }, { en: 'Desk', es: 'Escritorio' },
            { en: 'Sofa', es: 'Sofá' }, { en: 'Armchair', es: 'Sillón' },
            { en: 'Bookshelf', es: 'Estantería' }, { en: 'Wardrobe', es: 'Armario/Clóset' },
            { en: 'Mirror', es: 'Espejo' }, { en: 'Lamp', es: 'Lámpara' },
            { en: 'Fridge', es: 'Refrigerador' }, { en: 'Stove', es: 'Estufa/Cocina' },
            { en: 'Microwave', es: 'Microondas' }, { en: 'Shower', es: 'Ducha' },
            { en: 'Toilet', es: 'Inodoro' }, { en: 'Washing machine', es: 'Lavadora' }
          ]
        },
        {
          title: language === 'es' ? 'Profesiones' : 'Professions',
          items: [
            { en: 'Teacher', es: 'Profesor/a' }, { en: 'Student', es: 'Estudiante' },
            { en: 'Writer', es: 'Escritor' }, { en: 'Actor', es: 'Actor' },
            { en: 'Singer', es: 'Cantante' }, { en: 'Scientist', es: 'Científico' },
            { en: 'Dancer', es: 'Bailarín' }, { en: 'Painter', es: 'Pintor' },
            { en: 'Musician', es: 'Músico' }, { en: 'Inventor', es: 'Inventor' },
            { en: 'Director', es: 'Director' }
          ]
        },
        {
          title: language === 'es' ? 'Comida (Food & Drinks)' : 'Food & Drinks',
          items: [
            { en: 'Bread', es: 'Pan' }, { en: 'Cheese', es: 'Queso' },
            { en: 'Meat', es: 'Carne' }, { en: 'Chicken', es: 'Pollo' },
            { en: 'Fish', es: 'Pescado' }, { en: 'Milk', es: 'Leche' },
            { en: 'Water', es: 'Agua' }, { en: 'Rice', es: 'Arroz' },
            { en: 'Pasta', es: 'Pasta' }, { en: 'Salad', es: 'Ensalada' },
            { en: 'Apples', es: 'Manzanas' }, { en: 'Bananas', es: 'Plátanos' },
            { en: 'Oranges', es: 'Naranjas' }, { en: 'Carrots', es: 'Zanahorias' },
            { en: 'Potatoes', es: 'Papas' }, { en: 'Onions', es: 'Cebollas' },
            { en: 'Cake', es: 'Pastel' }, { en: 'Ice cream', es: 'Helado' },
            { en: 'Chocolate', es: 'Chocolate' }
          ]
        },
        {
          title: language === 'es' ? 'Recipientes (Containers)' : 'Containers',
          items: [
            { en: 'A bottle of', es: 'Una botella de' }, { en: 'A box of', es: 'Una caja de' },
            { en: 'A can of', es: 'Una lata de' }, { en: 'A carton of', es: 'Un cartón de' },
            { en: 'A jar of', es: 'Un frasco de' }, { en: 'A bag of', es: 'Una bolsa de' },
            { en: 'A package of', es: 'Un paquete de' }
          ]
        },
        {
          title: language === 'es' ? 'Lugares de la Ciudad' : 'City Places',
          items: [
            { en: 'Airport', es: 'Aeropuerto' }, { en: 'Station', es: 'Estación' },
            { en: 'Museum', es: 'Museo' }, { en: 'Park', es: 'Parque' },
            { en: 'Church', es: 'Iglesia' }, { en: 'Hospital', es: 'Hospital' },
            { en: 'Pharmacy', es: 'Farmacia' }, { en: 'Supermarket', es: 'Supermercado' },
            { en: 'Mall', es: 'Centro Comercial' }, { en: 'Bank', es: 'Banco' },
            { en: 'Bridge', es: 'Puente' }, { en: 'River', es: 'Río' },
            { en: 'Square', es: 'Plaza' }, { en: 'Castle', es: 'Castillo' }
          ]
        },
        {
          title: language === 'es' ? 'Tecnología & Internet' : 'Tech & Internet',
          items: [
            { en: 'Download an app', es: 'Descargar app' }, { en: 'Upload a video', es: 'Subir video' },
            { en: 'Share a photo', es: 'Compartir foto' }, { en: 'Send a message', es: 'Enviar mensaje' },
            { en: 'Post a tweet', es: 'Publicar tweet' }, { en: 'Log in', es: 'Iniciar sesión' },
            { en: 'Wifi', es: 'Wifi' }, { en: 'Online', es: 'En línea' }
          ]
        }
      ]
    },
    grammar: {
      label: language === 'es' ? 'Gramática' : 'Grammar',
      icon: 'abc',
      sections: [
        {
          title: language === 'es' ? 'Reglas de Tiempos (Con traducción)' : 'Tense Rules (Translated)',
          isRule: true,
          items: [
            { 
              label: 'PASADO SIMPLE (Acciones terminadas)', 
              text: '• I worked (Yo trabajé)\n• I went (Yo fui)\n• Did you go? (¿Fuiste?)\n• I did not go (No fui)', 
              color: 'blue' 
            },
            { 
              label: 'PRESENTE PERFECTO (Experiencias - "Alguna vez")', 
              text: '• I HAVE worked (Yo HE trabajado)\n• She HAS gone (Ella HA ido)\n• Have you ever...? (¿Alguna vez has...?)', 
              color: 'purple' 
            },
            { 
              label: 'FUTURO "GOING TO" (Planes seguros)', 
              text: '• I AM GOING TO travel (Yo VOY A viajar)\n• She IS GOING TO buy (Ella VA A comprar)\n• Are you going to...? (¿Vas a...?)', 
              color: 'green' 
            }
          ]
        },
        {
          title: language === 'es' ? 'Comparativos y Superlativos' : 'Comparatives & Superlatives',
          items: [
            { en: 'Big → Bigger → The Biggest', es: 'Grande' },
            { en: 'Small → Smaller → The Smallest', es: 'Pequeño' },
            { en: 'Fast → Faster → The Fastest', es: 'Rápido' },
            { en: 'Good → Better → The Best', es: 'Bueno (Irregular)' },
            { en: 'Bad → Worse → The Worst', es: 'Malo (Irregular)' },
            { en: 'Expensive → More expensive → The most expensive', es: 'Caro (Larga)' },
            { en: 'Beautiful → More beautiful → The most beautiful', es: 'Hermoso (Larga)' }
          ]
        },
        {
          title: language === 'es' ? 'Adverbios (Cómo haces algo)' : 'Adverbs',
          items: [
            { en: 'Slowly', es: 'Lentamente' }, { en: 'Quickly', es: 'Rápidamente' },
            { en: 'Carefully', es: 'Cuidadosamente' }, { en: 'Easily', es: 'Fácilmente' },
            { en: 'Well', es: 'Bien (Irregular)' }, { en: 'Hard', es: 'Duro/Fuerte (Irregular)' },
            { en: 'Fast', es: 'Rápido (Irregular)' }
          ]
        },
        {
          title: language === 'es' ? 'Cuantificadores (Cantidad)' : 'Quantifiers',
          items: [
            { en: 'A lot of', es: 'Mucho/Muchos (Ambos)' },
            { en: 'Many', es: 'Muchos (Contable - Apples)' },
            { en: 'Much', es: 'Mucho (Incontable - Water)' },
            { en: 'A few', es: 'Unos pocos (Contable)' },
            { en: 'A little', es: 'Un poco (Incontable)' }
          ]
        }
      ]
    },
    phrases: {
      label: language === 'es' ? 'Frases' : 'Phrases',
      icon: '🗣️',
      sections: [
        {
          title: language === 'es' ? 'Verb Phrases (Futuro/Planes)' : 'Verb Phrases',
          items: [
            { en: 'Get married', es: 'Casarse' },
            { en: 'Have a surprise', es: 'Tener una sorpresa' },
            { en: 'Fall in love', es: 'Enamorarse' },
            { en: 'Become famous', es: 'Hacerse famoso' },
            { en: 'Move to a new house', es: 'Mudarse de casa' },
            { en: 'Get a new job', es: 'Conseguir trabajo' }
          ]
        },
        {
          title: language === 'es' ? 'Viajes y Transporte' : 'Travel & Transport',
          items: [
            { en: 'Book a flight', es: 'Reservar vuelo' },
            { en: 'Rent a car', es: 'Arrendar auto' },
            { en: 'Stay in a hotel', es: 'Quedarse en hotel' },
            { en: 'Buy a ticket', es: 'Comprar boleto' },
            { en: 'One-way ticket', es: 'Boleto de ida' },
            { en: 'Round-trip ticket', es: 'Boleto ida y vuelta' },
            { en: 'Can you call a taxi?', es: '¿Puede llamar un taxi?' }
          ]
        },
        {
          title: language === 'es' ? 'Restaurante' : 'Restaurant',
          items: [
            { en: 'Can I see the menu?', es: '¿Puedo ver el menú?' },
            { en: 'I would like to order...', es: 'Me gustaría ordenar...' },
            { en: 'For starter / main course', es: 'De entrada / plato de fondo' },
            { en: 'Can I have the bill?', es: '¿La cuenta por favor?' },
            { en: 'It was delicious', es: 'Estaba delicioso' }
          ]
        },
        {
          title: language === 'es' ? 'Direcciones (Practical 4)' : 'Directions',
          items: [
            { en: 'Turn left / right', es: 'Gira izquierda / derecha' },
            { en: 'Go straight ahead', es: 'Sigue derecho' },
            { en: 'On the corner', es: 'En la esquina' },
            { en: 'At the traffic lights', es: 'En el semáforo' },
            { en: 'Go past the church', es: 'Pasa la iglesia' }
          ]
        }
      ]
    }
  }

  // Active Tab State
  const [activeTab, setActiveTab] = useState('basics')

  // Search Logic
  const getFilteredContent = () => {
    if (!searchTerm) return dictionary[activeTab].sections
    
    // Global Search across all tabs if searching
    let results = []
    Object.keys(dictionary).forEach(key => {
      dictionary[key].sections.forEach(sec => {
        const matches = sec.items.filter(item => 
          item.en?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.es?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.text && item.text.toLowerCase().includes(searchTerm.toLowerCase()))
        )
        if (matches.length > 0) {
          results.push({ ...sec, title: `${dictionary[key].icon} ${sec.title}`, items: matches })
        }
      })
    })
    return results
  }

  const sectionsToRender = getFilteredContent()

  return (
    <div className="study-guide view-container">
      <div className="guide-header-bar">
        <button className="btn btn-outline back-button" onClick={onBack}>
          ← {language === 'es' ? 'Volver' : 'Back'}
        </button>
        <h2 className="guide-main-title">📚 {language === 'es' ? 'Diccionario Completo' : 'Complete Dictionary'}</h2>
      </div>

      <div className="search-bar-container card">
        <div className="search-controls">
           <input
            type="text"
            className="master-search"
            placeholder={language === 'es' ? '🔎 Busca cualquier palabra...' : '🔎 Search any word...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button 
            className="btn-audio-settings" 
            onClick={() => setShowAudioSettings(!showAudioSettings)}
            title="Configurar Voz"
          >
            ⚙️
          </button>
        </div>
        {showAudioSettings && (
          <div className="audio-settings-panel">
            <select 
              value={selectedVoiceIndex}
              onChange={(e) => {
                setSelectedVoiceIndex(parseInt(e.target.value))
                const u = new SpeechSynthesisUtterance("Test")
                u.voice = voices[parseInt(e.target.value)]
                window.speechSynthesis.speak(u)
              }}
              className="voice-select"
              disabled={useCloudVoice} // Disable selector if cloud is on
              style={{ opacity: useCloudVoice ? 0.5 : 1 }}
            >
              {voices.map((voice, idx) => (
                <option key={idx} value={idx}>{voice.name}</option>
              ))}
            </select>
            
            <div className="premium-voice-toggle" style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', background: 'rgba(66, 133, 244, 0.1)', borderRadius: '8px', border: '1px solid rgba(66, 133, 244, 0.3)' }}>
              <input 
                type="checkbox" 
                id="cloudToggle"
                checked={useCloudVoice} 
                onChange={() => setUseCloudVoice(!useCloudVoice)}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
              <label htmlFor="cloudToggle" style={{ cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold', color: '#4285f4', display: 'flex', alignItems: 'center', gap: '5px' }}>
                {cloudLoading ? '⏳ Conectando...' : '☁️ Usar Voz Premium (Google Neural)'}
              </label>
            </div>
          </div>
        )}
      </div>

      {!searchTerm && (
        <div className="guide-tabs">
          {Object.keys(dictionary).map(key => (
            <button
              key={key}
              className={`guide-tab ${activeTab === key ? 'active' : ''}`}
              onClick={() => setActiveTab(key)}
            >
              <span className="tab-icon">{dictionary[key].icon}</span>
              <span className="tab-label">{dictionary[key].label}</span>
            </button>
          ))}
        </div>
      )}

      <div className="guide-content-feed">
        {sectionsToRender.map((section, idx) => (
          <div key={idx} className="study-section card">
            <h3 className="category-header">{section.title}</h3>
            <div className="section-body">
              {section.items.map((item, i) => {
                if (section.isRule) {
                  return (
                    <div key={i} className="grammar-rule-box" style={{borderLeftColor: item.color === 'blue' ? '#3b82f6' : item.color === 'purple' ? '#8b5cf6' : '#10b981'}}>
                      <div className="rule-title">{item.label}</div>
                      <div className="rule-text">{item.text}</div>
                    </div>
                  )
                }
                return (
                  <div key={i} className="vocab-row" onClick={() => playAudio(item.en)}>
                    <div className="vocab-audio-btn">🔊</div>
                    <div className="vocab-text">
                      <div className="vocab-en">{item.en}</div>
                      <div className="vocab-es">{item.es}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
        {sectionsToRender.length === 0 && (
          <div className="no-results">No results found / No hay resultados</div>
        )}
      </div>
    </div>
  )
}

export default StudyGuide
