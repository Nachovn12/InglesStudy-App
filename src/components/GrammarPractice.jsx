import { useState, useContext } from 'react'
import { LanguageContext } from '../App'
import { getTranslation } from '../translations'
import './GrammarPractice.css'

function GrammarPractice({ onProgress, onBack }) {
  const { language } = useContext(LanguageContext)
  const t = (key) => getTranslation(language, key)
  
  const [currentTopic, setCurrentTopic] = useState('menu')
  const [score, setScore] = useState(0)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [showFeedback, setShowFeedback] = useState(false)

  const topics = [
    { id: 'simple-past', title: 'Simple Past', icon: '⏰', color: '#6366f1' },
    { id: 'comparatives', title: 'Comparatives', icon: '⚖️', color: '#ec4899' },
    { id: 'quantifiers', title: 'Quantifiers', icon: '🔢', color: '#14b8a6' },
    { id: 'there-was-were', title: 'There Was/Were', icon: '📍', color: '#f59e0b' }
  ]

  const exercises = {
    'simple-past': [
      {
        question: "I ___ to the cinema last night.",
        options: ["go", "went", "goes", "going"],
        correct: 1,
        explanation: "Use 'went' (past simple of 'go') for completed actions in the past."
      },
      {
        question: "She ___ her homework yesterday.",
        options: ["finish", "finished", "finishes", "finishing"],
        correct: 1,
        explanation: "Regular verbs add -ed in past simple: finish → finished"
      },
      {
        question: "They ___ pizza for dinner last Friday.",
        options: ["eat", "eats", "ate", "eating"],
        correct: 2,
        explanation: "Irregular verb: eat → ate (past simple)"
      },
      {
        question: "We ___ at home last weekend.",
        options: ["was", "were", "are", "be"],
        correct: 1,
        explanation: "Use 'were' with 'we' (plural subject) in past simple"
      },
      {
        question: "He ___ a new car in 2020.",
        options: ["buy", "buys", "bought", "buying"],
        correct: 2,
        explanation: "Irregular verb: buy → bought (past simple)"
      },
      {
        question: "I ___ my keys yesterday morning.",
        options: ["lose", "losed", "lost", "losing"],
        correct: 2,
        explanation: "Irregular verb: lose → lost (NOT losed!)"
      },
      {
        question: "She ___ happy at the party.",
        options: ["was", "were", "is", "be"],
        correct: 0,
        explanation: "Use 'was' with 'she' (singular subject) in past simple"
      },
      {
        question: "They ___ English last semester.",
        options: ["study", "studied", "studyed", "studies"],
        correct: 1,
        explanation: "Verbs ending in consonant + y: change y to i and add -ed (study → studied)"
      },
      {
        question: "We ___ our friends at the mall.",
        options: ["meet", "met", "meeted", "meeting"],
        correct: 1,
        explanation: "Irregular verb: meet → met (NOT meeted!)"
      },
      {
        question: "He ___ coffee this morning.",
        options: ["drink", "drank", "drunk", "drinked"],
        correct: 1,
        explanation: "Irregular verb: drink → drank (past simple)"
      }
    ],
    'comparatives': [
      {
        question: "GTA VI is ___ than GTA V.",
        options: ["expensive", "more expensive", "expensiver", "most expensive"],
        correct: 1,
        explanation: "Long adjectives (2+ syllables) use 'more + adjective + than'"
      },
      {
        question: "Old Reggaeton is ___ than new Reggaeton.",
        options: ["good", "gooder", "better", "more good"],
        correct: 2,
        explanation: "Irregular comparative: good → better"
      },
      {
        question: "My sister is ___ than me.",
        options: ["tall", "taller", "more tall", "tallest"],
        correct: 1,
        explanation: "Short adjectives (1 syllable) add -er + than"
      },
      {
        question: "This test is ___ than the last one.",
        options: ["easy", "easier", "more easy", "easyer"],
        correct: 1,
        explanation: "Adjectives ending in -y: change y to i and add -er (easy → easier)"
      },
      {
        question: "Santiago is ___ than Valparaíso.",
        options: ["big", "biger", "bigger", "more big"],
        correct: 2,
        explanation: "Short adjectives ending in consonant-vowel-consonant: double the final consonant (big → bigger)"
      },
      {
        question: "The completo is ___ than sushi.",
        options: ["good", "better", "gooder", "more good"],
        correct: 1,
        explanation: "Irregular comparative: good → better"
      },
      {
        question: "Learning English is ___ than I thought.",
        options: ["difficult", "difficulter", "more difficult", "most difficult"],
        correct: 2,
        explanation: "Long adjectives use 'more + adjective + than'"
      },
      {
        question: "Today's weather is ___ than yesterday.",
        options: ["bad", "badder", "worse", "more bad"],
        correct: 2,
        explanation: "Irregular comparative: bad → worse"
      },
      {
        question: "My new phone is ___ than my old one.",
        options: ["fast", "faster", "more fast", "fastest"],
        correct: 1,
        explanation: "Short adjectives add -er + than"
      },
      {
        question: "This movie is ___ than the book.",
        options: ["interesting", "interestinger", "more interesting", "most interesting"],
        correct: 2,
        explanation: "Long adjectives use 'more + adjective + than'"
      }
    ],
    'quantifiers': [
      {
        question: "How ___ coffee do you drink?",
        options: ["many", "much", "few", "little"],
        correct: 1,
        explanation: "Use 'much' with uncountable nouns (coffee, water, sugar)"
      },
      {
        question: "I don't have ___ friends in this city.",
        options: ["much", "many", "a lot", "some"],
        correct: 1,
        explanation: "Use 'many' with countable nouns (friends, books, cars)"
      },
      {
        question: "There is ___ sugar in my coffee.",
        options: ["many", "a few", "a little", "few"],
        correct: 2,
        explanation: "Use 'a little' with uncountable nouns for small quantities"
      },
      {
        question: "We have ___ time before the exam.",
        options: ["many", "much", "a few", "few"],
        correct: 1,
        explanation: "Use 'much' with uncountable nouns (time, money, water)"
      },
      {
        question: "How ___ students are in your class?",
        options: ["much", "many", "little", "a little"],
        correct: 1,
        explanation: "Use 'many' with countable nouns (students, people, cars)"
      },
      {
        question: "I have ___ apples in my bag.",
        options: ["much", "a little", "a few", "little"],
        correct: 2,
        explanation: "Use 'a few' with countable nouns for small quantities"
      },
      {
        question: "There isn't ___ milk in the fridge.",
        options: ["many", "much", "a few", "few"],
        correct: 1,
        explanation: "Use 'much' with uncountable nouns in negative sentences"
      },
      {
        question: "Do you eat ___ of sugar?",
        options: ["many", "much", "a lot", "few"],
        correct: 2,
        explanation: "Use 'a lot of' with both countable and uncountable nouns"
      },
      {
        question: "I need ___ information about the exam.",
        options: ["many", "some", "a few", "few"],
        correct: 1,
        explanation: "Use 'some' with uncountable nouns (information, advice, help)"
      },
      {
        question: "How ___ money do you have?",
        options: ["many", "much", "few", "a few"],
        correct: 1,
        explanation: "Use 'much' with uncountable nouns (money, time, water)"
      }
    ],
    'there-was-were': [
      {
        question: "There ___ a good movie on TV last night.",
        options: ["was", "were", "is", "are"],
        correct: 0,
        explanation: "Use 'was' with singular nouns (a movie)"
      },
      {
        question: "There ___ many students in the classroom.",
        options: ["was", "were", "is", "are"],
        correct: 1,
        explanation: "Use 'were' with plural nouns (students)"
      },
      {
        question: "There ___ a desk in my first school.",
        options: ["was", "were", "is", "are"],
        correct: 0,
        explanation: "Use 'was' with singular nouns in the past"
      },
      {
        question: "___ there a library in your school?",
        options: ["Was", "Were", "Is", "Are"],
        correct: 0,
        explanation: "Questions: Was/Were + there + noun?"
      },
      {
        question: "There ___ three bedrooms in my old house.",
        options: ["was", "were", "is", "are"],
        correct: 1,
        explanation: "Use 'were' with plural nouns (bedrooms)"
      },
      {
        question: "There ___ a big garden behind the house.",
        options: ["was", "were", "is", "are"],
        correct: 0,
        explanation: "Use 'was' with singular nouns (garden)"
      },
      {
        question: "There ___ any ghosts in the picture.",
        options: ["wasn't", "weren't", "isn't", "aren't"],
        correct: 1,
        explanation: "Use 'weren't' with plural nouns in negative (ghosts)"
      },
      {
        question: "There ___ a lot of people at the party.",
        options: ["was", "were", "is", "are"],
        correct: 1,
        explanation: "Use 'were' with 'a lot of people' (plural)"
      },
      {
        question: "___ there many cars in the street?",
        options: ["Was", "Were", "Is", "Are"],
        correct: 1,
        explanation: "Use 'Were' in questions with plural nouns (cars)"
      },
      {
        question: "There ___ a problem with my computer yesterday.",
        options: ["was", "were", "is", "are"],
        correct: 0,
        explanation: "Use 'was' with singular nouns (problem)"
      }
    ]
  }

  const handleAnswer = (index) => {
    setSelectedAnswer(index)
    setShowFeedback(true)
    
    const currentExercises = exercises[currentTopic]
    if (index === currentExercises[currentQuestion].correct) {
      setScore(score + 1)
      onProgress(2)
    }
  }

  const nextQuestion = () => {
    const currentExercises = exercises[currentTopic]
    if (currentQuestion < currentExercises.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setSelectedAnswer(null)
      setShowFeedback(false)
    } else {
      // Finished topic
      setCurrentTopic('menu')
      setCurrentQuestion(0)
      setSelectedAnswer(null)
      setShowFeedback(false)
    }
  }

  const startTopic = (topicId) => {
    setCurrentTopic(topicId)
    setScore(0)
    setCurrentQuestion(0)
    setSelectedAnswer(null)
    setShowFeedback(false)
  }

  const backToMenu = () => {
    setCurrentTopic('menu')
    setCurrentQuestion(0)
    setSelectedAnswer(null)
    setShowFeedback(false)
  }

  if (currentTopic === 'menu') {
    return (
      <div className="grammar-practice view-container">
        <button className="btn btn-outline back-button" onClick={onBack}>
          ← {t('backToDashboard')}
        </button>

        <div className="section-header">
          <h2 className="section-title">📚 {t('grammarPractice')}</h2>
        </div>

        <div className="topics-grid">
          {topics.map((topic) => (
            <div
              key={topic.id}
              className="topic-card card card-interactive"
              onClick={() => startTopic(topic.id)}
              style={{ borderColor: topic.color }}
            >
              <div className="topic-icon" style={{ color: topic.color }}>
                {topic.icon}
              </div>
              <h3>{topic.title}</h3>
              <p>{exercises[topic.id].length} {t('exercises')}</p>
              <button
                className="btn btn-primary"
                style={{ background: topic.color }}
              >
                {t('startPractice')}
              </button>
            </div>
          ))}
        </div>

        <div className="grammar-tips card">
          <h3>💡 {t('grammarTips')}</h3>
          <div className="tips-grid">
            <div className="tip-item">
              <strong>{language === 'es' ? 'Pasado Simple Regular:' : 'Simple Past Regular:'}</strong> {t('simplePastRegular')}
            </div>
            <div className="tip-item">
              <strong>{language === 'es' ? 'Pasado Simple Irregular:' : 'Simple Past Irregular:'}</strong> {t('simplePastIrregular')}
            </div>
            <div className="tip-item">
              <strong>{language === 'es' ? 'Comparativos Cortos:' : 'Comparatives Short:'}</strong> {t('comparativesShort')}
            </div>
            <div className="tip-item">
              <strong>{language === 'es' ? 'Comparativos Largos:' : 'Comparatives Long:'}</strong> {t('comparativesLong')}
            </div>
            <div className="tip-item">
              <strong>{language === 'es' ? 'Contables:' : 'Countable:'}</strong> {t('countable')}
            </div>
            <div className="tip-item">
              <strong>{language === 'es' ? 'Incontables:' : 'Uncountable:'}</strong> {t('uncountable')}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const currentExercises = exercises[currentTopic]
  const currentEx = currentExercises[currentQuestion]
  const progress = ((currentQuestion + 1) / currentExercises.length) * 100
  const topicInfo = topics.find(t => t.id === currentTopic)

  return (
    <div className="grammar-practice view-container">
      <button className="btn btn-outline back-button" onClick={backToMenu}>
        ← {t('backToTopics')}
      </button>

      <div className="section-header">
        <h2 className="section-title">{topicInfo.icon} {topicInfo.title}</h2>
        <div className="score-display">
          <span className="score-label">{t('score')}:</span>
          <span className="score-value">{score}/{currentExercises.length}</span>
        </div>
      </div>

      <div className="progress-info">
        <span>{t('question')} {currentQuestion + 1} {t('of')} {currentExercises.length}</span>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="question-card card">
        <h3 className="question-text">{currentEx.question}</h3>
        
        <div className="options-grid">
          {currentEx.options.map((option, index) => (
            <button
              key={index}
              className={`option-button ${
                selectedAnswer === index
                  ? index === currentEx.correct
                    ? 'correct'
                    : 'incorrect'
                  : ''
              } ${showFeedback && index === currentEx.correct ? 'correct' : ''}`}
              onClick={() => !showFeedback && handleAnswer(index)}
              disabled={showFeedback}
            >
              {option}
            </button>
          ))}
        </div>

        {showFeedback && (
          <div className={`feedback ${selectedAnswer === currentEx.correct ? 'feedback-correct' : 'feedback-incorrect'}`}>
            <div className="feedback-icon">
              {selectedAnswer === currentEx.correct ? '✅' : '❌'}
            </div>
            <div className="feedback-content">
              <strong>
                {selectedAnswer === currentEx.correct ? t('correct') : t('incorrect')}
              </strong>
              <p>{currentEx.explanation}</p>
            </div>
          </div>
        )}

        {showFeedback && (
          <button className="btn btn-primary next-button" onClick={nextQuestion}>
            {currentQuestion < currentExercises.length - 1 ? `${t('nextQuestion')} →` : `${t('finishTopic')} ✓`}
          </button>
        )}
      </div>
    </div>
  )
}

export default GrammarPractice
