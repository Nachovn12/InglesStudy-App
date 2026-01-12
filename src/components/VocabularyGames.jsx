import { useState, useEffect, useContext } from 'react'
import { LanguageContext } from '../App'
import { getTranslation } from '../translations'
import './VocabularyGames.css'

function VocabularyGames({ onProgress, onBack }) {
  const { language } = useContext(LanguageContext)
  const t = (key) => getTranslation(language, key)
  const [gameMode, setGameMode] = useState('menu')
  const [currentCategory, setCurrentCategory] = useState(null)
  const [currentCard, setCurrentCard] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [score, setScore] = useState(0)
  const [matchingPairs, setMatchingPairs] = useState([])
  const [selectedCards, setSelectedCards] = useState([])
  const [matchedCards, setMatchedCards] = useState([])

  const vocabularyData = {
    professions: [
      { english: 'Singer', spanish: 'Cantante', emoji: '🎤' },
      { english: 'Painter', spanish: 'Pintor/a', emoji: '🎨' },
      { english: 'Musician', spanish: 'Músico/a', emoji: '🎵' },
      { english: 'Writer', spanish: 'Escritor/a', emoji: '✍️' },
      { english: 'Scientist', spanish: 'Científico/a', emoji: '🔬' },
      { english: 'Teacher', spanish: 'Profesor/a', emoji: '👨‍🏫' },
      { english: 'Doctor', spanish: 'Doctor/a', emoji: '👨‍⚕️' },
      { english: 'Engineer', spanish: 'Ingeniero/a', emoji: '👷' },
      { english: 'Chef', spanish: 'Chef', emoji: '👨‍🍳' },
      { english: 'Actor', spanish: 'Actor/Actriz', emoji: '🎭' },
      { english: 'Photographer', spanish: 'Fotógrafo/a', emoji: '📷' },
      { english: 'Architect', spanish: 'Arquitecto/a', emoji: '🏗️' },
      { english: 'Lawyer', spanish: 'Abogado/a', emoji: '⚖️' },
      { english: 'Nurse', spanish: 'Enfermero/a', emoji: '👩‍⚕️' },
      { english: 'Programmer', spanish: 'Programador/a', emoji: '💻' }
    ],
    house: [
      { english: 'Kitchen', spanish: 'Cocina', emoji: '🍳' },
      { english: 'Bathroom', spanish: 'Baño', emoji: '🚿' },
      { english: 'Bedroom', spanish: 'Dormitorio', emoji: '🛏️' },
      { english: 'Living room', spanish: 'Sala de estar', emoji: '🛋️' },
      { english: 'Bed', spanish: 'Cama', emoji: '🛏️' },
      { english: 'Fridge', spanish: 'Refrigerador', emoji: '🧊' },
      { english: 'Shelf', spanish: 'Estante', emoji: '📚' },
      { english: 'Desk', spanish: 'Escritorio', emoji: '🖥️' },
      { english: 'Chair', spanish: 'Silla', emoji: '🪑' },
      { english: 'Table', spanish: 'Mesa', emoji: '🪑' },
      { english: 'Window', spanish: 'Ventana', emoji: '🪟' },
      { english: 'Door', spanish: 'Puerta', emoji: '🚪' },
      { english: 'Lamp', spanish: 'Lámpara', emoji: '💡' },
      { english: 'Mirror', spanish: 'Espejo', emoji: '🪞' },
      { english: 'Carpet', spanish: 'Alfombra', emoji: '🧶' }
    ],
    food: [
      { english: 'Apple', spanish: 'Manzana', emoji: '🍎', type: 'countable' },
      { english: 'Water', spanish: 'Agua', emoji: '💧', type: 'uncountable' },
      { english: 'Sugar', spanish: 'Azúcar', emoji: '🧂', type: 'uncountable' },
      { english: 'Coffee', spanish: 'Café', emoji: '☕', type: 'uncountable' },
      { english: 'Bread', spanish: 'Pan', emoji: '🍞', type: 'uncountable' },
      { english: 'Egg', spanish: 'Huevo', emoji: '🥚', type: 'countable' },
      { english: 'Milk', spanish: 'Leche', emoji: '🥛', type: 'uncountable' },
      { english: 'Cheese', spanish: 'Queso', emoji: '🧀', type: 'uncountable' },
      { english: 'Tomato', spanish: 'Tomate', emoji: '🍅', type: 'countable' },
      { english: 'Rice', spanish: 'Arroz', emoji: '🍚', type: 'uncountable' },
      { english: 'Chicken', spanish: 'Pollo', emoji: '🍗', type: 'uncountable' },
      { english: 'Orange', spanish: 'Naranja', emoji: '🍊', type: 'countable' },
      { english: 'Juice', spanish: 'Jugo', emoji: '🧃', type: 'uncountable' },
      { english: 'Banana', spanish: 'Plátano', emoji: '🍌', type: 'countable' },
      { english: 'Meat', spanish: 'Carne', emoji: '🥩', type: 'uncountable' }
    ],
    collocations: [
      { english: 'GO shopping', spanish: 'Ir de compras', emoji: '🛍️' },
      { english: 'GO home', spanish: 'Ir a casa', emoji: '🏠' },
      { english: 'GO out', spanish: 'Salir', emoji: '🚶' },
      { english: 'GO to bed', spanish: 'Ir a la cama', emoji: '😴' },
      { english: 'HAVE breakfast', spanish: 'Desayunar', emoji: '🍳' },
      { english: 'HAVE lunch', spanish: 'Almorzar', emoji: '🍽️' },
      { english: 'HAVE a good time', spanish: 'Pasarla bien', emoji: '🎉' },
      { english: 'GET up', spanish: 'Levantarse', emoji: '⏰' },
      { english: 'GET dressed', spanish: 'Vestirse', emoji: '👔' },
      { english: 'GET home', spanish: 'Llegar a casa', emoji: '🏡' }
    ],
    restaurant: [
      { english: 'Menu', spanish: 'Menú', emoji: '📋' },
      { english: 'Starter', spanish: 'Entrada', emoji: '🥗' },
      { english: 'Main course', spanish: 'Plato de fondo', emoji: '🍝' },
      { english: 'Dessert', spanish: 'Postre', emoji: '🍨' },
      { english: 'Bill', spanish: 'Cuenta', emoji: '🧾' },
      { english: 'Waiter/Waitress', spanish: 'Mesero/a', emoji: '🤵' },
      { english: 'Order', spanish: 'Ordenar/Pedido', emoji: '📝' },
      { english: 'Delicious', spanish: 'Delicioso', emoji: '😋' },
      { english: 'Spicy', spanish: 'Picante', emoji: '🌶️' },
      { english: 'Vegetarian', spanish: 'Vegetariano', emoji: '🥦' },
      { english: 'Table for two', spanish: 'Mesa para dos', emoji: '👥' },
      { english: 'Tip', spanish: 'Propina', emoji: '💰' }
    ]
  }

  const categories = [
    { id: 'professions', title: 'Professions', icon: '👔', color: '#6366f1', count: 15 },
    { id: 'house', title: 'House & Furniture', icon: '🏠', color: '#ec4899', count: 15 },
    { id: 'food', title: 'Food & Drinks', icon: '🍕', color: '#14b8a6', count: 15 },
    { id: 'collocations', title: 'Collocations', icon: '🔗', color: '#f59e0b', count: 10 },
    { id: 'restaurant', title: 'Restaurant', icon: '🍽️', color: '#ef4444', count: 12 }
  ]

  const startFlashcards = (categoryId) => {
    setCurrentCategory(categoryId)
    setGameMode('flashcards')
    setCurrentCard(0)
    setIsFlipped(false)
    setScore(0)
  }

  const startMatching = (categoryId) => {
    setCurrentCategory(categoryId)
    setGameMode('matching')
    setScore(0)
    setSelectedCards([])
    setMatchedCards([])
    
    // Create pairs for matching game
    const words = vocabularyData[categoryId].slice(0, 6) // Use 6 pairs
    const pairs = []
    words.forEach((word, index) => {
      pairs.push({ id: index * 2, text: word.english, pairId: index, type: 'english' })
      pairs.push({ id: index * 2 + 1, text: word.spanish, pairId: index, type: 'spanish' })
    })
    // Shuffle pairs
    setMatchingPairs(pairs.sort(() => Math.random() - 0.5))
  }

  const flipCard = () => {
    setIsFlipped(!isFlipped)
    if (!isFlipped) {
      onProgress(1)
    }
  }

  const nextCard = () => {
    const words = vocabularyData[currentCategory]
    if (currentCard < words.length - 1) {
      setCurrentCard(currentCard + 1)
      setIsFlipped(false)
    } else {
      setGameMode('menu')
      setCurrentCard(0)
    }
  }

  const previousCard = () => {
    if (currentCard > 0) {
      setCurrentCard(currentCard - 1)
      setIsFlipped(false)
    }
  }

  const handleCardClick = (card) => {
    if (matchedCards.includes(card.id) || selectedCards.length >= 2) return
    
    const newSelected = [...selectedCards, card]
    setSelectedCards(newSelected)
    
    if (newSelected.length === 2) {
      if (newSelected[0].pairId === newSelected[1].pairId) {
        // Match found!
        setMatchedCards([...matchedCards, newSelected[0].id, newSelected[1].id])
        setScore(score + 1)
        onProgress(3)
        setTimeout(() => setSelectedCards([]), 500)
      } else {
        // No match
        setTimeout(() => setSelectedCards([]), 1000)
      }
    }
  }

  const backToMenu = () => {
    setGameMode('menu')
    setCurrentCategory(null)
  }

  if (gameMode === 'menu') {
    return (
      <div className="vocabulary-games view-container">
        <button className="btn btn-outline back-button" onClick={onBack}>
          ← {t('backToDashboard')}
        </button>

        <div className="section-header">
          <h2 className="section-title">🎮 {t('vocabularyGames')}</h2>
        </div>

        <div className="categories-grid">
          {categories.map((category) => (
            <div
              key={category.id}
              className="category-card card"
              style={{ borderColor: category.color }}
            >
              <div className="category-icon" style={{ color: category.color }}>
                {category.icon}
              </div>
              <h3>{category.title}</h3>
              <p>{category.count} {t('words')}</p>
              
              <div className="game-buttons">
                <button
                  className="btn btn-primary"
                  style={{ background: category.color }}
                  onClick={() => startFlashcards(category.id)}
                >
                  📇 {t('flashcards')}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => startMatching(category.id)}
                >
                  🎯 {t('matchingGame')}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="vocab-tips card">
          <h3>💡 {t('studyTips')}</h3>
          <ul>
            <li><strong>{t('flashcards')}:</strong> {t('studyTip1')}</li>
            <li><strong>{t('matchingGame')}:</strong> {t('studyTip2')}</li>
            <li><strong>{language === 'es' ? 'Repetición' : 'Repetition'}:</strong> {t('studyTip3')}</li>
            <li><strong>{language === 'es' ? 'Contexto' : 'Context'}:</strong> {t('studyTip4')}</li>
          </ul>
        </div>
      </div>
    )
  }

  if (gameMode === 'flashcards') {
    const words = vocabularyData[currentCategory]
    const currentWord = words[currentCard]
    const categoryInfo = categories.find(c => c.id === currentCategory)
    const progress = ((currentCard + 1) / words.length) * 100

    return (
      <div className="vocabulary-games view-container">
        <button className="btn btn-outline back-button" onClick={backToMenu}>
          ← {t('backToCategories')}
        </button>

        <div className="section-header">
          <h2 className="section-title">{categoryInfo.icon} {categoryInfo.title} - {t('flashcards')}</h2>
          <div className="score-display">
            <span className="score-label">{language === 'es' ? 'Tarjeta' : 'Card'}:</span>
            <span className="score-value">{currentCard + 1}/{words.length}</span>
          </div>
        </div>

        <div className="progress-bar mb-xl">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>

        <div className="flashcard-container">
          <div className={`flashcard ${isFlipped ? 'flipped' : ''}`} onClick={flipCard}>
            <div className="flashcard-front">
              <div className="flashcard-emoji">{currentWord.emoji}</div>
              <div className="flashcard-text">{currentWord.english}</div>
              {currentWord.type && (
                <div className="flashcard-badge badge badge-info">
                  {currentWord.type}
                </div>
              )}
              <div className="flashcard-hint">{t('clickToFlip')}</div>
            </div>
            <div className="flashcard-back">
              <div className="flashcard-emoji">{currentWord.emoji}</div>
              <div className="flashcard-text">{currentWord.spanish}</div>
              <div className="flashcard-original">{currentWord.english}</div>
            </div>
          </div>
        </div>

        <div className="flashcard-controls">
          <button
            className="btn btn-outline"
            onClick={previousCard}
            disabled={currentCard === 0}
          >
            ← {t('previous')}
          </button>
          <button className="btn btn-accent" onClick={flipCard}>
            🔄 {t('flipCard')}
          </button>
          <button
            className="btn btn-primary"
            onClick={nextCard}
          >
            {currentCard < words.length - 1 ? `${t('next')} →` : `${t('finish')} ✓`}
          </button>
        </div>
      </div>
    )
  }

  if (gameMode === 'matching') {
    const categoryInfo = categories.find(c => c.id === currentCategory)
    const isComplete = matchedCards.length === matchingPairs.length

    return (
      <div className="vocabulary-games view-container">
        <button className="btn btn-outline back-button" onClick={backToMenu}>
          ← {t('backToCategories')}
        </button>

        <div className="section-header">
          <h2 className="section-title">{categoryInfo.icon} {categoryInfo.title} - {t('matchingGame')}</h2>
          <div className="score-display">
            <span className="score-label">{t('matches')}:</span>
            <span className="score-value">{score}/6</span>
          </div>
        </div>

        {isComplete ? (
          <div className="completion-message card">
            <div className="completion-icon">🎉</div>
            <h3>{t('congratulations')}</h3>
            <p>{t('matchedAll')}</p>
            <button className="btn btn-primary" onClick={backToMenu}>
              {t('playAgain')}
            </button>
          </div>
        ) : (
          <div className="matching-grid">
            {matchingPairs.map((card) => (
              <button
                key={card.id}
                className={`matching-card ${
                  selectedCards.find(c => c.id === card.id) ? 'selected' : ''
                } ${matchedCards.includes(card.id) ? 'matched' : ''}`}
                onClick={() => handleCardClick(card)}
                disabled={matchedCards.includes(card.id)}
              >
                <span className={card.type === 'english' ? 'english-text' : 'spanish-text'}>
                  {card.text}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return null
}

export default VocabularyGames
