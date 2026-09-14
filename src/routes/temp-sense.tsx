import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { Card, SectionLabel, SensorPage, SP } from "@/components/SensorPage";
import { Thermometer, AlertTriangle, Activity, CalendarClock } from "lucide-react";
import { addNotification } from "@/lib/notifications";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";

export const Route = createFileRoute("/temp-sense")({ component: TempSensePage });

// Range requested: Sep 13th 9:00 AM to Sep 14th 11:30 AM
const STATIC_MOCK_HISTORY = [
  { label: "13 Sep, 09:00 AM", temp: 38.4 },
  { label: "13 Sep, 11:00 AM", temp: 38.5 },
  { label: "13 Sep, 01:30 PM", temp: 38.6 },
  { label: "13 Sep, 04:00 PM", temp: 39.6 }, // Anomaly spike!
  { label: "13 Sep, 04:15 PM", temp: 39.8 }, // Anomaly peak
  { label: "13 Sep, 05:00 PM", temp: 38.8 }, // Cooling down
  { label: "13 Sep, 08:00 PM", temp: 38.5 },
  { label: "14 Sep, 08:00 AM", temp: 38.4 },
  { label: "14 Sep, 10:00 AM", temp: 38.5 },
  { label: "14 Sep, 11:30 AM", temp: 38.6 },
];

function getStatusInfo(t: number) {
  if (t >= 39.5) return { label: "FEVER", color: "#EF4444", bg: "#FEE2E2", alert: true };
  if (t >= 39.2) return { label: "ELEVATED", color: "#F59E0B", bg: "#FEF3C7", alert: false };
  if (t <= 37.8) return { label: "LOW", color: "#3B82F6", bg: "#EFF6FF", alert: false };
  return { label: "NORMAL", color: "#10B981", bg: "#D1FAE5", alert: false };
}

function TempSensePage() {
  const [temperature, setTemperature] = useState(38.6);
  const [isHeating, setIsHeating] = useState(false);
  const timerRef = useRef<number | null>(null);
  const defaultFluctuationRef = useRef<number | null>(null);
  
  const [history, setHistory] = useState(STATIC_MOCK_HISTORY);

  // Background slight fluctuation
  useEffect(() => {
    const minTime = 3000;
    const maxTime = 7000;

    const fluctuate = () => {
      if (!isHeating) { // don't interfere if 't' anomaly simulation is running
        setTemperature(prev => {
          // slight fluctuation: ±0.1
          const delta = (Math.random() > 0.5 ? 0.1 : -0.1);
          let next = Number((prev + delta).toFixed(1));
          // keep it in a normal healthy range (38.3 - 38.8) unless it was already pushed out
          if (next > 38.9) next = 38.8;
          if (next < 38.3) next = 38.4;
          return next;
        });
      }
      
      const nextDelay = Math.random() * (maxTime - minTime) + minTime;
      defaultFluctuationRef.current = window.setTimeout(fluctuate, nextDelay);
    };
    
    defaultFluctuationRef.current = window.setTimeout(fluctuate, minTime);
    return () => {
      if (defaultFluctuationRef.current) clearTimeout(defaultFluctuationRef.current);
    };
  }, [isHeating]);

  useEffect(() => {
    // Keep history updated with live temp as the last point, replacing the 11:30AM point
    setHistory(prev => {
      const copy = [...prev];
      copy[copy.length - 1] = { label: "Now", temp: temperature };
      return copy;
    });
  }, [temperature]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "t") {
        setIsHeating(prev => {
          const nextState = !prev;
          if (timerRef.current) clearInterval(timerRef.current);
          
          if (nextState) {
            timerRef.current = window.setInterval(() => {
              setTemperature(t => {
                const delta = Math.random() * 0.2 + 0.1; 
                const newT = Number((t + delta).toFixed(1));
                
                if (newT >= 39.5 && t < 39.5) {
                  addNotification({ Icon: AlertTriangle, color: "#F44336", text: "High body temperature detected (" + newT + "°C)" });
                }
                return newT;
              });
            }, 300);
          } else {
             // Return to normal quickly
             timerRef.current = window.setInterval(() => {
               setTemperature(t => {
                 if (t <= 38.6) {
                   if (timerRef.current) clearInterval(timerRef.current);
                   return 38.6;
                 }
                 return Number((t - 0.2).toFixed(1));
               });
             }, 300);
          }
          
          return nextState;
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
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
                <YAxis domain={["dataMin - 0.5", "dataMax + 0.5"]} hide />
                <Tooltip 
                  contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                  labelStyle={{ color: SP.usuzumi, fontSize: 12 }}
                  itemStyle={{ color: SP.sumi, fontWeight: 700 }}
                  formatter={(value) => [`${Number(value).toFixed(1)} °C`, "Temp"]}
                />
                <Area type="monotone" dataKey="temp" stroke={status.color} strokeWidth={3} fillOpacity={1} fill="url(#colorTemp)" />
              </AreaChart>
            </ResponsiveContainer>
         </div>
         
         <div className="flex items-center gap-2 mt-4 text-xs font-medium" style={{ color: SP.usuzumi, background: "var(--bg-secondary)", padding: "12px 16px", borderRadius: 12 }}>
            <CalendarClock size={16} />
            <span>Includes data from 13 Sep 9:00 AM to 14 Sep 11:30 AM</span>
         </div>
      </Card>
    </SensorPage>
  );
}
