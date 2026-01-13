import { useState, useRef, useEffect } from 'react'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { Send, X, Bot, Loader2, Volume2, Trash2, Play, Square, Pause } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { playAudio } from '../services/googleTTS'
import './AIChatbot.css'

// Check for API Key
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null

const SYSTEM_PROMPT = `
You are "EnglishPro", an elite and friendly AI English Tutor designed specifically for Spanish-speaking beginners (especially from Chile).
Your goal is to help them learn English with confidence, using clear explanations in Spanish.

**Your Golden Rules:**
1.  **Spanish First**: Explain everything in clear Spanish first.
2.  **BOLD ENGLISH ONLY**: CRITICAL! Bold ('**text**') is a SPECIAL SIGNAL for the voice engine to switch to English Accent.
    *   ✅ CORRECT: "La palabra es **House**."
    *   ❌ WRONG: "La palabra **Casa** es **House**." (Never bold Spanish!)
    *   ❌ WRONG: "**Pronunciación:**" (Never bold headers!) -> Use *Italics* or Plain text for Spanish headings.
3.  **Strict Formatting**:
    *   English -> **Bold** (Always)
    *   Spanish Emphasis -> *Italics*
    *   Spanish Headers -> Plain Text or *Italics*
4.  **Bilingual Examples**: Always provide Spanish translation immediately after.
    *   Example: **I am happy** (Estoy feliz).
4.  **Encouraging Tone**: Be patient, warm, and motivating. Learning a new language is hard!
5.  **Local Context (Optional)**: If relevant, use examples that resonate with Chilean culture (like mentioned "tomar once" or local cities) to make it fun, but keep standard English.
6.  **Structure**:
    *   Start with a friendly greeting or direct answer in Spanish.
    *   Show the **English** phrase/concept clearly.
    *   Explain *why* it is used that way in Spanish.
    *   Ask a simple follow-up question to practice.

**Example Interaction:**
User: "¿Cómo se dice 'tengo hambre'?"
You: "¡Muy buena pregunta! Se dice:
**I am hungry** 🍔
(Literalmente: 'Yo estoy hambriento').

En inglés usamos el verbo 'to be' (ser/estar) para sensaciones, no 'tengo' (have). 
¡Intenta decir 'I am tired' (Estoy cansado)!"

Keep your responses concise, visual (use emojis), and super helpful for a beginner.
`

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { 
      role: 'model', 
      text: '¡Hola! Soy tu Tutor de Inglés personal con IA. 🤖✨ \n¿En qué te puedo ayudar hoy? \n\nPuedes preguntarme:\n* "Traduce esta frase"\n* "¿Cómo se usa el Pasado Simple?"\n* "Dame un ejemplo con..."\n\n¡Estoy aquí para que aprendas a tu ritmo! 🚀' 
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const [playingMsgIndex, setPlayingMsgIndex] = useState(null)
  const audioControllerRef = useRef(null)
  
  // Typewriter Buffer System
  const responseBufferRef = useRef('')

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Auto-scroll
  useEffect(() => {
    scrollToBottom()
  }, [messages, isOpen])

  // GLOBAL TYPEWRITER LOOP
  // This runs continuously and consumes text from the buffer if available.
  // This guarantees the animation always runs regardless of network timing.
  useEffect(() => {
    const interval = setInterval(() => {
      if (responseBufferRef.current.length > 0) {
        const chunk = responseBufferRef.current.slice(0, 2) // Speed: 2 chars per tick
        responseBufferRef.current = responseBufferRef.current.slice(2)
        
        setMessages(prev => {
          const newMsgs = [...prev]
          const lastIndex = newMsgs.length - 1
          
          if (lastIndex >= 0) {
              // CRITICAL FIX: Clone the object to avoid mutation in StrictMode (prevents "HolHola" duplication)
              const updatedMsg = { ...newMsgs[lastIndex] }
              
              if (updatedMsg.role === 'model') {
                  updatedMsg.text += chunk
                  newMsgs[lastIndex] = updatedMsg
              }
          }
          return newMsgs
        })
      }
    }, 30) // Slower speed: 30ms for better reading experience
    
    return () => clearInterval(interval)
  }, [])

  const handleSend = async (textOverride = null) => {
    const textToSend = textOverride || input
    if (!textToSend.trim() || isLoading) return
    
    if (!genAI) {
      setMessages(prev => [...prev, { role: 'model', text: '⚠️ Setup Error: API Key missing.' }])
      return
    }

    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: textToSend }])
    setIsLoading(true)

    try {
      // Use modern Gemini 2.5 Flash (Agent Optimized - 2026 Standard)
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }) 
      
      // History filtering logic
      let visibleHistory = messages.slice(1)
      let historyForApi = visibleHistory.map(m => ({
        role: m.role === 'model' ? 'model' : 'user',
        parts: [{ text: m.text }]
      }))

       if (historyForApi.length > 0 && historyForApi[0].role !== 'user') {
         historyForApi = historyForApi.slice(1)
      }

      const chat = model.startChat({
        history: historyForApi,
        generationConfig: { maxOutputTokens: 2000, temperature: 0.7 }
      })

      const prompt = messages.length < 2 ? `${SYSTEM_PROMPT}\nUser: ${textToSend}` : textToSend
      
      // Init Stream
      const result = await chat.sendMessageStream(prompt)
      
      // Add EMPTY model message to start filling
      setMessages(prev => [...prev, { role: 'model', text: ' ' }]) 
      responseBufferRef.current = '' 

      // Consume Stream & Feed Buffer
      for await (const chunk of result.stream) {
        const chunkText = chunk.text()
        responseBufferRef.current += chunkText
      }

    } catch (error) {
      console.error('Chat error:', error)
      setMessages(prev => [...prev, { role: 'model', text: 'Error: Could not connect to AI. Please try again.' }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSend()
  }

  // Advanced TTS Handler
  const handleSpeak = async (text, index, onlyEnglish = false) => {
    // 1. If clicking the SAME message that is playing -> STOP it.
    if (playingMsgIndex === index) {
       if (audioControllerRef.current) {
         audioControllerRef.current.stop()
         audioControllerRef.current = null
       }
       setPlayingMsgIndex(null)
       return
    }

    // 2. If clicking a NEW message -> STOP any previous one.
    if (audioControllerRef.current) {
      audioControllerRef.current.stop()
      audioControllerRef.current = null
    }

    // 3. Prepare Text
    let textToSpeak = text
    if (onlyEnglish) {
      // Regex to extract text inside bold **...**
      const matches = text.match(/\*\*(.*?)\*\*/g)
      if (matches && matches.length > 0) {
        // Join matches and strip asterisks
        textToSpeak = matches.map(m => m.replace(/\*\*/g, '')).join('. ')
      } else {
        // Fallback: If no bold text found, maybe just read all? Or warn?
        // Let's read all but maybe warn in console.
        console.log("No bold text found for English extraction, reading full.")
      }
    }

    // 4. Play
    setPlayingMsgIndex(index)
    // If onlyEnglish is requested, send 'en-US' to force English Neural Voice in backend.
    // If regular explanation, send 'es-US' to trigger the Bilingual Switching logic in backend.
    const lang = onlyEnglish ? 'en-US' : 'es-US'
    const controller = await playAudio(textToSpeak, lang)
    
    if (controller) {
      audioControllerRef.current = controller
      controller.onEnded(() => {
        setPlayingMsgIndex(null)
        audioControllerRef.current = null
      })
    } else {
      setPlayingMsgIndex(null) // Failed to start
    }
  }

  const clearChat = () => {
    setMessages([{ 
      role: 'model', 
      text: 'Chat cleared! Ready for a new topic. What shall we study now? 🧹✨' 
    }])
  }

  return (
    <div className={`ai-chatbot-container ${isOpen ? 'open' : ''}`}>
      {!isOpen && (
        <button className="chat-toggle-btn" onClick={() => setIsOpen(true)}>
          <Bot size={28} />
          <span className="tooltip">Ask AI Tutor</span>
        </button>
      )}

      {/* Chat Window */}
      <div className={`chat-window ${isOpen ? 'active' : ''}`} style={{display: isOpen ? 'flex' : 'none'}}>
          {/* Header */}
          <div className="chat-header">
            <div className="header-info">
              <div className="avatar-bot">
                <Bot size={20} />
              </div>
              <div>
                <h3>AI Tutor Pro</h3>
                <span className="status">
                  <span className="dot"></span> Online
                </span>
              </div>
            </div>
            <div className="header-actions">
              <button className="action-btn" onClick={clearChat} title="Clear Chat">
                <Trash2 size={18} />
              </button>
              <button className="close-btn" onClick={() => setIsOpen(false)}>
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="messages-area">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.role}`}>
                <div className="message-bubble">
                  {/* React Markdown for Professional Formatting */}
                  <div className={`message-content markdown-body ${msg.role === 'model' ? 'model-content' : ''}`}>
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({node, ...props}) => <p style={{margin: '0.4em 0', lineHeight: '1.5'}} {...props} />,
                        ul: ({node, ...props}) => <ul style={{paddingLeft: '20px', margin: '0.5em 0'}} {...props} />,
                        ol: ({node, ...props}) => <ol style={{paddingLeft: '20px', margin: '0.5em 0'}} {...props} />,
                        li: ({node, ...props}) => <li style={{margin: '0.2em 0'}} {...props} />,
                        h3: ({node, ...props}) => <h3 style={{fontSize: '1em', fontWeight: 'bold', margin: '0.8em 0 0.4em'}} {...props} />,
                        strong: ({node, ...props}) => <strong style={{fontWeight: '700', color: msg.role === 'user' ? 'white' : 'inherit'}} {...props} />,
                        hr: ({node, ...props}) => <hr style={{border: '0', height: '1px', background: 'rgba(255,255,255,0.1)', margin: '1em 0'}} {...props} />
                      }}
                    >
                      {msg.text}
                    </ReactMarkdown>
                  </div>
                  
                  {/* Footer Actions for Model Messages */}
                  {msg.role === 'model' && msg.text && !isLoading && (
                    <div className="message-actions" style={{display: 'flex', gap: '8px', marginTop: '8px'}}>
                      {/* Play Full / Stop Button */}
                      <button 
                        className={`speak-btn ${playingMsgIndex === index ? 'playing' : ''}`}
                        onClick={() => handleSpeak(msg.text, index, false)} 
                        title={playingMsgIndex === index ? "Stop" : "Read explanation"}
                        style={{display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: 'white', cursor: 'pointer'}}
                      >
                         {playingMsgIndex === index ? <Square size={14} fill="white" /> : <Volume2 size={16} />}
                         <span style={{fontSize: '12px'}}>Explicación</span>
                      </button>

                      {/* Play English Only Button */}
                      {(msg.text.includes('**')) && (
                        <button 
                          onClick={() => handleSpeak(msg.text, index, true)} 
                          title="Listen to English pronunciation only"
                          style={{display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '4px', border: '1px solid #6366f1', background: 'rgba(99, 102, 241, 0.1)', color: '#a5b4fc', cursor: 'pointer'}}
                        >
                           <Play size={14} />
                           <span style={{fontSize: '12px', fontWeight: '500'}}>English Only</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1].role !== 'model' && (
              <div className="message model loading">
                <div className="typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          <div className="quick-actions">
            <button onClick={() => handleSend("Explain more simply")}>Explain simply</button>
            <button onClick={() => handleSend("Give me an example")}>Give example</button>
            <button onClick={() => handleSend("Correct my grammar")}>Fix grammar</button>
          </div>

          {/* Input Area */}
          <div className="input-area">
            <input
              type="text"
              placeholder="Ask context, grammar..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading && messages[messages.length - 1].role === 'user'} 
            />
            <button onClick={() => handleSend()} disabled={!input.trim() || (isLoading && messages[messages.length - 1].role === 'user')}>
              {isLoading ? <Loader2 className="spin" size={20} /> : <Send size={20} />}
            </button>
          </div>
      </div>
    </div>
  )
}
