import React from 'react';
import { SystemParams, DebugMetrics } from '../types';
import { Settings, Activity } from 'lucide-react';

interface ControlPanelProps {
  params: SystemParams;
  onChange: (newParams: SystemParams) => void;
  metrics: DebugMetrics;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ params, onChange, metrics }) => {
  const [isOpen, setIsOpen] = React.useState(true);

  const handleChange = (key: keyof SystemParams, value: number | boolean) => {
    onChange({ ...params, [key]: value });
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 bg-white/90 p-3 rounded-full shadow-lg border border-gray-300 hover:bg-white transition z-50"
      >
        <Settings size={24} className="text-gray-700" />
      </button>
    );
  }

  return (
    <div className="fixed top-4 right-4 w-80 bg-[#F8F1E3]/95 border border-[#3B3B3B]/20 backdrop-blur-sm p-5 rounded-xl shadow-xl z-50 font-sans text-sm text-[#3B3B3B] max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-4 border-b border-[#3B3B3B]/10 pb-2">
        <h2 className="font-bold text-lg flex items-center gap-2">
          <Settings size={18} /> Controls
        </h2>
        <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-black">✕</button>
      </div>

      <div className="space-y-4">
        {/* Toggle Debug */}
        <div className="flex items-center justify-between">
          <label className="font-medium">Debug Overlay</label>
          <input 
            type="checkbox" 
            checked={params.showDebug}
            onChange={(e) => handleChange('showDebug', e.target.checked)}
            className="w-4 h-4 accent-[#D66158]"
          />
        </div>

        {/* Integration Strength */}
        <div>
          <label className="block mb-1 font-medium">Paper Texture (Integration)</label>
          <input 
            type="range" min="0" max="1" step="0.05"
            value={params.integrationStrength}
            onChange={(e) => handleChange('integrationStrength', parseFloat(e.target.value))}
            className="w-full accent-[#3B3B3B]"
          />
        </div>

        {/* Flower Controls */}
        <div className="space-y-2 pt-2 border-t border-[#3B3B3B]/10">
          <h3 className="font-semibold text-[#D66158]">Flowers</h3>
          <div>
            <label className="block text-xs mb-1">Size</label>
            <input 
              type="range" min="10" max="100" 
              value={params.flowerSize}
              onChange={(e) => handleChange('flowerSize', parseFloat(e.target.value))}
              className="w-full accent-[#D66158]"
            />
          </div>
          <div>
            <label className="block text-xs mb-1">Density</label>
            <input 
              type="range" min="0.1" max="2.0" step="0.1"
              value={params.flowerDensity}
              onChange={(e) => handleChange('flowerDensity', parseFloat(e.target.value))}
              className="w-full accent-[#D66158]"
            />
          </div>
        </div>

        {/* Rain Controls */}
        <div className="space-y-2 pt-2 border-t border-[#3B3B3B]/10">
          <h3 className="font-semibold text-[#8EB7E0]">Rain</h3>
          <div>
            <label className="block text-xs mb-1">Speed</label>
            <input 
              type="range" min="5" max="30" 
              value={params.rainSpeed}
              onChange={(e) => handleChange('rainSpeed', parseFloat(e.target.value))}
              className="w-full accent-[#8EB7E0]"
            />
          </div>
          <div>
            <label className="block text-xs mb-1">Density</label>
            <input 
              type="range" min="0.1" max="3.0" step="0.1"
              value={params.rainDensity}
              onChange={(e) => handleChange('rainDensity', parseFloat(e.target.value))}
              className="w-full accent-[#8EB7E0]"
            />
          </div>
        </div>

         {/* Cloud Controls */}
         <div className="space-y-2 pt-2 border-t border-[#3B3B3B]/10">
          <h3 className="font-semibold text-[#9BCB87]">Clouds</h3>
          <div>
            <label className="block text-xs mb-1">Complexity</label>
            <input 
              type="range" min="0.1" max="1.0" step="0.1"
              value={params.cloudComplexity}
              onChange={(e) => handleChange('cloudComplexity', parseFloat(e.target.value))}
              className="w-full accent-[#9BCB87]"
            />
          </div>
        </div>
      </div>

      {/* Live Metrics */}
      {params.showDebug && (
        <div className="mt-6 pt-4 border-t-2 border-[#3B3B3B] text-xs font-mono space-y-1 text-gray-600 bg-white/50 p-2 rounded">
          <div className="flex items-center gap-2 font-bold text-[#3B3B3B] mb-2">
            <Activity size={12} /> Live Metrics
          </div>
          <div className="flex justify-between"><span>FPS:</span> <span>{metrics.fps.toFixed(0)}</span></div>
          <div className="flex justify-between"><span>Hand Delta:</span> <span>{metrics.handHeightDelta.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Palm Open:</span> <span>{metrics.palmOpenness.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Head Tilt:</span> <span>{metrics.headTilt.toFixed(1)}°</span></div>
          <div className="flex justify-between"><span>Raised:</span> <span className={metrics.isHandRaised ? "text-green-600 font-bold" : "text-red-500"}>{metrics.isHandRaised ? "YES" : "NO"}</span></div>
          <div className="flex justify-between"><span>Flowers:</span> <span>{(metrics.palmOpenness * 100).toFixed(0)}% Bloom</span></div>
        </div>
      )}
    </div>
  );
};

export default ControlPanel;
