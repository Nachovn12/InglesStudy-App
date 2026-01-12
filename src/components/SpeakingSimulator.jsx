import { useState, useContext, useEffect } from 'react'
import { LanguageContext } from '../App'
import { getTranslation } from '../translations'
import './SpeakingSimulator.css'

function SpeakingSimulator({ onProgress, onBack }) {
  const { language } = useContext(LanguageContext)
  const t = (key) => getTranslation(language, key)

  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [completedQuestions, setCompletedQuestions] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showComparison, setShowComparison] = useState(false)
  
  // VOICE RECOGNITION STATE
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [recognition, setRecognition] = useState(null)
  
  // NEW: ANALYSIS STATE
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [feedback, setFeedback] = useState(null) // { score: number, message: string, type: 'success' | 'warning' | 'error' }

  useEffect(() => {
    // Initialize Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || window.SpeechRecognition
    if (SpeechRecognition) {
      const recog = new SpeechRecognition()
      recog.continuous = true
      recog.interimResults = true
      recog.lang = 'en-US' // Always listen in English
      
      recog.onresult = (event) => {
        let finalTranscript = ''
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript
          } else {
             finalTranscript += event.results[i][0].transcript
          }
        }
        setTranscript(finalTranscript)
      }

      recog.onend = () => {
        setIsListening(false)
        // Trigger analysis if there is content
        if (transcript && transcript.length > 5) {
            handleStopAndAnalyze(transcript)
        }
      }

      recog.onerror = (event) => {
        console.error("Speech recognition error", event.error)
        setIsListening(false)
      }

      setRecognition(recog)
    }
  }, [transcript]) // Added transcript dependency to ensure we capture latest state

  const handleStopAndAnalyze = (text) => {
      setIsAnalyzing(true)
      
      // Simulate API delay
      setTimeout(() => {
          let score = 0;
          let message = "";
          let type = "warning";

          // Simple heuristic analysis based on length (since we don't have real AI backend)
          const length = text.length;
          
          if (length < 30) {
              score = (Math.random() * (2.5 - 1.0) + 1.0).toFixed(1);
              message = language === 'es' 
                  ? "❌ Respuesta muy corta. El profesor te pedirá más detalles. Intenta usar 'because' para explicar."
                  : "❌ Too short. The professor will ask for more details. Try using 'because' to explain.";
              type = "error";
          } else if (length < 80) {
              score = (Math.random() * (4.0 - 2.6) + 2.6).toFixed(1);
              message = language === 'es' 
                  ? "⚠️ Buen comienzo, pero falta profundidad. Intenta agregar una frase más sobre cómo te sentiste."
                  : "⚠️ Good start, but needs more depth. Try adding one more sentence about how you felt.";
              type = "warning";
          } else {
              score = (Math.random() * (5.0 - 4.1) + 4.1).toFixed(1);
              message = language === 'es' 
                  ? "✅ ¡Excelente respuesta! Buena longitud y fluidez. Mantén este nivel de detalle."
                  : "✅ Excellent answer! Good length and fluency. Keep up this level of detail.";
              type = "success";
          }

          setFeedback({ score, message, type });
          setIsAnalyzing(false);
      }, 2000);
  }

  const toggleListening = () => {
    if (!recognition) {
      alert(language === 'es' ? "Tu navegador no soporta reconocimiento de voz. Usa Chrome." : "Browser usually doesn't support speech recognition. Use Chrome.")
      return
    }

    if (isListening) {
      recognition.stop()
      setIsListening(false)
      // Analysis is triggered by onend
    } else {
      setTranscript('')
      setFeedback(null) // Clear previous feedback
      recognition.start()
      setIsListening(true)
    }
  }

  // ... (Questions array remains unchanged) ...
  // ... (categories definitions) ...
  // ... (return statement starts) ...

  // RENDER SECTION - UPDATED VOICE RECORDER
        /* VOICE RECOGNITION SECTION - REDESIGNED */
        <div className={`voice-recorder-section ${isListening ? 'active' : ''}`}>
          <div className="recorder-status">
            {isListening ? (
              <span className="status-badge live">🔴 {language === 'es' ? 'Grabando...' : 'Listening...'}</span>
            ) : isAnalyzing ? (
              <span className="status-badge analyzing">🧠 {language === 'es' ? 'Analizando...' : 'Analyzing...'}</span>
            ) : (
              <span className="status-badge ready">{language === 'es' ? 'Listo para practicar' : 'Ready to practice'}</span>
            )}
          </div>
          
          <div className="recorder-interface">
            <div className="mic-button-wrapper">
              <button 
                onClick={toggleListening}
                className={`big-mic-button ${isListening ? 'listening' : ''}`}
                title={isListening ? 'Stop' : 'Start'}
                disabled={isAnalyzing}
              >
                <span className="mic-icon">{isListening ? '⏹' : '🎙'}</span>
              </button>
              {isListening && (
                <div className="pulse-ring"></div>
              )}
            </div>

            <div className="transcript-display">
              {transcript ? (
                <p className="transcript-text">"{transcript}"</p>
              ) : (
                 <p className="transcript-placeholder">
                   {isListening 
                     ? (language === 'es' ? 'Te escucho...' : 'Listening...') 
                     : (language === 'es' ? 'Presiona y responde la pregunta...' : 'Tap mic and answer...')}
                 </p>
              )}
              {isListening && (
                <div className="fake-waveform">
                  <div className="bar"></div><div className="bar"></div><div className="bar"></div><div className="bar"></div>
                  <div className="bar"></div><div className="bar"></div><div className="bar"></div><div className="bar"></div>
                </div>
              )}
            </div>
          </div>

          {/* AI FEEDBACK CARD */}
          {feedback && !isListening && !isAnalyzing && (
              <div className={`ai-feedback-card ${feedback.type}`}>
                  <div className="feedback-header">
                      <div className="feedback-score">
                          <span className="score-num">{feedback.score}</span>
                          <span className="score-max">/ 5.0</span>
                      </div>
                      <div className="feedback-badge">
                          {feedback.type === 'success' ? 'EXCELLENT' : feedback.type === 'warning' ? 'GOOD' : 'KEEP TRYING'}
                      </div>
                  </div>
                  <p className="feedback-message">{feedback.message}</p>
              </div>
          )}
        </div>

  const questions = [
    {
      id: 1,
      category: 'simple-past',
      priority: 'guaranteed',
      question: "What did you do last weekend?",
      badAnswer: "I was in my house.",
      goodAnswer: "Last weekend, I went to Santiago with my family. We visited Fantasilandia and rode many attractions. I ate empanadas for lunch. Then, we went to the mall and bought some clothes. It was a fun weekend.",
      followUpQuestions: ["Did you enjoy it?", "Who did you go with?", "What was your favorite part?", "What did you eat?"],
      tips: [
        language === 'es' ? "❌ MAL: Solo una actividad" : "❌ BAD: Only one activity",
        language === 'es' ? "✅ BIEN: Múltiples actividades con detalles" : "✅ GOOD: Multiple activities with details",
        language === 'es' ? "Usa conectores: and, then, after that" : "Use connectors: and, then, after that"
      ]
    },
    {
      id: 2,
      category: 'simple-past',
      priority: 'guaranteed',
      question: "What did you do last Christmas?",
      badAnswer: "I stayed home.",
      goodAnswer: "Last Christmas, I celebrated with my family at home. We cooked a big dinner with chicken and salad. I received gifts from my parents. After dinner, we watched a movie together. At midnight, we opened champagne. It was a beautiful night.",
      followUpQuestions: ["What did you eat?", "Did you receive any gifts?", "Who did you celebrate with?"],
      tips: [
        language === 'es' ? "Describe TODA la celebración" : "Describe the WHOLE celebration",
        language === 'es' ? "Usa: cooked, received, watched, opened" : "Use: cooked, received, watched, opened"
      ]
    },
    {
      id: 3,
      category: 'comparatives',
      priority: 'guaranteed',
      question: "Compare Santiago and Valparaíso.",
      badAnswer: "Santiago is bigger.",
      goodAnswer: "Santiago and Valparaíso are different. Santiago is bigger and more modern than Valparaíso. It has better transportation. However, Valparaíso is more colorful and more beautiful. It's near the ocean. I prefer Santiago for living because it has more job opportunities.",
      followUpQuestions: ["Which one do you prefer?", "Why do you prefer that one?", "Have you been to both cities?"],
      tips: [
        language === 'es' ? "Compara MÚLTIPLES aspectos" : "Compare MULTIPLE aspects",
        language === 'es' ? "Usa: bigger, more modern, better" : "Use: bigger, more modern, better",
        language === 'es' ? "Termina con: I prefer..." : "End with: I prefer..."
      ]
    },
    {
      id: 4,
      category: 'comparatives',
      priority: 'guaranteed',
      question: "Compare Linux and Windows.",
      badAnswer: "Linux is better.",
      goodAnswer: "Linux and Windows are different. Linux is faster than Windows and it's free. However, Windows is easier to use. Windows is more popular and has more programs. For programming, Linux is better. But for gaming, Windows is better. I prefer Linux because I'm a developer.",
      followUpQuestions: ["Which one do you use?", "Why do you prefer that one?", "Which is better for work?"],
      tips: [
        language === 'es' ? "Adapta a TU carrera" : "Adapt to YOUR major",
        language === 'es' ? "Compara velocidad, precio, uso" : "Compare speed, price, usage"
      ]
    },
    {
      id: 5,
      category: 'there-is-are',
      priority: 'likely',
      question: "Describe your room using there is/there are.",
      badAnswer: "There is a bed.",
      goodAnswer: "In my room, there is a big bed near the window. There are two windows with blue curtains. There is a desk with my computer. There are many books on the shelf. There is a closet for my clothes. There are some posters on the wall.",
      followUpQuestions: ["What is your favorite part?", "Is your room big or small?", "Do you like your room?"],
      tips: [
        language === 'es' ? "Describe MÚLTIPLES cosas" : "Describe MULTIPLE things",
        language === 'es' ? "Usa: bed, desk, window, closet" : "Use: bed, desk, window, closet"
      ]
    },
    {
      id: 6,
      category: 'countable-uncountable',
      priority: 'likely',
      question: "What do you drink or eat at breakfast?",
      badAnswer: "I drink coffee.",
      goodAnswer: "At breakfast, I drink a lot of coffee with milk. I usually have two cups. I eat some toast with butter and jam. I also eat a few eggs, usually two. Sometimes I drink a little orange juice. I don't eat much because I wake up late.",
      followUpQuestions: ["Do you like coffee?", "What is your favorite breakfast?", "What time do you eat?"],
      tips: [
        language === 'es' ? "Usa: a lot of, some, a few, a little" : "Use: a lot of, some, a few, a little",
        language === 'es' ? "Menciona CUÁNTO: two cups, two eggs" : "Mention HOW MUCH: two cups, two eggs"
      ]
    },
    {
      id: 7,
      category: 'simple-past',
      priority: 'guaranteed',
      question: "What did you do yesterday?",
      badAnswer: "I studied.",
      goodAnswer: "Yesterday, I woke up at 7 AM and had breakfast. Then I went to university and attended three classes. After lunch, I studied in the library for two hours. In the evening, I went home and cooked dinner. Before sleeping, I watched a movie on Netflix.",
      followUpQuestions: ["What time did you wake up?", "Did you study a lot?", "What did you eat?", "Did you go out?"],
      tips: [
        language === 'es' ? "Describe TODO el día, no solo una actividad" : "Describe the WHOLE day, not just one activity",
        language === 'es' ? "Usa expresiones de tiempo: in the morning, after lunch, in the evening" : "Use time expressions: in the morning, after lunch, in the evening"
      ]
    },
    {
      id: 8,
      category: 'simple-past',
      priority: 'guaranteed',
      question: "What did you do on your last vacation?",
      badAnswer: "I went to the beach.",
      goodAnswer: "On my last vacation, I traveled to La Serena with my family. We stayed in a hotel near the beach for five days. Every day, we went swimming in the ocean. We also visited the Elqui Valley and saw the stars. We ate delicious seafood at local restaurants. It was an amazing trip.",
      followUpQuestions: ["Where did you go?", "Who did you go with?", "How long did you stay?", "What was your favorite part?"],
      tips: [
        language === 'es' ? "Menciona: dónde, con quién, cuánto tiempo, qué hiciste" : "Mention: where, with whom, how long, what you did",
        language === 'es' ? "Usa: traveled, stayed, went, visited, ate" : "Use: traveled, stayed, went, visited, ate"
      ]
    },
    {
      id: 9,
      category: 'comparatives',
      priority: 'guaranteed',
      question: "Compare Python and JavaScript (or two programming languages).",
      badAnswer: "Python is easier.",
      goodAnswer: "Python and JavaScript are different programming languages. Python is easier to learn than JavaScript. It has simpler syntax. However, JavaScript is more popular for web development. Python is better for data science and AI. JavaScript is faster in the browser. I prefer Python because it's clearer and more readable.",
      followUpQuestions: ["Which one do you use more?", "Which is better for beginners?", "Why do you prefer that one?"],
      tips: [
        language === 'es' ? "Adapta a tu carrera: informática, turismo, etc." : "Adapt to your major: IT, tourism, etc.",
        language === 'es' ? "Compara: facilidad, velocidad, popularidad, uso" : "Compare: ease, speed, popularity, usage"
      ]
    },
    {
      id: 10,
      category: 'comparatives',
      priority: 'guaranteed',
      question: "Compare the beach and the mountains.",
      badAnswer: "The beach is better.",
      goodAnswer: "The beach and the mountains are different. The beach is hotter than the mountains. It's better for swimming and relaxing. However, the mountains are more peaceful and have fresher air. The beach is more crowded in summer. The mountains are better for hiking. I prefer the beach because I love the ocean.",
      followUpQuestions: ["Which do you prefer?", "Where do you go more often?", "Why do you like it more?"],
      tips: [
        language === 'es' ? "Compara: clima, actividades, ambiente" : "Compare: weather, activities, atmosphere",
        language === 'es' ? "Termina con tu preferencia y razón" : "End with your preference and reason"
      ]
    },
    {
      id: 11,
      category: 'there-is-are',
      priority: 'likely',
      question: "Describe your house using there is/there are.",
      badAnswer: "There are rooms.",
      goodAnswer: "In my house, there are three bedrooms. There is a big living room with a TV. There is a kitchen with modern appliances. There are two bathrooms. There is a small garden in the back. There are many windows, so it's very bright. It's a comfortable house.",
      followUpQuestions: ["How many rooms are there?", "Is there a garden?", "Do you like your house?"],
      tips: [
        language === 'es' ? "Menciona TODAS las áreas principales" : "Mention ALL main areas",
        language === 'es' ? "Usa números: three bedrooms, two bathrooms" : "Use numbers: three bedrooms, two bathrooms"
      ]
    },
    {
      id: 12,
      category: 'countable-uncountable',
      priority: 'likely',
      question: "How much water do you drink every day?",
      badAnswer: "I drink water.",
      goodAnswer: "I drink a lot of water every day. I usually have about eight glasses. I drink one glass in the morning when I wake up. I drink some water during classes. I also drink a lot of water when I exercise. I don't drink much soda because water is healthier.",
      followUpQuestions: ["Do you drink coffee too?", "When do you drink more water?", "Do you like water?"],
      tips: [
        language === 'es' ? "Usa: a lot of, much, some, a few glasses" : "Use: a lot of, much, some, a few glasses",
        language === 'es' ? "Menciona CUÁNDO bebes: in the morning, during classes" : "Mention WHEN you drink: in the morning, during classes"
      ]
    }
  ]

  const categories = [
    { id: 'all', name: language === 'es' ? 'Todas' : 'All', count: questions.length },
    { id: 'simple-past', name: 'Simple Past', count: questions.filter(q => q.category === 'simple-past').length, priority: 'guaranteed' },
    { id: 'comparatives', name: 'Comparatives', count: questions.filter(q => q.category === 'comparatives').length, priority: 'guaranteed' },
    { id: 'there-is-are', name: 'There is/are', count: questions.filter(q => q.category === 'there-is-are').length, priority: 'likely' },
    { id: 'countable-uncountable', name: 'Countable/Uncountable', count: questions.filter(q => q.category === 'countable-uncountable').length, priority: 'likely' }
  ]

  const filteredQuestions = selectedCategory === 'all' 
    ? questions 
    : questions.filter(q => q.category === selectedCategory)

  const handleMarkComplete = () => {
    const actualIndex = questions.findIndex(q => q.id === filteredQuestions[currentQuestion].id)
    if (!completedQuestions.includes(actualIndex)) {
      setCompletedQuestions([...completedQuestions, actualIndex])
      onProgress(2)
    }
  }

  const nextQuestion = () => {
    if (currentQuestion < filteredQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setShowAnswer(false)
      setShowComparison(false)
    }
  }

  const previousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
      setShowAnswer(false)
      setShowComparison(false)
    }
  }

  const progress = (completedQuestions.length / questions.length) * 100
  const current = filteredQuestions[currentQuestion]
  const actualIndex = questions.findIndex(q => q.id === current.id)

  return (
    <div className="speaking-simulator view-container">
      <button className="btn btn-outline back-button" onClick={onBack}>
        ← {t('backToDashboard')}
      </button>

      <div className="section-header">
        <h2 className="section-title">🗣️ {t('speakingSimulator')}</h2>
        <div className="score-display">
          <span className="score-label">{t('practiced')}:</span>
          <span className="score-value">{completedQuestions.length}/{questions.length}</span>
        </div>
      </div>

      {/* Category Filters */}
      <div className="category-filters card">
        <h4>📂 {language === 'es' ? 'Filtrar por categoría:' : 'Filter by category:'}</h4>
        <div className="filter-buttons">
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`filter-btn ${selectedCategory === cat.id ? 'active' : ''} ${cat.priority ? `priority-${cat.priority}` : ''}`}
              onClick={() => {
                setSelectedCategory(cat.id)
                setCurrentQuestion(0)
                setShowAnswer(false)
                setShowComparison(false)
              }}
            >
              <span className="filter-name">{cat.name}</span>
              <span className="filter-count">{cat.count}</span>
              {cat.priority === 'guaranteed' && <span className="priority-badge-small">🔴</span>}
              {cat.priority === 'likely' && <span className="priority-badge-small">🟡</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="progress-info">
        <span>{t('question')} {currentQuestion + 1} {t('of')} {filteredQuestions.length}</span>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="speaking-card card">
        <div className="question-header">
          <div className="question-number">Question #{current.id}</div>
          {current.priority === 'guaranteed' && (
            <span className="priority-badge guaranteed">
              🔴 {language === 'es' ? 'GARANTIZADO' : 'GUARANTEED'}
            </span>
          )}
          {current.priority === 'likely' && (
            <span className="priority-badge likely">
              🟡 {language === 'es' ? 'PROBABLE' : 'LIKELY'}
            </span>
          )}
        </div>
        
        <h3 className="speaking-question">{current.question}</h3>

        <div className="speaking-controls">
          <button
            className="btn btn-secondary"
            onClick={() => setShowComparison(!showComparison)}
          >
            {showComparison ? '🙈' : '👀'} {language === 'es' ? 'Ver Comparación' : 'Show Comparison'}
          </button>

          <button
            className="btn btn-accent"
            onClick={() => setShowAnswer(!showAnswer)}
          >
            {showAnswer ? `🙈 ${t('hideAnswer')}` : `👁️ ${t('showSampleAnswer')}`}
          </button>
          
          <button
            className={`btn ${completedQuestions.includes(actualIndex) ? 'btn-outline' : 'btn-primary'}`}
            onClick={handleMarkComplete}
          >
            {completedQuestions.includes(actualIndex) ? `✅ ${t('completed')}` : `⭕ ${t('markCompleted')}`}
          </button>
        </div>

        {/* VOICE RECOGNITION SECTION - REDESIGNED */}
        <div className={`voice-recorder-section ${isListening ? 'active' : ''}`}>
          <div className="recorder-status">
            {isListening ? (
              <span className="status-badge live">🔴 {language === 'es' ? 'Grabando...' : 'Listening...'}</span>
            ) : isAnalyzing ? (
              <span className="status-badge analyzing">🧠 {language === 'es' ? 'Analizando...' : 'Analyzing...'}</span>
            ) : (
              <span className="status-badge ready">{language === 'es' ? 'Listo para practicar' : 'Ready to practice'}</span>
            )}
          </div>
          
          <div className="recorder-interface">
            <div className="mic-button-wrapper">
              <button 
                onClick={toggleListening}
                className={`big-mic-button ${isListening ? 'listening' : ''}`}
                title={isListening ? 'Stop' : 'Start'}
                disabled={isAnalyzing}
              >
                <span className="mic-icon">{isListening ? '⏹' : '🎙'}</span>
              </button>
              {isListening && (
                <div className="pulse-ring"></div>
              )}
            </div>

            <div className="transcript-display">
              {transcript ? (
                <p className="transcript-text">"{transcript}"</p>
              ) : (
                 <p className="transcript-placeholder">
                   {isListening 
                     ? (language === 'es' ? 'Te escucho...' : 'Listening...') 
                     : (language === 'es' ? 'Presiona y responde la pregunta...' : 'Tap mic and answer...')}
                 </p>
              )}
              {isListening && (
                <div className="fake-waveform">
                  <div className="bar"></div><div className="bar"></div><div className="bar"></div><div className="bar"></div>
                  <div className="bar"></div><div className="bar"></div><div className="bar"></div><div className="bar"></div>
                </div>
              )}
            </div>
          </div>

          {/* AI FEEDBACK CARD - DISPLAYS SIMULATED ANALYSIS */}
          {feedback && !isListening && !isAnalyzing && (
              <div className={`ai-feedback-card ${feedback.type}`}>
                  <div className="feedback-header">
                      <div className="feedback-score">
                          <span className="score-num">{feedback.score}</span>
                          <span className="score-max">/ 5.0</span>
                      </div>
                      <div className="feedback-badge">
                          {feedback.type === 'success' ? 'EXCELLENT' : feedback.type === 'warning' ? 'GOOD' : 'KEEP TRYING'}
                      </div>
                  </div>
                  <p className="feedback-message">{feedback.message}</p>
              </div>
          )}
        </div>

        {/* Comparison Section */}
        {showComparison && (
          <div className="comparison-section">
            <div className="comparison-grid">
              <div className="comparison-bad">
                <h4>❌ {language === 'es' ? 'Respuesta MALA' : 'BAD Answer'}</h4>
                <p className="bad-example">"{current.badAnswer}"</p>
                <span className="comparison-note">
                  {language === 'es' ? '¡Muy corto! El profesor seguirá preguntando.' : 'Too short! Professor will keep asking.'}
                </span>
              </div>
              <div className="comparison-good">
                <h4>✅ {language === 'es' ? 'Respuesta BUENA' : 'GOOD Answer'}</h4>
                <p className="good-example">"{current.goodAnswer}"</p>
                <span className="comparison-note">
                  {language === 'es' ? '¡Perfecto! Múltiples detalles y conectores.' : 'Perfect! Multiple details and connectors.'}
                </span>
              </div>
            </div>
          </div>
        )}

        {showAnswer && (
          <div className="answer-section">
            <div className="sample-answer">
              <h4>📝 {t('sampleAnswer')}</h4>
              <p>{current.goodAnswer}</p>
            </div>

            <div className="tips-section">
              <h4>💡 {t('tips')}</h4>
              <ul>
                {current.tips.map((tip, index) => (
                  <li key={index}>{tip}</li>
                ))}
              </ul>
            </div>

            {/* Follow-up Questions */}
            <div className="followup-section">
              <h4>❓ {language === 'es' ? 'Follow-up Questions Fáciles:' : 'Easy Follow-up Questions:'}</h4>
              <div className="followup-tags">
                {current.followUpQuestions.map((q, index) => (
                  <span key={index} className="followup-tag">{q}</span>
                ))}
              </div>
              <p className="followup-tip">
                💡 {language === 'es' 
                  ? 'Coordina estas preguntas con tu compañero ANTES del examen' 
                  : 'Coordinate these questions with your partner BEFORE the exam'}
              </p>
            </div>
          </div>
        )}

        <div className="practice-tips card">
          <h4>🎯 {t('howToPractice')}</h4>
          <ol>
            <li>{t('practiceTip1')}</li>
            <li>{t('practiceTip2')}</li>
            <li>{t('practiceTip3')}</li>
            <li>{t('practiceTip4')}</li>
            <li>{t('practiceTip5')}</li>
          </ol>
        </div>
      </div>

      <div className="navigation-buttons">
        <button
          className="btn btn-outline"
          onClick={previousQuestion}
          disabled={currentQuestion === 0}
        >
          ← {t('previousQuestion')}
        </button>
        
        <button
          className="btn btn-primary"
          onClick={nextQuestion}
          disabled={currentQuestion === filteredQuestions.length - 1}
        >
          {t('nextQuestionBtn')} →
        </button>
      </div>

      <div className="questions-overview card">
        <h3>📋 {t('allQuestionsOverview')}</h3>
        <div className="questions-grid">
          {filteredQuestions.map((q, index) => {
            const qActualIndex = questions.findIndex(qu => qu.id === q.id)
            return (
              <button
                key={q.id}
                className={`question-pill ${currentQuestion === index ? 'active' : ''} ${
                  completedQuestions.includes(qActualIndex) ? 'completed' : ''
                } ${q.priority === 'guaranteed' ? 'pill-guaranteed' : 'pill-likely'}`}
                onClick={() => {
                  setCurrentQuestion(index)
                  setShowAnswer(false)
                  setShowComparison(false)
                }}
              >
                <span className="pill-number">#{q.id}</span>
                {completedQuestions.includes(qActualIndex) && <span className="pill-check">✓</span>}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default SpeakingSimulator
