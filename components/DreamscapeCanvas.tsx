import React, { useRef, useEffect, useState, useCallback } from 'react';
import { SystemParams, DebugMetrics, HolisticResults, Particle, Bird, Landmark } from '../types';
import { drawSketchLine, drawFlower, drawCloud, drawBird, drawLightning, COLORS, FLOWER_COLORS } from '../utils/pencilRenderer';
import { distance, calculateAngle, randomRange, lerp, mapRange } from '../utils/math';

interface DreamscapeCanvasProps {
  params: SystemParams;
  setMetrics: (m: DebugMetrics) => void;
}

// Global variable for MediaPipe to avoid React closure staleness in callbacks
let holisticInstance: any = null;

// Extended state for Lightning
interface LightningBolt {
  x: number;
  y: number;
  height: number;
  life: number;
}

const DreamscapeCanvas: React.FC<DreamscapeCanvasProps> = ({ params, setMetrics }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  // Simulation State
  const gameState = useRef({
    particles: [] as Particle[],
    birds: [] as Bird[],
    lightningBolts: [] as LightningBolt[],
    isHandRaised: false,
    handRaisedTimer: 0,
    palmOpenTimer: 0,
    isStormy: false,
    weatherMode: 'sun' as 'sun' | 'cloud',
    lastTapTime: 0,
    fps: 0,
    frameCount: 0,
    lastFpsTime: 0,
    nextLightningTime: 0,
    // Store previous frame landmarks to calculate velocity for bird shake-off
    prevLandmarks: {} as Record<string, {x: number, y: number}>
  });

  // MediaPipe Results Container
  const resultsRef = useRef<HolisticResults | null>(null);

  // Initialize Camera and MediaPipe
  useEffect(() => {
    const initVision = async () => {
      if (!videoRef.current || !canvasRef.current) return;
      
      // Wait for scripts to load (simplistic check)
      if (!(window as any).Holistic) {
        console.warn("Waiting for MediaPipe scripts...");
        setTimeout(initVision, 500);
        return;
      }

      const holistic = new (window as any).Holistic({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`;
        }
      });

      holistic.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        refineFaceLandmarks: true, // For better iris/ear tracking
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      holistic.onResults((results: any) => {
        resultsRef.current = {
          poseLandmarks: results.poseLandmarks,
          leftHandLandmarks: results.leftHandLandmarks,
          rightHandLandmarks: results.rightHandLandmarks,
          faceLandmarks: results.faceLandmarks
        };
      });

      holisticInstance = holistic;

      const camera = new (window as any).Camera(videoRef.current, {
        onFrame: async () => {
          if (holisticInstance && videoRef.current) {
            await holisticInstance.send({ image: videoRef.current });
          }
        },
        width: 1280,
        height: 720
      });
      
      camera.start();
    };

    initVision();

    return () => {
      if (holisticInstance) {
        holisticInstance.close();
      }
    };
  }, []);

  // Main Render Loop
  const animate = useCallback((time: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const video = videoRef.current;
    const state = gameState.current;

    if (!canvas || !ctx || !video) {
      requestRef.current = requestAnimationFrame(animate);
      return;
    }

    // 1. Calculate Delta Time
    const deltaTime = (time - lastTimeRef.current) / 1000;
    lastTimeRef.current = time;

    // FPS Calculation
    state.frameCount++;
    if (time - state.lastFpsTime >= 1000) {
      state.fps = state.frameCount;
      state.frameCount = 0;
      state.lastFpsTime = time;
    }

    // 2. Clear & Draw Webcam Feed
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw raw video first
    ctx.save();
    // Mirror the video horizontally for natural interaction
    ctx.scale(-1, 1);
    ctx.translate(-canvas.width, 0);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    // 3. Process Logic based on Vision Data
    const results = resultsRef.current;
    let handHeightDelta = 0;
    let palmOpenness = 0;
    let headTilt = 0;
    let isHandRaised = false;

    // Helper for mirrored coord mapping
    const getLandmarkPos = (lm: Landmark) => ({
      x: (1 - lm.x) * canvas.width, 
      y: lm.y * canvas.height
    });

    if (results && results.poseLandmarks) {
      // --- Gesture 4.1: Hand Raise ---
      const lShoulder = results.poseLandmarks[11];
      const lWrist = results.poseLandmarks[15];
      const rShoulder = results.poseLandmarks[12];
      const rWrist = results.poseLandmarks[16];

      const leftDelta = (lShoulder?.visibility || 0) > 0.5 ? lShoulder.y - lWrist.y : 0;
      const rightDelta = (rShoulder?.visibility || 0) > 0.5 ? rShoulder.y - rWrist.y : 0;
      handHeightDelta = Math.max(leftDelta, rightDelta);

      if (!state.isHandRaised && handHeightDelta > 0.17) {
        state.isHandRaised = true;
      } else if (state.isHandRaised && handHeightDelta < 0.13) {
        state.isHandRaised = false;
      }
      isHandRaised = state.isHandRaised;

      // --- Gesture 4.2: Palm Openness ---
      const calculatePalmOpenness = (handLms: Landmark[]) => {
        if (!handLms) return 0;
        const wrist = handLms[0];
        const middleFingerTip = handLms[12];
        const middleFingerMcp = handLms[9];
        const distFull = distance(wrist, middleFingerTip);
        const distPalm = distance(wrist, middleFingerMcp);
        const ratio = distFull / (distPalm || 0.001);
        return Math.min(Math.max((ratio - 0.8) / 1.5, 0), 1);
      };

      const lOpen = calculatePalmOpenness(results.leftHandLandmarks as Landmark[]);
      const rOpen = calculatePalmOpenness(results.rightHandLandmarks as Landmark[]);
      palmOpenness = Math.max(lOpen, rOpen);

      // --- Gesture 4.3: Head Tilt ---
      const lEar = results.poseLandmarks[7];
      const rEar = results.poseLandmarks[8];
      if (lEar && rEar) {
        const angleRad = Math.atan2(rEar.y - lEar.y, rEar.x - lEar.x);
        let deg = angleRad * (180/Math.PI);
        headTilt = Math.abs(deg); 
      }

      // --- Gesture 4.4: Storm Mode ---
      if (palmOpenness > 0.9) {
        state.palmOpenTimer += deltaTime;
      } else {
        state.palmOpenTimer = 0;
      }
      state.isStormy = state.palmOpenTimer > 1.5;

      // --- Gesture 4.6: Finger Tap (Mode Switch) - CLOUDS ONLY ---
      const detectTap = (hand: Landmark[]) => {
        if (!hand) return false;
        const d = distance(hand[4], hand[8]);
        return d < 0.05; 
      };
      
      const isTapping = detectTap(results.leftHandLandmarks as Landmark[]) || detectTap(results.rightHandLandmarks as Landmark[]);
      if (isTapping && time - state.lastTapTime > 1000) { 
        // TOGGLE CLOUDS
        state.weatherMode = state.weatherMode === 'sun' ? 'cloud' : 'sun';
        state.lastTapTime = time;

        if (state.weatherMode === 'cloud') {
           // Spawn 3-5 clouds immediately on toggle
           const count = Math.floor(randomRange(3, 6));
           for(let i=0; i<count; i++) {
             state.particles.push({
               id: Math.random(),
               x: randomRange(0, canvas.width),
               y: randomRange(20, 200),
               life: 1000,
               maxLife: 1000,
               vx: randomRange(0.2, 0.8), // drift slowly
               vy: 0,
               scale: randomRange(0.8, 1.5),
               color: COLORS.WHITE,
               type: 'cloud_part'
             });
           }
        } else {
           // Clear clouds
           state.particles = state.particles.filter(p => p.type !== 'cloud_part');
        }
      }
    }

    // 4. Render Effects

    // --- A. Paper Texture Overlay ---
    if (params.integrationStrength > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'overlay';
      ctx.fillStyle = params.integrationStrength > 0.5 ? '#F8F1E3' : '#aa9988';
      ctx.globalAlpha = params.integrationStrength * 0.3;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }

    // --- B. Rain ---
    const rainIntensity = (headTilt > 10 ? mapRange(headTilt, 10, 45, 0, 1) : 0) + (state.isStormy ? 1 : 0);
    const targetRainCount = rainIntensity * 500 * params.rainDensity;
    
    if (state.particles.filter(p => p.type === 'rain').length < targetRainCount) {
       for(let i=0; i<5; i++) {
         state.particles.push({
           id: Math.random(),
           x: randomRange(0, canvas.width),
           y: -20,
           life: 1,
           maxLife: 1,
           vx: (state.isStormy ? 5 : 0) + randomRange(-1, 1),
           vy: params.rainSpeed * (1 + (state.isStormy ? 1 : 0)),
           scale: 1,
           color: COLORS.BLUE,
           type: 'rain'
         });
       }
    }

    // --- C. Flowers ---
    if (isHandRaised && results?.poseLandmarks) {
      const activeWrists = [];
      if (results.poseLandmarks[15].visibility! > 0.5) activeWrists.push(results.poseLandmarks[15]);
      if (results.poseLandmarks[16].visibility! > 0.5) activeWrists.push(results.poseLandmarks[16]);

      activeWrists.forEach(wrist => {
        if (Math.random() < 0.1 * params.flowerDensity) {
          const pos = getLandmarkPos(wrist);
          // Pick Random Color from Palette
          const randomColor = FLOWER_COLORS[Math.floor(Math.random() * FLOWER_COLORS.length)];
          
          state.particles.push({
            id: Math.random(),
            x: pos.x + randomRange(-50, 50),
            y: pos.y + randomRange(-50, 50),
            life: 1.0,
            maxLife: 1.0,
            vx: 0,
            vy: 0.5, 
            scale: 0, 
            color: randomColor,
            type: 'flower'
          });
        }
      });
    }

    // --- D. Lightning Logic ---
    if (state.isStormy) {
       if (time > state.nextLightningTime) {
          // Spawn Bolt
          state.lightningBolts.push({
             x: randomRange(canvas.width * 0.2, canvas.width * 0.8),
             y: 0,
             height: randomRange(canvas.height * 0.5, canvas.height * 0.8),
             life: 10 // frames
          });
          state.nextLightningTime = time + randomRange(700, 2000); // Next bolt in 0.7-2s
       }
    }

    // Render Lightning
    state.lightningBolts = state.lightningBolts.filter(bolt => {
       bolt.life--;
       // Flash effect
       if (bolt.life > 7) {
          ctx.save();
          ctx.fillStyle = 'white';
          ctx.globalAlpha = 0.1;
          ctx.fillRect(0,0, canvas.width, canvas.height);
          ctx.restore();
       }
       drawLightning(ctx, bolt.x, bolt.y, bolt.height);
       return bolt.life > 0;
    });

    // --- E. Update & Draw Particles ---
    state.particles = state.particles.filter(p => {
      if (p.type === 'rain') {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y > canvas.height) return false;
        drawSketchLine(ctx, p.x, p.y, p.x - p.vx*2, p.y - 15, p.color, 1.5);
        return true;
      }
      
      if (p.type === 'flower') {
        p.scale = lerp(p.scale, 1, 0.05);
        p.y += p.vy;
        p.life -= 0.005;
        
        const bloomMult = mapRange(palmOpenness, 0, 1, 0.5, 1.5);
        if (p.life <= 0) return false;
        
        ctx.globalAlpha = p.life;
        drawFlower(ctx, p.x, p.y, params.flowerSize * p.scale * bloomMult, params.flowerDensity, p.color);
        ctx.globalAlpha = 1;
        return true;
      }

      if (p.type === 'cloud_part') {
        p.x += p.vx;
        // Wrap around for continuous feel if triggered, or just let them drift out
        if (p.x > canvas.width + 100) p.x = -100;
        drawCloud(ctx, p.x, p.y, 150 * p.scale, params.cloudComplexity);
        return true;
      }

      return false;
    });

    // --- F. Birds (Perching Logic) ---
    // Make sure we have enough birds
    if (state.birds.length < 3 && Math.random() < 0.01) {
       state.birds.push({
         id: Math.random(),
         x: Math.random() < 0.5 ? -50 : canvas.width + 50,
         y: randomRange(0, canvas.height/2),
         targetX: 0,
         targetY: 0,
         state: 'flying',
         flapPhase: 0,
         perchTarget: undefined // undefined = no target yet
       });
    }

    // Define Anchors based on current frame
    const anchors: Record<string, {x: number, y: number} | null> = {};
    if (results?.poseLandmarks) {
        anchors['shoulder_l'] = results.poseLandmarks[11].visibility! > 0.5 ? getLandmarkPos(results.poseLandmarks[11]) : null;
        anchors['shoulder_r'] = results.poseLandmarks[12].visibility! > 0.5 ? getLandmarkPos(results.poseLandmarks[12]) : null;
        anchors['head'] = results.poseLandmarks[0].visibility! > 0.5 ? getLandmarkPos(results.poseLandmarks[0]) : null;
        anchors['hand_l'] = results.poseLandmarks[15].visibility! > 0.5 ? getLandmarkPos(results.poseLandmarks[15]) : null;
        anchors['hand_r'] = results.poseLandmarks[16].visibility! > 0.5 ? getLandmarkPos(results.poseLandmarks[16]) : null;
    }

    state.birds.forEach(bird => {
       bird.flapPhase += 0.2;
       
       if (bird.state === 'flying') {
          // Find nearest available anchor or pick random one
          let bestDist = 10000;
          let bestKey: string | null = null;
          
          Object.keys(anchors).forEach(key => {
             const pos = anchors[key];
             if (pos) {
                const d = Math.sqrt(Math.pow(pos.x - bird.x, 2) + Math.pow(pos.y - bird.y, 2));
                if (d < bestDist) {
                   bestDist = d;
                   bestKey = key;
                }
             }
          });

          if (bestKey && bestDist < 300) { // If close enough to care
             const target = anchors[bestKey];
             if (target) {
                // Fly towards it
                const dx = target.x - bird.x;
                const dy = (target.y - 20) - bird.y; // Sit slightly above
                bird.x += dx * 0.05;
                bird.y += dy * 0.05;

                // Land?
                if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
                   bird.state = 'perched';
                   bird.perchTarget = bestKey as any;
                }
             }
          } else {
             // Idle fly
             bird.x += Math.sin(time * 0.001 + bird.id) * 2;
             bird.y += Math.cos(time * 0.001 + bird.id) * 1;
             // Keep bounds
             if(bird.x < 0) bird.x += 2;
             if(bird.x > canvas.width) bird.x -= 2;
             if(bird.y < 0) bird.y += 2;
             if(bird.y > canvas.height) bird.y -= 2;
          }
       } else if (bird.state === 'perched' && bird.perchTarget) {
          const anchor = anchors[bird.perchTarget];
          
          // Check shake off
          let shaken = false;
          if (state.prevLandmarks[bird.perchTarget] && anchor) {
             const prev = state.prevLandmarks[bird.perchTarget];
             const d = Math.sqrt(Math.pow(prev.x - anchor.x, 2) + Math.pow(prev.y - anchor.y, 2));
             if (d > 20) shaken = true; // Moved > 20px in one frame
          }

          if (anchor && !shaken) {
             // Stick to it
             bird.x = lerp(bird.x, anchor.x, 0.5);
             bird.y = lerp(bird.y, anchor.y - 15, 0.5);
          } else {
             // Fly away
             bird.state = 'flying';
             bird.perchTarget = undefined;
             bird.y -= 30; // Jump up
             // Fly away from center
             bird.x += (bird.x > canvas.width/2 ? 10 : -10); 
          }
       }

       drawBird(ctx, bird.x, bird.y, bird.flapPhase, COLORS.GRAPHITE, bird.state === 'perched');
    });

    // Update previous landmarks for next frame velocity check
    Object.keys(anchors).forEach(key => {
       if (anchors[key]) {
          state.prevLandmarks[key] = anchors[key]!;
       }
    });

    // 5. Update UI Metrics
    if (params.showDebug) {
      setMetrics({
        wristY: 0,
        shoulderY: 0,
        handHeightDelta,
        palmOpenness,
        headTilt,
        isHandRaised,
        raindropCount: state.particles.filter(p => p.type === 'rain').length,
        cloudCount: state.particles.filter(p => p.type === 'cloud_part').length,
        birdCount: state.birds.length,
        fps: state.fps
      });
    }
    
    requestRef.current = requestAnimationFrame(animate);
  }, [params, setMetrics]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [animate]);

  return (
    <div className="relative w-full h-full bg-[#F8F1E3]">
      {/* Hidden Video for processing */}
      <video
        ref={videoRef}
        className="absolute opacity-0 pointer-events-none"
        playsInline
        muted
      />
      {/* Main Rendering Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full object-cover"
      />
      
      {/* Initial Loading State */}
      {!holisticInstance && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#F8F1E3] z-10">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[#3B3B3B] mb-2">Loading Dreamscape...</h1>
            <p className="text-[#D66158]">Please allow camera access.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DreamscapeCanvas;