import { createFileRoute } from "@tanstack/react-router";
import { SensorPage } from "@/components/SensorPage";
import { calculateScores } from "@/lib/score";
import { useState, useEffect } from "react";
import { useLightSenseApi, type Pixel } from "@/lib/useLightSenseApi";
import { Settings, Lightbulb, ActivitySquare } from "lucide-react";

export const Route = createFileRoute("/light-sense")({ component: LightSensePage });

function LightSensePage() {
  const { live } = useCollar();
  const scores = calculateScores(78, live.motion?.value, live.skin?.value, live.bark?.value, live.temp?.value);
  
  const api = useLightSenseApi();
  const [pixels, setPixels] = useState<Pixel[]>([
    { r: 255, g: 0, b: 120 },
    { r: 0, g: 255, b: 80 },
    { r: 20, g: 40, b: 255 },
  ]);
  const [brightness, setBrightness] = useState(180);
  const [healthScore, setHealthScore] = useState(94);
  const [isCharging, setIsCharging] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [tempEndpoint, setTempEndpoint] = useState(api.endpoint);

  const hexToRgb = (hex: string): Pixel => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };

  const rgbToHex = (p: Pixel) => {
    return "#" + (1 << 24 | p.r << 16 | p.g << 8 | p.b).toString(16).slice(1).toUpperCase();
  };

  const updatePixel = (index: number, hex: string) => {
    const newPixels = [...pixels];
    newPixels[index] = hexToRgb(hex);
    setPixels(newPixels);
    api.updateCustomLights(newPixels, brightness);
  };

  const handleBrightness = (val: number) => {
    setBrightness(val);
    api.updateCustomLights(pixels, val);
  };

    
    
  return (
    <SensorPage score={scores.lightScore}
      titleEn="LightSense AI"
      subtitleEn="Hardware Control"
      descriptorEn="Ambient & RGB Control"
      bannerGradient="linear-gradient(135deg,var(--bg-card) 0%,var(--acc-pale) 100%)"
      bannerSubtitleColor="var(--acc-strong)"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-[#163E38]">ESP32 Control Center</h2>
        <button onClick={() => setShowSettings(!showSettings)} className="p-2 bg-gray-100 rounded-full text-gray-600">
          <Settings size={18} />
        </button>
      </div>

      {showSettings && (
        <div className="bg-white p-4 rounded-xl shadow-sm mb-6 border border-gray-100">
          <label className="block text-xs font-bold text-gray-500 mb-1">LightSense API Endpoint</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={tempEndpoint}
              onChange={e => setTempEndpoint(e.target.value)}
              className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm"
              placeholder="http://192.168.1.X:8000"
            />
            <button 
              onClick={() => { api.saveEndpoint(tempEndpoint); setShowSettings(false); }}
              className="bg-[#163E38] text-white px-4 py-2 rounded-lg text-sm font-bold"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Custom LED Control */}
      <div className="bg-white p-4 rounded-2xl shadow-sm mb-4 border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb size={20} className="text-yellow-500" />
          <h3 className="font-bold text-gray-800">Custom Pixels (3x WS2812B)</h3>
        </div>
        
        <div className="flex justify-between gap-4 mb-6">
          {pixels.map((p, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <span className="text-xs font-medium text-gray-500">LED {i + 1}</span>
              <input 
                type="color" 
                value={rgbToHex(p)} 
                onChange={e => updatePixel(i, e.target.value)}
                className="w-12 h-12 rounded-full cursor-pointer border-0 p-0"
                style={{ backgroundColor: rgbToHex(p) }}
              />
            </div>
          ))}
        </div>

        <div className="mb-2">
          <div className="flex justify-between text-xs font-medium text-gray-500 mb-2">
            <span>Brightness</span>
            <span>{Math.round((brightness / 255) * 100)}%</span>
          </div>
          <input 
            type="range" 
            min="0" max="255" 
            value={brightness}
            onChange={e => handleBrightness(Number(e.target.value))}
            className="w-full accent-[#163E38]"
          />
        </div>
      </div>

      {/* Status LED Control */}
      <div className="bg-white p-4 rounded-2xl shadow-sm mb-6 border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <ActivitySquare size={20} className="text-red-400" />
          <h3 className="font-bold text-gray-800">Status Pixel</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Simulated Health</label>
            <input 
              type="number" 
              value={healthScore}
              onChange={e => setHealthScore(Number(e.target.value))}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={isCharging}
                onChange={e => setIsCharging(e.target.checked)}
                className="w-5 h-5 accent-[#163E38] rounded"
              />
              <span className="text-sm font-medium text-gray-700">Charging (Blue)</span>
            </label>
          </div>
        </div>

        <button 
          onClick={() => api.updateStatusLight(healthScore, isCharging, brightness)}
          className="w-full bg-[#163E38] text-white font-bold py-3 rounded-xl shadow-lg active:scale-95 transition-transform"
        >
          Push Status to Collar
        </button>
      </div>

      
    </SensorPage>
  );
}
