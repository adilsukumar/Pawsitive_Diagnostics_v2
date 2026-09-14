import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { Card, SectionLabel, SensorPage, SP } from "@/components/SensorPage";
import { Thermometer, AlertTriangle, Activity, CalendarClock } from "lucide-react";
import { addNotification } from "@/lib/notifications";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";

export const Route = createFileRoute("/temp-sense")({ component: TempSensePage });

function generateHistory() {
  const data = [];
  let currentTemp = 38.5;
  
  // Yesterday's data
  for (let i = 0; i < 8; i++) {
    currentTemp += (Math.random() - 0.5) * 0.4;
    data.push({
      label: `Yesterday ${8 + i}:00`,
      temp: Number(currentTemp.toFixed(1))
    });
  }
  // Today's data
  for (let i = 0; i < 8; i++) {
    currentTemp += (Math.random() - 0.5) * 0.4;
    // cap at normal ranges
    if (currentTemp > 39.0) currentTemp = 39.0;
    if (currentTemp < 38.0) currentTemp = 38.0;
    data.push({
      label: `Today ${8 + i}:00`,
      temp: Number(currentTemp.toFixed(1))
    });
  }
  return data;
}

const initialHistory = generateHistory();

function getStatusInfo(t: number) {
  if (t >= 39.5) return { label: "FEVER", color: "#EF4444", bg: "#FEE2E2", alert: true };
  if (t >= 39.2) return { label: "ELEVATED", color: "#F59E0B", bg: "#FEF3C7", alert: false };
  if (t <= 37.8) return { label: "LOW", color: "#3B82F6", bg: "#EFF6FF", alert: false };
  return { label: "NORMAL", color: "#10B981", bg: "#D1FAE5", alert: false };
}

function TempSensePage() {
  const [temperature, setTemperature] = useState(38.5);
  const [isHeating, setIsHeating] = useState(false);
  const timerRef = useRef<number | null>(null);
  
  const [history, setHistory] = useState(initialHistory);

  useEffect(() => {
    // Keep history updated with live temp as the last point
    setHistory(prev => {
      const copy = [...prev];
      copy[copy.length - 1] = { label: "Now", temp: temperature };
      return copy;
    });
  }, [temperature]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 't') {
        setIsHeating(prev => {
          const nextState = !prev;
          if (timerRef.current) clearInterval(timerRef.current);
          
          timerRef.current = window.setInterval(() => {
            setTemperature(t => {
              let delta = 0;
              if (nextState) {
                delta = Math.random() * 0.2 + 0.1; 
              } else {
                delta = t > 38.5 ? -(Math.random() * 0.1 + 0.05) : 0;
              }
              const newT = Number((t + delta).toFixed(1));
              
              if (newT >= 39.5 && t < 39.5) {
                addNotification({ Icon: AlertTriangle, color: "#F44336", text: "High body temperature detected (" + newT + "°C)" });
              }
              return newT;
            });
          }, 300);
          
          return nextState;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const status = getStatusInfo(temperature);

  return (
    <SensorPage
      titleEn="Temperature"
      subtitleEn="TempSense AI"
      descriptorEn="Core body-temperature monitoring"
      requiresCollar={false}
    >
      <Card>
        <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
          <motion.div 
            animate={{ backgroundColor: status.bg }}
            className="flex items-center justify-center" style={{ width: 52, height: 52, borderRadius: 18 }}
          >
            <Thermometer size={24} style={{ color: status.color }} />
          </motion.div>
          <motion.div 
            animate={{ backgroundColor: status.bg }}
            style={{ padding: "6px 12px", borderRadius: 12, display: "flex", gap: 6, alignItems: "center" }}
          >
            {status.alert && (
              <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 0.8 }}>
                <AlertTriangle size={14} color={status.color} />
              </motion.div>
            )}
            <span style={{ fontSize: 12, fontWeight: 700, color: status.color, letterSpacing: "0.05em" }}>
              {status.label}
            </span>
          </motion.div>
        </div>
        
        <SectionLabel jp="Body temperature" en="Live Reading" />
        
        <div className="flex items-end" style={{ marginTop: 8, gap: 8 }}>
          <motion.div 
            key={temperature}
            initial={{ y: -5, opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            style={{ fontSize: 56, fontWeight: 800, color: SP.sumi, lineHeight: 1, letterSpacing: "-0.03em" }}
          >
            {temperature.toFixed(1)}
          </motion.div>
          <div style={{ fontSize: 24, fontWeight: 600, color: SP.usuzumi, paddingBottom: 6 }}>
            °C
          </div>
        </div>
      </Card>
      
      <div style={{ height: 16 }} />
      
      <Card>
         <div className="flex items-center gap-2 mb-4">
            <Activity size={18} color={SP.usuzumi} />
            <SectionLabel jp="History" en="Recent Trends" />
         </div>
         
         <div style={{ height: 180, width: "100%", marginLeft: -15, marginTop: 10 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={status.color} stopOpacity={0.4}/>
                    <stop offset="95%" stopColor={status.color} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" hide />
                <YAxis domain={['dataMin - 0.5', 'dataMax + 0.5']} hide />
                <Tooltip 
                  contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                  labelStyle={{ color: SP.usuzumi, fontSize: 12 }}
                  itemStyle={{ color: SP.sumi, fontWeight: 700 }}
                  formatter={(value: number) => [`${value.toFixed(1)} °C`, "Temp"]}
                />
                <Area type="monotone" dataKey="temp" stroke={status.color} strokeWidth={3} fillOpacity={1} fill="url(#colorTemp)" />
              </AreaChart>
            </ResponsiveContainer>
         </div>
         
         <div className="flex items-center gap-2 mt-4 text-xs font-medium" style={{ color: SP.usuzumi, background: "var(--bg-secondary)", padding: "12px 16px", borderRadius: 12 }}>
            <CalendarClock size={16} />
            <span>Includes data from Yesterday to Now</span>
         </div>
      </Card>
    </SensorPage>
  );
}
