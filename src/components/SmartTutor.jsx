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
    const [aiResponse, setAiResponse] = useState("Hello! I'm your AI Tutor. Press the microphone to start talking!");
    
    // REFS
    const recognitionRef = useRef(null);
    const audioRef = useRef(null);
    const silenceTimerRef = useRef(null);

    // 1. INITIALIZE SPEECH RECOGNITION
    useEffect(() => {
        if ('webkitSpeechRecognition' in window) {
            const recognition = new window.webkitSpeechRecognition();
            recognition.continuous = true; // Keep listening until WE decide to stop
            recognition.interimResults = true;
            recognition.lang = 'en-US'; 

            recognition.onstart = () => {
                setStatus('listening');
            };

            recognition.onresult = (event) => {
                // Clear any existing silence timer
                if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

                // Get latest transcript
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        finalTranscript += event.results[i][0].transcript;
                    }
                }
                
                setTranscript(finalTranscript);

                // Start Silence Timer (1.5s) -> if no more speech, assume finished
                silenceTimerRef.current = setTimeout(() => {
                    if (finalTranscript.trim().length > 1) {
                        recognition.stop(); // Stop listening explicitly
                        handleAiConversation(finalTranscript); // Process
                    }
                }, 1500); 
            };

            recognition.onend = () => {
                // Determine if we should restart listening or if we are processing
                // If we are 'processing' or 'speaking', do NOT restart yet.
                // If we stopped due to silence timer, we are already handling it.
            };
            
            recognitionRef.current = recognition;
        } else {
            alert("Your browser does not support Speech Recognition. Please use Chrome.");
        }
    }, []);

    // ... handleAiConversation ...
    const handleAiConversation = async (userText) => {
        setStatus('processing');
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        
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
            let aiText = data.reply || "I didn't catch that.";
            
            // 🔍 DETECT LANGUAGE & CLEAN TEXT
            let textToSpeak = aiText;
            let langCode = 'en-US'; // Default

            if (aiText.startsWith('[ES]')) {
                langCode = 'es-US'; // Spanish Neural
                textToSpeak = aiText.replace('[ES]', '').trim();
            } else if (aiText.startsWith('[EN]')) {
                langCode = 'en-US'; // English Neural
                textToSpeak = aiText.replace('[EN]', '').trim();
            }
            
            setAiResponse(textToSpeak); // Show clean text in UI
            
            // Speak with Dynamic Language
            await playTts(textToSpeak, langCode);
            
        } catch (error) {
            console.error("AI Error:", error);
            setStatus('idle');
        }
    };

    // 3. TTS FUNCTION (Bilingual Support)
    const playTts = async (text, langCode = 'en-US') => {
        setStatus('speaking');
        try {
            const res = await fetch('/api/synthesize', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    text: text, 
                    languageCode: langCode, // Dynamic: en-US or es-US
                    gender: 'female' 
                })
            });
            
            if (!res.ok) throw new Error("TTS Failed");
            
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            audioRef.current = audio;
            
            audio.onended = () => {
                setStatus('listening');
                setTranscript(''); 
                recognitionRef.current?.start(); 
            };
            
            audio.play();
        } catch (e) {
            console.error(e);
            setStatus('idle');
        }
    };

    // CONTROLS
    const toggleListening = () => {
        if (status === 'listening') {
            recognitionRef.current?.stop();
            setStatus('idle');
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        } else if (status === 'speaking') {
             // Interrupt Mode
             if (audioRef.current) {
                 audioRef.current.pause();
                 audioRef.current = null;
             }
             setStatus('listening');
             setTranscript('');
             recognitionRef.current?.start();
        } else {
            setTranscript('');
            recognitionRef.current?.start();
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
                   <span>{status === 'listening' ? 'Listening...' : status === 'speaking' ? 'Speaking...' : 'Ready'}</span>
               </div>
            </div>

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
