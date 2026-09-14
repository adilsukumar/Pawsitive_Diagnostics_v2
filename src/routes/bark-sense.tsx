import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mic, Activity, CalendarDays, Volume2, Smile, AlertTriangle, Frown, Zap } from "lucide-react";
import { SensorPage } from "@/components/SensorPage";
import { addNotification } from "@/lib/notifications";

export const Route = createFileRoute("/bark-sense")({ component: BarkSensePage });

type EmotionData = { id: string; name: string; desc: string; icon: any; color: string; bg: string; percentage: number };

const EMOTIONS: Record<string, Omit<EmotionData, "percentage">> = {
  n: { id: "n", name: "Normal / Calm", desc: "Ambient background, no distressed or excited vocals.", icon: Smile, color: "#64748B", bg: "#F8FAFC" },
  h: { id: "h", name: "Happy / Playful", desc: "High energy, positive vocalizations.", icon: Smile, color: "#10B981", bg: "#D1FAE5" },
  f: { id: "f", name: "Fear / Anxiety", desc: "Whining or distressed vocal patterns.", icon: AlertTriangle, color: "#F59E0B", bg: "#FEF3C7" },
  a: { id: "a", name: "Angry / Upset", desc: "Aggressive or territorial barking.", icon: Zap, color: "#EF4444", bg: "#FEE2E2" },
  p: { id: "p", name: "Pain / Sad", desc: "Low pitch, prolonged vocal distress.", icon: Frown, color: "#8B5CF6", bg: "#EDE9FE" },
};

function AudioVisualizer({ isRecording, activeColor }: { isRecording: boolean; activeColor: string }) {
  const bars = 24;
  return (
    <div className="flex items-center justify-center gap-1 h-16 w-full">
      {[...Array(bars)].map((_, i) => {
        const randomHeight = isRecording ? Math.random() * 40 + 10 : 4;
        return (
          <motion.div
            key={i}
            animate={{ height: randomHeight }}
            transition={{ type: "spring", stiffness: 300, damping: 20, mass: 0.5 }}
            style={{
              width: 6,
              borderRadius: 3,
              backgroundColor: isRecording ? activeColor : "#E5E7EB",
              opacity: isRecording ? 0.8 + Math.random() * 0.2 : 0.5,
            }}
          />
        );
      })}
    </div>
  );
}

function BarkSensePage() {
  const [currentMood, setCurrentMood] = useState<EmotionData>({ ...EMOTIONS["n"], percentage: 99 });
  const [isRecording, setIsRecording] = useState(true);

  // Fluctuating interval for the visualizer to keep moving
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!isRecording) return;
    const interval = setInterval(() => setTick((t) => t + 1), 100);
    return () => clearInterval(interval);
  }, [isRecording]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (EMOTIONS[key]) {
        setIsRecording(true);
        setCurrentMood({
          ...EMOTIONS[key],
          percentage: Math.floor(Math.random() * (98 - 85 + 1)) + 85
        });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const Icon = currentMood.icon;

  return (
    <SensorPage
      titleEn="BarkSense AI"
      subtitleEn="Vocal Analysis"
      descriptorEn="Real-time emotion & bark decoding"
      bannerGradient="linear-gradient(135deg,var(--bg-card) 0%,var(--acc-pale) 100%)"
      bannerSubtitleColor="var(--acc-strong)"
    >
      {/* Live Audio Visualizer Card */}
      <div className="bg-white p-5 rounded-3xl shadow-sm mb-4 border border-gray-100 flex flex-col items-center justify-center">
        <div className="flex items-center gap-2 mb-4 w-full">
          <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
            <Mic size={16} className="text-red-500" />
          </div>
          <span className="text-sm font-bold text-gray-800 flex-1">Live Collar Mic</span>
          <span className="text-xs font-semibold text-red-500 animate-pulse flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500 block"></span> Live
          </span>
        </div>
        
        <AudioVisualizer isRecording={isRecording} activeColor={currentMood.color} />
        
        <div className="mt-4 text-xs font-medium text-gray-400">
          Analyzing ambient audio & vocal patterns...
        </div>
      </div>

      {/* Current Mood Summary */}
      <div className="bg-white p-5 rounded-3xl shadow-sm mb-4 border border-gray-100">
        <div className="text-sm font-bold text-gray-800 mb-4">Detected Mood</div>
        
        <div className="flex items-center gap-4">
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner"
            style={{ backgroundColor: currentMood.bg, color: currentMood.color }}
          >
            <Icon size={32} strokeWidth={2.5} />
          </div>
          <div className="flex-1">
            <div className="flex items-end gap-2 mb-1">
              <span className="text-2xl font-black" style={{ color: currentMood.color }}>
                {currentMood.percentage}%
              </span>
              <span className="text-base font-bold text-gray-800 pb-1">
                {currentMood.name}
              </span>
            </div>
            <p className="text-xs font-medium text-gray-500 leading-tight">
              {currentMood.desc}
            </p>
          </div>
        </div>
      </div>

      {/* Today's Summary */}
      <div className="bg-[#163E38] text-white p-5 rounded-3xl shadow-md mb-6 relative overflow-hidden">
        <div className="absolute -right-4 -top-4 opacity-10">
          <Activity size={120} />
        </div>
        <h3 className="text-sm font-bold mb-2 opacity-90">Today's Summary</h3>
        <p className="text-sm font-medium leading-relaxed opacity-100">
          Your dog was predominantly <span className="text-green-300 font-bold">Happy and Energetic</span> today. 
          Vocal activity increased during the 2:30 PM park visit. No prolonged distress or pain markers detected.
        </p>
      </div>

      {/* History */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4 px-1">
          <CalendarDays size={18} className="text-gray-400" />
          <h3 className="text-sm font-bold text-gray-800">Recent Bark Events</h3>
        </div>

        <div className="flex flex-col gap-3">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center shrink-0">
              <Volume2 size={18} className="text-green-600" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-green-600">Today, 2:30 PM</span>
                <span className="text-xs font-bold text-gray-400">92% Happy</span>
              </div>
              <p className="text-sm font-medium text-gray-700 leading-snug">
                Playful barking detected during park visit. High energy levels.
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
              <AlertTriangle size={18} className="text-orange-500" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-orange-500">Today, 8:15 AM</span>
                <span className="text-xs font-bold text-gray-400">87% Anxiety</span>
              </div>
              <p className="text-sm font-medium text-gray-700 leading-snug">
                Whining and low-pitch barking noted. Possibly triggered by garbage truck.
              </p>
            </div>
          </div>
        </div>
      </div>
    </SensorPage>
  );
}


