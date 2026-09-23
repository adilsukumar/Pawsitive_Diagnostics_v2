# Pawsitive Diagnostics v2

A mobile-first research and product prototype for connecting pet-wearable telemetry with owner and veterinarian workflows.

Version 2 explores a more complete product surface than the original prototype: direct browser-to-collar connections, longitudinal sensor history, multilingual interfaces, report generation, pet profiles, nearby-clinic discovery, and separate owner and veterinary views.

> **Important:** This is an experimental student project, not a validated medical device. Sensor scores, generated guidance, image analysis, and demo data must not be used for diagnosis or treatment.

## What is implemented

- React 19 and TypeScript application built with TanStack Router and Vite
- Web Bluetooth and Web Serial connection paths for newline-delimited ESP32 telemetry
- Parsing of JSON or `key:value` packets for temperature, humidity, pressure, light, motion, skin, and battery fields
- Local sensor-history storage and client-side charts/reports
- Owner onboarding, pet profiles, settings, and data export
- Veterinary-console interface prototypes
- Geolocation, maps, and nearby-clinic discovery
- PDF and QR-code generation
- Optional Gemini-powered experimental features
- English/Japanese interface support plus optional translation services

## Prototype boundaries

The interface currently mixes working integrations with product demonstrations:

- Bluetooth/USB transport and telemetry parsing are implemented, but require compatible ESP32 firmware and browser support.
- Some screens seed or simulate readings so the interface can be evaluated without hardware.
- Bark/vocalisation output and parts of the veterinary console are demonstration flows rather than trained, validated systems.
- Image and chat features depend on an external generative-AI service and can be inaccurate.
- Authentication and profiles are stored locally for prototyping; they are not production security or health-record infrastructure.

Keeping these boundaries explicit is part of the project: the next technical goal is to replace demonstrations with traceable, versioned data and validated components.

## Telemetry format

The collar context accepts newline-delimited JSON:

```json
{"temp": 38.4, "humidity": 47.2, "motion": 1.8, "battery": 86}
```

or simple key/value packets:

```text
temp:38.4
humidity:47.2
```

Web Bluetooth uses the Nordic UART Service. Web Serial defaults to 115200 baud.

## Technology

React · TypeScript · TanStack Router/Query · Vite · Tailwind CSS · Web Bluetooth · Web Serial · Leaflet · Recharts · jsPDF · Gemini API

## Run locally

### Requirements

- Node.js 20+ or Bun
- Chrome/Edge for Web Serial; Web Bluetooth availability varies by platform

```bash
git clone https://github.com/AdilSukumar/Pawsitive_Diagnostics_v2.git
cd Pawsitive_Diagnostics_v2
npm install
npm run dev
```

Optional services are documented in `.env.example`. Do not commit API keys. Hardware APIs generally require a secure origin or `localhost`.

## Build and lint

```bash
npm run lint
npm run build
```

## Research and engineering roadmap

- Separate all demo data from live telemetry with an explicit simulation mode.
- Version the collar packet schema and add parser tests.
- Validate each sensor against a reference instrument.
- Collect consented, labelled datasets with veterinary oversight.
- Evaluate models with subject-level splits, calibration, uncertainty, and failure analysis.
- Replace local-only identity storage with an audited backend before handling real records.
- Add end-to-end tests for sensor ingestion, persistence, and report generation.
- Conduct safety, privacy, and usability reviews.

## My role

I lead the software and startup tracks for Pawsitive Diagnostics, including architecture, cloud/backend work, ML experimentation, sensor-to-interface integration, technical planning, team coordination, pitch refinement, and exploration of funding and intellectual-property pathways.

## License

No licence is currently included. All rights are reserved unless a licence is added.
