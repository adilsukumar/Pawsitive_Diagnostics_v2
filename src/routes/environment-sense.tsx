import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { calculateScores } from "@/lib/score";
import { useCollar } from "@/context/CollarContext";
import { LiveSensorBody } from "@/components/LiveSensorBody";
import AppShell from "@/components/AppShell";
import { SenseBanner } from "@/components/SenseBanner";


export const Route = createFileRoute("/environment-sense")({ component: EnvironmentSensePage });

// Fake data: 13th Sep 9:00 AM to 14th Sep 11:30 AM
const MOCK_ENV_HISTORY = [
  { time: "2026-09-13T09:15:00", temp: 32.4, hum: 45.2 },
  { time: "2026-09-13T10:45:00", temp: 33.1, hum: 46.1 },
  { time: "2026-09-13T12:30:00", temp: 34.2, hum: 47.5 },
  { time: "2026-09-13T14:10:00", temp: 35.8, hum: 50.3 },
  { time: "2026-09-13T15:55:00", temp: 36.1, hum: 49.8 },
  { time: "2026-09-13T18:20:00", temp: 33.5, hum: 47.1 },
  { time: "2026-09-13T21:40:00", temp: 31.2, hum: 44.5 },
  { time: "2026-09-14T02:15:00", temp: 29.8, hum: 41.2 },
  { time: "2026-09-14T06:30:00", temp: 28.5, hum: 39.8 },
  { time: "2026-09-14T08:45:00", temp: 30.2, hum: 42.1 },
  { time: "2026-09-14T10:20:00", temp: 31.7, hum: 44.3 },
  { time: "2026-09-14T11:15:00", temp: 32.5, hum: 45.8 },
];

function EnvironmentSensePage() {
  const { state, live } = useCollar();
  const scores = calculateScores(78, null, null, null, live.temp?.value || 32);

  return (
    <AppShell
      renderTopBar={({ menuOpen, onMenuClick }) => (
        <div style={{
          position: "sticky", top: 0, zIndex: 100, display: "flex", alignItems: "center",
          height: 56, padding: "0 16px", background: "var(--bg-page)",
          borderBottom: "1px solid var(--border-subtle)"
        }}>
          <button onClick={() => window.history.back()} style={{ marginRight: 16 }}>←</button>
          <span style={{ fontWeight: 700 }}>EnvironmentSense</span>
        </div>
      )}
    >
      <div style={{ background: "var(--bg-page)", minHeight: "100%", paddingBottom: 100 }}>
        <SenseBanner
          subtitleEn="EnvironmentSense"
          titleEn="EnvironmentSense"
          descriptorEn="Temperature and humidity around your dog"
          bgGradient="linear-gradient(135deg, var(--acc-pale) 0%, var(--acc-pale) 100%)"
          subtitleColor="var(--acc-strong)"
          score={scores.envScore}
        />

        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
          {/* LIVE SENSORS */}
          <LiveSensorBody
            sensor="temp"
            labelEn="Environmental Temperature"
            unitLabel="°C"
            decimals={2}
            note="Ambient temperature measured around the collar."
            showHistory={false}
          />
          <LiveSensorBody
            sensor="humidity"
            labelEn="Relative Humidity"
            unitLabel="% RH"
            decimals={1}
            note="Relative humidity measured by the collar's SHT40 sensor."
            showHistory={false}
          />

          {/* HISTORY GRAPH */}
          <div style={{ padding: 16, background: "#FFFFFF", borderRadius: 24, boxShadow: "0 2px 20px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 12 }}>
              ENVIRONMENTAL HISTORY
            </div>
            
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <div style={{ flex: 1, padding: "8px 12px", background: "var(--bg-elevated)", borderRadius: 12 }}>
                <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>Avg Temp</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "var(--acc-deep)" }}>32.4 °C</div>
              </div>
              <div style={{ flex: 1, padding: "8px 12px", background: "var(--bg-elevated)", borderRadius: 12 }}>
                <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>Avg Humidity</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "var(--acc-deep)" }}>44.8 %</div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {MOCK_ENV_HISTORY.map((item, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  paddingBottom: i !== MOCK_ENV_HISTORY.length - 1 ? 12 : 0,
                  borderBottom: i !== MOCK_ENV_HISTORY.length - 1 ? "1px solid var(--bg-elevated)" : "none"
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                      {new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                      {new Date(item.time).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 16, textAlign: "right" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{item.temp.toFixed(1)} °C</div>
                      <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>Temp</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{item.hum.toFixed(1)} %</div>
                      <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>Hum</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
