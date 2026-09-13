import { createFileRoute } from "@tanstack/react-router";
import { LiveSensorBody } from "@/components/LiveSensorBody";
import { SensorPage } from "@/components/SensorPage";

export const Route = createFileRoute("/environment-sense")({ component: EnvironmentSensePage });

function EnvironmentSensePage() {
  return (
    <SensorPage
      titleEn="EnvironmentSense"
      subtitleEn="SHT40 Environment"
      descriptorEn="Temperature and humidity around your dog"
    >
      <LiveSensorBody
        sensor="temp"
        labelEn="Environmental Temperature"
        unitLabel="°C"
        note="Ambient temperature measured around the collar; this is not body temperature."
        showHistory={false}
      />
      <LiveSensorBody
        sensor="humidity"
        labelEn="Relative Humidity"
        unitLabel="% RH"
        note="Relative humidity measured by the collar's SHT40 sensor."
      />
    </SensorPage>
  );
}
