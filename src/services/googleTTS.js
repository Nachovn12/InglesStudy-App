// Google TTS Service via Local Backend Proxy
// This uses the server.js running on port 3001 which holds the Service Account Credentials (JSON)

export const playAudio = async (text, languageCode = 'en-US', gender = 'NEUTRAL') => {
  if (!text) return

  // Clean markdown manually
  const cleanText = text.replace(/\*\*/g, '').replace(/\*/g, '').replace(/__/g, '')

  try {
    // Determine API Endpoint based on Environment
    // - Localhost: expects separate node server on port 3001
    // - Production (Vercel): uses relative path to Serverless Function
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    const apiUrl = isLocalhost 
      ? 'http://localhost:3001/api/synthesize' 
      : '/api/synthesize'

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        text: cleanText, 
        gender: gender === 'MALE' ? 'male' : 'female'
      })
    })

    if (!response.ok) {
      throw new Error('Local TTS Server response not ok')
    }

    const blob = await response.blob()
    const audioUrl = URL.createObjectURL(blob)
    const audio = new Audio(audioUrl)
    audio.play()

  } catch (error) {
    console.warn('Premium Voice Server (port 3001) not reachable. Using fallback.', error)
    // Fallback behavior: Use Browser Built-in Voices
    fallbackBrowserTTS(cleanText, languageCode)
  }
}

const fallbackBrowserTTS = (text, lang) => {
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = lang
  // Try to find a good browser voice
  const voices = window.speechSynthesis.getVoices()
  const bestVoice = voices.find(v => v.name.includes('Google') || v.lang === lang)
  if (bestVoice) utterance.voice = bestVoice
  
  window.speechSynthesis.speak(utterance)
}


