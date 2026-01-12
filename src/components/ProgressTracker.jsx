import { useContext } from 'react'
import { LanguageContext } from '../App'
import { getTranslation } from '../translations'
import './ProgressTracker.css'

function ProgressTracker({ progress, onBack }) {
  const { language } = useContext(LanguageContext)
  const t = (key) => getTranslation(language, key)
  const totalProgress = Math.round(
    (progress.grammar + progress.vocabulary + progress.speaking + progress.listening + progress.writing) / 5
  )

  const categories = [
    {
      name: 'Grammar',
      key: 'grammar',
      icon: '📚',
      color: '#6366f1',
      progress: progress.grammar,
      topics: ['Simple Past', 'Comparatives', 'Quantifiers', 'There was/were']
    },
    {
      name: 'Vocabulary',
      key: 'vocabulary',
      icon: '🎮',
      color: '#ec4899',
      progress: progress.vocabulary,
      topics: ['Professions', 'House & Furniture', 'Food & Drinks', 'Collocations']
    },
    {
      name: 'Speaking',
      key: 'speaking',
      icon: '🗣️',
      color: '#14b8a6',
      progress: progress.speaking,
      topics: ['23 Oral Questions', 'Sample Answers', 'Pronunciation', 'Fluency']
    },
    {
      name: 'Listening',
      key: 'listening',
      icon: '🎧',
      color: '#f59e0b',
      progress: progress.listening,
      topics: ['Pronunciation', 'Dictation', 'Comprehension', 'Audio Practice']
    },
    {
      name: 'Writing',
      key: 'writing',
      icon: '✍️',
      color: '#8b5cf6',
      progress: progress.writing,
      topics: ['60-70 words', 'Connectors', 'Grammar', 'Organization']
    }
  ]

  const getProgressLevel = (value) => {
    if (value >= 80) return { level: t('excellent'), color: 'var(--success)', emoji: '🌟' }
    if (value >= 60) return { level: t('good'), color: 'var(--accent)', emoji: '👍' }
    if (value >= 40) return { level: t('fair'), color: 'var(--warning)', emoji: '📈' }
    return { level: t('needsWork'), color: 'var(--error)', emoji: '💪' }
  }

  const overallLevel = getProgressLevel(totalProgress)

  const examDate = new Date('2026-01-13T09:00:00')
  const today = new Date()
  const daysLeft = Math.ceil((examDate - today) / (1000 * 60 * 60 * 24))
  const hoursLeft = Math.ceil((examDate - today) / (1000 * 60 * 60))

  const studyRecommendations = []
  
  if (progress.grammar < 60) {
    studyRecommendations.push({
      category: t('grammarPractice'),
      icon: '📚',
      message: language === 'es' ? 'Enfócate en verbos irregulares del Pasado Simple y comparativos' : 'Focus on Simple Past irregular verbs and comparatives',
      priority: 'high'
    })
  }
  
  if (progress.speaking < 60) {
    studyRecommendations.push({
      category: t('speakingSimulator'),
      icon: '🗣️',
      message: language === 'es' ? 'Practica respondiendo las 23 preguntas orales en voz alta' : 'Practice answering the 23 oral questions out loud',
      priority: 'high'
    })
  }
  
  if (progress.writing < 60) {
    studyRecommendations.push({
      category: t('writingPractice'),
      icon: '✍️',
      message: language === 'es' ? 'Escribe al menos 2 composiciones usando conectores' : 'Write at least 2 compositions using connectors',
      priority: 'medium'
    })
  }
  
  if (progress.vocabulary < 60) {
    studyRecommendations.push({
      category: t('vocabularyGames'),
      icon: '🎮',
      message: language === 'es' ? 'Revisa profesiones y colocaciones con flashcards' : 'Review professions and collocations with flashcards',
      priority: 'medium'
    })
  }
  
  if (progress.listening < 60) {
    studyRecommendations.push({
      category: t('listeningPractice'),
      icon: '🎧',
      message: language === 'es' ? 'Practica la pronunciación de verbos en pasado simple' : 'Practice pronunciation of past simple verbs',
      priority: 'low'
    })
  }

  if (studyRecommendations.length === 0) {
    studyRecommendations.push({
      category: language === 'es' ? 'Revisar' : 'Review',
      icon: '🎯',
      message: language === 'es' ? '¡Buen trabajo! Sigue revisando todos los temas para mantener tu nivel' : 'Great job! Keep reviewing all topics to maintain your level',
      priority: 'low'
    })
  }

  return (
    <div className="progress-tracker view-container">
      <button className="btn btn-outline back-button" onClick={onBack}>
        ← {t('backToDashboard')}
      </button>

      <div className="section-header">
        <h2 className="section-title">📈 {t('progressTracker')}</h2>
      </div>

      <div className="overall-progress card">
        <div className="overall-header">
          <div className="overall-info">
            <h3>{t('overallProgressTitle')}</h3>
            <div className="overall-level" style={{ color: overallLevel.color }}>
              {overallLevel.emoji} {overallLevel.level}
            </div>
          </div>
          <div className="overall-circle">
            <svg viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="var(--bg-secondary)"
                strokeWidth="10"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={overallLevel.color}
                strokeWidth="10"
                strokeDasharray={`${totalProgress * 2.827} 282.7`}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
              />
              <text
                x="50"
                y="50"
                textAnchor="middle"
                dy="7"
                fontSize="20"
                fontWeight="700"
                fill="var(--text-primary)"
              >
                {totalProgress}%
              </text>
            </svg>
          </div>
        </div>

        <div className="time-remaining">
          <div className="time-item">
            <span className="time-icon">⏰</span>
            <div>
              <div className="time-label">{t('timeUntilExam')}</div>
              <div className="time-value">{daysLeft} {t('days')} ({hoursLeft} {t('hours')})</div>
            </div>
          </div>
        </div>
      </div>

      <div className="categories-progress">
        <h3 className="section-subtitle">📊 {t('progressByCategory')}</h3>
        <div className="categories-grid">
          {categories.map((category) => {
            const level = getProgressLevel(category.progress)
            return (
              <div
                key={category.key}
                className="category-progress-card card"
                style={{ borderColor: category.color }}
              >
                <div className="category-progress-header">
                  <div className="category-icon" style={{ color: category.color }}>
                    {category.icon}
                  </div>
                  <div className="category-info">
                    <h4>{category.name}</h4>
                    <div className="category-level" style={{ color: level.color }}>
                      {level.emoji} {level.level}
                    </div>
                  </div>
                  <div className="category-percentage" style={{ color: category.color }}>
                    {category.progress}%
                  </div>
                </div>

                <div className="category-progress-bar">
                  <div
                    className="category-progress-fill"
                    style={{
                      width: `${category.progress}%`,
                      background: category.color
                    }}
                  />
                </div>

                <div className="category-topics">
                  {category.topics.map((topic, index) => (
                    <span key={index} className="topic-badge">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="recommendations">
        <h3 className="section-subtitle">💡 {t('studyRecommendations')}</h3>
        <div className="recommendations-list">
          {studyRecommendations.map((rec, index) => (
            <div
              key={index}
              className={`recommendation-card card priority-${rec.priority}`}
            >
              <div className="recommendation-icon">{rec.icon}</div>
              <div className="recommendation-content">
                <h4>{rec.category}</h4>
                <p>{rec.message}</p>
              </div>
              <div className={`priority-badge badge-${rec.priority}`}>
                {rec.priority === 'high' && `🔴 ${t('highPriority')}`}
                {rec.priority === 'medium' && `🟡 ${t('mediumPriority')}`}
                {rec.priority === 'low' && `🟢 ${t('lowPriority')}`}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="study-tips card">
        <h3>🎯 {t('finalExamTips')}</h3>
        <div className="tips-columns">
          <div className="tip-column">
            <h4>📝 {t('writtenExamTips')}</h4>
            <ul>
              <li>{language === 'es' ? 'Revisar lista de verbos irregulares' : 'Review irregular verbs list'}</li>
              <li>{language === 'es' ? 'Practicar comparativos con ejemplos reales' : 'Practice comparatives with real examples'}</li>
              <li>{language === 'es' ? 'Saber cuándo usar much/many' : 'Know when to use much/many'}</li>
              <li>{language === 'es' ? 'Escribir 60-70 palabras con conectores' : 'Write 60-70 words with connectors'}</li>
              <li>{language === 'es' ? 'Revisar ortografía y gramática' : 'Check your spelling and grammar'}</li>
            </ul>
          </div>
          <div className="tip-column">
            <h4>🗣️ {t('speakingExamTips')}</h4>
            <ul>
              <li>{language === 'es' ? 'Practicar las 23 preguntas en voz alta' : 'Practice all 23 questions out loud'}</li>
              <li>{language === 'es' ? 'Preparar ejemplos personales' : 'Prepare personal examples'}</li>
              <li>{language === 'es' ? 'Usar oraciones completas, no solo "sí/no"' : 'Use complete sentences, not just "yes/no"'}</li>
              <li>{language === 'es' ? 'Hablar clara y confiadamente' : 'Speak clearly and confidently'}</li>
              <li>{language === 'es' ? 'Responder preguntas de seguimiento' : 'Answer follow-up questions'}</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="motivational-message card">
        <div className="motivation-icon">🌟</div>
        <h3>{t('youreDoingGreat')}</h3>
        <p>
          {totalProgress >= 80 && t('motivationExcellent')}
          {totalProgress >= 60 && totalProgress < 80 && t('motivationGood')}
          {totalProgress >= 40 && totalProgress < 60 && t('motivationFair')}
          {totalProgress < 40 && t('motivationNeedsWork')}
        </p>
        <p className="exam-reminder">
          {t('examReminder')}
        </p>
      </div>
    </div>
  )
}

export default ProgressTracker
