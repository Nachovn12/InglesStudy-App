import { useState, useRef, useEffect } from 'react'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { Send, X, Bot, Loader2, Volume2, Trash2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { playAudio } from '../services/googleTTS'
import './AIChatbot.css'

// Check for API Key
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null

const SYSTEM_PROMPT = `
You are "EnglishPro", an elite, AI-powered English Tutor designed to be the ultimate companion for language learners. 
Your goal is to be helpful, encouraging, and highly educational.

**Your Responsibilities:**
1. **Explain Concepts Clearly**: When asked about grammar or vocabulary, avoid jargon. Use simple, clear explanations with practical examples.
2. **Translate with Context**: Don't just translate word-for-word. Explain *why* a phrase is used, its tone (formal/informal), and alternatives.
3. **Correct Gently**: If the user makes a mistake, correct it politely. Example: "Great try! A more natural way to say that represents..." or "Close! technically we use 'on' instead of 'in' here because..."
4. **Encourage Practice**: After answering, occasionally ask the user to try using the new word/concept in a sentence of their own.
5. **Bilingual Expertise**: You are fluent in both English and Spanish. If the user asks in Spanish, explain in Spanish but prioritize English examples to foster immersion.
6. **Structure**: Use Headers (##), Bullet Points (*), and Bold (**text**) to organize long answers beautifully.

**Tone & Style:**
*   Professional yet warm and approachable.
*   Use emojis sparingly to keep interaction friendly (e.g., ✨, 📚, ✅).
*   Use **bolding** for key terms or corrections to make them stand out.
*   Keep answers concise (max 3-4 paragraphs) unless asked for a deep dive.
`

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { 
      role: 'model', 
      text: 'Hello! I am your AI Tutor. Need help with translations or grammar? Ask me anything! 🤖✨' 
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isOpen])

  const handleSend = async (textOverride = null) => {
    const textToSend = textOverride || input
    if (!textToSend.trim() || isLoading) return
    
    if (!genAI) {
      setMessages(prev => [...prev, { role: 'model', text: '⚠️ Setup Error: API Key missing. Please set VITE_GOOGLE_API_KEY in your .env file.' }])
      return
    }

    setInput('')
    // Add user message
    setMessages(prev => [...prev, { role: 'user', text: textToSend }])
    setIsLoading(true)

    try {
      // Use stable model
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }) 
      
      // Filter history to comply with Gemini API Rules:
      // 1. Alternating roles (User -> Model -> User -> Model)
      // 2. Must start with 'user'
      // 3. Remove the initial welcome message if it exists (index 0)
      
      let historyForApi = []
      
      // Skip the first message if it is the welcome message (model role)
      const visibleHistory = messages.slice(1) 
      
      historyForApi = visibleHistory.map(m => ({
        role: m.role === 'model' ? 'model' : 'user',
        parts: [{ text: m.text }]
      }))

      // Ensure the history is not empty and starts with user (though slice(1) + our flow ensures this usually)
      if (historyForApi.length > 0 && historyForApi[0].role !== 'user') {
         // If for some reason the filtered history starts with model, skip it
         historyForApi = historyForApi.slice(1)
      }

      const chat = model.startChat({
        history: historyForApi,
        generationConfig: {
          maxOutputTokens: 2000,
          temperature: 0.7,
        }
      })

      const prompt = messages.length < 2 ? `${SYSTEM_PROMPT}\nUser: ${textToSend}` : textToSend
      
      // STREAMING IMPLEMENTATION (Typewriter Effect)
      const result = await chat.sendMessageStream(prompt)
      
      let fullResponse = ""
      // Add a placeholder message for the model that we will update live
      setMessages(prev => [...prev, { role: 'model', text: '' }])

      for await (const chunk of result.stream) {
        const chunkText = chunk.text()
        fullResponse += chunkText
        
        // Update the last message with the accumulated text
        setMessages(prev => {
          const newMessages = [...prev]
          newMessages[newMessages.length - 1].text = fullResponse
          return newMessages
        })
      }

    } catch (error) {
      console.error('Chat error:', error)
      setMessages(prev => {
         // If we started streaming, append error to it, otherwise new message
         const lastMsg = prev[prev.length - 1]
         if (lastMsg.role === 'model' && lastMsg.text === '') {
             const newMsgs = [...prev]
             newMsgs[newMsgs.length - 1].text = 'Sorry, connection timed out or model unavailable. Please try again! 😓'
             return newMsgs
         }
         return [...prev, { role: 'model', text: 'Sorry, connection error. Please try again! 😓' }]
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSend()
  }

  const speak = (text) => {
    playAudio(text, 'en-US')
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
                  {msg.role === 'model' && msg.text && !isLoading && (
                    <button className="speak-btn" onClick={() => speak(msg.text)} title="Listen">
                      <Volume2 size={14} />
                    </button>
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
