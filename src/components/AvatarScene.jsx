import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, OrbitControls, Environment, ContactShadows, Center } from '@react-three/drei';
import * as THREE from 'three';

// Avatar de Ready Player Me (Externo)
// Parámetros: morphTargets=ARKit (habilita blendshapes), textureAtlas=1024 (optimiza texturas)
const MODEL_URL = 'https://models.readyplayer.me/69670226e0839cba1b121dfe.glb?morphTargets=ARKit&textureAtlas=1024';

// Componente del Avatar con lip-sync real
const ProfessorAvatar = ({ status, audioElement, scale = 1.7 }) => {
  const group = useRef();
  const { scene } = useGLTF(MODEL_URL);
  const headMesh = useRef();
  
  // Audio Analysis
  const audioContext = useRef(null);
  const analyser = useRef(null);
  const dataArray = useRef(null);
  const sourceNode = useRef(null);
  const isAudioSetup = useRef(false);

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

    // 1. LIP SYNC
    const mouthOpenIndex = dict['viseme_aa'] ?? dict['mouthOpen'] ?? dict['jawOpen'] ?? dict['mouthSmile'];
    
    if (mouthOpenIndex !== undefined) {
      if (status === 'speaking') {
        let targetMouth = 0;

        // Intentar usar análisis de audio real
        if (analyser.current && dataArray.current && audioContext.current?.state === 'running') {
          try {
            analyser.current.getByteFrequencyData(dataArray.current);
            
            // Calcular volumen en frecuencias de voz (100Hz-300Hz aprox)
            const sampleRate = audioContext.current.sampleRate;
            const binSize = sampleRate / analyser.current.fftSize;
            const startBin = Math.floor(100 / binSize);
            const endBin = Math.floor(300 / binSize);
            
            let sum = 0;
            let count = 0;
            for (let i = startBin; i < Math.min(endBin, dataArray.current.length); i++) {
              sum += dataArray.current[i];
              count++;
            }
            
            if (count > 0) {
              const average = sum / count;
              const normalizedVolume = average / 255;
              targetMouth = normalizedVolume > 0.03 ? Math.min(normalizedVolume * 0.8, 0.6) : 0;
            }
          } catch (e) {
            console.warn('Audio analysis error:', e);
          }
        }
        
        // Fallback: animación simple si no hay audio analysis
        if (targetMouth === 0) {
          targetMouth = Math.abs(Math.sin(t * 10)) * 0.4 + 0.1;
        }

        // Suavizar transición
        influences[mouthOpenIndex] = THREE.MathUtils.lerp(
          influences[mouthOpenIndex],
          targetMouth,
          0.25
        );
      } else {
        // Cerrar boca
        influences[mouthOpenIndex] = THREE.MathUtils.lerp(
          influences[mouthOpenIndex],
          0,
          0.2
        );
      }
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

const AvatarScene = ({ status, audioRef }) => {
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
