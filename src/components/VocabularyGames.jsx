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
  
  // SCRAMBLE GAME STATE
  const [scrambleSentence, setScrambleSentence] = useState(null)
  const [userOrder, setUserOrder] = useState([])
  const [scrambleFeedback, setScrambleFeedback] = useState(null) // 'success' | 'error' | null
  const [streak, setStreak] = useState(0)
  const [errorIndex, setErrorIndex] = useState(-1) // Index where the error starts

  const scrambleData = [
    // Future (Going to)
    { id: 1, text: "I am going to study English", words: ["I", "am", "going", "to", "study", "English"], hint: "Future Plan", translation: "Voy a estudiar inglés", rule: "Subject + am/is/are + going to + verb" },
    { id: 2, text: "Are you going to buy a car?", words: ["Are", "you", "going", "to", "buy", "a", "car?"], hint: "Question / Future", translation: "¿Vas a comprar un auto?", rule: "Am/Is/Are + Subject + going to + verb...?" },
    { id: 3, text: "She is not going to travel", words: ["She", "is", "not", "going", "to", "travel"], hint: "Negative / Future", translation: "Ella no va a viajar", rule: "Subject + is not + going to + verb" },
    { id: 10, text: "It is going to rain tomorrow", words: ["It", "is", "going", "to", "rain", "tomorrow"], hint: "Prediction / Future", translation: "Va a llover mañana", rule: "Prediction based on evidence" },
    { id: 11, text: "They are going to play soccer", words: ["They", "are", "going", "to", "play", "soccer"], hint: "Future Plan", translation: "Ellos van a jugar fútbol", rule: "Plural Subject + are + going to" },
    
    // Past Simple
    { id: 4, text: "Did you go to the party?", words: ["Did", "you", "go", "to", "the", "party?"], hint: "Question / Past", translation: "¿Fuiste a la fiesta?", rule: "Did + Subject + Verb (Base Form)...?" },
    { id: 5, text: "I bought a new phone", words: ["I", "bought", "a", "new", "phone"], hint: "Irregular Verb / Past", translation: "Compré un teléfono nuevo", rule: "Subject + Verb (Past Form - Buy/Bought)" },
    { id: 6, text: "We didn't see the movie", words: ["We", "didn't", "see", "the", "movie"], hint: "Negative / Past", translation: "No vimos la película", rule: "Subject + didn't + Verb (Base Form)" },
    { id: 12, text: "She wrote a letter yesterday", words: ["She", "wrote", "a", "letter", "yesterday"], hint: "Past Action", translation: "Ella escribió una carta ayer", rule: "Subject + Verb (Past Form - Write/Wrote)" },
    { id: 13, text: "He didn't like the food", words: ["He", "didn't", "like", "the", "food"], hint: "Negative / Past", translation: "No le gustó la comida", rule: "Subject + didn't + Verb (Base Form)" },
    
    // Present Perfect
    { id: 7, text: "Have you ever been to Paris?", words: ["Have", "you", "ever", "been", "to", "Paris?"], hint: "Question / Experience", translation: "¿Alguna vez has estado en París?", rule: "Have + Subject + ever + Participle...?" },
    { id: 8, text: "I have never eaten sushi", words: ["I", "have", "never", "eaten", "sushi"], hint: "Negative / Experience", translation: "Nunca he comido sushi", rule: "Subject + have + never + Participle" },
    { id: 9, text: "She has finished her homework", words: ["She", "has", "finished", "her", "homework"], hint: "Action Completed", translation: "Ella ha terminado su tarea", rule: "Subject + has + Participle" },
    { id: 14, text: "I have lost my keys", words: ["I", "have", "lost", "my", "keys"], hint: "Recent Event", translation: "He perdido mis llaves", rule: "Subject + have + Participle (Lose/Lost)" },
    { id: 15, text: "We have lived here for two years", words: ["We", "have", "lived", "here", "for", "two", "years"], hint: "Duration", translation: "Hemos vivido aquí por dos años", rule: "Subject + have + Participle + for..." }
  ]

  const vocabularyData = {
    // ... (vocabulary data remains unchanged)
    professions: [
      { english: 'Singer', spanish: 'Cantante', emoji: '🎤' },
      { english: 'Painter', spanish: 'Pintor/a', emoji: '🎨' },
      // ...
    ]
  }

  // NOTE: vocabularyData continues... skipping to save space...

  // SCRAMBLE LOGIC
  const startScrambleGame = () => {
    setGameMode('scramble')
    setStreak(0) // Reset streak on new game
    nextScrambleRound()
  }

  const categories = [
    { id: 'professions', title: 'Professions', icon: '👔', color: '#6366f1', count: 15 },
    { id: 'house', title: 'House & Furniture', icon: '🏠', color: '#ec4899', count: 15 },
    { id: 'food', title: 'Food & Drinks', icon: '🍕', color: '#14b8a6', count: 15 },
    { id: 'collocations', title: 'Collocations', icon: '🔗', color: '#f59e0b', count: 10 },
    { id: 'restaurant', title: 'Restaurant', icon: '🍽️', color: '#ef4444', count: 12 }
  ]

  const nextScrambleRound = () => {
    // Pick random sentence
    const randomIdx = Math.floor(Math.random() * scrambleData.length)
    const sentence = scrambleData[randomIdx]
    
    // Shuffle words securely
    const shuffled = [...sentence.words].sort(() => Math.random() - 0.5)
    
    setScrambleSentence({ ...sentence, shuffledWords: shuffled })
    setUserOrder([])
    setScrambleFeedback(null)
    setErrorIndex(-1) // Reset error
  }

  const handleWordClick = (word, fromPool) => {
    if (scrambleFeedback === 'success') return // Lock if won

    setScrambleFeedback(null) // Clear error state on interaction
    setErrorIndex(-1)

    if (fromPool) {
      const newPool = [...scrambleSentence.shuffledWords]
      const idx = newPool.indexOf(word)
      if (idx > -1) {
        newPool.splice(idx, 1)
        setScrambleSentence({ ...scrambleSentence, shuffledWords: newPool })
        setUserOrder([...userOrder, word])
      }
    } else {
      const newOrder = [...userOrder]
      const idx = newOrder.indexOf(word)
      if (idx > -1) {
        newOrder.splice(idx, 1)
        setUserOrder(newOrder)
        setScrambleSentence({ 
          ...scrambleSentence, 
          shuffledWords: [...scrambleSentence.shuffledWords, word] 
        })
      }
    }
  }

  const checkScrambleAnswer = () => {
    const userText = userOrder.join(' ')
    const correctWords = scrambleSentence.text.split(' ')
    
    // Check word by word to find where it starts being wrong
    let firstStructureError = -1
    for (let i = 0; i < userOrder.length; i++) {
        if (userOrder[i] !== correctWords[i]) {
            firstStructureError = i
            break
        }
    }

    if (userText === scrambleSentence.text) {
      setScrambleFeedback('success')
      setStreak(s => s + 1) // 🔥 Increase Streak
      
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.m4a')
      audio.play().catch(() => {})
    } else {
      setScrambleFeedback('error')
      setErrorIndex(firstStructureError) // Mark where the error starts
      setStreak(0) // 😢 Reset Streak
      // setTimeout(() => setScrambleFeedback(null), 1000)
    }
  }

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

        {/* NEW FEATURED GAME CARD */}
        <div className="featured-game-section" style={{ marginBottom: '2rem' }}>
          <div 
            className="card card-interactive" 
            style={{ 
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', 
              color: 'white',
              border: 'none',
              textAlign: 'center',
              padding: '2rem'
            }}
            onClick={startScrambleGame}
          >
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
            <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Ordena la Frase</h2>
            <p style={{ fontSize: '1.1rem', opacity: 0.9 }}>
              {language === 'es' ? 'Practica la estructura de oraciones (Past, Future & Perfect)' : 'Practice sentence structure (Past, Future & Perfect)'}
            </p>
            <button className="btn" style={{ marginTop: '1.5rem', background: 'white', color: '#6366f1', fontWeight: 'bold' }}>
               ▶ {language === 'es' ? 'JUGAR AHORA' : 'PLAY NOW'}
            </button>
          </div>
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
            <div className="games-grid">
              <div className="game-card" onClick={() => setGameMode('menu')}>
                <div className="game-icon">🎴</div>
                <h3>{t('flashcards')}</h3>
                <p>Practice vocabulary with interactive cards</p>
              </div>
              
              <div className="game-card" onClick={() => startMatching(currentCategory)}>
                <div className="game-icon">🧩</div>
                <h3>{t('matchingGame')}</h3>
                <p>Match concepts against the clock</p>
              </div>
              
              <div className="game-card" onClick={startScrambleGame}>
                <div className="game-icon">📝</div>
                <h3>Ordena la Frase</h3>
                <p>Sentence Scramble (Past, Future, Perfect)</p>
              </div>
            </div>
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

  if (gameMode === 'scramble') {
    return (
      <div className="vocabulary-games view-container">
        <button className="btn btn-outline back-button" onClick={() => setGameMode('menu')}>
          ← {language === 'es' ? 'Volver al Menú' : 'Back to Menu'}
        </button>

        <div className="section-header">
          <h2 className="section-title">📝 Ordena la Frase</h2>
          
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            {/* STREAK BADGE */}
            {streak > 0 && (
              <div className="streak-badge" style={{ 
                background: '#ffeb3b', 
                color: '#d50000', 
                padding: '5px 15px', 
                borderRadius: '20px', 
                fontWeight: 'bold',
                boxShadow: '0 4px 10px rgba(255, 193, 7, 0.4)',
                animation: 'popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
              }}>
                🔥 {language === 'es' ? 'Racha' : 'Streak'}: {streak}
              </div>
            )}
            
            <div className="score-display">
              <span className="score-label">{language === 'es' ? 'Pista' : 'Hint'}:</span>
              <span className="score-value" style={{fontSize: '0.9rem'}}>{scrambleSentence.hint}</span>
            </div>
          </div>
        </div>

        <div className="scramble-game-board card">
          {/* ANSWER AREA */}
          <div className={`scramble-answer-area ${scrambleFeedback}`}>
            {userOrder.length === 0 ? (
              <span className="placeholder-text">
                {language === 'es' ? 'Toca las palabras para ordenar la frase...' : 'Tap words to build the sentence...'}
              </span>
            ) : (
              userOrder.map((word, idx) => {
                // Determine styling based on error state
                let chipStyle = {};
                if (scrambleFeedback === 'error' && errorIndex !== -1) {
                    if (idx < errorIndex) {
                        chipStyle = { background: '#10b981', borderColor: '#10b981' }; // Green for correct part
                    } else if (idx === errorIndex) {
                        chipStyle = { background: '#ef4444', borderColor: '#ef4444' }; // Red for the first error
                    }
                }

                return (
                    <button 
                      key={`user-${idx}`} 
                      className={`word-chip word-chip-selected`}
                      style={chipStyle}
                      onClick={() => handleWordClick(word, false)}
                    >
                      {word}
                    </button>
                )
              })
            )}
            
            <div className="answer-status-icon">
              {scrambleFeedback === 'success' && '✅'}
              {scrambleFeedback === 'error' && '❌'}
            </div>
          </div>

          {/* WORD POOL */}
          <div className="scramble-word-pool">
            {scrambleSentence.shuffledWords.map((word, idx) => (
              <button 
                key={`pool-${idx}`} 
                className="word-chip" 
                onClick={() => handleWordClick(word, true)}
              >
                {word}
              </button>
            ))}
          </div>

          {/* CONTROLS */}
          <div className="scramble-controls">
            {scrambleFeedback === 'success' ? (
              <div className="success-message-box">
                <p style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>
                    🎉 {language === 'es' ? '¡Correcto!' : 'Correct!'}
                </p>
                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '10px', marginBottom: '15px' }}>
                    <p style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 'bold' }}>
                        "{scrambleSentence.translation}"
                    </p>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '5px' }}>
                        ℹ️ Rule: {scrambleSentence.rule}
                    </p>
                </div>

                <button className="btn btn-primary btn-lg" onClick={nextScrambleRound}>
                  {language === 'es' ? 'Siguiente Frase →' : 'Next Sentence →'}
                </button>
              </div>
            ) : (
              <button 
                className="btn btn-success btn-lg" 
                onClick={checkScrambleAnswer}
                disabled={userOrder.length === 0}
              >
                {language === 'es' ? 'Comprobar' : 'Check Answer'}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default VocabularyGames
