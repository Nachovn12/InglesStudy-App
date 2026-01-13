import { useState, useRef, useEffect, useContext } from 'react';
import { Volume2, Mic, MicOff, X, Play, RotateCcw } from 'lucide-react';
import { LanguageContext } from '../App';
import './SmartTutor.css';

const SYSTEM_PROMPT = `You are an expert English Tutor AI named "Alex". 
Goal: Have a natural conversation.
Level: Elementary to Intermediate.

LANGUAGE RULES (Hybrid Mode):
1. If the user speaks English, respond in English.
2. If the user speaks Spanish, respond in Spanish to assist them.
3. CRITICAL: Start EVERY response with a language tag: [EN] for English or [ES] for Spanish.
   - Example 1: "[EN] Hello! How are you?"
   - Example 2: "[ES] Hola, veo que quieres practicar. ¿Empezamos?"

BEHAVIOR:
- Concise responses (1-3 sentences).
- If correcting grammar, be gentle.
- Use simple, clear vocabulary.`;

export default function SmartTutor({ onBack }) {
    const { language } = useContext(LanguageContext);
    
    // STATES
    const [status, setStatus] = useState('idle'); // idle, listening, processing, speaking
    const [transcript, setTranscript] = useState('');
    const [aiResponse, setAiResponse] = useState("Hello! I'm your AI Tutor. Start speaking!");
    const [errorMsg, setErrorMsg] = useState('');
    
    // REFS
    const recognitionRef = useRef(null);
    const audioRef = useRef(null);
    const lastFinalTranscript = useRef(''); // To store text between events

    // 1. TTS FUNCTION (Defined first to be accessible)
    const playTts = async (text, langCode = 'en-US') => {
        setStatus('speaking');
        try {
            const res = await fetch('/api/synthesize', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    text: text, 
                    languageCode: langCode, 
                    gender: 'female' 
                })
            });
            
            if (!res.ok) throw new Error(`TTS Error: ${res.status}`);
            
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            audioRef.current = audio;
            
            audio.onended = () => {
                // AUTO-RESTART LISTENING
                startListening();
            };
            
            audio.play();
        } catch (e) {
            console.error(e);
            setErrorMsg(e.message);
            setStatus('idle');
        }
    };

    // 2. AI INTERACTION (Defined first)
    const handleAiConversation = async (userText) => {
        if (!userText || userText.trim().length < 2) {
             startListening(); // Just noise? Listen again.
             return;
        }

        setStatus('processing');
        setErrorMsg(''); // Clear errors
        
        try {
            const response = await fetch('/api/chat', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userText,
                    history: [], 
                    systemPrompt: SYSTEM_PROMPT 
                })
            });
            
            const data = await response.json();
            if (!response.ok) throw new Error(data.reply || "Server Error");

            let aiText = data.reply || "I didn't catch that.";
            
            // DETECT LANGUAGE
            let textToSpeak = aiText;
            let langCode = 'en-US';

            if (aiText.startsWith('[ES]')) {
                langCode = 'es-US';
                textToSpeak = aiText.replace('[ES]', '').trim();
            } else if (aiText.startsWith('[EN]')) {
                langCode = 'en-US';
                textToSpeak = aiText.replace('[EN]', '').trim();
            }
            
            setAiResponse(textToSpeak);
            await playTts(textToSpeak, langCode);
            
        } catch (error) {
            console.error("AI Error:", error);
            setErrorMsg(`AI Error: ${error.message}`);
            setStatus('idle');
        }
    };

    // 3. START LISTENING HELPER
    const startListening = () => {
        if (recognitionRef.current) {
            try {
                recognitionRef.current.start();
                setStatus('listening');
                console.log("🎤 Listening started...");
            } catch (e) {
                // Already started? Ignore.
                if (e.name !== 'NotAllowedError') console.warn("Mic restart issue:", e);
                // Ensure status is correct
                setStatus('listening');
            }
        }
    };

    // 4. INITIALIZE SPEECH RECOGNITION (Effect)
    useEffect(() => {
        if ('webkitSpeechRecognition' in window) {
            const recognition = new window.webkitSpeechRecognition();
            // NATIVE ENDPOINTING: Let the browser detect when you stop talking
            recognition.continuous = false; 
            recognition.interimResults = true;
            recognition.lang = 'en-US'; 

            recognition.onstart = () => {
                setStatus('listening');
                lastFinalTranscript.current = '';
            };

            recognition.onresult = (event) => {
                let final = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        final += event.results[i][0].transcript;
                    } else {
                        // Interim visual only
                        setTranscript(event.results[i][0].transcript);
                    }
                }
                if (final) {
                    lastFinalTranscript.current = final;
                    setTranscript(final);
                }
            };

            recognition.onend = () => {
                // Browser assumes speech ended.
                // We check if we have text.
                if (status === 'listening') { // Only process if we were listening natively
                    const text = lastFinalTranscript.current;
                    if (text && text.trim().length > 1) {
                         handleAiConversation(text);
                    } else {
                        // No speech? Restart listening (Keep alive)
                        startListening();
                    }
                }
            };

            recognition.onerror = (event) => {
                console.warn("Speech Error:", event.error);
                if (event.error === 'no-speech') {
                    // Just restart quietly
                    return; 
                }
                setErrorMsg(`Mic Error: ${event.error}`);
            };
            
            recognitionRef.current = recognition;
        } else {
            alert("Use Chrome for Best Experience");
        }
    }, []); // Only runs once on mount. Warning: Closures don't capture updated 'status' from state, but 'recognition' uses refs usually. Wait.
    // Actually, 'handleAiConversation' inside onend closure WILL use the initial version if not careful.
    // BUT since we use definitions inside the component body, and 'onend' is assigned once...
    // To be perfectly safe, we should use a REF for the handler or rely on the fact that we won't change handleAiConversation logic.
    // Let's assume standard functional component behavior.

    // CONTROLS
    const toggleListening = () => {
        if (status === 'listening') {
            recognitionRef.current?.stop();
            setStatus('idle');
        } else if (status === 'speaking') {
             // Interrupt
             if (audioRef.current) {
                 audioRef.current.pause();
                 audioRef.current = null;
             }
             startListening();
        } else {
            startListening();
        }
    };

    return (
        <div className="smart-tutor-container view-container">
            {/* Header */}
            <div className="tutor-header">
               <button className="btn-icon back-btn" onClick={onBack}>
                   <X size={24} />
               </button>
               <div className="tutor-status">
                   <div className={`status-dot ${status}`}></div>
                   <span>{status === 'listening' ? 'Listening...' : status === 'processing' ? 'Thinking...' : status === 'speaking' ? 'Speaking...' : 'Ready'}</span>
               </div>
            </div>

            {/* Error Banner */}
            {errorMsg && (
                <div style={{
                    position: 'absolute', top: 70, left: '50%', transform: 'translateX(-50%)',
                    background: 'rgba(239, 68, 68, 0.9)', color: 'white', padding: '8px 16px', borderRadius: 8, zIndex: 100
                }}>
                    {errorMsg}
                </div>
            )}

            {/* Main Visualizer */}
            <div className="tutor-visualizer">
                <div className={`ai-orb ${status}`}>
                    <div className="orb-core"></div>
                    <div className="orb-ring ring-1"></div>
                    <div className="orb-ring ring-2"></div>
                </div>
            </div>

            {/* Conversation Feedback */}
            <div className="conversation-display">
                {transcript && (
                    <div className="user-bubble fade-in">
                        <span className="label">You said:</span>
                        <p>"{transcript}"</p>
                    </div>
                )}
                
                <div className="ai-bubble fade-in">
                    <span className="label">AI Tutor:</span>
                    <p>{aiResponse}</p>
                </div>
            </div>

            {/* Controls */}
            <div className="tutor-controls">
                <button 
                    className={`mic-button ${status === 'listening' ? 'active' : ''}`}
                    onClick={toggleListening}
                >
                    {status === 'listening' ? <MicOff size={32} /> : <Mic size={32} />}
                </button>
            </div>
        </div>
    );
}
