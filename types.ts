export interface SystemParams {
  flowerSize: number;
  flowerDensity: number;
  cloudComplexity: number;
  rainSpeed: number;
  rainDensity: number;
  textureStrength: number;
  integrationStrength: number;
  showDebug: boolean;
}

export interface DebugMetrics {
  wristY: number;
  shoulderY: number;
  handHeightDelta: number;
  palmOpenness: number;
  headTilt: number;
  isHandRaised: boolean;
  raindropCount: number;
  cloudCount: number;
  birdCount: number;
  fps: number;
}

// MediaPipe Types (Simplified for use from window object)
export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface HolisticResults {
  poseLandmarks?: Landmark[];
  leftHandLandmarks?: Landmark[];
  rightHandLandmarks?: Landmark[];
  faceLandmarks?: Landmark[];
}

// Visual Entities
export interface Particle {
  id: number;
  x: number;
  y: number;
  life: number;
  maxLife: number;
  vx: number;
  vy: number;
  scale: number;
  color: string;
  type: 'rain' | 'flower' | 'cloud_part';
}

export interface Bird {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  state: 'flying' | 'perched';
  perchTarget?: 'shoulder_l' | 'shoulder_r' | 'head' | 'hand_l' | 'hand_r';
  flapPhase: number;
}
