import { useState, createContext } from 'react'
import { useLocalStorage } from './hooks/useLocalStorage'
import { useTheme } from './hooks/useTheme'
import './App.css'
import Dashboard from './components/Dashboard'
import GrammarPractice from './components/GrammarPractice'
import VocabularyGames from './components/VocabularyGames'
import SpeakingSimulator from './components/SpeakingSimulator'
import ListeningPractice from './components/ListeningPractice'
import WritingPractice from './components/WritingPractice'
import ComparativeGame from './components/ComparativeGame'
import ProgressTracker from './components/ProgressTracker'
import StudyGuide from './components/StudyGuide'

export const LanguageContext = createContext()

function App() {
  const [currentView, setCurrentView] = useState('dashboard')
  
  // Persist language preference
  const [language, setLanguage] = useLocalStorage('english-app-language', 'es')
  
  // Persist progress
  const [progress, setProgress] = useLocalStorage('english-app-progress', {
    grammar: 0,
    vocabulary: 0,
    speaking: 0,
    listening: 0,
    writing: 0,
    comparativeGame: 0
  })

  // Theme management
  const { theme, toggleTheme } = useTheme()

  const updateProgress = (category, value) => {
    setProgress(prev => ({
      ...prev,
      [category]: Math.min(100, prev[category] + value)
    }))
  }

  const resetProgress = () => {
    if (window.confirm(language === 'es' 
      ? '¿Estás seguro de que quieres reiniciar todo tu progreso? Esta acción no se puede deshacer.' 
      : 'Are you sure you want to reset all your progress? This action cannot be undone.')) {
      setProgress({
        grammar: 0,
        vocabulary: 0,
        speaking: 0,
        listening: 0,
        writing: 0,
        comparativeGame: 0
      })
      alert(language === 'es' 
        ? '¡Progreso reiniciado exitosamente!' 
        : 'Progress reset successfully!')
    }
  }

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'es' : 'en')
  }

  const renderView = () => {
    switch(currentView) {
      case 'grammar':
        return <GrammarPractice onProgress={(val) => updateProgress('grammar', val)} onBack={() => setCurrentView('dashboard')} />
      case 'vocabulary':
        return <VocabularyGames onProgress={(val) => updateProgress('vocabulary', val)} onBack={() => setCurrentView('dashboard')} />
      case 'speaking':
        return <SpeakingSimulator onProgress={(val) => updateProgress('speaking', val)} onBack={() => setCurrentView('dashboard')} />
      case 'listening':
        return <ListeningPractice onProgress={(val) => updateProgress('listening', val)} onBack={() => setCurrentView('dashboard')} />
      case 'writing':
        return <WritingPractice onProgress={(val) => updateProgress('writing', val)} onBack={() => setCurrentView('dashboard')} />
      case 'progress':
        return <ProgressTracker progress={progress} onBack={() => setCurrentView('dashboard')} />
      case 'comparative-game':
        return <ComparativeGame onProgress={(val) => updateProgress('comparativeGame', val)} onBack={() => setCurrentView('dashboard')} />
      case 'study-guide':
        return <StudyGuide onBack={() => setCurrentView('dashboard')} />
      default:
        return <Dashboard onNavigate={setCurrentView} progress={progress} onResetProgress={resetProgress} />
    }
  }

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage }}>
      <div className="app">
        <div className="language-selector">
          <button 
            className={`lang-btn ${language === 'en' ? 'active' : ''}`}
            onClick={() => setLanguage('en')}
          >
            🇺🇸 English
          </button>
          <button 
            className={`lang-btn ${language === 'es' ? 'active' : ''}`}
            onClick={() => setLanguage('es')}
          >
            🇪🇸 Español
          </button>
        </div>

        <button 
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        {renderView()}
      </div>
    </LanguageContext.Provider>
  )
}

export default App
