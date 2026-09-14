import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { calculateScores } from "@/lib/score";
import { useCollar } from "@/context/CollarContext";
import { LiveSensorBody } from "@/components/LiveSensorBody";
import AppShell from "@/components/AppShell";
import { SenseBanner } from "@/components/SenseBanner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export const Route = createFileRoute("/pressure-sense")({ component: PressureSensePage });

// Fake data: 13th Sep 9:00 AM to 14th Sep 11:30 AM
const MOCK_PRESSURE_HISTORY = [
  { time: "2026-09-13T09:15:00", val: 101.32 },
  { time: "2026-09-13T10:45:00", val: 101.34 },
  { time: "2026-09-13T12:30:00", val: 101.35 },
  { time: "2026-09-13T14:10:00", val: 101.38 },
  { time: "2026-09-13T15:55:00", val: 101.40 },
  { time: "2026-09-13T18:20:00", val: 101.37 },
  { time: "2026-09-13T21:40:00", val: 101.36 },
  { time: "2026-09-14T02:15:00", val: 101.35 },
  { time: "2026-09-14T06:30:00", val: 101.38 },
  { time: "2026-09-14T08:45:00", val: 101.42 },
  { time: "2026-09-14T10:20:00", val: 101.45 },
  { time: "2026-09-14T11:15:00", val: 101.47 },
];

function PressureSensePage() {
  const { live } = useCollar();
  const scores = calculateScores(78, live.motion?.value, live.skin?.value, live.bark?.value, live.temp?.value);

  // Format data for Recharts
  const chartData = MOCK_PRESSURE_HISTORY.map(d => {
    const date = new Date(d.time);
    return {
      timeLabel: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      Pressure: d.val,
      fullDate: date
    };
  });

  return (
    <AppShell
      renderTopBar={({ menuOpen, onMenuClick }) => (
        <div style={{
          position: "sticky", top: 0, zIndex: 100, display: "flex", alignItems: "center",
          height: 56, padding: "0 16px", background: "var(--bg-page)",
          borderBottom: "1px solid var(--border-subtle)"
        }}>
          <button onClick={() => window.history.back()} style={{ marginRight: 16 }}>←</button>
          <span style={{ fontWeight: 700 }}>PressureSense</span>
        </div>
      )}
    >
      <div style={{ background: "var(--bg-page)", minHeight: "100%", paddingBottom: 100 }}>
        <SenseBanner
          subtitleEn="PressureSense AI"
          titleEn="PressureSense AI"
          descriptorEn="Collar pressure monitoring"
          bgGradient="linear-gradient(135deg, var(--bg-card) 0%, var(--acc-pale) 100%)"
          subtitleColor="var(--acc-strong)"
          score={scores.pressureScore}
        />

        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
          {/* LIVE SENSORS */}
          <LiveSensorBody
            sensor="pressure"
            labelEn="Current Pressure"
            unitLabel="kPa"
            decimals={2}
            note="Reported directly by the collar's pressure sensor."
            showHistory={false}
          />

          {/* HISTORY GRAPH */}
          <div style={{ padding: 16, background: "#FFFFFF", borderRadius: 24, boxShadow: "0 2px 20px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 16 }}>
              PRESSURE TRENDS
            </div>
            
            <div style={{ width: "100%", height: 220, marginBottom: 16 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                  <XAxis dataKey="timeLabel" tick={{ fontSize: 10, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} />
                  <YAxis domain={['dataMin - 0.05', 'dataMax + 0.05']} tick={{ fontSize: 10, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
                    labelStyle={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}
                  />
                  <Line type="monotone" dataKey="Pressure" stroke="var(--acc-strong)" strokeWidth={3} dot={{ r: 4, fill: "var(--acc-strong)", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {MOCK_PRESSURE_HISTORY.map((item, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  paddingBottom: i !== MOCK_PRESSURE_HISTORY.length - 1 ? 12 : 0,
                  borderBottom: i !== MOCK_PRESSURE_HISTORY.length - 1 ? "1px solid var(--bg-elevated)" : "none"
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                      {new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>
                      {new Date(item.time).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "var(--acc-deep)" }}>
                    {item.val.toFixed(2)} <span style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 600 }}>kPa</span>
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
