import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { Card, SectionLabel, SensorPage, SP } from "@/components/SensorPage";
import { Thermometer, AlertTriangle } from "lucide-react";
import { addNotification } from "@/lib/notifications";

export const Route = createFileRoute("/temp-sense")({ component: TempSensePage });

function TempSensePage() {
  const [temperature, setTemperature] = useState(38.5);
  const [isIncreasing, setIsIncreasing] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 't') {
        setIsIncreasing(prev => {
          const nextState = !prev;
          if (timerRef.current) clearInterval(timerRef.current);
          
          timerRef.current = window.setInterval(() => {
            setTemperature(t => {
              const delta = nextState ? 0.1 : -0.1;
              const newT = Number((t + delta).toFixed(1));
              if (newT === 39.5 && delta > 0) {
                addNotification({ Icon: AlertTriangle, color: "#F44336", text: "High body temperature detected (" + newT + "°C)" });
              }
              return newT;
            });
          }, 500);
          
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

  return (
    <SensorPage
      titleEn="Temperature"
      subtitleEn="TempSense"
      descriptorEn="Direct body-temperature monitoring"
      requiresCollar={false}
    >
      <Card>
        <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
          <div className="flex items-center justify-center" style={{ width: 52, height: 52, borderRadius: 18, background: "var(--acc-pale)" }}>
            <Thermometer size={24} style={{ color: "var(--acc-strong)" }} />
          </div>
          <div style={{ padding: "4px 10px", background: isIncreasing ? "#FFEAEA" : "#E8F5E9", borderRadius: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: isIncreasing ? "#F44336" : "#4CAF50" }}>
              {isIncreasing ? "RISING" : "STABLE"}
            </span>
          </div>
        </div>
        
        <SectionLabel jp="Body temperature" en="Current Reading" />
        
        <div className="flex items-end" style={{ marginTop: 8, gap: 8 }}>
          <div style={{ fontSize: 48, fontWeight: 800, color: SP.sumi, lineHeight: 1 }}>
            {temperature.toFixed(1)}
          </div>
          <div style={{ fontSize: 24, fontWeight: 600, color: SP.usuzumi, paddingBottom: 4 }}>
            °C
          </div>
        </div>
        
        <p style={{ fontSize: 13, lineHeight: 1.65, color: SP.usuzumi, marginTop: 16 }}>
          Real-time core body temperature reading from the NTC thermistor. Normal temperature ranges between 38.3°C and 39.2°C.
        </p>
      </Card>
    </SensorPage>
  );
}

