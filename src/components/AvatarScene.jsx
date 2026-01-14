import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, OrbitControls, Environment, ContactShadows, Center } from '@react-three/drei';
import * as THREE from 'three';

// Avatar de Ready Player Me (Externo)
// Parámetros: morphTargets=ARKit (habilita blendshapes), textureAtlas=1024 (optimiza texturas)
const MODEL_URL = 'https://models.readyplayer.me/69670226e0839cba1b121dfe.glb?morphTargets=ARKit&textureAtlas=1024';

// Componente del Avatar con lip-sync real basado en visemas
const ProfessorAvatar = ({ status, audioElement, visemes = [], audioUrl, scale = 1.7 }) => {
  const group = useRef();
  const { scene } = useGLTF(MODEL_URL);
  const headMesh = useRef();
  
  // Viseme-based lip-sync
  const [isPlaying, setIsPlaying] = useState(false);
  const startTimeRef = useRef(0);
  const currentVisemeIndex = useRef(0);
  
  // Audio Analysis (fallback)
  const audioContext = useRef(null);
  const analyser = useRef(null);
  const dataArray = useRef(null);
  const sourceNode = useRef(null);
  const isAudioSetup = useRef(false);

  // Mapeo de visemas de Google TTS a blendshapes ARKit
  // Google TTS retorna timepoints, necesitamos mapear a morfos faciales
  const visemeToBlendshape = {
    // Vocales
    'A': 'jawOpen',
    'E': 'mouthSmile',
    'I': 'mouthSmile',
    'O': 'mouthFunnel',
    'U': 'mouthPucker',
    // Consonantes
    'M': 'mouthClose',
    'P': 'mouthClose',
    'B': 'mouthClose',
    'F': 'mouthFrown',
    'V': 'mouthFrown',
    'TH': 'mouthOpen',
    'S': 'mouthSmile',
    'Z': 'mouthSmile',
    'SH': 'mouthFunnel',
    'CH': 'mouthFunnel',
    'L': 'mouthOpen',
    'R': 'mouthOpen',
    'W': 'mouthPucker',
    'Y': 'mouthSmile',
  };

  useEffect(() => {
    // Buscar la malla de la cabeza que tiene los MorphTargets
    scene.traverse((child) => {
      if (child.isMesh && child.morphTargetDictionary && child.morphTargetInfluences) {
        if (!headMesh.current) { // Solo tomar el primero
          headMesh.current = child;
          console.log('✅ Head mesh found:', child.name);
          console.log('📋 Available morph targets:', Object.keys(child.morphTargetDictionary));
        }
      }
    });
    
    if (!headMesh.current) {
      console.warn('⚠️ No mesh with morph targets found in the model');
    }
  }, [scene]);

  // Setup Audio Analyzer cuando el audio empieza a reproducirse
  useEffect(() => {
    if (!audioElement) {
      console.log('⏳ Waiting for audio element...');
      return;
    }

    const setupAudioAnalyzer = async () => {
      if (isAudioSetup.current) {
        console.log('🔄 Audio already setup, skipping...');
        return;
      }

      try {
        console.log('🎤 Setting up audio analyzer...');
        
        // Crear AudioContext (requiere interacción del usuario)
        if (!audioContext.current) {
          audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
          console.log('✅ AudioContext created, state:', audioContext.current.state);
          
          // Resume si está suspended
          if (audioContext.current.state === 'suspended') {
            await audioContext.current.resume();
            console.log('▶️ AudioContext resumed');
          }
        }

        // Crear Analyser
        if (!analyser.current) {
          analyser.current = audioContext.current.createAnalyser();
          analyser.current.fftSize = 512; // Aumentado para mejor resolución
          analyser.current.smoothingTimeConstant = 0.7;
          dataArray.current = new Uint8Array(analyser.current.frequencyBinCount);
          console.log('✅ Analyser created with', analyser.current.frequencyBinCount, 'bins');
        }

        // Conectar el audio al analyser (solo una vez)
        if (!sourceNode.current) {
          sourceNode.current = audioContext.current.createMediaElementSource(audioElement);
          sourceNode.current.connect(analyser.current);
          analyser.current.connect(audioContext.current.destination);
          isAudioSetup.current = true;
          console.log('✅ Audio source connected to analyzer');
        }
      } catch (error) {
        console.error('❌ Audio analyzer setup failed:', error);
        // Si falla, usaremos animación simple
      }
    };

    // Configurar cuando el audio empieza a reproducirse
    const handlePlay = () => {
      console.log('▶️ Audio playing, setting up analyzer...');
      setupAudioAnalyzer();
    };

    audioElement.addEventListener('play', handlePlay);

    return () => {
      audioElement.removeEventListener('play', handlePlay);
    };
  }, [audioElement]);

  // Efecto para sincronizar visemas con audio
  useEffect(() => {
    if (audioUrl && visemes.length > 0) {
      console.log('🎭 Viseme-based lip-sync enabled:', visemes.length, 'visemes');
      setIsPlaying(true);
      startTimeRef.current = Date.now() / 1000;
      currentVisemeIndex.current = 0;
      
      // Cuando el audio termina
      const handleEnded = () => {
        setIsPlaying(false);
        currentVisemeIndex.current = 0;
      };
      
      if (audioElement) {
        audioElement.addEventListener('ended', handleEnded);
        return () => audioElement.removeEventListener('ended', handleEnded);
      }
    }
  }, [audioUrl, visemes, audioElement]);

  // Animación en cada frame
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    
    if (!headMesh.current || !headMesh.current.morphTargetInfluences || !headMesh.current.morphTargetDictionary) {
      return;
    }

    const dict = headMesh.current.morphTargetDictionary;
    const influences = headMesh.current.morphTargetInfluences;

    // ANIMACIÓN DE CABEZA (Idle Breathing - Movimiento sutil natural)
    if (group.current) {
      // Rotación sutil de cabeza (como si estuviera pensando)
      group.current.rotation.y = Math.sin(t * 0.3) * 0.05; // Muy sutil
      group.current.rotation.x = Math.sin(t * 0.4) * 0.02;
      
      // Movimiento vertical sutil (breathing)
      group.current.position.y = Math.sin(t * 0.5) * 0.01;
      
      // Cuando habla, añadir más movimiento
      if (status === 'speaking') {
        group.current.rotation.y += Math.sin(t * 2) * 0.03;
        group.current.rotation.z = Math.sin(t * 1.5) * 0.01;
      }
    }

    // 1. LIP SYNC - ANÁLISIS DE FRECUENCIAS AVANZADO
    if (status === 'speaking') {
      // Sistema mejorado de análisis de audio
      if (analyser.current && dataArray.current && audioContext.current?.state === 'running') {
        try {
          analyser.current.getByteFrequencyData(dataArray.current);
          
          const sampleRate = audioContext.current.sampleRate;
          const binSize = sampleRate / analyser.current.fftSize;
          
          // Analizar diferentes rangos de frecuencia
          const getLevelInRange = (startHz, endHz) => {
            const startBin = Math.floor(startHz / binSize);
            const endBin = Math.floor(endHz / binSize);
            let sum = 0;
            let count = 0;
            for (let i = startBin; i < Math.min(endBin, dataArray.current.length); i++) {
              sum += dataArray.current[i];
              count++;
            }
            return count > 0 ? sum / count / 255 : 0;
          };
          
          // Rangos de frecuencia para diferentes formas de boca
          const lowFreq = getLevelInRange(80, 250);    // Vocales graves (O, U)
          const midFreq = getLevelInRange(250, 800);   // Vocales medias (A, E)
          const highFreq = getLevelInRange(800, 2000); // Vocales agudas (I) y consonantes
          const veryHighFreq = getLevelInRange(2000, 4000); // Consonantes sibilantes (S, F)
          
          const totalEnergy = lowFreq + midFreq + highFreq + veryHighFreq;
          
          // Resetear todos los blendshapes de boca
          const mouthBlendshapes = [
            'jawOpen', 'mouthOpen', 'mouthSmile', 'mouthFunnel', 
            'mouthPucker', 'mouthClose', 'mouthFrown', 'mouthLeft', 'mouthRight'
          ];
          
          mouthBlendshapes.forEach(name => {
            const index = dict[name];
            if (index !== undefined) {
              influences[index] = THREE.MathUtils.lerp(influences[index], 0, 0.25);
            }
          });
          
          if (totalEnergy > 0.05) {
            // VOCAL "O" o "U" - Frecuencias bajas dominantes
            if (lowFreq > midFreq && lowFreq > highFreq) {
              const funnelIndex = dict['mouthFunnel'] ?? dict['mouthPucker'];
              const jawIndex = dict['jawOpen'];
              if (funnelIndex !== undefined) {
                influences[funnelIndex] = THREE.MathUtils.lerp(
                  influences[funnelIndex],
                  Math.min(lowFreq * 1.2, 0.8),
                  0.35
                );
              }
              if (jawIndex !== undefined) {
                influences[jawIndex] = THREE.MathUtils.lerp(
                  influences[jawIndex],
                  Math.min(lowFreq * 0.6, 0.4),
                  0.3
                );
              }
            }
            // VOCAL "A" - Frecuencias medias dominantes
            else if (midFreq > lowFreq && midFreq > highFreq) {
              const jawIndex = dict['jawOpen'] ?? dict['mouthOpen'];
              if (jawIndex !== undefined) {
                influences[jawIndex] = THREE.MathUtils.lerp(
                  influences[jawIndex],
                  Math.min(midFreq * 1.3, 0.9),
                  0.4
                );
              }
            }
            // VOCAL "E" o "I" - Frecuencias altas
            else if (highFreq > lowFreq && highFreq > midFreq) {
              const smileIndex = dict['mouthSmile'];
              const jawIndex = dict['jawOpen'];
              if (smileIndex !== undefined) {
                influences[smileIndex] = THREE.MathUtils.lerp(
                  influences[smileIndex],
                  Math.min(highFreq * 1.1, 0.7),
                  0.35
                );
              }
              if (jawIndex !== undefined) {
                influences[jawIndex] = THREE.MathUtils.lerp(
                  influences[jawIndex],
                  Math.min(highFreq * 0.5, 0.3),
                  0.3
                );
              }
            }
            // CONSONANTES (F, S, SH) - Frecuencias muy altas
            else if (veryHighFreq > 0.1) {
              const frownIndex = dict['mouthFrown'] ?? dict['mouthClose'];
              if (frownIndex !== undefined) {
                influences[frownIndex] = THREE.MathUtils.lerp(
                  influences[frownIndex],
                  Math.min(veryHighFreq * 0.9, 0.6),
                  0.4
                );
              }
            }
            
            // Añadir movimiento general de mandíbula basado en volumen total
            const jawIndex = dict['jawOpen'] ?? dict['mouthOpen'];
            if (jawIndex !== undefined) {
              const currentJaw = influences[jawIndex];
              const targetJaw = Math.min(totalEnergy * 0.7, 0.6);
              influences[jawIndex] = Math.max(
                currentJaw,
                THREE.MathUtils.lerp(currentJaw, targetJaw, 0.3)
              );
            }
          }
        } catch (e) {
          console.warn('Audio analysis error:', e);
        }
      }
      // Fallback: animación simple
      else {
        const jawIndex = dict['jawOpen'] ?? dict['mouthOpen'];
        if (jawIndex !== undefined) {
          const targetMouth = Math.abs(Math.sin(t * 10)) * 0.4 + 0.1;
          influences[jawIndex] = THREE.MathUtils.lerp(
            influences[jawIndex],
            targetMouth,
            0.25
          );
        }
      }
    } else {
      // Cerrar boca cuando no está hablando
      const mouthBlendshapes = [
        'jawOpen', 'mouthOpen', 'mouthSmile', 'mouthFunnel', 
        'mouthPucker', 'mouthClose', 'mouthFrown'
      ];
      
      mouthBlendshapes.forEach(name => {
        const index = dict[name];
        if (index !== undefined) {
          influences[index] = THREE.MathUtils.lerp(influences[index], 0, 0.2);
        }
      });
    }

    // 2. PESTAÑEO REALISTA (con intervalos variables)
    const blinkIndex = dict['eyesClosed'] ?? dict['blink'] ?? dict['eyeBlinkLeft'];
    
    if (blinkIndex !== undefined) {
      // Pestañeo más natural con probabilidad variable
      const blinkChance = status === 'speaking' ? 0.997 : 0.996;
      
      if (Math.random() > blinkChance) {
        influences[blinkIndex] = 1; 
      } else {
        influences[blinkIndex] = THREE.MathUtils.lerp(
          influences[blinkIndex],
          0,
          0.3 // Pestañeo más rápido
        );
      }
    }

    // 3. MICRO-EXPRESIONES (sonrisa sutil cuando está idle)
    const smileIndex = dict['mouthSmile'] ?? dict['mouthSmileLeft'];
    if (smileIndex !== undefined && status === 'idle') {
      const subtleSmile = Math.sin(t * 0.2) * 0.05 + 0.05;
      influences[smileIndex] = THREE.MathUtils.lerp(
        influences[smileIndex],
        subtleSmile,
        0.05
      );
    }
  });

  return (
    <group ref={group} dispose={null} scale={scale}>
      <primitive object={scene} />
    </group>
  );
};

const AvatarScene = ({ status, audioRef, visemes = [], audioUrl }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  // Ocultar spinner después de 3 segundos (tiempo suficiente para cargar)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '100%', borderRadius: '0', overflow: 'hidden', position: 'relative' }}>
      {/* Loading Spinner con cierre manual x seguridad */}
      {isLoading && (
        <div style={{ 
          position: 'absolute',
          top: 0, 
          left: 0,
          width: '100%', 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center',
          zIndex: 20,
          background: 'rgba(15, 23, 42, 0.6)', 
          backdropFilter: 'blur(8px)'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '3px solid rgba(255,255,255,0.1)',
            borderTop: '3px solid #60a5fa',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '15px'
          }}></div>
          <p style={{ color: 'white', fontWeight: 500, fontSize: '0.9rem' }}>Loading Avatar...</p>
          
          {/* Botón de emergencia por si se traba el loader */}
          <button 
            onClick={() => setIsLoading(false)}
            style={{
              marginTop: '20px',
              padding: '6px 16px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '20px',
              color: 'white',
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            Force Show
          </button>
        </div>
      )}

      {/* Cámara FIJA - Encuadre "High Quality" */}
      <Canvas 
        camera={{ position: [0, 1.85, 1.4], fov: 28 }} 
        shadows 
        dpr={2}
        gl={{ 
          antialias: true, 
          toneMapping: THREE.ACESFilmicToneMapping, 
          toneMappingExposure: 0.85, // Exposición reducida para evitar el "blanco lavado"
          outputColorSpace: THREE.SRGBColorSpace 
        }}
      >
        {/* Luz base mínima para contraste dramático */}
        <ambientLight intensity={0.3} />
        
        {/* KEY LIGHT (Principal): Lateral y cálida para dar volumen y realismo a la piel */}
        <spotLight 
          position={[2, 2, 2]} 
          angle={0.4} 
          penumbra={0.5} 
          intensity={2.0} 
          color="#fff7ed" 
          castShadow 
          shadow-bias={-0.0001}
        />

        {/* FILL LIGHT (Relleno): Fría y suave desde el lado opuesto para sombras ricas */}
        <spotLight 
          position={[-2, 1, 2]} 
          angle={0.5} 
          penumbra={1} 
          intensity={1.5} 
          color="#a5b4fc" 
        />

        {/* RIM LIGHT (Recorte): Potente desde atrás para separar del fondo oscuro */}
        <spotLight 
          position={[0, 4, -3]} 
          angle={0.6} 
          penumbra={0.5} 
          intensity={4.0} 
          color="#ffffff" 
        />
        
        {/* Reflejos sutiles (city preset es bueno para gafas, pero bajamos su influencia) */}
        <Environment preset="city" environmentIntensity={0.5} />

        <React.Suspense fallback={null}>
            {/* Avatar en posición neutra */}
            <group position={[0, -1.0, 0]}>
                <ProfessorAvatar 
                  status={status} 
                  audioElement={audioRef?.current} 
                  visemes={visemes}
                  audioUrl={audioUrl}
                  scale={1.7}
                  onLoad={() => setIsLoading(false)}
                />
            </group>
        </React.Suspense>
    
        <ContactShadows opacity={0.5} scale={10} blur={2.5} far={4} resolution={512} color="#000000" />
        
        <OrbitControls 
            enableZoom={false} 
            enablePan={false}
            enableRotate={false}
            target={[0, 1.75, 0]} 
        />
      </Canvas>
    </div>
  );
};

// Precargar el modelo para carga instantánea
useGLTF.preload(MODEL_URL);

export default AvatarScene;
