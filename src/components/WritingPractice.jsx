import { useState, useContext, useEffect } from 'react'
import { LanguageContext } from '../App'
import { getTranslation } from '../translations'
import './WritingPractice.css'
import './WritingPracticeFeedback.css'

function WritingPractice({ onProgress, onBack }) {
  const { language } = useContext(LanguageContext)
  const t = (key) => getTranslation(language, key)
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [writingText, setWritingText] = useState('')
  const [showGuidance, setShowGuidance] = useState(true)
  
  // Timer states
  const [timeLeft, setTimeLeft] = useState(15 * 60) // 15 minutes in seconds
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [timerMode, setTimerMode] = useState('practice') // 'practice' or 'exam'

  // Timer effect
  useEffect(() => {
    let interval = null
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => time - 1)
      }, 1000)
    } else if (timeLeft === 0) {
      setIsTimerRunning(false)
      if (timerMode === 'exam') {
        alert(language === 'es' 
          ? '⏰ ¡Tiempo terminado! El examen ha finalizado.' 
          : '⏰ Time\'s up! The exam has ended.')
      }
    }
    return () => clearInterval(interval)
  }, [isTimerRunning, timeLeft, timerMode, language])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const startTimer = (mode = 'practice') => {
    setTimerMode(mode)
    setTimeLeft(15 * 60)
    setIsTimerRunning(true)
  }

  const pauseTimer = () => {
    setIsTimerRunning(false)
  }

  const resumeTimer = () => {
    setIsTimerRunning(true)
  }

  const resetTimer = () => {
    setIsTimerRunning(false)
    setTimeLeft(15 * 60)
  }

  const topics = [
    {
      id: 1,
      title: 'My Last Weekend',
      prompt: 'Write about what you did last weekend. Include where you went, who you were with, and what activities you did.',
      requiredGrammar: ['Simple Past', 'Time expressions (last weekend, on Saturday, etc.)'],
      suggestedConnectors: ['First', 'Then', 'After that', 'Finally'],
      sampleOutline: [
        'Introduction: What you did in general',
        'Saturday activities',
        'Sunday activities',
        'Conclusion: How you felt'
      ],
      keyVocabulary: ['went', 'visited', 'played', 'watched', 'ate', 'had fun', 'relaxed']
    },
    {
      id: 2,
      title: 'My Last Vacation',
      prompt: 'Describe your last vacation. Where did you go? What did you do? Who did you travel with?',
      requiredGrammar: ['Simple Past', 'There was/were', 'Time expressions'],
      suggestedConnectors: ['First', 'Then', 'After that', 'However', 'Finally'],
      sampleOutline: [
        'Where you went and when',
        'What you did there',
        'What you saw or visited',
        'How you felt about the trip'
      ],
      keyVocabulary: ['traveled', 'visited', 'stayed', 'saw', 'took photos', 'enjoyed', 'beautiful']
    },
    {
      id: 3,
      title: 'Comparing Two Cities',
      prompt: 'Compare two cities in Chile (Santiago, Valparaíso, Concepción, etc.). Talk about population, weather, and things to do.',
      requiredGrammar: ['Comparatives', 'There is/are', 'Present Simple'],
      suggestedConnectors: ['However', 'But', 'On the other hand', 'Also', 'In contrast'],
      sampleOutline: [
        'Introduction: Name the two cities',
        'Compare population and size',
        'Compare weather',
        'Compare things to do',
        'Conclusion: Which do you prefer?'
      ],
      keyVocabulary: ['bigger', 'smaller', 'more', 'less', 'better', 'worse', 'population', 'weather']
    },
    {
      id: 4,
      title: 'A Memorable Event',
      prompt: 'Write about a memorable event in your life. What happened? When was it? Why was it important?',
      requiredGrammar: ['Simple Past', 'Time expressions', 'Because/So'],
      suggestedConnectors: ['First', 'Then', 'Suddenly', 'After that', 'Because', 'So'],
      sampleOutline: [
        'What the event was',
        'When it happened',
        'What you did',
        'Why it was memorable'
      ],
      keyVocabulary: ['remember', 'special', 'important', 'felt', 'happened', 'unforgettable']
    },
    {
      id: 5,
      title: 'My Daily Routine (Past)',
      prompt: 'Describe what you did yesterday from morning to night. Use collocations (GO, HAVE, GET).',
      requiredGrammar: ['Simple Past', 'Collocations', 'Time expressions'],
      suggestedConnectors: ['First', 'Then', 'After that', 'Later', 'Finally'],
      sampleOutline: [
        'Morning routine (got up, had breakfast)',
        'Afternoon activities',
        'Evening activities',
        'Night routine (went to bed)'
      ],
      keyVocabulary: ['got up', 'had breakfast', 'went to', 'got home', 'had lunch', 'went to bed']
    },
    {
      id: 6,
      title: 'At a Restaurant',
      prompt: 'Write a dialogue between a waiter and a customer ordering food. Include specific vocabulary about food and polite requests.',
      requiredGrammar: ['Would like', 'Polite requests', 'Vocabulary for food'],
      suggestedConnectors: ['Please', 'Thank you', 'Excuse me', 'Enjoy your meal'],
      sampleOutline: [
        'Greeting and asking for a table',
        'Ordering drinks and starter',
        'Ordering main course',
        'Asking for the bill'
      ],
      keyVocabulary: ['menu', 'order', 'starter', 'main course', 'dessert', 'bill', 'would like']
    }
  ]

  const connectors = [
    { word: 'First', use: 'To start a sequence', example: 'First, I woke up at 8 AM.' },
    { word: 'Then', use: 'To continue a sequence', example: 'Then, I had breakfast.' },
    { word: 'After that', use: 'To show what happened next', example: 'After that, I went to school.' },
    { word: 'However', use: 'To show contrast', example: 'However, it started to rain.' },
    { word: 'But', use: 'To show contrast', example: 'I wanted to go out, but it was raining.' },
    { word: 'Because', use: 'To give a reason', example: 'I stayed home because I was tired.' },
    { word: 'So', use: 'To show result', example: 'I was tired, so I went to bed early.' },
    { word: 'Finally', use: 'To end a sequence', example: 'Finally, I went to sleep at 11 PM.' },
    { word: 'Also', use: 'To add information', example: 'I also visited my grandmother.' }
  ]

  const wordCount = writingText.trim().split(/\s+/).filter(word => word.length > 0).length
  const isInRange = wordCount >= 60 && wordCount <= 70
  const progress = Math.min(100, (wordCount / 70) * 100)

  // NEW: Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [feedback, setFeedback] = useState(null)

  const analyzeWriting = async () => {
    if (wordCount < 60) {
      alert(language === 'es' ? `Necesitas al menos 60 palabras. Conteo actual: ${wordCount}` : `You need at least 60 words. Current count: ${wordCount}`)
      return
    }

    setIsAnalyzing(true)
    const textLower = writingText.toLowerCase()

    try {
      // PROFESSIONAL GRAMMAR CHECK using LanguageTool API
      const response = await fetch('https://api.languagetool.org/v2/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          text: writingText,
          language: 'en-US',
          enabledOnly: 'false'
        })
      })

      const grammarData = await response.json()
      
      // Analyze connectors usage
      const usedConnectors = selectedTopic.suggestedConnectors.filter(connector => 
        textLower.includes(connector.toLowerCase())
      )
      const connectorScore = (usedConnectors.length / selectedTopic.suggestedConnectors.length) * 100

      // Analyze key vocabulary
      const usedVocabulary = selectedTopic.keyVocabulary.filter(word => 
        textLower.includes(word.toLowerCase())
      )
      const vocabularyScore = (usedVocabulary.length / selectedTopic.keyVocabulary.length) * 100

      // Professional Grammar Analysis from LanguageTool
      const grammarErrors = grammarData.matches || []
      const criticalErrors = grammarErrors.filter(e => 
        e.rule.issueType === 'misspelling' || 
        e.rule.issueType === 'grammar' ||
        e.rule.category.id === 'GRAMMAR'
      )
      const styleIssues = grammarErrors.filter(e => 
        e.rule.issueType === 'style' || 
        e.rule.issueType === 'typographical'
      )

      // Calculate grammar score (inverse of errors)
      const maxErrors = 10
      const errorPenalty = Math.min(criticalErrors.length, maxErrors) / maxErrors
      const grammarScore = Math.max(0, (1 - errorPenalty) * 100)

      // Check for required grammar patterns
      let requiredGrammarScore = 0
      const grammarFeedback = []
      
      selectedTopic.requiredGrammar.forEach(grammar => {
        if (grammar.includes('Simple Past')) {
          const pastVerbs = ['went', 'was', 'were', 'had', 'did', 'visited', 'played', 'watched', 'ate', 'saw', 'took', 'stayed', 'traveled']
          const foundPastVerbs = pastVerbs.filter(verb => textLower.includes(verb))
          if (foundPastVerbs.length >= 3) {
            requiredGrammarScore += 33
          } else {
            grammarFeedback.push(language === 'es' ? 'Usa más verbos en pasado simple' : 'Use more simple past verbs')
          }
        }
        if (grammar.includes('Comparative')) {
          const comparatives = ['bigger', 'smaller', 'more', 'less', 'better', 'worse', 'than']
          const foundComparatives = comparatives.filter(comp => textLower.includes(comp))
          if (foundComparatives.length >= 2) {
            requiredGrammarScore += 33
          } else {
            grammarFeedback.push(language === 'es' ? 'Incluye más comparativos' : 'Include more comparatives')
          }
        }
        if (grammar.includes('There is/are') || grammar.includes('There was/were')) {
          if (textLower.includes('there is') || textLower.includes('there are') || textLower.includes('there was') || textLower.includes('there were')) {
            requiredGrammarScore += 33
          } else {
            grammarFeedback.push(language === 'es' ? 'Usa "there is/are" o "there was/were"' : 'Use "there is/are" or "there was/were"')
          }
        }
      })

      // Calculate final score
      const totalScore = (
        connectorScore * 0.2 + 
        vocabularyScore * 0.2 + 
        grammarScore * 0.3 +
        requiredGrammarScore * 0.3
      ) / 20 // Convert to 5.0 scale
      const finalScore = Math.min(5.0, Math.max(1.0, totalScore)).toFixed(1)

      let type = 'warning'
      let message = ''
      let suggestions = []

      if (finalScore >= 4.0 && criticalErrors.length === 0) {
        type = 'success'
        message = language === 'es' 
          ? '✅ ¡Excelente trabajo! Tu escritura es profesional y cumple con todos los requisitos.'
          : '✅ Excellent work! Your writing is professional and meets all requirements.'
      } else if (finalScore >= 3.0) {
        type = 'warning'
        message = language === 'es'
          ? '⚠️ Buen intento. Hay algunos errores que debes corregir.'
          : '⚠️ Good attempt. There are some errors you should fix.'
      } else {
        type = 'error'
        message = language === 'es'
          ? '❌ Tu escritura necesita mejoras significativas. Revisa los errores gramaticales.'
          : '❌ Your writing needs significant improvements. Review the grammar errors.'
      }

      // Build professional suggestions from LanguageTool
      if (criticalErrors.length > 0) {
        criticalErrors.slice(0, 5).forEach(error => {
          const errorText = writingText.substring(error.offset, error.offset + error.length)
          const suggestion = error.replacements[0]?.value || ''
          suggestions.push({
            type: 'grammar',
            message: language === 'es' 
              ? `"${errorText}" → Sugerencia: "${suggestion}" (${error.message})`
              : `"${errorText}" → Suggestion: "${suggestion}" (${error.message})`,
            original: errorText,
            suggestion: suggestion,
            rule: error.rule.description
          })
        })
      }

      if (styleIssues.length > 0) {
        styleIssues.slice(0, 3).forEach(issue => {
          const issueText = writingText.substring(issue.offset, issue.offset + issue.length)
          suggestions.push({
            type: 'style',
            message: language === 'es'
              ? `Estilo: "${issueText}" - ${issue.message}`
              : `Style: "${issueText}" - ${issue.message}`,
            original: issueText,
            rule: issue.rule.description
          })
        })
      }

      if (connectorScore < 50) {
        const missingConnectors = selectedTopic.suggestedConnectors.filter(c => !usedConnectors.includes(c)).slice(0, 2)
        suggestions.push({
          type: 'connector',
          message: language === 'es' 
            ? `Agrega conectores como: ${missingConnectors.join(', ')}`
            : `Add connectors like: ${missingConnectors.join(', ')}`
        })
      }

      if (vocabularyScore < 50) {
        const missingVocab = selectedTopic.keyVocabulary.filter(v => !usedVocabulary.includes(v)).slice(0, 3)
        suggestions.push({
          type: 'vocabulary',
          message: language === 'es'
            ? `Usa vocabulario clave: ${missingVocab.join(', ')}`
            : `Use key vocabulary: ${missingVocab.join(', ')}`
        })
      }

      if (grammarFeedback.length > 0) {
        grammarFeedback.forEach(fb => {
          suggestions.push({
            type: 'required',
            message: fb
          })
        })
      }

      if (wordCount < 65) {
        suggestions.push({
          type: 'length',
          message: language === 'es' 
            ? 'Intenta escribir más cerca de 70 palabras para más detalles'
            : 'Try to write closer to 70 words for more details'
        })
      }

      setFeedback({
        score: finalScore,
        message,
        type,
        suggestions,
        connectorScore: Math.round(connectorScore),
        vocabularyScore: Math.round(vocabularyScore),
        grammarScore: Math.round(grammarScore),
        requiredGrammarScore: Math.round(requiredGrammarScore),
        usedConnectors,
        usedVocabulary,
        totalErrors: criticalErrors.length,
        styleIssues: styleIssues.length,
        isProfessional: true
      })
      setIsAnalyzing(false)

    } catch (error) {
      console.error('Error analyzing writing:', error)
      alert(language === 'es' 
        ? 'Error al analizar. Por favor, verifica tu conexión a internet.' 
        : 'Error analyzing. Please check your internet connection.')
      setIsAnalyzing(false)
    }
  }

  const handleComplete = () => {
    if (wordCount >= 60 && feedback && parseFloat(feedback.score) >= 3.0) {
      onProgress(10)
      alert(language === 'es' ? '¡Buen trabajo! Tu escritura ha sido guardada en tu progreso.' : 'Great job! Your writing has been saved to your progress.')
      setWritingText('')
      setSelectedTopic(null)
      setFeedback(null)
    } else if (!feedback) {
      alert(language === 'es' ? 'Primero analiza tu escritura antes de enviar.' : 'Please analyze your writing before submitting.')
    } else {
      alert(language === 'es' ? 'Mejora tu escritura según las sugerencias antes de enviar.' : 'Improve your writing based on suggestions before submitting.')
    }
  }

  if (!selectedTopic) {
    return (
      <div className="writing-practice view-container">
        <button className="btn btn-outline back-button" onClick={onBack}>
          ← {t('backToDashboard')}
        </button>

        <div className="section-header">
          <h2 className="section-title">✍️ {t('writingPractice')}</h2>
        </div>

        <div className="writing-info card">
          <h3>📝 {t('writingRequirements')}</h3>
          <ul>
            <li><strong>{language === 'es' ? 'Extensión:' : 'Length:'}</strong> {t('length')}</li>
            <li><strong>{language === 'es' ? 'Usar conectores:' : 'Use connectors:'}</strong> {t('useConnectors')}</li>
            <li><strong>{language === 'es' ? 'Gramática:' : 'Grammar:'}</strong> {t('correctGrammar')}</li>
            <li><strong>{language === 'es' ? 'Sin traductor:' : 'No translator:'}</strong> {t('noTranslator')}</li>
            <li><strong>{language === 'es' ? 'Sé específico:' : 'Be specific:'}</strong> {t('beSpecific')}</li>
          </ul>
        </div>



        <div className="topics-grid">
          {topics.map((topic) => (
            <div
              key={topic.id}
              className="writing-topic-card card card-interactive"
              onClick={() => {
                setSelectedTopic(topic)
                startTimer('practice') // Auto-start timer
              }}
            >
              <h3>{topic.title}</h3>
              <p className="topic-prompt">{topic.prompt}</p>
              
              <div className="topic-requirements">
                <div className="requirement-item">
                  <strong>Grammar:</strong>
                  <div className="tags">
                    {topic.requiredGrammar.map((grammar, index) => (
                      <span key={index} className="tag">{grammar}</span>
                    ))}
                  </div>
                </div>
                
                <div className="requirement-item">
                  <strong>Connectors:</strong>
                  <div className="tags">
                    {topic.suggestedConnectors.map((connector, index) => (
                      <span key={index} className="tag tag-connector">{connector}</span>
                    ))}
                  </div>
                </div>
              </div>
              
              <button className="btn btn-primary">
                {t('startWriting')} →
              </button>
            </div>
          ))}
        </div>

        <div className="connectors-reference card">
          <h3>🔗 {t('connectorsReference')}</h3>
          <div className="connectors-grid">
            {connectors.map((connector, index) => (
              <div key={index} className="connector-item">
                <div className="connector-word">{connector.word}</div>
                <div className="connector-use">{connector.use}</div>
                <div className="connector-example">"{connector.example}"</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="writing-practice view-container">
      <button className="btn btn-outline back-button" onClick={() => setSelectedTopic(null)}>
        ← {t('backToTopics')}
      </button>

      <div className="section-header">
        <h2 className="section-title">✍️ {selectedTopic.title}</h2>
        <div className="header-controls">
          <div className={`mini-timer ${timeLeft <= 300 ? 'warning' : ''} ${timeLeft <= 60 ? 'critical' : ''}`}>
             ⏱️ {formatTime(timeLeft)}
          </div>
          <button
            className="btn btn-outline"
            onClick={() => setShowGuidance(!showGuidance)}
          >
            {showGuidance ? `🙈 ${t('hideGuidance')}` : `👁️ ${t('showGuidance')}`}
          </button>
        </div>
      </div>

      <div className="writing-container">
        <div className="writing-editor">
          <div className="word-counter">
            <div className="counter-display">
              <span className={`word-count ${isInRange ? 'in-range' : ''}`}>
                {wordCount}
              </span>
              <span className="word-target">/ 60-70 {t('words')}</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${progress}%`,
                  background: isInRange ? 'var(--success)' : 'var(--primary)'
                }}
              />
            </div>

            {/* Timer Controls inside Editor */}
            <div className="editor-timer-controls">
               {isTimerRunning ? (
                 <button className="btn-small btn-secondary" onClick={pauseTimer}>
                   ⏸️ {language === 'es' ? 'Pausar' : 'Pause'}
                 </button>
               ) : (
                 <button className="btn-small btn-primary" onClick={resumeTimer}>
                   ▶️ {language === 'es' ? 'Reanudar' : 'Resume'}
                 </button>
               )}
               <button className="btn-small btn-outline" onClick={resetTimer}>
                 🔄 {language === 'es' ? 'Reiniciar' : 'Reset'}
               </button>
            </div>
          </div>

          <div className="prompt-box">
            <strong>{t('prompt')}</strong> {selectedTopic.prompt}
          </div>

          <textarea
            className="writing-textarea"
            placeholder={language === 'es' ? 'Comienza a escribir aquí... ¡Recuerda usar conectores y gramática correcta!' : 'Start writing here... Remember to use connectors and correct grammar!'}
            value={writingText}
            onChange={(e) => setWritingText(e.target.value)}
          />

          <div className="writing-actions">
            <button
              className="btn btn-accent"
              onClick={analyzeWriting}
              disabled={wordCount < 60 || isAnalyzing}
            >
              {isAnalyzing ? (language === 'es' ? '🧠 Analizando...' : '🧠 Analyzing...') : (language === 'es' ? '✨ Analizar Escritura' : '✨ Analyze Writing')}
            </button>
            <button
              className="btn btn-primary"
              onClick={handleComplete}
              disabled={!feedback || parseFloat(feedback.score) < 3.0}
            >
              {!feedback ? (language === 'es' ? 'Analiza primero' : 'Analyze first') : (parseFloat(feedback.score) < 3.0 ? (language === 'es' ? 'Mejora tu escritura' : 'Improve writing') : `${t('submitWriting')} ✓`)}
            </button>
            <button
              className="btn btn-outline"
              onClick={() => {
                setWritingText('')
                setFeedback(null)
              }}
            >
              {t('clear')}
            </button>
          </div>

          {/* AI FEEDBACK CARD */}
          {feedback && !isAnalyzing && (
            <div className={`ai-feedback-card ${feedback.type}`} style={{ marginTop: '20px' }}>
              <div className="feedback-header">
                <div className="feedback-score">
                  <span className="score-num">{feedback.score}</span>
                  <span className="score-max">/ 5.0</span>
                </div>
                <div className="feedback-badge">
                  {feedback.type === 'success' ? (language === 'es' ? 'EXCELENTE' : 'EXCELLENT') : feedback.type === 'warning' ? (language === 'es' ? 'BUENO' : 'GOOD') : (language === 'es' ? 'SIGUE INTENTANDO' : 'KEEP TRYING')}
                </div>
              </div>
              <p className="feedback-message">{feedback.message}</p>
              
              {/* Detailed Scores */}
              <div className="detailed-scores">
                <div className="score-item">
                  <span className="score-label">{language === 'es' ? 'Conectores' : 'Connectors'}:</span>
                  <span className={`score-value ${feedback.connectorScore >= 50 ? 'good' : 'needs-work'}`}>{feedback.connectorScore}%</span>
                </div>
                <div className="score-item">
                  <span className="score-label">{language === 'es' ? 'Vocabulario' : 'Vocabulary'}:</span>
                  <span className={`score-value ${feedback.vocabularyScore >= 50 ? 'good' : 'needs-work'}`}>{feedback.vocabularyScore}%</span>
                </div>
                <div className="score-item">
                  <span className="score-label">{language === 'es' ? 'Gramática' : 'Grammar'}:</span>
                  <span className={`score-value ${feedback.grammarScore >= 50 ? 'good' : 'needs-work'}`}>{feedback.grammarScore}%</span>
                </div>
              </div>

              {/* Suggestions */}
              {feedback.suggestions.length > 0 && (
                <div className="suggestions-section">
                  <h5>{language === 'es' ? '💡 Correcciones y Sugerencias Profesionales:' : '💡 Professional Corrections & Suggestions:'}</h5>
                  {feedback.isProfessional && feedback.totalErrors > 0 && (
                    <div className="error-summary">
                      <strong>{language === 'es' ? 'Errores encontrados:' : 'Errors found:'}</strong> {feedback.totalErrors} {language === 'es' ? 'gramaticales' : 'grammar'}, {feedback.styleIssues} {language === 'es' ? 'de estilo' : 'style'}
                    </div>
                  )}
                  <ul>
                    {feedback.suggestions.map((suggestion, index) => (
                      <li key={index} className={`suggestion-item suggestion-${suggestion.type || 'general'}`}>
                        {suggestion.type === 'grammar' && <span className="suggestion-badge grammar">Grammar</span>}
                        {suggestion.type === 'style' && <span className="suggestion-badge style">Style</span>}
                        {suggestion.type === 'connector' && <span className="suggestion-badge connector">Connector</span>}
                        {suggestion.type === 'vocabulary' && <span className="suggestion-badge vocabulary">Vocabulary</span>}
                        {suggestion.type === 'required' && <span className="suggestion-badge required">Required</span>}
                        {suggestion.type === 'length' && <span className="suggestion-badge length">Length</span>}
                        <span className="suggestion-text">{suggestion.message || suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* What you used well */}
              {(feedback.usedConnectors.length > 0 || feedback.usedVocabulary.length > 0) && (
                <div className="used-well-section">
                  <h5>{language === 'es' ? '✅ Lo que usaste bien:' : '✅ What you used well:'}</h5>
                  {feedback.usedConnectors.length > 0 && (
                    <p><strong>{language === 'es' ? 'Conectores:' : 'Connectors:'}</strong> {feedback.usedConnectors.join(', ')}</p>
                  )}
                  {feedback.usedVocabulary.length > 0 && (
                    <p><strong>{language === 'es' ? 'Vocabulario:' : 'Vocabulary:'}</strong> {feedback.usedVocabulary.join(', ')}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {showGuidance && (
          <div className="writing-guidance">
            <div className="guidance-card card">
              <h4>📋 {t('suggestedOutline')}</h4>
              <ol>
                {selectedTopic.sampleOutline.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ol>
            </div>

            <div className="guidance-card card">
              <h4>📚 {t('keyVocabulary')}</h4>
              <div className="vocabulary-tags">
                {selectedTopic.keyVocabulary.map((word, index) => (
                  <span key={index} className="vocab-tag">{word}</span>
                ))}
              </div>
            </div>

            <div className="guidance-card card">
              <h4>🔗 {t('useTheseConnectors')}</h4>
              <div className="connector-tags">
                {selectedTopic.suggestedConnectors.map((connector, index) => (
                  <span key={index} className="connector-tag">{connector}</span>
                ))}
              </div>
            </div>

            <div className="guidance-card card">
              <h4>✅ {t('checklist')}</h4>
              <ul className="checklist">
                <li>
                  <input type="checkbox" checked={wordCount >= 60 && wordCount <= 70} readOnly />
                  <span>{t('checklistItem1')}</span>
                </li>
                <li>
                  <input type="checkbox" />
                  <span>{t('checklistItem2')}</span>
                </li>
                <li>
                  <input type="checkbox" />
                  <span>{t('checklistItem3')}</span>
                </li>
                <li>
                  <input type="checkbox" />
                  <span>{t('checklistItem4')}</span>
                </li>
                <li>
                  <input type="checkbox" />
                  <span>{t('checklistItem5')}</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default WritingPractice
