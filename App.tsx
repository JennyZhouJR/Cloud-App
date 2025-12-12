import React, { useState } from 'react';
import DreamscapeCanvas from './components/DreamscapeCanvas';
import ControlPanel from './components/ControlPanel';
import { SystemParams, DebugMetrics } from './types';

const App: React.FC = () => {
  const [params, setParams] = useState<SystemParams>({
    flowerSize: 40,
    flowerDensity: 1.0,
    cloudComplexity: 0.5,
    rainSpeed: 15,
    rainDensity: 1.0,
    textureStrength: 0.5,
    integrationStrength: 0.2, // Light paper texture
    showDebug: false
  });

  const [metrics, setMetrics] = useState<DebugMetrics>({
    wristY: 0,
    shoulderY: 0,
    handHeightDelta: 0,
    palmOpenness: 0,
    headTilt: 0,
    isHandRaised: false,
    raindropCount: 0,
    cloudCount: 0,
    birdCount: 0,
    fps: 0
  });

  return (
    <div className="w-screen h-screen overflow-hidden relative font-sans">
      <DreamscapeCanvas 
        params={params} 
        setMetrics={setMetrics} 
      />
      
      <ControlPanel 
        params={params} 
        onChange={setParams} 
        metrics={metrics}
      />
      
      {/* Instructions Overlay (Fades out) */}
      <div className="absolute bottom-8 left-8 text-[#3B3B3B] pointer-events-none opacity-80 mix-blend-multiply max-w-md">
        <h1 className="text-3xl font-bold mb-2 tracking-tighter">Colored-Pencil Dreamscape</h1>
        <p className="text-sm font-medium leading-relaxed">
          • Raise hands to grow flowers<br/>
          • Open/Close palms to bloom<br/>
          • Tilt head (>10°) for rain<br/>
          • Tap index & thumb to toggle clouds
        </p>
      </div>
    </div>
  );
};

export default App;
