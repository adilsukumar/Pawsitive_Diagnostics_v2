import type { BreedKey } from "@/components/DogAvatar";

/* ================= Patients ================= */

export type SizeClass = "toy" | "small" | "medium" | "large" | "giant";
export type Species = "dog";
export type RiskTone = "red" | "amber" | "blue";

export type VetPatient = {
  id: string;
  name: string;
  species: Species;
  breed: string;
  breedKey: BreedKey;
  size: SizeClass;
  age: string;
  weightKg: number;
  gender: "male" | "female";
  owner: string;
  ownerPhone: string;
  patientCode: string; // medical record number, e.g. PT-10284
  microchip: string;
  status: "Active Patient" | "Inactive";
  conditions: string[];
  allergies: string[];
  currentMeds: string[];
  vaccinationStatus: "Up to date" | "Due soon" | "Overdue";
  lastVisit: string;
  nextFollowUp: string;
  tempC: number;
};

export const VET_PATIENTS: VetPatient[] = [
  {
    id: "p1", name: "Bruno", species: "dog", breed: "Indian Pariah Dog", breedKey: "mixed",
    size: "medium", age: "3y 4m", weightKg: 24, gender: "male",
    owner: "Rahul Shah", ownerPhone: "+91 98200 11223",
    patientCode: "PT-10231", microchip: "982000123450001",
    status: "Active Patient",
    conditions: ["Flea allergy dermatitis (2025)"],
    allergies: [], currentMeds: [],
    vaccinationStatus: "Overdue", lastVisit: "14 Sep 2026", nextFollowUp: "14 Sep 2026", tempC: 38.5,
  },
  {
    id: "p2", name: "Coco", species: "dog", breed: "Pug", breedKey: "frenchie",
    size: "small", age: "4y 0m", weightKg: 8.2, gender: "female",
    owner: "Sarah Mehta", ownerPhone: "+91 99301 44556",
    patientCode: "PT-10284", microchip: "982000123456789",
    status: "Active Patient",
    conditions: ["BOAS grade II", "Corneal ulcer (2024)"],
    allergies: ["Penicillin"], currentMeds: ["Prednisolone 5 mg"],
    vaccinationStatus: "Up to date", lastVisit: "13 Sep 2026", nextFollowUp: "14 Sep 2026", tempC: 38.4,
  },
  {
    id: "p3", name: "Simba", species: "dog", breed: "Golden Retriever", breedKey: "golden",
    size: "large", age: "7y 8m", weightKg: 30, gender: "male",
    owner: "Ananya Rao", ownerPhone: "+91 98111 77889",
    patientCode: "PT-10115", microchip: "982000123450115",
    status: "Active Patient",
    conditions: ["Early hip dysplasia", "Hypothyroidism"],
    allergies: [], currentMeds: ["Levothyroxine 0.4 mg"],
    vaccinationStatus: "Up to date", lastVisit: "14 Sep 2026", nextFollowUp: "14 Sep 2026", tempC: 38.4,
  },
  {
    id: "p4", name: "Sheru", species: "dog", breed: "German Shepherd", breedKey: "shiba",
    size: "large", age: "4y 0m", weightKg: 34, gender: "male",
    owner: "Vikram Singh", ownerPhone: "+91 98922 33445",
    patientCode: "PT-10302", microchip: "982000123450302",
    status: "Active Patient",
    conditions: [], allergies: [], currentMeds: [],
    vaccinationStatus: "Up to date", lastVisit: "13 Sep 2026", nextFollowUp: "—", tempC: 38.6,
  },
  {
    id: "p5", name: "Milo", species: "dog", breed: "Chihuahua", breedKey: "chihuahua",
    size: "toy", age: "2y 2m", weightKg: 2.4, gender: "male",
    owner: "Arjun Patel", ownerPhone: "+91 97690 22110",
    patientCode: "PT-10340", microchip: "982000123450340",
    status: "Active Patient",
    conditions: ["Patellar luxation grade I"],
    allergies: [], currentMeds: ["Carprofen 6.25 mg"],
    vaccinationStatus: "Up to date", lastVisit: "14 Sep 2026", nextFollowUp: "13 Sep 2026", tempC: 38.7,
  },
];

export function patientById(id: string | undefined): VetPatient | undefined {
  return VET_PATIENTS.find((p) => p.id === id);
}

export const CLINIC_BRANCHES = ["Bandra West Clinic", "Andheri East Branch", "Powai Pet Hospital"];

/* ================= Breed-specific risk tags ================= */

export type RiskTag = { label: string; tone: RiskTone };

const BREED_RISKS: Record<string, RiskTag[]> = {
  Pug: [
    { label: "Respiratory Risk", tone: "red" },
    { label: "Heat Sensitivity", tone: "red" },
    { label: "Eye Ulcer Prone", tone: "amber" },
  ],
  "French Bulldog": [
    { label: "Respiratory Risk", tone: "red" },
    { label: "Heat Sensitivity", tone: "amber" },
    { label: "Skin Fold Dermatitis", tone: "amber" },
  ],
  "Golden Retriever": [
    { label: "Hip Dysplasia", tone: "amber" },
    { label: "Cancer Watch", tone: "red" },
  ],
  "Labrador Retriever": [
    { label: "Hip Dysplasia", tone: "amber" },
    { label: "Obesity Risk", tone: "amber" },
  ],
  "German Shepherd": [
    { label: "Hip Dysplasia", tone: "amber" },
    { label: "Bloat (GDV) Risk", tone: "red" },
  ],
  Chihuahua: [
    { label: "Dental Disease", tone: "amber" },
    { label: "Patellar Luxation", tone: "amber" },
  ],
  Dachshund: [{ label: "IVDD / Back Risk", tone: "red" }],
  "Indian Pariah Dog": [{ label: "Tick-Borne Disease", tone: "amber" }],
};

export function riskTagsFor(patient: VetPatient): RiskTag[] {
  const tags = BREED_RISKS[patient.breed] ?? [];
  const extra: RiskTag[] = [];
  if (isMdr1Sensitive(patient.breed)) extra.push({ label: "MDR1 Sensitivity", tone: "red" });
  if (tags.length === 0 && extra.length === 0) return [{ label: "General Wellness", tone: "blue" }];
  return [...tags, ...extra];
}

/* ================= Size-adjusted vital baselines ================= */

export type VitalBaseline = { hr: [number, number]; temp: [number, number]; rr: [number, number] };

export const VITAL_BASELINES: Record<SizeClass, VitalBaseline> = {
  toy: { hr: [100, 140], temp: [38.3, 39.2], rr: [18, 34] },
  small: { hr: [100, 140], temp: [38.3, 39.2], rr: [18, 34] },
  medium: { hr: [80, 120], temp: [38.3, 39.2], rr: [15, 30] },
  large: { hr: [60, 100], temp: [38.0, 39.0], rr: [12, 24] },
  giant: { hr: [60, 90], temp: [38.0, 39.0], rr: [12, 24] },
};

export function baselineFor(patient: VetPatient): VitalBaseline {
  return VITAL_BASELINES[patient.size];
}

export const SIZE_LABEL: Record<SizeClass, string> = {
  toy: "Toy breed",
  small: "Small breed",
  medium: "Medium breed",
  large: "Large breed",
  giant: "Giant breed",
};

/** Current collar vitals (mock live feed) — keyed by patient id */
export const CURRENT_VITALS: Record<string, { hr: number; temp: number; rr: number }> = {
  p1: { hr: 96, temp: 38.5, rr: 22 },
  p2: { hr: 118, temp: 39.1, rr: 36 },
  p3: { hr: 72, temp: 38.4, rr: 18 },
  p4: { hr: 78, temp: 38.6, rr: 20 },
  p5: { hr: 122, temp: 38.7, rr: 28 },
  p6: { hr: 168, temp: 38.6, rr: 26 },
};

/* ================= Collar behaviour telemetry ================= */

export type ScratchDay = { day: string; events: number };

export const SCRATCH_SHAKE_WEEK: Record<string, ScratchDay[]> = {
  p1: [
    { day: "Mon", events: 4 }, { day: "Tue", events: 5 }, { day: "Wed", events: 3 },
    { day: "Thu", events: 6 }, { day: "Fri", events: 9 }, { day: "Sat", events: 12 },
    { day: "Today", events: 18 },
  ],
  p2: [
    { day: "Mon", events: 7 }, { day: "Tue", events: 6 }, { day: "Wed", events: 8 },
    { day: "Thu", events: 7 }, { day: "Fri", events: 9 }, { day: "Sat", events: 8 },
    { day: "Today", events: 10 },
  ],
  p3: [
    { day: "Mon", events: 3 }, { day: "Tue", events: 2 }, { day: "Wed", events: 4 },
    { day: "Thu", events: 3 }, { day: "Fri", events: 3 }, { day: "Sat", events: 2 },
    { day: "Today", events: 4 },
  ],
};

export const DEFAULT_SCRATCH_WEEK: ScratchDay[] = [
  { day: "Mon", events: 4 }, { day: "Tue", events: 5 }, { day: "Wed", events: 4 },
  { day: "Thu", events: 6 }, { day: "Fri", events: 5 }, { day: "Sat", events: 6 },
  { day: "Today", events: 7 },
];

export function scratchWeekFor(patientId: string): ScratchDay[] {
  return SCRATCH_SHAKE_WEEK[patientId] ?? DEFAULT_SCRATCH_WEEK;
}

/** Spike = today is >1.8x the week's baseline average */
export function scratchSpike(week: ScratchDay[]): { spike: boolean; pct: number } {
  const base = week.slice(0, -1);
  const avg = base.reduce((s, d) => s + d.events, 0) / Math.max(base.length, 1);
  const today = week[week.length - 1].events;
  const pct = avg > 0 ? Math.round(((today - avg) / avg) * 100) : 0;
  return { spike: today > avg * 1.8, pct };
}

/* Thermal panting correlator */
export type PantingFeed = { ambientC: number; pantingPerMin: number };
export const PANTING_FEED: Record<string, PantingFeed> = {
  p1: { ambientC: 34, pantingPerMin: 214 },
  p2: { ambientC: 33, pantingPerMin: 240 },
  p3: { ambientC: 29, pantingPerMin: 90 },
  p4: { ambientC: 30, pantingPerMin: 120 },
  p5: { ambientC: 27, pantingPerMin: 60 },
};
export const DEFAULT_PANTING: PantingFeed = { ambientC: 30, pantingPerMin: 110 };

export function heatStressRisk(feed: PantingFeed): "high" | "moderate" | "low" {
  if (feed.ambientC >= 32 && feed.pantingPerMin >= 180) return "high";
  if (feed.ambientC >= 30 && feed.pantingPerMin >= 120) return "moderate";
  return "low";
}

/* Gait asymmetry — % of body weight borne per leg */
export type GaitReading = { leg: string; pct: number };
export const GAIT_FEED: Record<string, GaitReading[]> = {
  p3: [
    { leg: "Front L", pct: 31 },
    { leg: "Front R", pct: 30 },
    { leg: "Hind L", pct: 20 },
    { leg: "Hind R", pct: 19 },
  ],
};
export const DEFAULT_GAIT: GaitReading[] = [
  { leg: "Front L", pct: 27 },
  { leg: "Front R", pct: 27 },
  { leg: "Hind L", pct: 23 },
  { leg: "Hind R", pct: 23 },
];
export const GAIT_IDEAL = 25;

export function gaitAsymmetry(readings: GaitReading[]): { flag: boolean; worst: GaitReading; deficit: number } {
  let worst = readings[0];
  for (const r of readings) if (Math.abs(r.pct - GAIT_IDEAL) > Math.abs(worst.pct - GAIT_IDEAL)) worst = r;
  const deficit = Math.round(((GAIT_IDEAL - worst.pct) / GAIT_IDEAL) * 100);
  return { flag: deficit >= 12, worst, deficit };
}

/* ================= Body map (clinical examination tool) ================= */

export type BodyZone = {
  id: string;
  label: string;
  cx: number;
  cy: number;
  r: number;
  issues: string[];
};

export const BODY_ZONES: BodyZone[] = [
  { id: "ear", label: "Left Ear", cx: 44, cy: 26, r: 11, issues: ["Otitis externa", "Ear mites", "Yeast infection", "Aural hematoma"] },
  { id: "eye", label: "Eye", cx: 30, cy: 34, r: 7, issues: ["Conjunctivitis", "Corneal ulcer", "Cherry eye"] },
  { id: "mouth", label: "Mouth", cx: 14, cy: 46, r: 8, issues: ["Gingivitis", "Broken tooth", "Oral foreign body"] },
  { id: "neck", label: "Neck", cx: 62, cy: 52, r: 11, issues: ["Collar dermatitis", "Lymph node swelling", "Hot spot"] },
  { id: "chest", label: "Thorax", cx: 86, cy: 78, r: 13, issues: ["Bronchitis / cough", "Cardiac murmur", "Kennel cough"] },
  { id: "abdomen", label: "Abdomen", cx: 122, cy: 82, r: 13, issues: ["Gastritis", "Bloat (GDV) watch", "Diarrhea", "Foreign body"] },
  { id: "flank", label: "Skin / Flank", cx: 148, cy: 62, r: 12, issues: ["Hot spot", "Flea allergy dermatitis", "Skin mass"] },
  { id: "frontpaw", label: "Forelimb / Paw", cx: 76, cy: 126, r: 9, issues: ["Pad tear", "Interdigital cyst", "Torn dewclaw"] },
  { id: "hindpaw", label: "Hindlimb / Paw", cx: 152, cy: 126, r: 9, issues: ["Pad tear", "Interdigital cyst", "ACL tear watch"] },
  { id: "tail", label: "Tail", cx: 186, cy: 40, r: 10, issues: ["Tail tip injury", "Anal gland impaction"] },
];

/** SkinSense AI uploads projected onto the model (patientId → zones with findings) */
export const SKIN_HISTORY_PINS: Record<string, { zoneId: string; note: string }[]> = {
  p1: [{ zoneId: "flank", note: "Hot spot photo — SkinSense AI, 2 days ago" }],
  p2: [{ zoneId: "ear", note: "Ear redness photo — SkinSense AI, last week" }],
};

/* ================= e-Prescription: Toxic-Check Engine ================= */

export const MDR1_BREEDS = [
  "Collie",
  "Australian Shepherd",
  "Shetland Sheepdog",
  "Border Collie",
  "Old English Sheepdog",
  "German Shepherd",
];

export function isMdr1Sensitive(breed: string): boolean {
  return MDR1_BREEDS.some((b) => breed.toLowerCase().includes(b.toLowerCase()));
}

export type Medication = {
  id: string;
  name: string;
  category: string;
  mdr1Risk: boolean;
  notes: string;
};

export const MEDICATIONS: Medication[] = [
  { id: "m1", name: "Ivermectin", category: "Antiparasitic", mdr1Risk: true, notes: "Neurotoxic in MDR1-mutant breeds even at low doses." },
  { id: "m2", name: "Loperamide", category: "Antidiarrheal", mdr1Risk: true, notes: "CNS depression risk in MDR1-mutant breeds." },
  { id: "m3", name: "Apomorphine", category: "Emetic", mdr1Risk: true, notes: "Use reduced dose in MDR1-mutant breeds." },
  { id: "m4", name: "Carprofen", category: "NSAID", mdr1Risk: false, notes: "Avoid with kidney/liver disease; give with food." },
  { id: "m5", name: "Apoquel (Oclacitinib)", category: "Antipruritic", mdr1Risk: false, notes: "Not for dogs under 12 months." },
  { id: "m6", name: "Amoxicillin-Clavulanate", category: "Antibiotic", mdr1Risk: false, notes: "Broad spectrum; complete full course." },
  { id: "m7", name: "Prednisolone", category: "Corticosteroid", mdr1Risk: false, notes: "Do not combine with NSAIDs." },
];

export const RX_ROUTES = ["Oral", "Topical", "Subcutaneous", "Intramuscular", "Intravenous", "Otic", "Ophthalmic"];
export const RX_FREQUENCIES = ["Once daily", "Twice daily", "Three times daily", "Every 8 hours", "Every 12 hours", "Once weekly", "As needed"];
export const RX_DURATIONS = ["3 days", "5 days", "7 days", "10 days", "14 days", "30 days"];

export type SafetyFlag = { level: "danger" | "caution" | "ok"; text: string };

export function checkMedication(med: Medication, patient: VetPatient): SafetyFlag[] {
  const flags: SafetyFlag[] = [];
  if (patient.allergies.some((a) => med.name.toLowerCase().includes(a.toLowerCase()))) {
    flags.push({ level: "danger", text: `${patient.name} has a recorded ${patient.allergies.find((a) => med.name.toLowerCase().includes(a.toLowerCase()))} allergy — do not prescribe ${med.name}.` });
  }
  if (med.mdr1Risk && isMdr1Sensitive(patient.breed)) {
    flags.push({
      level: "danger",
      text: `${patient.breed} may carry the MDR1 gene mutation — ${med.name} can be neurotoxic. Choose an alternative or genetic-test first.`,
    });
  } else if (med.mdr1Risk) {
    flags.push({ level: "caution", text: `${med.name}: MDR1 risk not indicated for ${patient.breed}, but confirm no herding-breed ancestry.` });
  }
  if (med.id === "m4" && patient.conditions.some((c) => c.toLowerCase().includes("kidney"))) {
    flags.push({ level: "danger", text: "NSAID contraindicated with renal history." });
  }
  if (med.id === "m5" && patient.age.startsWith("0")) {
    flags.push({ level: "caution", text: "Apoquel is not licensed for dogs under 12 months." });
  }
  if (med.id === "m7" && patient.currentMeds.some((m) => /carprofen|nsaid/i.test(m))) {
    flags.push({ level: "danger", text: `${patient.name} is on an NSAID — corticosteroids must not be combined.` });
  }
  if (flags.length === 0) {
    flags.push({ level: "ok", text: `No breed, allergy or drug-interaction conflicts for ${patient.name}. Safe to prescribe.` });
  }
  return flags;
}

/* ================= Toxicity calculator ================= */

export type Toxin = {
  id: string;
  name: string;
  unit: "g" | "pieces";
  unitLabel: string;
  mgPerUnit: number;
  thresholds: { mild: number; moderate: number; severe: number };
  hint: string;
};

export const TOXINS: Toxin[] = [
  { id: "t1", name: "Dark chocolate", unit: "g", unitLabel: "grams", mgPerUnit: 15, thresholds: { mild: 20, moderate: 40, severe: 60 }, hint: "Theobromine ≈ 15 mg/g" },
  { id: "t2", name: "Milk chocolate", unit: "g", unitLabel: "grams", mgPerUnit: 2.3, thresholds: { mild: 20, moderate: 40, severe: 60 }, hint: "Theobromine ≈ 2.3 mg/g" },
  { id: "t3", name: "Grapes / raisins", unit: "pieces", unitLabel: "pieces", mgPerUnit: 500, thresholds: { mild: 50, moderate: 100, severe: 150 }, hint: "Even small amounts can cause kidney failure" },
  { id: "t4", name: "Xylitol (gum)", unit: "pieces", unitLabel: "pieces", mgPerUnit: 1000, thresholds: { mild: 75, moderate: 150, severe: 500 }, hint: "≈ 1 g xylitol per piece of gum" },
  { id: "t5", name: "Onion / garlic", unit: "g", unitLabel: "grams", mgPerUnit: 200, thresholds: { mild: 3000, moderate: 4500, severe: 6000 }, hint: "Toxic at ~15–30 g per kg body weight" },
];

export type ToxicityResult = {
  doseMgKg: number;
  level: "minimal" | "mild" | "moderate" | "severe";
  advice: string;
};

export function calcToxicity(toxin: Toxin, amount: number, weightKg: number): ToxicityResult {
  const doseMgKg = weightKg > 0 ? (amount * toxin.mgPerUnit) / weightKg : 0;
  let level: ToxicityResult["level"] = "minimal";
  if (doseMgKg >= toxin.thresholds.severe) level = "severe";
  else if (doseMgKg >= toxin.thresholds.moderate) level = "moderate";
  else if (doseMgKg >= toxin.thresholds.mild) level = "mild";

  const advice =
    level === "severe"
      ? "EMERGENCY — Induce vomiting immediately (if <2h since ingestion) and start IV fluids. Refer to a 24×7 hospital now."
      : level === "moderate"
        ? "High risk — Induce vomiting if within 2 hours, give activated charcoal, monitor vitals every 30 min."
        : level === "mild"
          ? "Mild exposure — Likely GI upset only. Monitor for vomiting, tremors or lethargy for 12–24 hours."
          : "Below toxic threshold — No treatment needed. Reassure the owner and log the exposure.";

  return { doseMgKg: Math.round(doseMgKg * 10) / 10, level, advice };
}

/* ================= Appointments / consultation queue ================= */

export type ApptStatus = "scheduled" | "checked-in" | "waiting" | "in-consultation" | "completed";

export type Appointment = {
  id: string;
  patientId: string;
  time: string;
  reason: string;
  type: "Clinic" | "Video";
  status: ApptStatus;
  followUp?: boolean;
};

export const APPOINTMENTS: Appointment[] = [
  { id: "a1", patientId: "p2", time: "09:00", reason: "Annual vaccination", type: "Clinic", status: "completed" },
  { id: "a2", patientId: "p1", time: "09:30", reason: "Vomiting / lethargy", type: "Clinic", status: "waiting" },
  { id: "a3", patientId: "p3", time: "10:00", reason: "Skin condition", type: "Clinic", status: "in-consultation" },
  { id: "a4", patientId: "p5", time: "10:30", reason: "Post-surgery follow-up", type: "Clinic", status: "scheduled", followUp: true },
  { id: "a5", patientId: "p4", time: "11:00", reason: "Annual health check", type: "Clinic", status: "checked-in" },
  { id: "a6", patientId: "p6", time: "11:30", reason: "Vaccination (FVRCP)", type: "Clinic", status: "scheduled" },
  { id: "a7", patientId: "p2", time: "10:20", reason: "Respiratory symptoms recheck", type: "Video", status: "waiting", followUp: true },
  { id: "a8", patientId: "p1", time: "10:35", reason: "Scratching & ear odour", type: "Video", status: "in-consultation" },
  { id: "a9", patientId: "p3", time: "10:40", reason: "Hypothyroidism review", type: "Video", status: "scheduled", followUp: true },
  { id: "a10", patientId: "p5", time: "10:50", reason: "Suture removal", type: "Clinic", status: "scheduled", followUp: true },
  { id: "a11", patientId: "p4", time: "11:00", reason: "GDV risk consult", type: "Video", status: "scheduled" },
  { id: "a12", patientId: "p6", time: "11:15", reason: "Dental check", type: "Clinic", status: "scheduled", followUp: true },
];

export const APPT_STATUS_META: Record<ApptStatus, { label: string; tone: "green" | "amber" | "blue" | "grey" }> = {
  scheduled: { label: "Scheduled", tone: "grey" },
  "checked-in": { label: "Checked In", tone: "green" },
  waiting: { label: "Waiting", tone: "amber" },
  "in-consultation": { label: "In Consultation", tone: "blue" },
  completed: { label: "Completed", tone: "grey" },
};

/* ================= Follow-ups & clinical alerts ================= */

export type FollowUp = {
  id: string;
  patientId: string;
  date: string;
  reason: string;
  status: "Scheduled" | "Overdue";
  remindOwner: boolean;
};

export const FOLLOW_UPS: FollowUp[] = [
  { id: "f1", patientId: "p5", date: "13 Sep 2026", reason: "Post-surgery recheck", status: "Scheduled", remindOwner: true },
  { id: "f2", patientId: "p2", date: "14 Sep 2026", reason: "Recheck respiratory symptoms", status: "Scheduled", remindOwner: true },
  { id: "f3", patientId: "p3", date: "14 Sep 2026", reason: "Thyroid panel review", status: "Scheduled", remindOwner: false },
  { id: "f4", patientId: "p1", date: "14 Sep 2026", reason: "GI upset recheck", status: "Overdue", remindOwner: true },
  { id: "f5", patientId: "p6", date: "14 Sep 2026", reason: "Dental follow-up", status: "Scheduled", remindOwner: false },
];

export type ClinicalAlert = { level: "red" | "amber"; text: string; patientId?: string };

export const CLINICAL_ALERTS: ClinicalAlert[] = [
  { level: "red", text: "Allergy — Penicillin (Coco, PT-10284)", patientId: "p2" },
  { level: "amber", text: "Follow-up overdue — Bruno, GI recheck (8 days)", patientId: "p1" },
  { level: "amber", text: "Lab result requires review — Simba, thyroid panel", patientId: "p3" },
];

/* ================= Medical records ================= */

export type VisitRecord = { date: string; reason: string; vet: string; summary: string };
export type DiagnosisRecord = { date: string; name: string; status: "Active" | "Resolved"; notes?: string };
export type MedRecord = { name: string; dose: string; route: string; frequency: string; duration: string; prescribed: string; status: "Active" | "Completed" };
export type VaccineRecord = { name: string; date: string; nextDue: string; status: "Administered" | "Due" | "Overdue" };
export type LabValue = { name: string; value: string; unit: string; ref: string; flag: "normal" | "high" | "low" };
export type LabResult = { id: string; name: string; date: string; status: "available" | "pending"; values: LabValue[] };
export type DocRecord = { name: string; type: string; date: string };

export type PatientRecord = {
  visits: VisitRecord[];
  diagnoses: DiagnosisRecord[];
  medications: MedRecord[];
  vaccinations: VaccineRecord[];
  labs: LabResult[];
  documents: DocRecord[];
};

const VET_NAME = "Dr. Sharma";

export const PATIENT_RECORDS: Record<string, PatientRecord> = {
  p1: {
    visits: [
      { date: "13 Sep 2026", reason: "Vomiting / lethargy", vet: VET_NAME, summary: "Acute gastroenteritis. Prescribed bland diet + antiemetic. Hydration adequate." },
      { date: "13 Sep 2026", reason: "Scratching & ear odour", vet: VET_NAME, summary: "Flea allergy dermatitis on flank. Started ectoparasite control." },
      { date: "13 Sep 2026", reason: "Annual wellness exam", vet: VET_NAME, summary: "Healthy. Weight stable at 24 kg. Dental score 1/4." },
    ],
    diagnoses: [
      { date: "13 Sep 2026", name: "Acute gastroenteritis", status: "Active", notes: "Dietary indiscretion suspected." },
      { date: "13 Sep 2026", name: "Flea allergy dermatitis", status: "Resolved" },
    ],
    medications: [
      { name: "Maropitant", dose: "2 mg/kg", route: "Oral", frequency: "Once daily", duration: "5 days", prescribed: "14 Sep 2026", status: "Completed" },
    ],
    vaccinations: [
      { name: "Rabies", date: "13 Sep 2026", nextDue: "14 Sep 2026", status: "Overdue" },
      { name: "DHPP", date: "13 Sep 2026", nextDue: "14 Sep 2026", status: "Administered" },
    ],
    labs: [
      {
        id: "l1", name: "CBC", date: "13 Sep 2026", status: "available",
        values: [
          { name: "Hemoglobin", value: "14.2", unit: "g/dL", ref: "12.0–18.0", flag: "normal" },
          { name: "WBC", value: "11.2", unit: "×10⁹/L", ref: "5.5–16.9", flag: "normal" },
          { name: "Platelets", value: "248", unit: "×10⁹/L", ref: "175–500", flag: "normal" },
        ],
      },
      { id: "l2", name: "Urinalysis", date: "13 Sep 2026", status: "pending", values: [] },
    ],
    documents: [
      { name: "Vaccination certificate 2025", type: "PDF", date: "14 Sep 2026" },
    ],
  },
  p2: {
    visits: [
      { date: "14 Sep 2026", reason: "Annual vaccination + wellness", vet: VET_NAME, summary: "Rabies & DHPP administered. Mild stertor consistent with BOAS grade II. Prednisolone continued for airway inflammation." },
      { date: "13 Sep 2026", reason: "Eye recheck", vet: VET_NAME, summary: "Corneal ulcer fully healed. Fluorescein stain negative." },
      { date: "14 Sep 2026", reason: "BOAS assessment", vet: VET_NAME, summary: "Grade II BOAS. Advised weight control; surgical consult optional." },
    ],
    diagnoses: [
      { date: "14 Sep 2026", name: "BOAS grade II", status: "Active", notes: "Brachycephalic obstructive airway syndrome." },
      { date: "14 Sep 2026", name: "Corneal ulcer (left eye)", status: "Resolved" },
    ],
    medications: [
      { name: "Prednisolone", dose: "5 mg", route: "Oral", frequency: "Once daily", duration: "14 days", prescribed: "13 Sep 2026", status: "Active" },
    ],
    vaccinations: [
      { name: "Rabies", date: "14 Sep 2026", nextDue: "13 Sep 2026", status: "Administered" },
      { name: "DHPP", date: "14 Sep 2026", nextDue: "14 Sep 2026", status: "Administered" },
    ],
    labs: [
      {
        id: "l3", name: "CBC", date: "14 Sep 2026", status: "available",
        values: [
          { name: "Hemoglobin", value: "12.1", unit: "g/dL", ref: "12.0–18.0", flag: "normal" },
          { name: "WBC", value: "18.4", unit: "×10⁹/L", ref: "5.5–16.9", flag: "high" },
          { name: "Platelets", value: "310", unit: "×10⁹/L", ref: "175–500", flag: "normal" },
        ],
      },
      {
        id: "l4", name: "Blood Chemistry", date: "13 Sep 2026", status: "available",
        values: [
          { name: "ALT", value: "42", unit: "U/L", ref: "10–125", flag: "normal" },
          { name: "Creatinine", value: "0.9", unit: "mg/dL", ref: "0.5–1.8", flag: "normal" },
          { name: "Glucose", value: "108", unit: "mg/dL", ref: "74–143", flag: "normal" },
        ],
      },
      { id: "l5", name: "Urinalysis", date: "14 Sep 2026", status: "pending", values: [] },
      {
        id: "l6", name: "Thoracic Imaging", date: "14 Sep 2026", status: "available",
        values: [
          { name: "Tracheal diameter", value: "Narrowed", unit: "", ref: "", flag: "high" },
          { name: "Cardiac silhouette", value: "Normal", unit: "", ref: "", flag: "normal" },
        ],
      },
    ],
    documents: [
      { name: "Vaccination certificate 2026", type: "PDF", date: "13 Sep 2026" },
      { name: "Thoracic X-ray report", type: "PDF", date: "13 Sep 2026" },
      { name: "Left ear — SkinSense photo", type: "Image", date: "13 Sep 2026" },
    ],
  },
  p3: {
    visits: [
      { date: "14 Sep 2026", reason: "Skin condition", vet: VET_NAME, summary: "Bilateral flank alopecia, non-pruritic — consistent with hypothyroidism. Continue levothyroxine, recheck TT4 in 4 weeks." },
      { date: "13 Sep 2026", reason: "Limping — hind left", vet: VET_NAME, summary: "Mild hip laxity. Weight management + joint supplement advised." },
      { date: "14 Sep 2026", reason: "Annual wellness exam", vet: VET_NAME, summary: "TT4 low-normal at the time; started monitoring." },
    ],
    diagnoses: [
      { date: "13 Sep 2026", name: "Hypothyroidism", status: "Active", notes: "On levothyroxine 0.4 mg BID." },
      { date: "13 Sep 2026", name: "Hip dysplasia (early)", status: "Active" },
    ],
    medications: [
      { name: "Levothyroxine", dose: "0.4 mg", route: "Oral", frequency: "Twice daily", duration: "30 days", prescribed: "14 Sep 2026", status: "Active" },
    ],
    vaccinations: [
      { name: "Rabies", date: "14 Sep 2026", nextDue: "13 Sep 2026", status: "Administered" },
      { name: "DHPP", date: "13 Sep 2026", nextDue: "14 Sep 2026", status: "Administered" },
    ],
    labs: [
      {
        id: "l7", name: "Thyroid Panel", date: "14 Sep 2026", status: "available",
        values: [
          { name: "TT4", value: "1.1", unit: "µg/dL", ref: "1.5–4.5", flag: "low" },
          { name: "TSH", value: "0.62", unit: "ng/mL", ref: "0.05–0.50", flag: "high" },
        ],
      },
      {
        id: "l8", name: "CBC", date: "14 Sep 2026", status: "available",
        values: [
          { name: "Hemoglobin", value: "13.8", unit: "g/dL", ref: "12.0–18.0", flag: "normal" },
          { name: "WBC", value: "9.4", unit: "×10⁹/L", ref: "5.5–16.9", flag: "normal" },
        ],
      },
    ],
    documents: [
      { name: "Thyroid panel report", type: "PDF", date: "13 Sep 2026" },
    ],
  },
};

function defaultRecord(p: VetPatient): PatientRecord {
  return {
    visits: [
      { date: p.lastVisit, reason: "General consultation", vet: VET_NAME, summary: "Examined. No acute findings on physical exam." },
    ],
    diagnoses: p.conditions.map((c) => ({ date: p.lastVisit, name: c, status: "Active" as const })),
    medications: p.currentMeds.map((m) => ({ name: m, dose: "As directed", route: "Oral", frequency: "Twice daily", duration: "7 days", prescribed: p.lastVisit, status: "Active" as const })),
    vaccinations: [
      { name: "Rabies", date: "14 Sep 2026", nextDue: "13 Sep 2026", status: "Administered" as const },
    ],
    labs: [
      { id: `l-${p.id}-cbc`, name: "CBC", date: p.lastVisit, status: "pending", values: [] },
    ],
    documents: [],
  };
}

export function recordFor(patientId: string): PatientRecord {
  const rec = PATIENT_RECORDS[patientId];
  if (rec) return rec;
  const p = patientById(patientId);
  if (!p) return { visits: [], diagnoses: [], medications: [], vaccinations: [], labs: [], documents: [] };
  return defaultRecord(p);
}

/* ================= Common diagnoses (terminology picklist) ================= */

export const COMMON_DIAGNOSES = [
  "Otitis externa",
  "Acute gastroenteritis",
  "Kennel cough (CIRDC)",
  "Flea allergy dermatitis",
  "Pyoderma",
  "Conjunctivitis",
  "Patellar luxation",
  "Hip dysplasia",
  "BOAS",
  "Hypothyroidism",
  "Diabetes mellitus",
  "Chronic kidney disease",
  "Lower urinary tract infection",
  "Dental disease",
  "Pancreatitis",
];

/* ================= Inventory & billing ================= */

export type StockLevel = "ok" | "low" | "critical";
export type InventoryItem = { id: string; item: string; category: string; stock: number; unit: string; level: StockLevel };

export const INVENTORY: InventoryItem[] = [
  { id: "i1", item: "Amoxicillin-Clavulanate 250mg", category: "Antibiotic", stock: 60, unit: "tabs", level: "ok" },
  { id: "i2", item: "Carprofen 25mg", category: "NSAID", stock: 25, unit: "tabs", level: "low" },
  { id: "i3", item: "Ivermectin 1% injection", category: "Antiparasitic", stock: 8, unit: "vials", level: "critical" },
  { id: "i4", item: "Rabies vaccine", category: "Vaccine", stock: 42, unit: "doses", level: "ok" },
  { id: "i5", item: "Prednisolone 5mg", category: "Corticosteroid", stock: 15, unit: "tabs", level: "low" },
  { id: "i6", item: "IV fluids (LRS 500ml)", category: "Fluids", stock: 30, unit: "bags", level: "ok" },
  { id: "i7", item: "Syringes 3ml", category: "Consumables", stock: 480, unit: "pcs", level: "ok" },
  { id: "i8", item: "Apoquel 16mg", category: "Antipruritic", stock: 12, unit: "tabs", level: "low" },
];

export type Invoice = { id: string; owner: string; patientId: string; date: string; amount: number; status: "Paid" | "Pending" | "Overdue" };

export const INVOICES: Invoice[] = [
  { id: "INV-2081", owner: "Sarah Mehta", patientId: "p2", date: "14 Sep 2026", amount: 1800, status: "Paid" },
  { id: "INV-2080", owner: "Rahul Shah", patientId: "p1", date: "14 Sep 2026", amount: 2400, status: "Pending" },
  { id: "INV-2079", owner: "Ananya Rao", patientId: "p3", date: "14 Sep 2026", amount: 3150, status: "Pending" },
  { id: "INV-2078", owner: "Vikram Singh", patientId: "p4", date: "14 Sep 2026", amount: 1200, status: "Paid" },
  { id: "INV-2077", owner: "Arjun Patel", patientId: "p5", date: "13 Sep 2026", amount: 4500, status: "Overdue" },
  { id: "INV-2076", owner: "Nisha Verma", patientId: "p6", date: "14 Sep 2026", amount: 900, status: "Paid" },
];
