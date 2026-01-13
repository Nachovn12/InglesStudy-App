import { useState, useContext, useEffect, useRef } from 'react'
import { LanguageContext } from '../App'
import { getTranslation } from '../translations'
import './ComparativeGame.css'

function ComparativeGame({ onProgress, onBack }) {
  const { language } = useContext(LanguageContext)
  const t = (key) => getTranslation(language, key)

  const [currentPair, setCurrentPair] = useState(null)
  const [userAnswer, setUserAnswer] = useState('')
  const [mode, setMode] = useState('write') // 'write' or 'speak'
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const recognitionRef = useRef(null)
  const [feedback, setFeedback] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [score, setScore] = useState(0)
  const [round, setRound] = useState(1)
  const [showHint, setShowHint] = useState(false)

  // Comparison pairs with REAL IMAGES from Unsplash
  const comparisonPairs = [
    {
      id: 1,
      item1: { 
        name: 'Elephant', 
        image: 'https://images.unsplash.com/photo-1564760055775-d63b17a55c44?w=400&h=400&fit=crop&q=80',
        adjective: 'big' 
      },
      item2: { 
        name: 'Mouse', 
        image: 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=400&h=400&fit=crop&q=80',
        adjective: 'small' 
      },
      correctAnswer: 'The elephant is bigger than the mouse',
      translation: 'El elefante es más grande que el ratón',
      hint: 'Use: bigger than',
      category: 'animals'
    },
    {
      id: 2,
      item1: { 
        name: 'Cheetah', 
        image: 'https://images.unsplash.com/photo-1551969014-7d2c4cddf0b6?w=400&h=400&fit=crop&q=80',
        adjective: 'fast' 
      },
      item2: { 
        name: 'Turtle', 
        image: 'https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?w=400&h=400&fit=crop&q=80',
        adjective: 'slow' 
      },
      correctAnswer: 'The cheetah is faster than the turtle',
      translation: 'El guepardo es más rápido que la tortuga',
      hint: 'Use: faster than',
      category: 'animals'
    },
    {
      id: 3,
      item1: { 
        name: 'Sun', 
        image: 'https://images.unsplash.com/photo-1475274047050-1d0c0975c63e?w=400&h=400&fit=crop&q=80',
        adjective: 'hot' 
      },
      item2: { 
        name: 'Ice Cube', 
        image: 'https://images.unsplash.com/photo-1563306406-e66174fa3787?w=400&h=400&fit=crop&q=80',
        adjective: 'cold' 
      },
      correctAnswer: 'The sun is hotter than ice',
      translation: 'El sol es más caliente que el hielo',
      hint: 'Use: hotter than',
      category: 'nature'
    },
    {
      id: 4,
      item1: { 
        name: 'Mountain', 
        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop&q=80',
        adjective: 'high' 
      },
      item2: { 
        name: 'Hill', 
        image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&h=400&fit=crop&q=80',
        adjective: 'low' 
      },
      correctAnswer: 'The mountain is higher than the hill',
      translation: 'La montaña es más alta que la colina',
      hint: 'Use: higher than',
      category: 'nature'
    },
    {
      id: 5,
      item1: { 
        name: 'Ferrari', 
        image: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=400&h=400&fit=crop&q=80',
        adjective: 'expensive' 
      },
      item2: { 
        name: 'Bicycle', 
        image: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=400&h=400&fit=crop&q=80',
        adjective: 'cheap' 
      },
      correctAnswer: 'The Ferrari is more expensive than the bicycle',
      translation: 'El Ferrari es más caro que la bicicleta',
      hint: 'Use: more expensive than',
      category: 'vehicles'
    },
    {
      id: 6,
      item1: { 
        name: 'Diamond', 
        image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=400&fit=crop&q=80',
        adjective: 'valuable' 
      },
      item2: { 
        name: 'Rock', 
        image: 'https://images.unsplash.com/photo-1611689037241-d8dfe4280f2e?w=400&h=400&fit=crop&q=80',
        adjective: 'common' 
      },
      correctAnswer: 'The diamond is more valuable than the rock',
      translation: 'El diamante es más valioso que la roca',
      hint: 'Use: more valuable than',
      category: 'objects'
    },
    {
      id: 7,
      item1: { 
        name: 'Lion', 
        image: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=400&h=400&fit=crop&q=80',
        adjective: 'strong' 
      },
      item2: { 
        name: 'Cat', 
        image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=400&fit=crop&q=80',
        adjective: 'weak' 
      },
      correctAnswer: 'The lion is stronger than the cat',
      translation: 'El león es más fuerte que el gato',
      hint: 'Use: stronger than',
      category: 'animals'
    },
    {
      id: 8,
      item1: { 
        name: 'Rocket', 
        image: 'https://images.unsplash.com/photo-1516849841032-87cbac4d88f7?w=400&h=400&fit=crop&q=80',
        adjective: 'fast' 
      },
      item2: { 
        name: 'Car', 
        image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=400&fit=crop&q=80',
        adjective: 'slow' 
      },
      correctAnswer: 'The rocket is faster than the car',
      translation: 'El cohete es más rápido que el auto',
      hint: 'Use: faster than',
      category: 'vehicles'
    },
    {
      id: 9,
      item1: { 
        name: 'Beach', 
        image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=400&fit=crop&q=80',
        adjective: 'beautiful' 
      },
      item2: { 
        name: 'Desert', 
        image: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=400&h=400&fit=crop&q=80',
        adjective: 'dry' 
      },
      correctAnswer: 'The beach is more beautiful than the desert',
      translation: 'La playa es más hermosa que el desierto',
      hint: 'Use: more beautiful than',
      category: 'nature'
    },
    {
      id: 10,
      item1: { 
        name: 'Skyscraper', 
        image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=400&fit=crop&q=80',
        adjective: 'tall' 
      },
      item2: { 
        name: 'House', 
        image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=400&fit=crop&q=80',
        adjective: 'short' 
      },
      correctAnswer: 'The skyscraper is taller than the house',
      translation: 'El rascacielos es más alto que la casa',
      hint: 'Use: taller than',
      category: 'buildings'
    },
    {
      id: 11,
      item1: { 
        name: 'Tiger', 
        image: 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=400&h=400&fit=crop&q=80',
        adjective: 'dangerous' 
      },
      item2: { 
        name: 'Rabbit', 
        image: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=400&h=400&fit=crop&q=80',
        adjective: 'safe' 
      },
      correctAnswer: 'The tiger is more dangerous than the rabbit',
      translation: 'El tigre es más peligroso que el conejo',
      hint: 'Use: more dangerous than',
      category: 'animals'
    },
    {
      id: 12,
      item1: { 
        name: 'Coffee', 
        image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=400&fit=crop&q=80',
        adjective: 'hot' 
      },
      item2: { 
        name: 'Juice', 
        image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=400&fit=crop&q=80',
        adjective: 'cold' 
      },
      correctAnswer: 'Coffee is hotter than juice',
      translation: 'El café es más caliente que el jugo',
      hint: 'Use: hotter than',
      category: 'food'
    },
    {
      id: 13,
      item1: { 
        name: 'Airplane', 
        image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&h=400&fit=crop&q=80',
        adjective: 'fast' 
      },
      item2: { 
        name: 'Train', 
        image: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=400&h=400&fit=crop&q=80',
        adjective: 'slow' 
      },
      correctAnswer: 'The airplane is faster than the train',
      translation: 'El avión es más rápido que el tren',
      hint: 'Use: faster than',
      category: 'vehicles'
    },
    {
      id: 14,
      item1: { 
        name: 'Ocean', 
        image: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=400&h=400&fit=crop&q=80',
        adjective: 'deep' 
      },
      item2: { 
        name: 'Pool', 
        image: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=400&h=400&fit=crop&q=80',
        adjective: 'shallow' 
      },
      correctAnswer: 'The ocean is deeper than the pool',
      translation: 'El océano es más profundo que la piscina',
      hint: 'Use: deeper than',
      category: 'nature'
    },
    {
      id: 15,
      item1: { 
        name: 'Pizza', 
        image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=400&fit=crop&q=80',
        adjective: 'delicious' 
      },
      item2: { 
        name: 'Salad', 
        image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=400&fit=crop&q=80',
        adjective: 'healthy' 
      },
      correctAnswer: 'Pizza is more delicious than salad',
      translation: 'La pizza es más deliciosa que la ensalada',
      hint: 'Use: more delicious than',
      category: 'food'
    },
    {
      id: 16,
      item1: { 
        name: 'Winter', 
        image: 'https://images.unsplash.com/photo-1483664852095-d6cc6870702d?w=400&h=400&fit=crop&q=80',
        adjective: 'cold' 
      },
      item2: { 
        name: 'Summer', 
        image: 'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=400&h=400&fit=crop&q=80',
        adjective: 'hot' 
      },
      correctAnswer: 'Winter is colder than summer',
      translation: 'El invierno es más frío que el verano',
      hint: 'Use: colder than',
      category: 'seasons'
    },
    {
      id: 17,
      item1: { 
        name: 'Book', 
        image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=400&fit=crop&q=80',
        adjective: 'interesting' 
      },
      item2: { 
        name: 'Magazine', 
        image: 'https://images.unsplash.com/photo-1603400521630-9f2de124b33b?w=400&h=400&fit=crop&q=80',
        adjective: 'short' 
      },
      correctAnswer: 'The book is more interesting than the magazine',
      translation: 'El libro es más interesante que la revista',
      hint: 'Use: more interesting than',
      category: 'objects'
    },
    {
      id: 18,
      item1: { 
        name: 'Laptop', 
        image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop&q=80',
        adjective: 'modern' 
      },
      item2: { 
        name: 'Typewriter', 
        image: 'https://images.unsplash.com/photo-1589149098258-3e9102cd63d3?w=400&h=400&fit=crop&q=80',
        adjective: 'old' 
      },
      correctAnswer: 'The laptop is more modern than the typewriter',
      translation: 'La laptop es más moderna que la máquina de escribir',
      hint: 'Use: more modern than',
      category: 'technology'
    },
    {
      id: 19,
      item1: { 
        name: 'Stadium', 
        image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=400&h=400&fit=crop&q=80',
        adjective: 'large' 
      },
      item2: { 
        name: 'Classroom', 
        image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&h=400&fit=crop&q=80',
        adjective: 'small' 
      },
      correctAnswer: 'The stadium is larger than the classroom',
      translation: 'El estadio es más grande que el salón de clases',
      hint: 'Use: larger than',
      category: 'buildings'
    },
    {
      id: 20,
      item1: { 
        name: 'Gold', 
        image: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=400&h=400&fit=crop&q=80',
        adjective: 'expensive' 
      },
      item2: { 
        name: 'Silver', 
        image: 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=400&h=400&fit=crop&q=80',
        adjective: 'cheap' 
      },
      correctAnswer: 'Gold is more expensive than silver',
      translation: 'El oro es más caro que la plata',
      hint: 'Use: more expensive than',
      category: 'objects'
    }
  ]

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      const recog = new SpeechRecognition()
      recog.continuous = true
      recog.interimResults = true
      recog.lang = 'en-US'
      
      recog.onresult = (event) => {
        const currentTranscript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('')
        setTranscript(currentTranscript)
        setUserAnswer(currentTranscript)
      }

      recog.onend = () => {
        setIsListening(false)
      }

      recog.onerror = (event) => {
        console.error("Speech recognition error", event.error)
        setIsListening(false)
      }

      recognitionRef.current = recog
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
    }
  }, [])

  // Start new round
  const startNewRound = () => {
    const randomPair = comparisonPairs[Math.floor(Math.random() * comparisonPairs.length)]
    setCurrentPair(randomPair)
    setUserAnswer('')
    setTranscript('')
    setFeedback(null)
    setShowHint(false)
  }

  useEffect(() => {
    startNewRound()
  }, [])

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert(language === 'es' ? 'Tu navegador no soporta reconocimiento de voz.' : 'Your browser doesn\'t support speech recognition.')
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      setTranscript('')
      setUserAnswer('')
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  const analyzeAnswer = async () => {
    if (!userAnswer || userAnswer.trim().length < 5) {
      alert(language === 'es' ? 'Por favor, escribe o di tu respuesta primero.' : 'Please write or say your answer first.')
      return
    }

    setIsAnalyzing(true)

    try {
      // Professional grammar check with LanguageTool
      const response = await fetch('https://api.languagetool.org/v2/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          text: userAnswer,
          language: 'en-US',
          enabledOnly: 'false'
        })
      })

      const grammarData = await response.json()
      const grammarErrors = grammarData.matches || []

      // Check if answer contains the key comparative structure
      const userLower = userAnswer.toLowerCase()
      const hasComparative = userLower.includes('than') && 
        (userLower.includes('er than') || userLower.includes('more') || userLower.includes('less'))

      const hasItem1 = userLower.includes(currentPair.item1.name.toLowerCase())
      const hasItem2 = userLower.includes(currentPair.item2.name.toLowerCase())

      let scoreValue = 0
      let message = ''
      let type = 'error'

      if (grammarErrors.length === 0 && hasComparative && hasItem1 && hasItem2) {
        scoreValue = 100
        type = 'success'
        message = language === 'es'
          ? '🎉 ¡Perfecto! Tu comparación es correcta y sin errores gramaticales.'
          : '🎉 Perfect! Your comparison is correct and grammatically flawless.'
        setScore(score + 10)
      } else if (hasComparative && hasItem1 && hasItem2) {
        scoreValue = 75
        type = 'warning'
        message = language === 'es'
          ? '✅ Buena comparación, pero hay algunos errores gramaticales.'
          : '✅ Good comparison, but there are some grammar errors.'
        setScore(score + 5)
      } else if (hasComparative) {
        scoreValue = 50
        type = 'warning'
        message = language === 'es'
          ? '⚠️ Usaste la estructura comparativa, pero falta mencionar ambos elementos.'
          : '⚠️ You used the comparative structure, but you\'re missing both elements.'
      } else {
        scoreValue = 25
        type = 'error'
        message = language === 'es'
          ? '❌ Tu respuesta no contiene una estructura comparativa válida.'
          : '❌ Your answer doesn\'t contain a valid comparative structure.'
      }

      const suggestions = []
      if (grammarErrors.length > 0) {
        grammarErrors.slice(0, 3).forEach(error => {
          const errorText = userAnswer.substring(error.offset, error.offset + error.length)
          const suggestion = error.replacements[0]?.value || ''
          suggestions.push({
            type: 'grammar',
            message: `"${errorText}" → "${suggestion}"`,
            explanation: error.message
          })
        })
      }

      if (!hasItem1 || !hasItem2) {
        suggestions.push({
          type: 'content',
          message: language === 'es'
            ? `Asegúrate de mencionar: "${currentPair.item1.name}" y "${currentPair.item2.name}"`
            : `Make sure to mention: "${currentPair.item1.name}" and "${currentPair.item2.name}"`
        })
      }

      if (!hasComparative) {
        suggestions.push({
          type: 'structure',
          message: language === 'es'
            ? `Usa la estructura: [sustantivo] + is + [adjetivo comparativo] + than + [sustantivo]`
            : `Use the structure: [noun] + is + [comparative adjective] + than + [noun]`
        })
      }

      setFeedback({
        score: scoreValue,
        message,
        type,
        suggestions,
        correctAnswer: currentPair.correctAnswer,
        translation: currentPair.translation,
        yourAnswer: userAnswer
      })

      setIsAnalyzing(false)

    } catch (error) {
      console.error('Error analyzing answer:', error)
      alert(language === 'es' 
        ? 'Error al analizar. Verifica tu conexión.' 
        : 'Error analyzing. Check your connection.')
      setIsAnalyzing(false)
    }
  }

  const nextRound = () => {
    setRound(round + 1)
    startNewRound()
    onProgress(2)
  }

  if (!currentPair) {
    return <div>Loading...</div>
  }

  return (
    <div className="comparative-game view-container">
      <button className="btn btn-outline back-button" onClick={onBack}>
        ← {t('backToDashboard')}
      </button>

      <div className="section-header">
        <h2 className="section-title">🎯 {language === 'es' ? 'Juego de Comparaciones' : 'Comparative Game'}</h2>
        <div className="game-stats">
          <span className="stat-item">🏆 {language === 'es' ? 'Puntos' : 'Score'}: {score}</span>
          <span className="stat-item">🎮 {language === 'es' ? 'Ronda' : 'Round'}: {round}</span>
        </div>
      </div>

      <div className="game-card card">
        <div className="mode-selector">
          <button 
            className={`mode-btn ${mode === 'write' ? 'active' : ''}`}
            onClick={() => setMode('write')}
          >
            ✍️ {language === 'es' ? 'Escribir' : 'Write'}
          </button>
          <button 
            className={`mode-btn ${mode === 'speak' ? 'active' : ''}`}
            onClick={() => setMode('speak')}
          >
            🎤 {language === 'es' ? 'Hablar' : 'Speak'}
          </button>
        </div>

        <div className="comparison-display">
          <div className="item-card item-1">
            <div className="item-image-container">
              <img src={currentPair.item1.image} alt={currentPair.item1.name} className="item-image" />
            </div>
            <div className="item-name">{currentPair.item1.name}</div>
            <div className="item-adjective">{currentPair.item1.adjective}</div>
          </div>

          <div className="vs-badge">VS</div>

          <div className="item-card item-2">
            <div className="item-image-container">
              <img src={currentPair.item2.image} alt={currentPair.item2.name} className="item-image" />
            </div>
            <div className="item-name">{currentPair.item2.name}</div>
            <div className="item-adjective">{currentPair.item2.adjective}</div>
          </div>
        </div>

        <div className="instruction-text">
          {language === 'es' 
            ? '📝 Compara estos dos elementos usando la estructura comparativa:'
            : '📝 Compare these two elements using the comparative structure:'}
        </div>

        {mode === 'write' ? (
          <div className="write-mode">
            <textarea
              className="answer-input"
              placeholder={language === 'es' 
                ? 'Escribe tu comparación aquí... (Ej: The elephant is bigger than the mouse)'
                : 'Write your comparison here... (Ex: The elephant is bigger than the mouse)'}
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              disabled={isAnalyzing || feedback}
            />
          </div>
        ) : (
          <div className="speak-mode">
            <div className={`voice-recorder ${isListening ? 'active' : ''}`}>
              <button 
                className={`mic-button ${isListening ? 'listening' : ''}`}
                onClick={toggleListening}
                disabled={isAnalyzing || feedback}
              >
                <span className="mic-icon">{isListening ? '⏹' : '🎤'}</span>
              </button>
              {isListening && <div className="pulse-ring"></div>}
            </div>
            <div className="transcript-display">
              {transcript ? (
                <p className="transcript-text">"{transcript}"</p>
              ) : (
                <p className="transcript-placeholder">
                  {isListening 
                    ? (language === 'es' ? 'Te escucho...' : 'Listening...') 
                    : (language === 'es' ? 'Presiona el micrófono y di tu comparación' : 'Press the mic and say your comparison')}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="game-actions">
          {!feedback && (
            <>
              <button 
                className="btn btn-outline btn-sm"
                onClick={() => setShowHint(!showHint)}
              >
                💡 {language === 'es' ? 'Pista' : 'Hint'}
              </button>
              <button 
                className="btn btn-accent"
                onClick={analyzeAnswer}
                disabled={!userAnswer || isAnalyzing}
              >
                {isAnalyzing ? (language === 'es' ? '🧠 Analizando...' : '🧠 Analyzing...') : (language === 'es' ? '✨ Analizar' : '✨ Analyze')}
              </button>
            </>
          )}
          {feedback && (
            <button 
              className="btn btn-primary"
              onClick={nextRound}
            >
              {language === 'es' ? 'Siguiente Ronda →' : 'Next Round →'}
            </button>
          )}
        </div>

        {showHint && !feedback && (
          <div className="hint-box">
            <strong>💡 {language === 'es' ? 'Pista' : 'Hint'}:</strong> {currentPair.hint}
          </div>
        )}

        {feedback && (
          <div className={`feedback-card ${feedback.type}`}>
            <div className="feedback-header">
              <div className="feedback-score-badge">{feedback.score}%</div>
              <div className="feedback-type-badge">{feedback.type === 'success' ? '✅' : feedback.type === 'warning' ? '⚠️' : '❌'}</div>
            </div>
            <p className="feedback-message">{feedback.message}</p>

            <div className="answer-comparison">
              <div className="your-answer-section">
                <strong>{language === 'es' ? '📝 Tu respuesta:' : '📝 Your answer:'}</strong>
                <p className="your-answer">"{feedback.yourAnswer}"</p>
              </div>
              <div className="correct-answer-section">
                <strong>{language === 'es' ? '✅ Respuesta correcta:' : '✅ Correct answer:'}</strong>
                <p className="correct-answer">"{feedback.correctAnswer}"</p>
                <p className="translation">🌍 {feedback.translation}</p>
              </div>
            </div>

            {feedback.suggestions.length > 0 && (
              <div className="suggestions-list">
                <strong>{language === 'es' ? '💡 Sugerencias:' : '💡 Suggestions:'}</strong>
                <ul>
                  {feedback.suggestions.map((suggestion, index) => (
                    <li key={index} className={`suggestion-${suggestion.type}`}>
                      {suggestion.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ComparativeGame
