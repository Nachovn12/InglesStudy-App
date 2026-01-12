import { useState, useContext } from 'react'
import { LanguageContext } from '../App'
import { getTranslation } from '../translations'
import './ListeningPractice.css'

function ListeningPractice({ onProgress, onBack }) {
  const { language } = useContext(LanguageContext)
  const t = (key) => getTranslation(language, key)
  const [currentExercise, setCurrentExercise] = useState(0)
  const [userAnswer, setUserAnswer] = useState('')
  const [showFeedback, setShowFeedback] = useState(false)
  const [score, setScore] = useState(0)
  const [playCount, setPlayCount] = useState(0)
  const [audioSpeed, setAudioSpeed] = useState(0.9) // 0.7 = slow, 0.9 = normal, 1.1 = fast

  const exercises = [
    {
      id: 1,
      type: 'pronunciation',
      priority: 'high',
      title: language === 'es' ? 'Pronunciación del Pasado Simple - Sonido /t/' : 'Past Simple Pronunciation - /t/ sound',
      text: language === 'es' ? 'Escucha y repite:' : 'Listen and repeat:',
      audioText: 'walked - talked - worked - asked - watched',
      explanation: language === 'es' 
        ? 'Estos verbos terminan con el sonido /t/ porque el verbo base termina en: k, p, s, sh, ch, f'
        : 'These verbs end with the /t/ sound because the base verb ends in: k, p, s, sh, ch, f',
      examples: ['walk → walked', 'talk → talked', 'work → worked', 'ask → asked', 'watch → watched'],
      tip: language === 'es' ? '❌ NO pronuncies la "e" final' : '❌ DO NOT pronounce the final "e"'
    },
    {
      id: 2,
      type: 'dictation',
      priority: 'critical',
      title: language === 'es' ? 'Dictado: Fin de semana pasado' : 'Dictation: Last weekend',
      text: language === 'es' ? 'Escucha y escribe la oración completa:' : 'Listen and write the complete sentence:',
      audioText: 'Last weekend I went to Santiago with my family and we visited Fantasilandia.',
      correctAnswer: 'Last weekend I went to Santiago with my family and we visited Fantasilandia',
      explanation: language === 'es' 
        ? 'Palabras clave: went (pasado irregular de go), visited (pasado regular)'
        : 'Key words: went (irregular past of go), visited (regular past)',
      tip: language === 'es' ? 'Escucha 2-3 veces antes de escribir' : 'Listen 2-3 times before writing'
    },
    {
      id: 3,
      type: 'dictation',
      priority: 'critical',
      title: language === 'es' ? 'Dictado: Navidad' : 'Dictation: Christmas',
      text: language === 'es' ? 'Escucha y escribe:' : 'Listen and write:',
      audioText: 'Last Christmas we cooked a big dinner and opened presents at midnight.',
      correctAnswer: 'Last Christmas we cooked a big dinner and opened presents at midnight',
      explanation: language === 'es'
        ? 'Palabras clave: cooked (pasado regular), opened (pasado regular), at midnight (expresión de tiempo)'
        : 'Key words: cooked (regular past), opened (regular past), at midnight (time expression)',
      tip: language === 'es' ? 'Presta atención a las expresiones de tiempo' : 'Pay attention to time expressions'
    },
    {
      id: 4,
      type: 'comprehension',
      priority: 'critical',
      title: language === 'es' ? 'Comprensión: Comparación de ciudades' : 'Comprehension: City comparison',
      text: language === 'es' ? 'Escucha y responde:' : 'Listen and answer:',
      audioText: 'Santiago is bigger than Valparaíso and has more population. However, Valparaíso is more colorful and more beautiful. The weather in Valparaíso is better because it is near the ocean.',
      question: language === 'es' ? '¿Qué es verdad sobre estas ciudades?' : 'What is true about these cities?',
      options: language === 'es' 
        ? [
            'Valparaíso es más grande que Santiago',
            'Santiago tiene más población',
            'Santiago tiene mejor clima',
            'Tienen la misma población'
          ]
        : [
            'Valparaíso is bigger than Santiago',
            'Santiago has more population',
            'Santiago has better weather',
            'They have the same population'
          ],
      correctAnswer: 1,
      explanation: language === 'es'
        ? 'Santiago es más grande y tiene más población, pero Valparaíso tiene mejor clima y es más colorido.'
        : 'Santiago is bigger and has more population, but Valparaíso has better weather and is more colorful.',
      tip: language === 'es' ? 'Escucha las palabras: bigger, more, better' : 'Listen for: bigger, more, better'
    },
    {
      id: 5,
      type: 'comprehension',
      priority: 'high',
      title: language === 'es' ? 'Comprensión: Descripción de habitación' : 'Comprehension: Room description',
      text: language === 'es' ? 'Escucha y responde:' : 'Listen and answer:',
      audioText: 'In my room there is a big bed near the window. There are two windows with blue curtains. There is a desk with my computer and there are many books on the shelf.',
      question: language === 'es' ? '¿Cuántas ventanas hay?' : 'How many windows are there?',
      options: language === 'es'
        ? ['Una ventana', 'Dos ventanas', 'Tres ventanas', 'No hay ventanas']
        : ['One window', 'Two windows', 'Three windows', 'No windows'],
      correctAnswer: 1,
      explanation: language === 'es'
        ? 'Hay dos ventanas con cortinas azules.'
        : 'There are two windows with blue curtains.',
      tip: language === 'es' ? 'Escucha: there is (singular), there are (plural)' : 'Listen for: there is (singular), there are (plural)'
    },
    {
      id: 6,
      type: 'dictation',
      priority: 'high',
      title: language === 'es' ? 'Dictado: En el Restaurante' : 'Dictation: At the Restaurant',
      text: language === 'es' ? 'Escucha y escribe la orden:' : 'Listen and write the order:',
      audioText: 'I would like to order the chicken with rice and a bottle of water please.',
      correctAnswer: 'I would like to order the chicken with rice and a bottle of water please',
      explanation: language === 'es'
        ? 'Frase clave: I would like to order (Me gustaría ordenar)'
        : 'Key phrase: I would like to order',
      tip: language === 'es' ? 'Presta atención a la frase cortés "I would like"' : 'Pay attention to the polite phrase "I would like"'
    }
  ]

  const handleTextToSpeech = (text, speed = audioSpeed) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'en-US'
      utterance.rate = speed
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(utterance)
      setPlayCount(playCount + 1)
    } else {
      alert(language === 'es' 
        ? 'Text-to-speech no está soportado en tu navegador.' 
        : 'Text-to-speech is not supported in your browser.')
    }
  }

  const checkAnswer = () => {
    const exercise = exercises[currentExercise]
    
    if (exercise.type === 'dictation') {
      const userClean = userAnswer.toLowerCase().trim().replace(/[.,!?]/g, '')
      const correctClean = exercise.correctAnswer.toLowerCase().trim().replace(/[.,!?]/g, '')
      
      if (userClean === correctClean) {
        setScore(score + 1)
        onProgress(5)
      }
      setShowFeedback(true)
    } else if (exercise.type === 'comprehension') {
      const selectedIndex = parseInt(userAnswer)
      if (selectedIndex === exercise.correctAnswer) {
        setScore(score + 1)
        onProgress(5)
      }
      setShowFeedback(true)
    }
  }

  const nextExercise = () => {
    if (currentExercise < exercises.length - 1) {
      setCurrentExercise(currentExercise + 1)
      setUserAnswer('')
      setShowFeedback(false)
      setPlayCount(0)
    } else {
      setCurrentExercise(0)
      setUserAnswer('')
      setShowFeedback(false)
      setPlayCount(0)
    }
  }

  const exercise = exercises[currentExercise]
  const progress = ((currentExercise + 1) / exercises.length) * 100

  return (
    <div className="listening-practice view-container">
      <button className="btn btn-outline back-button" onClick={onBack}>
        ← {t('backToDashboard')}
      </button>

      <div className="section-header">
        <h2 className="section-title">🎧 {t('listeningPractice')}</h2>
        <div className="score-display">
          <span className="score-label">{t('score')}:</span>
          <span className="score-value">{score}/{exercises.length}</span>
        </div>
      </div>

      <div className="progress-info">
        <span>{language === 'es' ? 'Ejercicio' : 'Exercise'} {currentExercise + 1} {t('of')} {exercises.length}</span>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="listening-card card">
        <div className="exercise-header">
          <div className="exercise-type badge badge-info">
            {exercise.type === 'pronunciation' && `🗣️ ${t('pronunciation')}`}
            {exercise.type === 'dictation' && `✍️ ${t('dictation')}`}
            {exercise.type === 'comprehension' && `👂 ${t('comprehension')}`}
          </div>
          {exercise.priority === 'critical' && (
            <span className="priority-badge critical">
              🔴 {language === 'es' ? 'CRÍTICO' : 'CRITICAL'}
            </span>
          )}
          {exercise.priority === 'high' && (
            <span className="priority-badge high">
              🟡 {language === 'es' ? 'IMPORTANTE' : 'IMPORTANT'}
            </span>
          )}
        </div>

        <h3 className="exercise-title">{exercise.title}</h3>
        <p className="exercise-instruction">{exercise.text}</p>

        {/* Audio Controls */}
        <div className="audio-controls-enhanced">
          <div className="audio-main">
            <button
              className="btn btn-primary audio-button-large"
              onClick={() => handleTextToSpeech(exercise.audioText, audioSpeed)}
            >
              🔊 {t('playAudio')}
            </button>
            <div className="play-counter">
              {language === 'es' ? 'Reproducido' : 'Played'}: {playCount} {language === 'es' ? 'veces' : 'times'}
            </div>
          </div>

          <div className="speed-controls">
            <span className="speed-label">{language === 'es' ? 'Velocidad:' : 'Speed:'}</span>
            <button
              className={`speed-btn ${audioSpeed === 0.7 ? 'active' : ''}`}
              onClick={() => setAudioSpeed(0.7)}
            >
              🐢 {language === 'es' ? 'Lento' : 'Slow'}
            </button>
            <button
              className={`speed-btn ${audioSpeed === 0.9 ? 'active' : ''}`}
              onClick={() => setAudioSpeed(0.9)}
            >
              ▶️ {language === 'es' ? 'Normal' : 'Normal'}
            </button>
            <button
              className={`speed-btn ${audioSpeed === 1.1 ? 'active' : ''}`}
              onClick={() => setAudioSpeed(1.1)}
            >
              🐰 {language === 'es' ? 'Rápido' : 'Fast'}
            </button>
          </div>

          {exercise.tip && (
            <div className="exercise-tip">
              💡 {exercise.tip}
            </div>
          )}
        </div>

        {exercise.type === 'pronunciation' && (
          <div className="pronunciation-section">
            <div className="examples-box">
              <h4>{t('examples')}</h4>
              {exercise.examples.map((example, index) => (
                <div key={index} className="example-item">
                  <span>{example}</span>
                  <button
                    className="btn-small"
                    onClick={() => handleTextToSpeech(example.split('→')[1].trim(), audioSpeed)}
                  >
                    🔊
                  </button>
                </div>
              ))}
            </div>
            <div className="explanation-box">
              <strong>{t('rule')}:</strong> {exercise.explanation}
            </div>
          </div>
        )}

        {exercise.type === 'dictation' && (
          <div className="dictation-section">
            <textarea
              className="dictation-input"
              placeholder={t('writeWhatYouHear')}
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              disabled={showFeedback}
            />
            
            {!showFeedback && (
              <button 
                className="btn btn-accent" 
                onClick={checkAnswer}
                disabled={!userAnswer.trim()}
              >
                {language === 'es' ? 'Verificar Respuesta' : 'Check Answer'}
              </button>
            )}

            {showFeedback && (
              <div className={`feedback ${
                userAnswer.toLowerCase().trim().replace(/[.,!?]/g, '') === 
                exercise.correctAnswer.toLowerCase().trim().replace(/[.,!?]/g, '')
                  ? 'feedback-correct'
                  : 'feedback-incorrect'
              }`}>
                <div className="feedback-icon">
                  {userAnswer.toLowerCase().trim().replace(/[.,!?]/g, '') === 
                   exercise.correctAnswer.toLowerCase().trim().replace(/[.,!?]/g, '')
                    ? '✅'
                    : '❌'}
                </div>
                <div className="feedback-content">
                  <strong>{language === 'es' ? 'Respuesta correcta:' : 'Correct answer:'}</strong>
                  <p className="correct-answer-text">{exercise.correctAnswer}</p>
                  <p className="explanation">{exercise.explanation}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {exercise.type === 'comprehension' && (
          <div className="comprehension-section">
            <h4 className="question-text">{exercise.question}</h4>
            
            <div className="options-list">
              {exercise.options.map((option, index) => (
                <button
                  key={index}
                  className={`option-item ${
                    showFeedback && index === exercise.correctAnswer ? 'correct' : ''
                  } ${
                    showFeedback && parseInt(userAnswer) === index && index !== exercise.correctAnswer
                      ? 'incorrect'
                      : ''
                  } ${userAnswer === index.toString() && !showFeedback ? 'selected' : ''}`}
                  onClick={() => !showFeedback && setUserAnswer(index.toString())}
                  disabled={showFeedback}
                >
                  {option}
                </button>
              ))}
            </div>

            {!showFeedback && userAnswer !== '' && (
              <button className="btn btn-accent" onClick={checkAnswer}>
                {language === 'es' ? 'Verificar Respuesta' : 'Check Answer'}
              </button>
            )}

            {showFeedback && (
              <div className="explanation-box">
                <strong>{t('explanation')}:</strong> {exercise.explanation}
              </div>
            )}
          </div>
        )}

        {showFeedback && (
          <button className="btn btn-primary next-button" onClick={nextExercise}>
            {currentExercise < exercises.length - 1 
              ? `${t('nextExercise')} →` 
              : `${t('finish')} ✓`}
          </button>
        )}
      </div>

      <div className="listening-tips card">
        <h3>💡 {t('listeningTips')}</h3>
        <ul>
          <li>{t('listeningTip1')}</li>
          <li>{t('listeningTip2')}</li>
          <li>{t('listeningTip3')}</li>
          <li>{t('listeningTip4')}</li>
          <li className="tip-highlight">
            {language === 'es' 
              ? '🎯 Usa la velocidad LENTA al principio, luego practica con NORMAL'
              : '🎯 Use SLOW speed at first, then practice with NORMAL'}
          </li>
        </ul>
      </div>
    </div>
  )
}

export default ListeningPractice
