# Roadmap

## Current engineering priorities

- [ ] Add an explicit simulation mode and remove implicit seeded readings from live mode.
- [ ] Version and document the ESP32 telemetry schema.
- [ ] Add unit tests for packet parsing and sensor-history persistence.
- [ ] Verify Bluetooth and USB flows on representative devices and browsers.
- [ ] Finish the Pawsitive Diagnostics rebrand in internal storage keys and identifiers.
- [ ] Separate owner-facing prototypes from veterinarian-facing prototypes.
- [ ] Audit health language so experimental outputs cannot be mistaken for diagnoses.

## Data and model priorities

- [ ] Define data-collection and consent protocols with veterinary guidance.
- [ ] Establish labelled datasets and subject-level evaluation splits.
- [ ] Track model/data versions and report uncertainty and failure cases.
- [ ] Replace demonstration classifiers with evaluated model artefacts.

## Product and safety priorities

- [ ] Replace local prototype authentication before handling real user data.
- [ ] Add privacy, security, and accessibility reviews.
- [ ] Add integration tests from collar packet to report output.
- [ ] Validate sensors against reference instruments before field claims.

## Implemented foundations

- [x] Web Bluetooth Nordic UART connection path.
- [x] Web Serial connection path for ESP32 telemetry.
- [x] JSON and key/value packet parsing.
- [x] Local sensor history and report generation.
- [x] Owner and veterinary interface prototypes.
- [x] Nearby-clinic discovery and mapping interfaces.
