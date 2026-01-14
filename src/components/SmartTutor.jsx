import { useState, useRef, useEffect, useContext } from 'react';
import { Mic, MicOff, Settings, X, Volume2, Globe, Sparkles, Send, Check, Play, ArrowRight, ArrowLeft, Keyboard, Sun, Moon, MessageSquareText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import AvatarScene from './AvatarScene'; // 🟢 Import 3D Avatar
import { LanguageContext } from '../App';
import { useTheme } from '../hooks/useTheme';
import './SmartTutor.css';

// Dynamic System Prompt Generator
const getSystemPrompt = (teacherName) => `Actúa como "${teacherName}", un profesor de inglés experto, paciente y muy humano.
Objetivo: Enseñar inglés de forma conversacional, profesional y amena.

REGLAS DE VOZ (CRÍTICO PARA TU ACENTO):
1. Escribe TODAS las frases o palabras en Inglés en **negritas** (ej: **Hello friend**). Esto activa tu voz nativa en inglés.
2. Escribe el Español en texto normal.

ESTILO DE CONVERSACIÓN:
- Habla como una persona real, no como un robot. Usa frases como "¡Qué buena pregunta!", "Mira, es sencillo...", "Intenta decirlo así:".
- Sé conciso pero cálido.
- Si te hablo en español chileno, entiéndeme perfectamente pero contéstame en español neutro o profesional.
- Preséntate como "Profesor ${teacherName}" o "Profesora ${teacherName}" según corresponda.

EJEMPLO:
Usuario: "Oye, como se dice rutina diaria?"
Tú: "¡Claro! Rutina diaria se dice **Daily Routine**. Por ejemplo, podrías decir: **My daily routine is very busy**."`;

export default function SmartTutor({ onBack }) {
    const { language } = useContext(LanguageContext);
    const { theme, toggleTheme } = useTheme();
    
    // STATES
    const [status, setStatus] = useState('idle'); // idle, listening, processing, speaking
    const [transcript, setTranscript] = useState('');
    const [aiResponse, setAiResponse] = useState("Hello! I'm your AI Tutor. Start speaking!");
    const [errorMsg, setErrorMsg] = useState('');
    const [isPaused, setIsPaused] = useState(false); 
    const [selectedVoice, setSelectedVoice] = useState('orbit');
    const [showVoiceMenu, setShowVoiceMenu] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);
    const [playingPreview, setPlayingPreview] = useState(null); 
    const [chatHistory, setChatHistory] = useState([]); 
    const [inputText, setInputText] = useState(''); 
    const [isTypingMode, setIsTypingMode] = useState(false);
    const [isTyping, setIsTyping] = useState(false); // Typing indicator
    const [sessionTime, setSessionTime] = useState(0); // Session timer
    const [showQuickReplies, setShowQuickReplies] = useState(true); // Quick reply buttons
    
    // REFS
    const recognitionRef = useRef(null);
    const audioRef = useRef(null);
    const previewAudioRef = useRef(null); 
    const lastFinalTranscript = useRef(''); 
    const statusRef = useRef('idle');
    const chatMessagesRef = useRef(null); 

    // Helper to update both
    const updateStatus = (newStatus) => {
        setStatus(newStatus);
        statusRef.current = newStatus;
    };

    // VOICE PREVIEW FUNCTION
    const playVoicePreview = async (voiceId) => {
        if (previewAudioRef.current) {
            previewAudioRef.current.pause();
            previewAudioRef.current = null;
        }

        setPlayingPreview(voiceId);
        const voiceName = VOICES.find(v => v.id === voiceId)?.name || 'Alex';
        const previewText = `Hola, soy tu profesor ${voiceName}. Estoy aquí para ayudarte a **learn English** de forma natural y efectiva. ¡Empecemos!`;

        try {
            const res = await fetch('/api/synthesize', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    text: previewText, 
                    languageCode: 'es-US',
                    voiceId: voiceId
                })
            });
            
            if (!res.ok) throw new Error('Preview failed');

            const blob = await res.blob();
            const audioUrl = URL.createObjectURL(blob);
            const audio = new Audio(audioUrl);
            previewAudioRef.current = audio;

            audio.onended = () => {
                setPlayingPreview(null);
            };
            
            await audio.play();

        } catch (err) {
            console.error("Preview Error:", err);
            setPlayingPreview(null);
        }
    };

    // VOICES CONFIGURATION
    const VOICES = [
        { id: 'orbit', name: 'Alex', desc: 'Energetic & Motivating', gender: 'Male', icon: '👨‍🏫', color: '#0984e3' },
        { id: 'nova', name: 'Sofia', desc: 'Warm & Patient', gender: 'Female', icon: '👩‍🏫', color: '#ff7675' },
        { id: 'echo', name: 'Daniel', desc: 'Calm & Clear', gender: 'Male', icon: '👨‍💼', color: '#00b894' },
        { id: 'shimmer', name: 'Emma', desc: 'Bright & Friendly', gender: 'Female', icon: '👩‍💼', color: '#ffeaa7' }
    ];

    // TTS FUNCTION
    const playTts = async (text, langCode = 'en-US') => {
        updateStatus('speaking');
        try {
            const res = await fetch('/api/synthesize', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    text: text, 
                    languageCode: langCode, 
                    voiceId: selectedVoice
                })
            });
            
            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`TTS Failed: ${errorText}`);
            }
            
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            audioRef.current = audio;
            
            audio.onended = () => {
                startListening();
            };
            
            audio.play();
        } catch (e) {
            console.error(e);
            setErrorMsg(e.message);
            updateStatus('idle');
        }
    };

    // AI INTERACTION
    const handleAiConversation = async (userText) => {
        console.log('handleAiConversation called with:', userText);
        if (!userText || userText.trim().length < 1) return;

        updateStatus('processing');
        setErrorMsg('');
        
        setChatHistory(prev => [...prev, { sender: 'user', text: userText }]);
        
        try {
            console.log('Sending request to /api/chat...');
            const response = await fetch('/api/chat', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userText,
                    history: [], 
                    systemPrompt: getSystemPrompt(VOICES.find(v => v.id === selectedVoice)?.name || 'Alex')
                })
            });
            
            console.log('Response status:', response.status);
            const data = await response.json();
            console.log('Response data:', data);
            
            if (!response.ok) throw new Error(data.reply || "Server Error");

            let aiText = data.reply || "I didn't catch that.";
            
            setChatHistory(prev => [...prev, { sender: 'ai', text: aiText }]);
            setAiResponse(aiText);
            await playTts(aiText, 'es-US');
            
        } catch (error) {
            console.error("AI Error:", error);
            console.error("Error details:", error.message, error.stack);
            setErrorMsg(`AI Error: ${error.message}`);
            setChatHistory(prev => [...prev, { sender: 'ai', text: `Error: ${error.message}` }]);
            updateStatus('idle');
        }
    };


    // TEXT SUBMIT
    const handleSendText = () => {
        console.log('handleSendText called with:', inputText);
        if (!inputText.trim()) return;
        handleAiConversation(inputText);
        setInputText('');
        // Scroll to bottom after sending
        setTimeout(() => {
            if (chatMessagesRef.current) {
                chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
            }
        }, 100);
    };

    // LISTENING
    const startListening = () => {
        if (statusRef.current === 'listening' && recognitionRef.current) return;
        setTimeout(() => {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.start();
                    updateStatus('listening');
                } catch (e) {
                    if (e.name !== 'NotAllowedError' && e.name !== 'InvalidStateError') console.warn("Mic check:", e);
                    updateStatus('listening');
                }
            }
        }, 250);
    };

    // INIT SPEECH RECOGNITION
    useEffect(() => {
        if ('webkitSpeechRecognition' in window) {
            const recognition = new window.webkitSpeechRecognition();
            recognition.continuous = false; 
            recognition.interimResults = true;
            recognition.lang = 'es-CL';
            recognition.maxAlternatives = 1;

            recognition.onstart = () => {
                updateStatus('listening');
                lastFinalTranscript.current = '';
            };

            recognition.onresult = (event) => {
                let final = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        final += event.results[i][0].transcript;
                    }
                }
                if (final) {
                    lastFinalTranscript.current = final;
                    setTranscript(final);
                }
            };

            recognition.onend = () => {
                if (statusRef.current === 'listening') { 
                    const text = lastFinalTranscript.current;
                    if (text && text.trim().length > 1) {
                         handleAiConversation(text);
                    } else {
                        startListening();
                    }
                }
            };
            
            recognitionRef.current = recognition;
        }
    }, []);

    // AUTO-SCROLL
    useEffect(() => {
        if (chatMessagesRef.current) {
            chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
        }
    }, [chatHistory, status]);

    // SESSION TIMER
    useEffect(() => {
        if (!hasStarted) return;
        
        const timer = setInterval(() => {
            setSessionTime(prev => prev + 1);
        }, 1000);
        
        return () => clearInterval(timer);
    }, [hasStarted]);

    const toggleListening = () => {
         if (status === 'listening') {
            recognitionRef.current?.stop();
            updateStatus('idle');
        } else {
            startListening();
        }
    };
    
    const handleEndSession = () => {
        if (recognitionRef.current) recognitionRef.current.stop();
        if (audioRef.current) audioRef.current.pause();
        onBack();
    };


    // --- SETUP SCREEN (Kept simple for now) ---
    if (!hasStarted) {
        return (
            <div className="smart-tutor-container setup-mode" style={{ padding: '60px 20px', overflowY: 'auto' }}>
                <div className="setup-content" style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '40px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Select Your Tutor</h1>
                    
                    <div className="voice-grid" style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '1fr 1fr',
                        gap: '24px', 
                        margin: '0 0 40px 0',
                        width: '100%'
                    }}>
                        {VOICES.map(voice => (
                            <div 
                                key={voice.id}
                                onClick={() => { setSelectedVoice(voice.id); playVoicePreview(voice.id); }}
                                style={{ 
                                    padding: '28px 20px', 
                                    borderRadius: '20px', 
                                    background: selectedVoice === voice.id ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255,255,255,0.05)',
                                    border: selectedVoice === voice.id ? '2px solid rgba(102, 126, 234, 0.5)' : '2px solid rgba(255,255,255,0.08)',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    minHeight: '160px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '100%',
                                    boxShadow: selectedVoice === voice.id ? '0 8px 32px rgba(102, 126, 234, 0.4)' : '0 4px 12px rgba(0,0,0,0.1)'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-6px) scale(1.02)';
                                    e.currentTarget.style.boxShadow = '0 12px 40px rgba(102, 126, 234, 0.3)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                    e.currentTarget.style.boxShadow = selectedVoice === voice.id ? '0 8px 32px rgba(102, 126, 234, 0.4)' : '0 4px 12px rgba(0,0,0,0.1)';
                                }}
                            >
                                <div style={{ fontSize: '3.5rem', marginBottom: '12px' }}>{voice.icon}</div>
                                <h3 style={{ fontSize: '1.2rem', marginBottom: '6px', fontWeight: '600' }}>{voice.name}</h3>
                                <p style={{ opacity: 0.8, fontSize: '0.85rem', marginTop: '4px' }}>{voice.desc}</p>
                            </div>
                        ))}
                    </div>

                    <button 
                        onClick={() => setHasStarted(true)}
                        style={{
                            padding: '18px 48px',
                            borderRadius: '50px',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            border: 'none',
                            fontSize: '1.1rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            marginTop: '20px',
                            transition: 'all 0.3s',
                            boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '10px'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05)';
                            e.currentTarget.style.boxShadow = '0 12px 32px rgba(102, 126, 234, 0.5)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.4)';
                        }}
                    >
                        Start Class <ArrowRight size={20} />
                    </button>
                    
                    <button className="icon-btn close" onClick={onBack} style={{ position: 'fixed', top: 30, right: 30 }}>
                        <X />
                    </button>
                </div>
            </div>
        );
    }
    
    // Helper function to format time
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // --- MAIN RENDER ---
    return (
        <div className={`smart-tutor-container ${theme === 'dark' ? 'dark-mode' : ''}`}>
            {/* HEADER */}
            <header className="header-bar">
                <div className="logo-area">
                    <Sparkles size={24} />
                    <span>AI Tutor Live</span>
                </div>
                
                {/* Timer */}
                {hasStarted && (
                    <div className="session-info">
                        <span className="session-time">⏱ {formatTime(sessionTime)}</span>
                    </div>
                )}
                
                <div className="header-right">
                    <button 
                        className="icon-btn" 
                        title="Toggle Theme"
                        onClick={toggleTheme}
                    >
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                    <button className="icon-btn" title="Messages">
                        <Send size={20} />
                    </button>
                    <button className="icon-btn" title="Audio">
                        <Volume2 size={20} />
                    </button>
                    <button className="icon-btn disabled" title="Camera (disabled)">
                        <Globe size={20} />
                    </button>
                    <button className="icon-btn close" onClick={handleEndSession}>
                        <X size={20} />
                    </button>
                </div>
            </header>

            {/* MAIN CONTENT */}
            <main className="main-content">
                {/* VIDEO SECTION (LEFT) */}
                <div className="avatar-section">
                    {/* Video Card */}
                    <div className="video-card">
                        <div className="avatar-container-3d">
                            <AvatarScene status={status} audioRef={audioRef} />
                        </div>
                    </div>
                </div>

                {/* CHAT SECTION (RIGHT) */}
                <div className="chat-section">
                    {/* Chat Header */}
                    <div className="chat-header">
                        <MessageSquareText size={24} color="#60a5fa" />
                        <span className="chat-header-title">Conferencia Inteligente</span>
                        <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
                            <span style={{ fontSize: '0.8rem', opacity: 0.6, background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '12px' }}>
                                EN-B1
                            </span>
                        </div>
                    </div>
                    
                    {/* Messages Area */}
                    <div className="chat-messages-area" ref={chatMessagesRef}>
                        {chatHistory.length === 0 && (
                            <>
                                <div className="chat-bubble ai">
                                    <p>Hello! I'm Alex. I'm excited to help you practice English today. How are you doing?</p>
                                    <span className="message-icon">�🇧</span>
                                </div>
                            </>
                        )}
                        
                        {chatHistory.map((msg, idx) => (
                            <div key={idx} className={`chat-bubble ${msg.sender}`}>
                                <ReactMarkdown>{msg.text}</ReactMarkdown>
                                {msg.sender === 'ai' && <span className="message-icon">�🇧</span>}
                            </div>
                        ))}
                        
                        {status === 'processing' && (
                            <div className="chat-bubble ai processing">
                                <span>Thinking...</span>
                            </div>
                        )}
                    </div>

                    {/* TEXT INPUT AREA (Solo visible en modo Tipo) */}
                    {isTypingMode && (
                        <div style={{ padding: '0 24px 20px', display: 'flex', gap: '10px' }}>
                            <input 
                                type="text" 
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
                                placeholder="Escribe tu respuesta aquí..."
                                style={{
                                    flex: 1,
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '12px',
                                    padding: '12px 16px',
                                    color: 'white',
                                    fontSize: '1rem',
                                    outline: 'none'
                                }}
                            />
                            <button 
                                onClick={handleSendText}
                                style={{
                                    background: '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '12px',
                                    width: '48px',
                                    height: '48px',
                                    minHeight: '48px',
                                    padding: '12px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <Send size={20} />
                            </button>
                        </div>
                    )}
                    
                    {/* Controls Dock */}
                    <div className="controls-dock">
                        <button 
                            className={`control-btn ${isTypingMode ? 'active' : ''}`}
                            onClick={() => setIsTypingMode(!isTypingMode)}
                        >
                            <div className="control-btn-icon" style={isTypingMode ? { borderColor: '#3b82f6', background: 'rgba(59, 130, 246, 0.2)' } : {}}>
                                <Keyboard size={22} />
                            </div>
                            <span className="control-label">Escribir</span>
                        </button>
                        
                        <button 
                            className={`control-btn mic-btn-large ${status === 'listening' ? 'listening' : ''}`}
                            onClick={toggleListening}
                            // Eliminado el scale(1.1) para que no sea gigante
                        >
                            <div className="control-btn-icon" style={{ 
                                width: '56px',  /* Antes 64px */
                                height: '56px', /* Antes 64px */
                                background: status === 'listening' ? '#ef4444' : 'rgba(255,255,255,0.05)',
                                borderColor: status === 'listening' ? '#ef4444' : 'rgba(59, 130, 246, 0.3)',
                                color: status === 'listening' ? 'white' : '#60a5fa'
                            }}>
                                {status === 'listening' ? <Mic size={26} className="mic-pulse" /> : <MicOff size={26} />}
                            </div>
                            <span className="control-label" style={{ fontWeight: 'bold', marginTop: '5px' }}>
                                {status === 'listening' ? 'Escuchando' : 'Hablar'}
                            </span>
                        </button>
                        
                        <button className="control-btn" onClick={() => setInputText("Could you repeat that, please?") || setIsTypingMode(true)}>
                            <div className="control-btn-icon">
                                <Sparkles size={22} />
                            </div>
                            <span className="control-label">Ayuda</span>
                        </button>
                    </div>
                </div>
            </main>

            {/* VOICE MENU OVERLAY if needed */}
            {showVoiceMenu && (
                 <div style={{ position: 'absolute', top: 70, right: 20, background: '#1e1e24', padding: 20, borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)', zIndex: 200 }}>
                    <h3>Voice Settings</h3>
                    {VOICES.map(voice => (
                        <div key={voice.id} onClick={() => { setSelectedVoice(voice.id); setShowVoiceMenu(false); }} style={{ padding: 10, cursor: 'pointer', opacity: selectedVoice === voice.id ? 1 : 0.5 }}>
                            {voice.icon} {voice.name}
                        </div>
                    ))}
                 </div>
            )}
        </div>
    );
}
