import { useContext, useState } from 'react'
import { LanguageContext } from '../App'
import { getTranslation } from '../translations'
import './Dashboard.css'

function Dashboard({ onNavigate, progress, onResetProgress }) {
  const { language } = useContext(LanguageContext)
  const t = (key) => getTranslation(language, key)
  
  // State for collapsible tips
  const [showTips, setShowTips] = useState(false)
  
  const examDate = new Date('2026-01-13T09:00:00') // Written exam
  const speakingExamDate = new Date('2026-01-14T09:00:00') // Speaking exam - CORRECTED
  const today = new Date()
  const daysLeft = Math.ceil((examDate - today) / (1000 * 60 * 60 * 24))
  const speakingDaysLeft = Math.ceil((speakingExamDate - today) / (1000 * 60 * 60 * 24))
  const hoursLeft = Math.ceil((examDate - today) / (1000 * 60 * 60)) % 24

  const modules = [
    {
      id: 'grammar',
      title: `📚 ${t('grammarPractice')}`,
      description: t('grammarDesc'),
      color: '#6366f1',
      topics: [
        'Simple Past (Regular & Irregular)', 
        'Comparatives', 
        'Quantifiers (Much/Many)', 
        'There was/were'
      ],
      progress: progress.grammar
    },
    {
      id: 'vocabulary',
      title: `🎮 ${t('vocabularyGames')}`,
      description: t('vocabularyDesc'),
      color: '#ec4899',
      topics: ['Professions', 'House & Furniture', 'Food & Drinks', 'Collocations (GO/HAVE/GET)'],
      progress: progress.vocabulary
    },
    {
      id: 'speaking',
      title: `🗣️ ${t('speakingSimulator')}`,
      description: t('speakingDesc'),
      color: '#14b8a6',
      topics: ['Personal Questions', 'Past Events', 'Comparisons', 'Future Plans'],
      progress: progress.speaking
    },
    {
      id: 'listening',
      title: `🎧 ${t('listeningPractice')}`,
      description: t('listeningDesc'),
      color: '#f59e0b',
      topics: ['Past Simple Stories', 'Conversations', 'Pronunciation Practice', 'Dictation Exercises'],
      progress: progress.listening
    },
    {
      id: 'writing',
      title: `✍️ ${t('writingPractice')}`,
      description: t('writingDesc'),
      color: '#8b5cf6',
      topics: ['My Last Weekend', 'Comparing Cities', 'Using Connectors', 'Past Experiences'],
      progress: progress.writing
    },
    {
      id: 'comparative-game',
      title: language === 'es' ? `🎯 Juego de Comparaciones` : `🎯 Comparative Game`,
      description: language === 'es' ? 'Practica comparativos de forma interactiva' : 'Practice comparatives interactively',
      color: '#10b981',
      topics: language === 'es' 
        ? ['Comparativos Cortos', 'Comparativos Largos', 'Irregulares', 'Escribir y Hablar']
        : ['Short Comparatives', 'Long Comparatives', 'Irregulars', 'Write & Speak'],
      progress: progress.comparativeGame || 0
    },
    {
      id: 'study-guide',
      title: language === 'es' ? `🆘 Guía de Estudio y Diccionario` : `🆘 Study Guide & Dictionary`,
      description: language === 'es' ? 'Kit de Emergencia: Diccionario y Gramática' : 'Emergency Kit: Dictionary & Grammar',
      color: '#ef4444',
      topics: language === 'es' 
        ? ['Verbos', 'Números', 'Resumen Gramatical', 'Frases de Supervivencia']
        : ['Verbs', 'Numbers', 'Grammar Cheat Sheet', 'Survival Phrases'],
      progress: 100 // Always 100% accessible
    }
  ]

  const totalProgress = Math.round(
    (progress.grammar + progress.vocabulary + progress.speaking + progress.listening + progress.writing + (progress.comparativeGame || 0)) / 6
  )

  return (
    <div className="dashboard view-container">
      <header className="header">
        <h1 className="header-title">🎓 {t('appTitle')}</h1>
        <p className="header-subtitle">{t('appSubtitle')}</p>
        
        <div className="exam-countdown">
          <div className="countdown-item">
            <span className="countdown-label">{t('writtenExam')}</span>
            <span className="countdown-value">{daysLeft} {t('days')}</span>
          </div>
          <div className="countdown-separator">•</div>
          <div className="countdown-item">
            <span className="countdown-label">{t('speakingExam')}</span>
            <span className="countdown-value">{speakingDaysLeft} {t('days')}</span>
          </div>
          <div className="countdown-separator">•</div>
          <div className="countdown-item">
            <span className="countdown-label">{t('overallProgress')}</span>
            <span className="countdown-value">{totalProgress}%</span>
          </div>
        </div>
      </header>

      {/* Professor's Tips Section - Collapsible */}
      <div className="professor-tips-container">
        <button 
          className="tips-toggle-btn card card-interactive"
          onClick={() => setShowTips(!showTips)}
        >
          <div className="tips-toggle-content">
            <div className="tips-toggle-header">
              <h3>👨‍🏫 {language === 'es' ? 'Tips del Profesor' : 'Professor\'s Tips'}</h3>
              <span className="tips-badge">
                {language === 'es' ? 'Información Crítica del Examen' : 'Critical Exam Information'}
              </span>
            </div>
            <span className="tips-toggle-icon">
              {showTips ? '▼' : '▶'}
            </span>
          </div>
        </button>

        {showTips && (
          <div className="professor-tips card">
            <div className="tips-priority">
              <div className="priority-item priority-critical">
                <span className="priority-badge">🔴 {language === 'es' ? 'GARANTIZADO' : 'GUARANTEED'}</span>
                <div className="priority-content">
                  <h4>{language === 'es' ? 'Aparecerá SÍ O SÍ en ambos exámenes:' : 'Will appear in BOTH exams:'}</h4>
                  <ul>
                    <li><strong>Simple Past</strong> - {language === 'es' ? 'Mínimo 1 pregunta garantizada' : 'Minimum 1 question guaranteed'}</li>
                    <li><strong>Comparatives</strong> - {language === 'es' ? 'Mínimo 1 pregunta garantizada' : 'Minimum 1 question guaranteed'}</li>
                  </ul>
                </div>
              </div>

              <div className="priority-item priority-high">
                <span className="priority-badge">🟡 {language === 'es' ? 'PROBABLE' : 'LIKELY'}</span>
                <div className="priority-content">
                  <h4>{language === 'es' ? 'Podría aparecer:' : 'May appear:'}</h4>
                  <ul>
                    <li><strong>There is/There are</strong> - {language === 'es' ? 'Posible pero no garantizado' : 'Possible but not guaranteed'}</li>
                    <li><strong>Countable/Uncountable</strong> - {language === 'es' ? 'Posible pero no garantizado' : 'Possible but not guaranteed'}</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="tips-warnings">
              <h4>⚠️ {language === 'es' ? 'Advertencias Importantes' : 'Important Warnings'}</h4>
              <div className="warning-grid">
                <div className="warning-item">
                  <span className="warning-icon">❌</span>
                  <p><strong>{language === 'es' ? 'NO usar traductor' : 'NO translator'}</strong><br/>
                  {language === 'es' ? 'El profesor lo nota inmediatamente' : 'Professor notices immediately'}</p>
                </div>
                <div className="warning-item">
                  <span className="warning-icon">❌</span>
                  <p><strong>{language === 'es' ? 'NO memorizar palabra por palabra' : 'NO word-by-word memorization'}</strong><br/>
                  {language === 'es' ? 'Suena artificial' : 'Sounds artificial'}</p>
                </div>
                <div className="warning-item">
                  <span className="warning-icon">✅</span>
                  <p><strong>{language === 'es' ? 'USA vocabulario simple' : 'USE simple vocabulary'}</strong><br/>
                  {language === 'es' ? 'Solo lo que realmente conoces' : 'Only what you really know'}</p>
                </div>
                <div className="warning-item">
                  <span className="warning-icon">✅</span>
                  <p><strong>{language === 'es' ? 'Respuestas EXTENSAS' : 'EXTENDED answers'}</strong><br/>
                  {language === 'es' ? 'Múltiples actividades, no solo una' : 'Multiple activities, not just one'}</p>
                </div>
              </div>
            </div>

            <div className="tips-speaking">
              <h4>🎤 {language === 'es' ? 'Speaking: Estructura del Examen' : 'Speaking: Exam Structure'}</h4>
              <div className="speaking-flow">
                <div className="flow-step">
                  <span className="step-number">1</span>
                  <p>{language === 'es' ? 'Profesor pregunta → Tú respondes' : 'Professor asks → You answer'}</p>
                </div>
                <div className="flow-arrow">→</div>
                <div className="flow-step">
                  <span className="step-number">2</span>
                  <p>{language === 'es' ? 'Compañero pregunta → Tú respondes' : 'Partner asks → You answer'}</p>
                </div>
                <div className="flow-arrow">→</div>
                <div className="flow-step">
                  <span className="step-number">3</span>
                  <p>{language === 'es' ? 'Se repite (2-4 preguntas cada uno)' : 'Repeats (2-4 questions each)'}</p>
                </div>
              </div>
              <p className="tip-note">
                💡 {language === 'es' 
                  ? 'Si hablas poco → más preguntas. Si hablas bien → menos preguntas.' 
                  : 'Speak little → more questions. Speak well → fewer questions.'}
              </p>
            </div>

            <div className="tips-followup">
              <h4>❓ {language === 'es' ? 'Follow-up Questions Fáciles' : 'Easy Follow-up Questions'}</h4>
              <div className="followup-examples">
                <div className="followup-tag">What is your favorite...?</div>
                <div className="followup-tag">Do you like...?</div>
                <div className="followup-tag">Did you enjoy it?</div>
                <div className="followup-tag">Who did you go with?</div>
              </div>
              <p className="tip-important">
                🎯 {language === 'es' 
                  ? '¡CRÍTICO! Coordina con tu compañero ANTES del examen' 
                  : 'CRITICAL! Coordinate with your partner BEFORE the exam'}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="modules-grid">
        {modules.map((module) => (
          <div 
            key={module.id}
            className="module-card card card-interactive"
            onClick={() => onNavigate(module.id)}
            style={{ borderColor: module.color }}
          >
            <div className="module-header">
              <h3 className="module-title">{module.title}</h3>
              <div className="module-progress-circle" style={{ borderColor: module.color }}>
                <span style={{ color: module.color }}>{module.progress}%</span>
              </div>
            </div>
            
            <p className="module-description">{module.description}</p>
            
            <div className="module-topics">
              {module.topics.map((topic, index) => (
                <span key={index} className="topic-tag" style={{ borderColor: module.color, color: module.color }}>
                  {topic}
                </span>
              ))}
            </div>
            
            <div className="module-progress-bar">
              <div 
                className="module-progress-fill" 
                style={{ 
                  width: `${module.progress}%`,
                  background: module.color
                }}
              />
            </div>
            
            <button 
              className="btn btn-primary module-button"
              style={{ background: module.color }}
            >
              {t('startPractice')} →
            </button>
          </div>
        ))}
      </div>

      <div className="quick-stats">
        <div className="stat-card card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h4>{t('totalProgress')}</h4>
            <p className="stat-value">{totalProgress}%</p>
          </div>
        </div>
        
        <div className="stat-card card">
          <div className="stat-icon">⏰</div>
          <div className="stat-content">
            <h4>{t('timeRemaining')}</h4>
            <p className="stat-value">{daysLeft}d {hoursLeft}h</p>
          </div>
        </div>
        
        <div className="stat-card card">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <h4>{t('examWeight')}</h4>
            <p className="stat-value">44%</p>
          </div>
        </div>
        
        <button 
          className="stat-card card card-interactive view-progress-card"
          onClick={() => onNavigate('progress')}
        >
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <h4>{t('viewProgress')}</h4>
            <p className="stat-link">Click to see your stats →</p>
          </div>
        </button>

        <button 
          className="stat-card card card-interactive reset-progress-card"
          onClick={onResetProgress}
        >
          <div className="stat-icon">🔄</div>
          <div className="stat-content">
            <h4>{language === 'es' ? 'Reiniciar Progreso' : 'Reset Progress'}</h4>
            <p className="stat-link">{language === 'es' ? 'Borrar todo el progreso' : 'Clear all progress'}</p>
          </div>
        </button>
      </div>

      <div className="exam-info card">
        <h3>📅 {t('examSchedule')}</h3>
        <div className="exam-schedule">
          {/* EXISTING EXAMS (DO NOT TOUCH) */}
          <div className="exam-item">
            <div className="exam-date">
              <span className="exam-day">13</span>
              <span className="exam-month">ENE</span>
            </div>
            <div className="exam-details">
              <h4>{t('writtenExam')}</h4>
              <p>{t('writtenExamDetails')}</p>
              <span className="exam-weight">{t('weight')}: 32% (Partial)</span>
            </div>
          </div>
          
          <div className="exam-item">
            <div className="exam-date">
              <span className="exam-day">14</span>
              <span className="exam-month">ENE</span>
            </div>
            <div className="exam-details">
              <h4>{t('speakingExam')}</h4>
              <p>{t('speakingExamDetails')}</p>
              <span className="exam-weight">{t('weight')}: 12% (Partial)</span>
            </div>
          </div>

          {/* NEW EVALUATIONS */}
          <div className="exam-item">
            <div className="exam-date">
              <span className="exam-day">22</span>
              <span className="exam-month">ENE</span>
            </div>
            <div className="exam-details">
              <h4>{t('endTermWritten')}</h4>
              <p>{t('ea2Content')}</p>
              <span className="exam-weight">{t('weight')}: 32% (Partial)</span>
            </div>
          </div>

          <div className="exam-item">
            <div className="exam-date">
              <span className="exam-day">22</span>
              <span className="exam-month">ENE</span>
            </div>
            <div className="exam-details">
              <h4>{t('endTermSpeaking')}</h4>
              <p>{t('ea2Content')}</p>
              <span className="exam-weight">{t('weight')}: 12% (Partial)</span>
            </div>
          </div>

          <div className="exam-item">
            <div className="exam-date">
              <span className="exam-day">26</span>
              <span className="exam-month">ENE</span>
            </div>
            <div className="exam-details">
              <h4>{t('englishProduction')}</h4>
              <p>{t('activity1')}</p>
              <span className="exam-weight">{t('weight')}: 12% (Partial)</span>
            </div>
          </div>

          <div className="exam-item final-exam-item" style={{background: 'rgba(99, 102, 241, 0.1)', borderLeft: '4px solid #6366f1'}}>
            <div className="exam-date" style={{background: '#6366f1'}}>
              <span className="exam-day">27</span>
              <span className="exam-month">ENE</span>
            </div>
            <div className="exam-details">
              <h4>{t('finalSpeaking')}</h4>
              <p>{t('ea1And2')}</p>
              <span className="exam-weight">{t('weight')}: 25% (of Final 40%)</span>
            </div>
          </div>

          <div className="exam-item final-exam-item" style={{background: 'rgba(99, 102, 241, 0.1)', borderLeft: '4px solid #6366f1'}}>
            <div className="exam-date" style={{background: '#6366f1'}}>
              <span className="exam-day">28</span>
              <span className="exam-month">ENE</span>
            </div>
            <div className="exam-details">
              <h4>{t('finalWritten')}</h4>
              <p>{t('ea1And2')}</p>
              <span className="exam-weight">{t('weight')}: 75% (of Final 40%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
