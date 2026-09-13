import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";

export type Pixel = { r: number; g: number; b: number };

export function useLightSenseApi() {
  const [endpoint, setEndpoint] = useState(() => {
    return localStorage.getItem("lightSenseEndpoint") || "http://localhost:8000";
  });

  const saveEndpoint = (url: string) => {
    setEndpoint(url);
    localStorage.setItem("lightSenseEndpoint", url);
  };

  const customTimer = useRef<NodeJS.Timeout | null>(null);

  const updateCustomLights = useCallback(
    (pixels: Pixel[], brightness: number, immediate = false) => {
      if (customTimer.current) clearTimeout(customTimer.current);

      const send = async () => {
        try {
          const res = await fetch("${endpoint}/api/v1/lights/custom", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pixels, brightness }),
          });
          if (!res.ok) throw new Error("Failed");
        } catch (err) {
          console.error("LightSense API Error:", err);
        }
      };

      if (immediate) {
        void send();
      } else {
        customTimer.current = setTimeout(send, 200);
      }
    },
    [endpoint]
  );

  const updateStatusLight = useCallback(
    async (health_score: number, is_charging: boolean, brightness: number) => {
      try {
        const res = await fetch("${endpoint}/api/v1/lights/status", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ health_score, is_charging, brightness }),
        });
        if (!res.ok) throw new Error("Failed");
        toast.success("Status pushed to collar!");
      } catch (err) {
        console.error("LightSense API Error:", err);
        toast.error("Failed to connect to LightSense API");
      }
    },
    [endpoint]
  );

  return { endpoint, saveEndpoint, updateCustomLights, updateStatusLight };
}
