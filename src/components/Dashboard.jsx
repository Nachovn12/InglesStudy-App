import { useContext, useState, useEffect } from 'react'
import { LanguageContext } from '../App'
import { getTranslation } from '../translations'
import { Folder, FileText, Download, Upload, Loader2, X, Lock, Trash2 } from 'lucide-react'
import './Dashboard.css'

function Dashboard({ onNavigate, progress, onResetProgress }) {
  const { language } = useContext(LanguageContext)
  const t = (key) => getTranslation(language, key)
  
  // State for collapsible tips
  const [showTips, setShowTips] = useState(false)
  
  // FILE SHARING STATE
  const [showFileModal, setShowFileModal] = useState(false)
  const [selectedExamId, setSelectedExamId] = useState(null)
  const [selectedExamTitle, setSelectedExamTitle] = useState('')
  const [examFiles, setExamFiles] = useState([])
  const [loadingFiles, setLoadingFiles] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [adminCode, setAdminCode] = useState('')
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false)
  
  const examDate = new Date('2026-01-13T09:00:00') // Written exam
  const speakingExamDate = new Date('2026-01-14T09:00:00') // Speaking exam
  const today = new Date()
  const daysLeft = Math.ceil((examDate - today) / (1000 * 60 * 60 * 24))
  const speakingDaysLeft = Math.ceil((speakingExamDate - today) / (1000 * 60 * 60 * 24))
  const hoursLeft = Math.ceil((examDate - today) / (1000 * 60 * 60)) % 24

  const modules = [
    {
      id: 'grammar',
      title: `📚 ${t('grammarPractice')}`,
      description: t('grammarDesc'),
      color: '#6366f1',
      topics: ['Simple Past', 'Comparatives', 'Quantifiers', 'There was/were'],
      progress: progress.grammar
    },
    {
      id: 'vocabulary',
      title: `🎮 ${t('vocabularyGames')}`,
      description: t('vocabularyDesc'),
      color: '#ec4899',
      topics: ['Professions', 'House', 'Food', 'Collocations'],
      progress: progress.vocabulary
    },
    {
      id: 'speaking',
      title: `🗣️ ${t('speakingSimulator')}`,
      description: t('speakingDesc'),
      color: '#14b8a6',
      topics: ['Personal', 'Past Events', 'Comparisons', 'Future'],
      progress: progress.speaking
    },
    {
      id: 'listening',
      title: `🎧 ${t('listeningPractice')}`,
      description: t('listeningDesc'),
      color: '#f59e0b',
      topics: ['Stories', 'Conversations', 'Pronunciation', 'Dictation'],
      progress: progress.listening
    },
    {
      id: 'writing',
      title: `✍️ ${t('writingPractice')}`,
      description: t('writingDesc'),
      color: '#8b5cf6',
      topics: ['Last Weekend', 'Comparing', 'Connectors', 'Past Exp'],
      progress: progress.writing
    },
    {
      id: 'comparative-game',
      title: language === 'es' ? `🎯 Juego de Comparaciones` : `🎯 Comparative Game`,
      description: language === 'es' ? 'Practica comparativos' : 'Practice comparatives',
      color: '#10b981',
      topics: ['Short', 'Long', 'Irregulars'],
      progress: progress.comparativeGame || 0
    },
    {
      id: 'study-guide',
      title: language === 'es' ? `🆘 Diccionario & Guía` : `🆘 Dictionary & Guide`,
      description: language === 'es' ? 'Kit de Emergencia' : 'Emergency Kit',
      color: '#ef4444',
      topics: ['Verbs', 'Numbers', 'Grammar', 'Phrases'],
      progress: 100 
    }
  ]

  const totalProgress = Math.round(
    (progress.grammar + progress.vocabulary + progress.speaking + progress.listening + progress.writing + (progress.comparativeGame || 0)) / 6
  )

  // SECRET ADMIN ACTIVATION
  const [secretClicks, setSecretClicks] = useState(0)

  // --- FILE FUNCTIONS ---
  // Detect Vercel Environment
  const isVercel = typeof window !== 'undefined' && window.location.hostname.includes('vercel');

  const openFiles = async (examId, title) => {
    setSelectedExamId(examId)
    setSelectedExamTitle(title)
    setShowFileModal(true)
    setExamFiles([])
    setLoadingFiles(true)
    
    // Admin unlock reset
    setSecretClicks(0)
    setIsAdminUnlocked(false)

    try {
        if (isVercel) {
            // ☁️ MODO VERCEL: Leer índice estático
            const res = await fetch('/static-files.json');
            if (res.ok) {
                const allFiles = await res.json();
                // Filtrar por examen
                const myFiles = allFiles.filter(f => f.examId === examId);
                setExamFiles(myFiles);
            }
        } else {
            // 🏠 MODO LOCAL: Usar API Backend
            const apiUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
              ? `http://localhost:3001/api/files/${examId}`
              : `/api/files/${examId}`;
              
            const res = await fetch(apiUrl)
            if (res.ok) {
                const data = await res.json()
                setExamFiles(data)
            } else {
                setExamFiles([])
            }
        }
    } catch (e) {
        console.error("Error fetching files", e)
        setExamFiles([])
    } finally {
        setLoadingFiles(false)
    }
  }

  const handleDelete = async (filename) => {
      // No delete on Vercel
      if (isVercel) return;

      if(!window.confirm(language === 'es' ? "¿Estás seguro de eliminar este archivo?" : "Are you sure you want to delete this file?")) return;
      
      try {
        const apiUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                ? `http://localhost:3001/api/files/${filename}`
                : `/api/files/${filename}`;
        
        const res = await fetch(apiUrl, { method: 'DELETE' });
        if(res.ok) {
            // Refresh list
            openFiles(selectedExamId, selectedExamTitle);
        } else {
            alert("Delete failed");
        }
      } catch (e) { console.error(e); }
  }

  const handleAdminUnlock = () => {
      // Simple hardcoded password
      if (adminCode === 'admin123' || adminCode === 'nacho') {
          setIsAdminUnlocked(true)
      } else {
          alert("Incorrect Password")
      }
  }

  const uploadFile = async (e) => {
      // No upload on Vercel
      if (isVercel) {
          alert("⚠️ MODO VERCEL: La subida está desactivada. Sube archivos en Localhost y haz deploy.");
          return;
      }

      const files = e.target.files
      if (!files || files.length === 0) return

      setIsUploading(true)
      const formData = new FormData()
      
      // Append all files
      Array.from(files).forEach(file => {
          formData.append('files', file)
      })
      formData.append('examId', selectedExamId)

      try {
        const apiUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
          ? 'http://localhost:3001/api/upload' 
          : '/api/upload';

        const res = await fetch(apiUrl, {
            method: 'POST',
            body: formData
        })
        if (res.ok) {
            // Refresh list
            openFiles(selectedExamId, selectedExamTitle)
        } else {
            alert("Upload failed")
        }
      } catch (error) {
          console.error(error)
          alert("Upload Error")
      } finally {
          setIsUploading(false)
          // Reset input
          e.target.value = null
      }
  }

  // Helper to render the Folder Button
  const FolderButton = ({ examId, title }) => (
      <button 
        className="btn-folder" 
        onClick={() => openFiles(examId, title)}
        title={language === 'es' ? "Ver Material de Estudio" : "View Study Material"}
        style={{
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid #6366f1',
            color: '#6366f1',
            padding: '4px 10px',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.85em',
            marginLeft: 'auto'
        }}
      >
          <Folder size={16} />
          <span>{language === 'es' ? "Material" : "Files"}</span>
      </button>
  )
  
  // Helper for Download URL
  const getDownloadUrl = (filename) => {
      return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? `http://localhost:3001/uploads/${filename}`
        : `/uploads/${filename}` 
  }

  const handleTitleClick = () => {
      setSecretClicks(prev => prev + 1)
  }

  return (
    <div className="dashboard view-container">
      <header className="header">
        <h1 className="header-title">🎓 {t('appTitle')}</h1>
        <p className="header-subtitle">{t('appSubtitle')}</p>
        
        <div className="exam-countdown">
           <div className="countdown-item">
            <span className="countdown-label">{t('writtenExam')}</span>
            <span className="countdown-value">{daysLeft} {t('days')}</span>
          </div>
          <div className="countdown-separator">•</div>
          <div className="countdown-item">
            <span className="countdown-label">{t('speakingExam')}</span>
            <span className="countdown-value">{speakingDaysLeft} {t('days')}</span>
          </div>
          <div className="countdown-separator">•</div>
          <div className="countdown-item">
            <span className="countdown-label">{t('overallProgress')}</span>
            <span className="countdown-value">{totalProgress}%</span>
          </div>
        </div>
      </header>

       {/* Professor's Tips Section - Collapsible */}
       <div className="professor-tips-container">
        <button 
          className="tips-toggle-btn card card-interactive"
          onClick={() => setShowTips(!showTips)}
        >
          <div className="tips-toggle-content">
            <div className="tips-toggle-header">
              <h3>👨‍🏫 {language === 'es' ? 'Tips del Profesor' : 'Professor\'s Tips'}</h3>
              <span className="tips-badge">
                {language === 'es' ? 'Información Crítica del Examen' : 'Critical Exam Information'}
              </span>
            </div>
            <span className="tips-toggle-icon">
              {showTips ? '▼' : '▶'}
            </span>
          </div>
        </button>

        {showTips && (
          <div className="professor-tips card">
             <div className="tips-priority">
              <div className="priority-item priority-critical">
                <span className="priority-badge">🔴 {language === 'es' ? 'GARANTIZADO' : 'GUARANTEED'}</span>
                <div className="priority-content">
                  <h4>{language === 'es' ? 'Aparecerá SÍ O SÍ en ambos exámenes:' : 'Will appear in BOTH exams:'}</h4>
                  <ul>
                    <li><strong>Simple Past</strong> - {language === 'es' ? 'Mínimo 1 pregunta garantizada' : 'Minimum 1 question guaranteed'}</li>
                    <li><strong>Comparatives</strong> - {language === 'es' ? 'Mínimo 1 pregunta garantizada' : 'Minimum 1 question guaranteed'}</li>
                  </ul>
                </div>
              </div>
              <div className="priority-item priority-high">
                 <span className="priority-badge">🟡 {language === 'es' ? 'PROBABLE' : 'LIKELY'}</span>
                 <div className="priority-content">
                    <h4>{language === 'es' ? 'Speaking: Estructura Examen' : 'Speaking Exam Structure'}</h4>
                    <div className="exam-flow">
                        <div className="flow-step"><span className="step-number">1</span><p>Warm-up</p></div>
                        <div className="flow-step"><span className="step-number">2</span><p>Topic Questions</p></div>
                        <div className="flow-step"><span className="step-number">3</span><p>Repeats</p></div>
                    </div>
                 </div>
              </div>
              <p className="tip-important">🎯 Coordina con tu compañero ANTES del examen</p>
            </div>
          </div>
        )}
      </div>

      <div className="modules-grid">
        {modules.map((module) => (
          <div key={module.id} className="module-card card card-interactive" onClick={() => onNavigate(module.id)} style={{ borderColor: module.color }}>
            <div className="module-header">
              <h3 className="module-title">{module.title}</h3>
              <div className="module-progress-circle" style={{ borderColor: module.color }}>
                <span style={{ color: module.color }}>{module.progress}%</span>
              </div>
            </div>
            <p className="module-description">{module.description}</p>
            <div className="module-topics">
                {module.topics.map((t, i) => <span key={i} className="topic-tag" style={{borderColor:module.color, color:module.color}}>{t}</span>)}
            </div>
            <div className="module-progress-bar">
              <div className="module-progress-fill" style={{ width: `${module.progress}%`, background: module.color }} />
            </div>
            <button className="btn btn-primary module-button" style={{ background: module.color }}>{t('startPractice')} →</button>
          </div>
        ))}
      </div>

      {/* QUICK STATS */}
      <div className="quick-stats">
        <div className="stat-card card"><div className="stat-icon">📊</div><div className="stat-content"><h4>{t('totalProgress')}</h4><p className="stat-value">{totalProgress}%</p></div></div>
        <div className="stat-card card"><div className="stat-icon">⏰</div><div className="stat-content"><h4>{t('timeRemaining')}</h4><p className="stat-value">{daysLeft}d {hoursLeft}h</p></div></div>
        <div className="stat-card card"><div className="stat-icon">🎯</div><div className="stat-content"><h4>{t('examWeight')}</h4><p className="stat-value">44%</p></div></div>

      </div>

      {/* EXAM SCHEDULE */}
      <div className="exam-info card">
        <h3>📅 {t('examSchedule')}</h3>
        <div className="exam-schedule">
          
          {/* EXAM 1 */}
          <div className="exam-item">
            <div className="exam-date">
              <span className="exam-day">13</span>
              <span className="exam-month">ENE</span>
            </div>
            <div className="exam-details">
              <div className="exam-header-row" style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                  <h4>{t('writtenExam')}</h4>
                  <FolderButton examId="exam_13_jan_written" title="Written Exam (13 Jan)" />
              </div>
              <p>{t('writtenExamDetails')}</p>
              <span className="exam-weight">{t('weight')}: 32% (Partial)</span>
            </div>
          </div>
          
          {/* EXAM 2 */}
          <div className="exam-item">
            <div className="exam-date">
              <span className="exam-day">14</span>
              <span className="exam-month">ENE</span>
            </div>
            <div className="exam-details">
              <div className="exam-header-row" style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                  <h4>{t('speakingExam')}</h4>
                  <FolderButton examId="exam_14_jan_speaking" title="Speaking Exam (14 Jan)" />
              </div>
              <p>{t('speakingExamDetails')}</p>
              <span className="exam-weight">{t('weight')}: 12% (Partial)</span>
            </div>
          </div>

           <div className="exam-item">
            <div className="exam-date"><span className="exam-day">22</span><span className="exam-month">ENE</span></div>
            <div className="exam-details">
                <div className="exam-header-row" style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                    <h4>{t('endTermWritten')}</h4>
                    <FolderButton examId="exam_22_jan_written" title="End Term Written" />
                </div>
                <p>{t('ea2Content')}</p>
                <span className="exam-weight">{t('weight')}: 32%</span>
            </div>
          </div>

           <div className="exam-item">
            <div className="exam-date"><span className="exam-day">22</span><span className="exam-month">ENE</span></div>
            <div className="exam-details">
                <div className="exam-header-row" style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                    <h4>{t('endTermSpeaking')}</h4>
                    <FolderButton examId="exam_22_jan_speaking" title="End Term Speaking" />
                </div>
                <p>{t('ea2Content')}</p>
                <span className="exam-weight">{t('weight')}: 12%</span>
            </div>
          </div>
          
           <div className="exam-item">
            <div className="exam-date"><span className="exam-day">26</span><span className="exam-month">ENE</span></div>
            <div className="exam-details">
                <div className="exam-header-row" style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                    <h4>{t('englishProduction')}</h4>
                    <FolderButton examId="exam_26_jan_production" title="English Production" />
                </div>
                <p>{t('activity1')}</p>
                <span className="exam-weight">{t('weight')}: 12%</span>
            </div>
          </div>

          <div className="exam-item final-exam-item" style={{background: 'rgba(99, 102, 241, 0.1)', borderLeft: '4px solid #6366f1'}}>
            <div className="exam-date" style={{background: '#6366f1'}}>
              <span className="exam-day">27</span>
              <span className="exam-month">ENE</span>
            </div>
            <div className="exam-details">
              <div className="exam-header-row" style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                  <h4>{t('finalSpeaking')}</h4>
                  <FolderButton examId="exam_27_jan_final_speaking" title="Final Speaking" />
              </div>
              <p>{t('ea1And2')}</p>
              <span className="exam-weight">{t('weight')}: 25% (of Final 40%)</span>
            </div>
          </div>

          <div className="exam-item final-exam-item" style={{background: 'rgba(99, 102, 241, 0.1)', borderLeft: '4px solid #6366f1'}}>
            <div className="exam-date" style={{background: '#6366f1'}}>
              <span className="exam-day">27</span>
              <span className="exam-month">ENE</span>
            </div>
            <div className="exam-details">
              <div className="exam-header-row" style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                  <h4>{t('finalWritten')}</h4>
                  <FolderButton examId="exam_28_jan_final_written" title="Final Written" />
              </div>
              <p>{t('ea1And2')}</p>
              <span className="exam-weight">{t('weight')}: 75% (of Final 40%)</span>
            </div>
          </div>

        </div>
      </div>

      {/* FILE MODAL */}
      {showFileModal && (
        <div className="modal-overlay" onClick={() => { setShowFileModal(false); setSecretClicks(0); setIsAdminUnlocked(false); }} style={{
            position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.8)', zIndex:1000, display:'flex', justifyContent:'center', alignItems:'center', backdropFilter: 'blur(5px)'
        }}>
          <div className="modal-content file-modal" onClick={e => e.stopPropagation()} style={{
              background:'#1e1e2e', padding:'25px', borderRadius:'16px', maxWidth:'500px', width:'90%', maxHeight:'80vh', overflowY:'auto', border:'1px solid #3f3f46', boxShadow:'0 20px 50px rgba(0,0,0,0.5)'
          }}>
            <div className="modal-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', borderBottom:'1px solid #3f3f46', paddingBottom:'15px'}}>
              {/* SECRET CLICK TRIGGER AREA */}
              <h2 onClick={handleTitleClick} style={{margin:0, fontSize:'1.2rem', cursor:'default', userSelect:'none'}}>
                  📂 {selectedExamTitle}
              </h2>
              <button className="modal-close" onClick={() => { setShowFileModal(false); setSecretClicks(0); setIsAdminUnlocked(false); }} style={{background:'none', border:'none', color:'#fff', cursor:'pointer'}}><X size={24} /></button>
            </div>
            
            <div className="file-list-container" style={{ minHeight: '150px' }}>
              {loadingFiles ? (
                <div className="loading-state" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '200px', color: '#a1a1aa', gap: '15px' }}>
                  <Loader2 className="spin" size={40} color="#6366f1" />
                  <p>Accesing Secure Vault...</p>
                </div>
              ) : examFiles.length === 0 ? (
                <div className="empty-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#52525b' }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '50%', marginBottom: '15px' }}>
                    <Folder size={48} opacity={0.5} />
                  </div>
                  <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>{language === 'es' ? 'Carpeta Vacía' : 'Folder Empty'}</p>
                  <p style={{ fontSize: '0.9rem', opacity: 0.6 }}>{language === 'es' ? 'El profesor aún no ha subido material.' : 'Professor has not uploaded material yet.'}</p>
                </div>
              ) : (
                <div className="file-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px', padding: '10px' }}>
                  {examFiles.map((file, i) => {
                    // 🔧 FIX: Decodificar caracteres rotos (UTF-8 interpretado como Latin1)
                    const fixEncoding = (str) => {
                        try {
                            return decodeURIComponent(escape(str));
                        } catch (e) {
                            return str;
                        }
                    };
                    
                    const originalNameFixed = fixEncoding(file.originalName);
                    
                    // 🧠 Smart Tagging & Icon Logic
                    const ext = originalNameFixed.split('.').pop().toLowerCase();
                    const isPdf = ext === 'pdf';
                    const isWord = ext === 'doc' || ext === 'docx';
                    const isImg = ['jpg', 'png', 'jpeg', 'webp'].includes(ext);

                    let iconColor = '#a1a1aa';
                    if (isPdf) iconColor = '#ef4444'; // Red for PDF
                    if (isWord) iconColor = '#3b82f6'; // Blue for Word
                    if (isImg) iconColor = '#10b981'; // Green for Images

                    const tags = [];
                    const lowerName = originalNameFixed.toLowerCase();
                    if (lowerName.includes('exam') || lowerName.includes('examen')) tags.push({ label: 'EXAM', color: '#f59e0b' });
                    if (lowerName.includes('grammar') || lowerName.includes('gramatica')) tags.push({ label: 'GRAMMAR', color: '#8b5cf6' });
                    if (lowerName.includes('vocab')) tags.push({ label: 'VOCAB', color: '#ec4899' });
                    if (isPdf) tags.push({ label: 'PDF', color: '#ef4444' });

                    const getForceDownloadUrl = (filename) => {
                        if (isVercel) return `/materials/${filename}`;
                        
                        return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                            ? `http://localhost:3001/api/download/${filename}`
                            : `/api/download/${filename}` 
                    }
                    
                    const getDownloadUrl = (filename) => {
                         // For preview
                         if (isVercel) return `/materials/${filename}`;
                         
                         return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                            ? `http://localhost:3001/uploads/${filename}`
                            : `/uploads/${filename}`
                    };

                    return (
                      <div key={file.id + '-' + i} className="file-card-premium" style={{
                        position: 'relative',
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '12px',
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        transition: 'all 0.3s ease',
                        cursor: 'default',
                        minHeight: '180px',
                        overflow: 'hidden'
                      }}
                        onMouseEnter={e => {
                          e.currentTarget.style.transform = 'translateY(-5px)';
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                          e.currentTarget.style.borderColor = iconColor;
                          e.currentTarget.style.boxShadow = `0 10px 20px -5px ${iconColor}33`;
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        {isNew && <div style={{ position: 'absolute', top: '10px', left: '10px', width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} title="New file" />}

                        {/* DELETE BUTTON - Only Admin */}
                        {isAdminUnlocked && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleDelete(file.systemFilename); }}
                                style={{
                                    position: 'absolute', top: '5px', right: '5px',
                                    background: 'rgba(239, 68, 68, 0.2)', border: 'none', borderRadius: '50%',
                                    width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', zIndex: 10, transition: 'all 0.2s'
                                }}
                                title="Delete"
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.4)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                            >
                                <Trash2 size={14} color="#ef4444" />
                            </button>
                        )}

                        {/* PREVIEW AREA */}
                        <div className="file-preview-wrapper" style={{ marginBottom: '10px', position: 'relative', width: '100%', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {isImg ? (
                              <img src={previewUrl} alt="preview" style={{width:'100%', height:'100%', objectFit:'cover', borderRadius:'8px', opacity:0.8}} />
                          ) : (
                              <>
                                <FileText size={48} color={iconColor} strokeWidth={1.5} />
                                <div style={{ position: 'absolute', inset: 0, filter: 'blur(20px)', opacity: 0.2, background: iconColor, zIndex: -1 }}></div>
                              </>
                          )}
                        </div>

                        <div className="file-info" style={{ textAlign: 'center', width: '100%', marginBottom: '10px' }}>
                          <div className="file-name" style={{
                            fontSize: '0.8rem', fontWeight: 500, color: '#e4e4e7',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%'
                          }} title={originalNameFixed}>
                            {originalNameFixed.replace(/\.[^/.]+$/, "")}
                          </div>
                          
                          <div className="file-tags" style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginTop: '6px', flexWrap: 'wrap' }}>
                            {tags.slice(0, 2).map((tag, i) => (
                              <span key={i} style={{ fontSize: '0.6rem', padding: '2px 6px', borderRadius: '4px', background: `${tag.color}22`, color: tag.color, fontWeight: 700, letterSpacing: '0.5px' }}>
                                {tag.label}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* BUTTONS ROW */}
                        <div style={{display:'flex', gap:'8px', width:'100%'}}>
                             {/* PREVIEW BUTTON (Only for PDF & Images) */}
                             {(isPdf || isImg) && (
                                <a
                                    href={previewUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    title="Preview (Ver)"
                                    style={{
                                        flex: 1,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        borderRadius: '6px', color: '#fff', padding: '6px',
                                        cursor: 'pointer', transition: 'background 0.2s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                                >
                                    <span style={{fontSize:'1.2rem'}}>👁️</span>
                                </a>
                             )}

                            <a
                              href={downloadUrl}
                              download={originalNameFixed}
                              className="btn-download-premium"
                              style={{
                                flex: 3,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                background: iconColor || '#6366f1',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                color: '#fff',
                                textDecoration: 'none',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                transition: 'all 0.2s',
                              }}
                            >
                              <Download size={14} />
                              {language === 'es' ? 'Descargar' : 'Download'}
                            </a>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* ONLY SHOW IF SECRET CLICKS >= 5 */}
            {secretClicks >= 5 && (
                <div className="upload-section" style={{marginTop:'20px', paddingTop:'20px', borderTop:'1px solid #3f3f46', animation: 'fadeIn 0.5s ease'}}>
                    {!isAdminUnlocked ? (
                        <div className="admin-unlock" style={{display:'flex', alignItems:'center', gap:'10px', background:'#27273a', padding:'10px', borderRadius:'8px'}}>
                            <Lock size={16} color="#ef4444"/>
                            <span style={{fontSize:'0.9em', color:'#a1a1aa'}}>{language === 'es' ? 'Admin:' : 'Admin:'}</span>
                            <input 
                                type="password" 
                                placeholder="****" 
                                className="admin-code-input"
                                value={adminCode}
                                onChange={e => setAdminCode(e.target.value)}
                                style={{background:'#181825', border:'1px solid #3f3f46', color:'#fff', padding:'5px', borderRadius:'4px', width:'80px'}}
                            />
                            <button className="btn-unlock" onClick={handleAdminUnlock} style={{
                                background:'#ef4444', border:'none', color:'#fff', padding:'5px 10px', borderRadius:'4px', cursor:'pointer', fontSize:'0.8em'
                            }}>Unlock</button>
                        </div>
                    ) : (
                        <div className="upload-box" style={{textAlign:'center'}}>
                            <label className="file-upload-label" style={{
                                display:'inline-flex', alignItems:'center', gap:'8px', background:'#6366f1', color:'#fff', padding:'10px 20px', borderRadius:'8px', cursor:'pointer', transition:'all 0.2s'
                            }}>
                                {isUploading ? <Loader2 className="spin" size={16} /> : <Upload size={16} />}
                                {language === 'es' ? 'Subir Archivos (Múltiple)' : 'Upload Files (Multiple)'}
                                <input type="file" onChange={uploadFile} accept=".pdf,.doc,.docx,.jpg,.png" multiple disabled={isUploading} style={{display:'none'}} />
                            </label>
                        </div>
                    )}
                </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
