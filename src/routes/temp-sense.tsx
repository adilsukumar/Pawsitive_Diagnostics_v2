import { createFileRoute } from "@tanstack/react-router";
import { Card, SectionLabel, SensorPage, SP } from "@/components/SensorPage";
import { Thermometer } from "lucide-react";

export const Route = createFileRoute("/temp-sense")({ component: TempSensePage });

function TempSensePage() {
  return (
    <SensorPage
      titleEn="Body Temperature"
      subtitleEn="TempSense"
      descriptorEn="Direct body-temperature monitoring"
      requiresCollar={false}
    >
      <Card>
        <div className="flex items-center justify-center" style={{ width: 52, height: 52, borderRadius: 18, background: "var(--acc-pale)", marginBottom: 16 }}>
          <Thermometer size={24} style={{ color: "var(--acc-strong)" }} />
        </div>
        <SectionLabel jp="Body temperature" en="Body temperature" />
        <div style={{ fontSize: 22, fontWeight: 700, color: SP.sumi }}>Sensor not configured yet</div>
        <p style={{ fontSize: 13, lineHeight: 1.65, color: SP.usuzumi, marginTop: 10 }}>
          This page is reserved for the collar's upcoming NTC thermistor. Environmental readings from the SHT40 are kept separate so they are never mistaken for your dog's body temperature.
        </p>
      </Card>
    </SensorPage>
  );
}
