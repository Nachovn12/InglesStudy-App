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
    // SIMPLE PAST (Guaranteed Topic)
    { id: 1, text: "I went to Santiago last weekend", words: ["I", "went", "to", "Santiago", "last", "weekend"], hint: "Past Action", translation: "Fui a Santiago el fin de semana pasado", rule: "Subject + Verb (Past) + Time Expression" },
    { id: 2, text: "Did you go to the party?", words: ["Did", "you", "go", "to", "the", "party?"], hint: "Question / Past", translation: "¿Fuiste a la fiesta?", rule: "Did + Subject + Verb (Base Form)...?" },
    { id: 3, text: "She didn't watch the movie", words: ["She", "didn't", "watch", "the", "movie"], hint: "Negative / Past", translation: "Ella no vio la película", rule: "Subject + didn't + Verb (Base Form)" },
    { id: 4, text: "We visited Fantasilandia yesterday", words: ["We", "visited", "Fantasilandia", "yesterday"], hint: "Past Activity", translation: "Visitamos Fantasilandia ayer", rule: "Subject + Verb-ed + Time Expression" },
    { id: 5, text: "I ate empanadas for lunch", words: ["I", "ate", "empanadas", "for", "lunch"], hint: "Irregular Verb / Past", translation: "Comí empanadas en el almuerzo", rule: "Subject + Verb (Irregular Past - Eat/Ate)" },
    { id: 6, text: "They had a great time", words: ["They", "had", "a", "great", "time"], hint: "Past Experience", translation: "Ellos la pasaron genial", rule: "Subject + had (Have/Had)" },
    { id: 7, text: "What did you do yesterday?", words: ["What", "did", "you", "do", "yesterday?"], hint: "Question / Past", translation: "¿Qué hiciste ayer?", rule: "What + did + Subject + do...?" },
    { id: 8, text: "I bought some clothes at the mall", words: ["I", "bought", "some", "clothes", "at", "the", "mall"], hint: "Past Shopping", translation: "Compré algo de ropa en el mall", rule: "Subject + bought (Buy/Bought)" },

    // COMPARATIVES (Guaranteed Topic)
    { id: 9, text: "Santiago is bigger than Valparaíso", words: ["Santiago", "is", "bigger", "than", "Valparaíso"], hint: "Comparative / Cities", translation: "Santiago es más grande que Valparaíso", rule: "Subject + is + Adjective-er + than" },
    { id: 10, text: "Linux is faster than Windows", words: ["Linux", "is", "faster", "than", "Windows"], hint: "Comparative / Technology", translation: "Linux es más rápido que Windows", rule: "Subject + is + Adjective-er + than" },
    { id: 11, text: "Python is easier than JavaScript", words: ["Python", "is", "easier", "than", "JavaScript"], hint: "Comparative / Programming", translation: "Python es más fácil que JavaScript", rule: "Subject + is + Adjective-er + than" },
    { id: 12, text: "Valparaíso is more colorful than Santiago", words: ["Valparaíso", "is", "more", "colorful", "than", "Santiago"], hint: "Comparative / Long Adjective", translation: "Valparaíso es más colorido que Santiago", rule: "Subject + is + more + Adjective + than" },
    { id: 13, text: "Windows is more popular than Linux", words: ["Windows", "is", "more", "popular", "than", "Linux"], hint: "Comparative / Popularity", translation: "Windows es más popular que Linux", rule: "Subject + is + more + Adjective + than" },
    { id: 14, text: "The beach is better than the mountains", words: ["The", "beach", "is", "better", "than", "the", "mountains"], hint: "Irregular Comparative", translation: "La playa es mejor que las montañas", rule: "Subject + is + better + than (Good/Better)" },
    { id: 15, text: "This phone is worse than my old one", words: ["This", "phone", "is", "worse", "than", "my", "old", "one"], hint: "Irregular Comparative", translation: "Este teléfono es peor que mi viejo", rule: "Subject + is + worse + than (Bad/Worse)" },

    // THERE IS / THERE ARE (Likely Topic)
    { id: 16, text: "There is a bed in my room", words: ["There", "is", "a", "bed", "in", "my", "room"], hint: "Singular / Location", translation: "Hay una cama en mi habitación", rule: "There is + Singular Noun" },
    { id: 17, text: "There are two windows in the kitchen", words: ["There", "are", "two", "windows", "in", "the", "kitchen"], hint: "Plural / Location", translation: "Hay dos ventanas en la cocina", rule: "There are + Plural Noun" },
    { id: 18, text: "There is a computer on the desk", words: ["There", "is", "a", "computer", "on", "the", "desk"], hint: "Singular / Object", translation: "Hay un computador en el escritorio", rule: "There is + Singular Noun + Preposition" },
    { id: 19, text: "There are many books on the shelf", words: ["There", "are", "many", "books", "on", "the", "shelf"], hint: "Plural / Quantity", translation: "Hay muchos libros en el estante", rule: "There are + many + Plural Noun" },
    { id: 20, text: "Is there a closet in your room?", words: ["Is", "there", "a", "closet", "in", "your", "room?"], hint: "Question / Singular", translation: "¿Hay un clóset en tu habitación?", rule: "Is there + Singular Noun...?" },

    // COUNTABLE / UNCOUNTABLE (Likely Topic)
    { id: 21, text: "I drink a lot of coffee", words: ["I", "drink", "a", "lot", "of", "coffee"], hint: "Uncountable / Quantity", translation: "Bebo mucho café", rule: "a lot of + Uncountable Noun" },
    { id: 22, text: "I eat a few eggs for breakfast", words: ["I", "eat", "a", "few", "eggs", "for", "breakfast"], hint: "Countable / Small Quantity", translation: "Como algunos huevos en el desayuno", rule: "a few + Countable Plural" },
    { id: 23, text: "She drinks a little orange juice", words: ["She", "drinks", "a", "little", "orange", "juice"], hint: "Uncountable / Small Quantity", translation: "Ella bebe un poco de jugo de naranja", rule: "a little + Uncountable Noun" },
    { id: 24, text: "There is some milk in the fridge", words: ["There", "is", "some", "milk", "in", "the", "fridge"], hint: "Uncountable / Existence", translation: "Hay algo de leche en el refrigerador", rule: "some + Uncountable Noun" },
    { id: 25, text: "I don't drink much soda", words: ["I", "don't", "drink", "much", "soda"], hint: "Negative / Uncountable", translation: "No bebo mucha bebida", rule: "much + Uncountable Noun (Negative)" },
    { id: 26, text: "How much water do you drink?", words: ["How", "much", "water", "do", "you", "drink?"], hint: "Question / Uncountable", translation: "¿Cuánta agua bebes?", rule: "How much + Uncountable Noun...?" },
    { id: 27, text: "How many glasses do you have?", words: ["How", "many", "glasses", "do", "you", "have?"], hint: "Question / Countable", translation: "¿Cuántos vasos tienes?", rule: "How many + Countable Plural...?" },

    // FUTURE (Going to)
    { id: 28, text: "I am going to study English", words: ["I", "am", "going", "to", "study", "English"], hint: "Future Plan", translation: "Voy a estudiar inglés", rule: "Subject + am/is/are + going to + verb" },
    { id: 29, text: "Are you going to travel next month?", words: ["Are", "you", "going", "to", "travel", "next", "month?"], hint: "Question / Future", translation: "¿Vas a viajar el próximo mes?", rule: "Am/Is/Are + Subject + going to...?" },
    { id: 30, text: "She is not going to buy a car", words: ["She", "is", "not", "going", "to", "buy", "a", "car"], hint: "Negative / Future", translation: "Ella no va a comprar un auto", rule: "Subject + is not + going to + verb" },

    // PRESENT PERFECT
    { id: 31, text: "I have visited La Serena twice", words: ["I", "have", "visited", "La", "Serena", "twice"], hint: "Experience / Frequency", translation: "He visitado La Serena dos veces", rule: "Subject + have + Participle + Frequency" },
    { id: 32, text: "Have you ever eaten sushi?", words: ["Have", "you", "ever", "eaten", "sushi?"], hint: "Question / Experience", translation: "¿Alguna vez has comido sushi?", rule: "Have + Subject + ever + Participle...?" },
    { id: 33, text: "She has never been to Paris", words: ["She", "has", "never", "been", "to", "Paris"], hint: "Negative / Experience", translation: "Ella nunca ha estado en París", rule: "Subject + has + never + Participle" }
  ]

  const vocabularyData = {
    professions: [
        { english: 'Singer', spanish: 'Cantante', emoji: '🎤' },
        { english: 'Painter', spanish: 'Pintor/a', emoji: '🎨' },
        { english: 'Doctor', spanish: 'Doctor', emoji: '👨‍⚕️' },
        { english: 'Teacher', spanish: 'Profesor', emoji: '👨‍🏫' },
        { english: 'Engineer', spanish: 'Ingeniero', emoji: '👷' },
        { english: 'Layer', spanish: 'Abogado', emoji: '⚖️' }
    ],
    house: [
        { english: 'Kitchen', spanish: 'Cocina', emoji: '🍳' },
        { english: 'Bedroom', spanish: 'Dormitorio', emoji: '🛏️' },
        { english: 'Bathroom', spanish: 'Baño', emoji: '🚽' },
        { english: 'Living Room', spanish: 'Sala', emoji: '🛋️' },
        { english: 'Garden', spanish: 'Jardín', emoji: '🏡' },
        { english: 'Door', spanish: 'Puerta', emoji: '🚪' }
    ],
    food: [
        { english: 'Pizza', spanish: 'Pizza', emoji: '🍕' },
        { english: 'Burger', spanish: 'Hamburguesa', emoji: '🍔' },
        { english: 'Water', spanish: 'Agua', emoji: '💧' },
        { english: 'Coffee', spanish: 'Café', emoji: '☕' },
        { english: 'Apple', spanish: 'Manzana', emoji: '🍎' },
        { english: 'Bread', spanish: 'Pan', emoji: '🍞' }
    ],
    collocations: [
        { english: 'Make a mistake', spanish: 'Cometer un error', emoji: '❌' },
        { english: 'Do homework', spanish: 'Hacer tarea', emoji: '📝' },
        { english: 'Take a photo', spanish: 'Tomar una foto', emoji: '📸' },
        { english: 'Have fun', spanish: 'Divertirse', emoji: '🎉' },
        { english: 'Save money', spanish: 'Ahorrar dinero', emoji: '💰' },
        { english: 'Pay attention', spanish: 'Poner atención', emoji: '👂' }
    ],
    restaurant: [
        { english: 'Menu', spanish: 'Menú', emoji: '📋' },
        { english: 'Waiter', spanish: 'Mesero', emoji: '🤵' },
        { english: 'Bill', spanish: 'Cuenta', emoji: '🧾' },
        { english: 'Table', spanish: 'Mesa', emoji: '🍽️' },
        { english: 'Chef', spanish: 'Chef', emoji: '👨‍🍳' },
        { english: 'Order', spanish: 'Orden', emoji: '📝' }
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
    const words = (vocabularyData[categoryId] || []).slice(0, 6) // Use 6 pairs
    if (words.length === 0) return; // Prevent crash
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
    const words = vocabularyData[currentCategory] || []
    if (!words.length) return <div className="p-4 text-center">Loading words...</div>
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
