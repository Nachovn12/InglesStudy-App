export const playAudio = async (text, languageCode = 'en-US', gender = 'NEUTRAL') => {
  if (!text) return null

  // Advanced Text Cleaning for TTS
  // 1. Remove Emojis
  let cleanText = text.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '')
  
  // 2. Remove URL links
  cleanText = cleanText.replace(/https?:\/\/\S+/g, '')

  // 3. Remove Markdown structural chars (Headers #, Code `, Underscore _)
  cleanText = cleanText.replace(/[#`_]/g, '')
  
  // 4. Remove single asterisks (bullets) but KEEP double asterisks ** (used for language switching)
  // Logic: Replace * that is NOT followed by * AND NOT preceded by *
  cleanText = cleanText.replace(/(?<!\*)\*(?!\*)/g, '') 

  // 5. Replace colons with a pause (comma) so it doesn't say "colon"
  cleanText = cleanText.replace(/:/g, ', ')

  // 6. Trim extra spaces
  cleanText = cleanText.replace(/\s+/g, ' ').trim()

  try {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    
    // NOTE: On Vercel, the backend /api/synthesize might not exist if not deployed as Serverless Function.
    // Assuming for now user wants to try server first.
    const apiUrl = isLocalhost 
      ? 'http://localhost:3001/api/synthesize' 
      : '/api/synthesize'

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        text: cleanText, 
        gender: gender === 'MALE' ? 'male' : 'female',
        languageCode: languageCode // Send requested language ('en-US' or 'es-US')
      })
    })

    if (!response.ok) {
      throw new Error('Local TTS Server response not ok')
    }

    const blob = await response.blob()
    const audioUrl = URL.createObjectURL(blob)
    const audio = new Audio(audioUrl)
    
    audio.play().catch(e => console.error("Audio play failed", e))
    
    // Return a controller object
    return {
      stop: () => {
        audio.pause()
        audio.currentTime = 0
      },
      onEnded: (callback) => {
        audio.onended = callback
      }
    }

  } catch (error) {
    console.warn('TTS Fallback active:', error.message)
    // Fallback behavior: Use Browser Built-in Voices
    return fallbackBrowserTTS(cleanText, languageCode)
  }
}

const fallbackBrowserTTS = (text, lang) => {
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = lang
  
  // Helper to select best voice
  const setBestVoice = () => {
    const voices = window.speechSynthesis.getVoices()
    if (voices.length === 0) return

    // Priority 1: Google Voice matching language
    let bestVoice = voices.find(v => v.name.includes('Google') && v.lang.startsWith(lang.slice(0,2)))
    // Priority 2: Any voice matching language
    if (!bestVoice) bestVoice = voices.find(v => v.lang.startsWith(lang.slice(0,2)))
    // Priority 3: Default
    
    if (bestVoice) utterance.voice = bestVoice
  }

  // Attempt to set voice
  setBestVoice()
  
  // Handle async voice loading in Chrome
  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.onvoiceschanged = () => {
      setBestVoice()
    }
  }

  window.speechSynthesis.speak(utterance)
  
  return {
    stop: () => window.speechSynthesis.cancel(),
    onEnded: (callback) => {
      utterance.onend = callback
    }
  }
}


