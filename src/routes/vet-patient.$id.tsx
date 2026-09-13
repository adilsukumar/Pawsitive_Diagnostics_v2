import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Phone, Stethoscope, Pill, ChevronDown, ChevronUp, Plus, Upload, X,
  FileText, Syringe, Activity, AlertTriangle, ArrowLeft, type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import VetShell from "@/components/vet/VetShell";
import { Card, Chip, E, FieldLabel, GhostBtn, PatientAvatar, PrimaryBtn, inputStyle } from "@/components/vet/ehr";
import {
  CURRENT_VITALS, DEFAULT_GAIT, DEFAULT_PANTING, GAIT_FEED, PANTING_FEED,
  VET_PATIENTS, baselineFor, gaitAsymmetry, heatStressRisk, recordFor,
  riskTagsFor, scratchSpike, scratchWeekFor, type VetPatient,
} from "@/components/vet/vetData";

export const Route = createFileRoute("/vet-patient/$id")({
  head: () => ({
    meta: [
      { title: "Patient Record — Pawsitive Diagnostics Veterinary" },
      { name: "description", content: "Veterinary patient profile: clinical summary, visits, diagnoses, medications, vaccinations and lab results." },
      { property: "og:title", content: "Patient Record — Pawsitive Diagnostics Veterinary" },
      { property: "og:description", content: "Veterinary patient profile and medical record." },
    ],
  }),
  component: VetPatientProfile,
});

const TABS = ["Overview", "Visits", "Diagnoses", "Medications", "Vaccinations", "Lab Results", "Documents"] as const;
type Tab = (typeof TABS)[number];

const TONE: Record<string, { fg: string; bg: string }> = {
  red: { fg: E.red, bg: E.redSoft },
  amber: { fg: E.amber, bg: E.amberSoft },
  blue: { fg: E.blue, bg: E.blueSoft },
};

function VitalMini({ label, value, unit, range, decimals = 0 }: { label: string; value: number | null; unit: string; range: [number, number]; decimals?: number }) {
  const ok = value != null ? (value >= range[0] && value <= range[1]) : true;
  return (
    <div style={{ flex: 1, minWidth: 120, background: E.bg, borderRadius: 10, padding: "10px 12px" }}>
      <div style={{ fontSize: 10.5, fontWeight: 600, color: E.sub, letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</div>
      <div className="flex items-baseline" style={{ gap: 5, marginTop: 3 }}>
        <span style={{ fontSize: 17, fontWeight: 800, color: E.ink, fontVariantNumeric: "tabular-nums" }}>{value != null ? value.toFixed(decimals) : "—"}</span>
        <span style={{ fontSize: 10.5, color: E.sub }}>{unit}</span>
        <Chip tone={value != null ? (ok ? "green" : "red") : "gray"} style={{ marginLeft: "auto" }}>{value != null ? (ok ? "Normal" : "Review") : "Pending"}</Chip>
      </div>
      <div style={{ fontSize: 10, color: E.faint, marginTop: 3 }}>Ref {range[0]}–{range[1]} {unit}</div>
    </div>
  );
}

function OverviewTab({ patient }: { patient: VetPatient }) {
  const vitals = { hr: null, temp: null, rr: null };
  const base = baselineFor(patient);
  const week = scratchWeekFor(patient.id);
  const { spike, pct } = scratchSpike(week);
  const panting = PANTING_FEED[patient.id] ?? DEFAULT_PANTING;
  const risk = heatStressRisk(panting);
  const gait = gaitAsymmetry(GAIT_FEED[patient.id] ?? DEFAULT_GAIT);
  const rec = recordFor(patient.id);
  const maxEvents = Math.max(...week.map((d) => d.events));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Risk tags */}
      <Card style={{ padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: E.ink, marginBottom: 10 }}>Breed Risk Profile</div>
        <div className="flex" style={{ gap: 7, flexWrap: "wrap" }}>
          {riskTagsFor(patient).map((t) => (
            <span key={t.label} style={{ fontSize: 11.5, fontWeight: 600, color: TONE[t.tone].fg, background: TONE[t.tone].bg, borderRadius: 7, padding: "4px 10px" }}>
              {t.label}
            </span>
          ))}
        </div>
      </Card>

      {/* Live vitals */}
      <Card style={{ padding: 16 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: E.ink }}>Latest Vitals</div>
          <span style={{ fontSize: 11, color: E.sub }}>Collar sync · just now</span>
        </div>
        <div className="flex" style={{ gap: 8, flexWrap: "wrap" }}>
          <VitalMini label="Heart rate" value={vitals.hr} unit="bpm" range={base.hr} />
          <VitalMini label="Temperature" value={vitals.temp} unit="°C" range={base.temp} decimals={1} />
          <VitalMini label="Resp. rate" value={vitals.rr} unit="/min" range={base.rr} />
        </div>
      </Card>

      {/* Telemetry */}
      <Card style={{ padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: E.ink, marginBottom: 4 }}>Remote Telemetry</div>
        <div style={{ fontSize: 11.5, color: E.sub, marginBottom: 12 }}>Smart-collar signals from the last 7 days</div>
        <div className="flex items-end" style={{ gap: 6, height: 56 }}>
          {week.map((d) => {
            const isToday = d.day === "Today";
            return (
              <div key={d.day} className="flex-1 flex flex-col items-center" style={{ gap: 4 }}>
                <div style={{ width: "100%", maxWidth: 24, height: `${Math.max(12, (d.events / maxEvents) * 100)}%`, minHeight: 5, borderRadius: 4, background: isToday ? (spike ? E.red : E.accent) : "var(--acc2-soft)" }} />
                <span style={{ fontSize: 8.5, fontWeight: isToday ? 700 : 500, color: isToday ? E.ink : E.sub }}>{d.day}</span>
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: 11, color: E.sub, marginTop: 6 }}>Scratch & shake events</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 10 }}>
          {spike && (
            <div className="flex items-start" style={{ gap: 8, background: E.amberSoft, borderRadius: 10, padding: "8px 11px" }}>
              <AlertTriangle size={13} style={{ color: E.amber, flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 11.5, lineHeight: 1.45, color: E.amber, fontWeight: 600 }}>Scratching up {pct}% this week — consider ear/flea exam.</span>
            </div>
          )}
          {risk !== "low" && (
            <div className="flex items-start" style={{ gap: 8, background: risk === "high" ? E.redSoft : E.amberSoft, borderRadius: 10, padding: "8px 11px" }}>
              <AlertTriangle size={13} style={{ color: risk === "high" ? E.red : E.amber, flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 11.5, lineHeight: 1.45, fontWeight: 600, color: risk === "high" ? E.red : E.amber }}>
                {risk === "high" ? `Heat stress risk — panting ${panting.pantingPerMin}/min at ${panting.ambientC}°C ambient.` : `Panting elevated (${panting.pantingPerMin}/min) at ${panting.ambientC}°C.`}
              </span>
            </div>
          )}
          {gait.flag && (
            <div className="flex items-start" style={{ gap: 8, background: E.amberSoft, borderRadius: 10, padding: "8px 11px" }}>
              <Activity size={13} style={{ color: E.amber, flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 11.5, lineHeight: 1.45, color: E.amber, fontWeight: 600 }}>{gait.worst.leg} bearing {gait.deficit}% less weight — orthopaedic exam recommended.</span>
            </div>
          )}
        </div>
      </Card>

      {/* Latest visit */}
      {rec.visits[0] && (
        <Card style={{ padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: E.ink, marginBottom: 8 }}>Most Recent Visit — {rec.visits[0].date}</div>
          <div style={{ fontSize: 12.5, color: E.sub, lineHeight: 1.55 }}>{rec.visits[0].summary}</div>
        </Card>
      )}
    </div>
  );
}

function VetPatientProfile() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const patient = VET_PATIENTS.find((p) => p.id === id);
  const [tab, setTab] = useState<Tab>("Overview");
  const [expandedLab, setExpandedLab] = useState<string | null>(null);
  const [vaxOpen, setVaxOpen] = useState(false);
  const [vaxForm, setVaxForm] = useState({ name: "Rabies", date: new Date().toISOString().slice(0, 10) });
  const [addedVax, setAddedVax] = useState<{ name: string; date: string; nextDue: string; status: "Administered" }[]>([]);
  const [addedDocs, setAddedDocs] = useState<{ name: string; type: string; date: string }[]>([]);

  const rec = useMemo(() => recordFor(id), [id]);

  if (!patient) {
    return (
      <VetShell title="Patient not found">
        <Card style={{ padding: 28, textAlign: "center" }}>
          <div style={{ fontSize: 13, color: E.sub }}>No patient record exists for ID “{id}”.</div>
          <div style={{ marginTop: 14 }}>
            <PrimaryBtn onClick={() => navigate({ to: "/vet-patients", search: { q: "" } })}>Back to Patients</PrimaryBtn>
          </div>
        </Card>
      </VetShell>
    );
  }

  const addVaccination = () => {
    const d = new Date(vaxForm.date);
    const next = new Date(d); next.setFullYear(next.getFullYear() + 1);
    const fmt = (x: Date) => x.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    setAddedVax((v) => [...v, { name: vaxForm.name, date: fmt(d), nextDue: fmt(next), status: "Administered" }]);
    setVaxOpen(false);
    toast.success(`${vaxForm.name} vaccination recorded for ${patient.name}.`);
  };

  const summaryItems: { label: string; value: string; warn?: boolean }[] = [
    { label: "Known Allergies", value: patient.allergies.length ? patient.allergies.join(", ") : "None recorded", warn: patient.allergies.length > 0 },
    { label: "Current Medications", value: patient.currentMeds.length ? patient.currentMeds.join(", ") : "None" },
    { label: "Vaccination Status", value: patient.vaccinationStatus, warn: patient.vaccinationStatus !== "Up to date" },
    { label: "Last Visit", value: patient.lastVisit },
    { label: "Next Follow-up", value: patient.nextFollowUp },
    { label: "Weight", value: patient.weightKg > 0 ? `${patient.weightKg} kg` : "—" },
    { label: "Temperature", value: `${patient.tempC}°C` },
  ];

  return (
    <VetShell>
      {/* Back + header */}
      <button
        onClick={() => navigate({ to: "/vet-patients", search: { q: "" } })}
        className="flex items-center"
        style={{ gap: 6, background: "none", border: "none", fontSize: 12.5, fontWeight: 600, color: E.sub, marginBottom: 12, padding: 0 }}
      >
        <ArrowLeft size={14} /> All patients
      </button>

      <Card style={{ padding: 18, marginBottom: 14 }}>
        <div className="flex items-start flex-wrap" style={{ gap: 16 }}>
          <PatientAvatar patient={patient} size={64} />
          <div style={{ flex: 1, minWidth: 200 }}>
            <div className="flex items-center flex-wrap" style={{ gap: 9 }}>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: E.ink, margin: 0, letterSpacing: "-0.015em" }}>{patient.name}</h1>
              <Chip tone="green" dot>{patient.status}</Chip>
            </div>
            <div style={{ fontSize: 13, color: E.sub, marginTop: 3 }}>
              {patient.breed} · {patient.gender === "female" ? "Female" : "Male"} · {patient.age}{patient.weightKg > 0 ? ` · ${patient.weightKg} kg` : ""}
            </div>
            <div className="flex flex-wrap" style={{ gap: "6px 22px", marginTop: 12 }}>
              {[
                { label: "Owner", value: `${patient.owner} · ${patient.ownerPhone}` },
                { label: "Patient ID", value: patient.patientCode },
                { label: "Microchip", value: patient.microchip },
              ].map((m) => (
                <div key={m.label}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: E.faint, letterSpacing: "0.05em", textTransform: "uppercase" }}>{m.label}</div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: E.ink, marginTop: 2 }}>{m.value}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex" style={{ gap: 8, flexWrap: "wrap" }}>
            <GhostBtn onClick={() => { window.location.href = `tel:${patient.ownerPhone.replace(/\s/g, "")}`; toast.info(`Calling ${patient.owner}…`); }}>
              <Phone size={14} /> Call Owner
            </GhostBtn>
            <GhostBtn onClick={() => navigate({ to: "/vet-rx", search: { patient: patient.id } })}>
              <Pill size={14} /> New Prescription
            </GhostBtn>
            <PrimaryBtn onClick={() => navigate({ to: "/vet-consult", search: { patient: patient.id } })}>
              <Stethoscope size={14} /> Start Consultation
            </PrimaryBtn>
          </div>
        </div>
      </Card>

      {/* Clinical summary */}
      <Card style={{ padding: 16, marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: E.ink, marginBottom: 12 }}>Clinical Summary</div>
        <div className="grid grid-cols-2" style={{ gap: 10 }}>
          {summaryItems.map((s) => (
            <div key={s.label} style={{ background: s.warn ? E.redSoft : E.bg, borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: s.warn ? E.red : E.sub, letterSpacing: "0.04em", textTransform: "uppercase" }}>{s.label}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: s.warn ? E.red : E.ink, marginTop: 3 }}>{s.value}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex scrollbar-hide" style={{ gap: 4, overflowX: "auto", borderBottom: `1px solid ${E.border}`, marginBottom: 16 }}>
        {TABS.map((t) => {
          const active = tab === t;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "9px 13px", fontSize: 13, fontWeight: active ? 700 : 500, whiteSpace: "nowrap",
                color: active ? E.accentDeep : E.sub, background: "none", border: "none",
                borderBottom: active ? `2.5px solid ${E.accent}` : "2.5px solid transparent",
              }}
            >
              {t}
            </button>
          );
        })}
      </div>

      {tab === "Overview" && <OverviewTab patient={patient} />}

      {tab === "Visits" && (
        <Card style={{ overflow: "hidden" }}>
          {rec.visits.map((v, i) => (
            <div key={i} style={{ padding: "14px 16px", borderTop: i === 0 ? "none" : `1px solid ${E.borderSubtle}` }}>
              <div className="flex items-center justify-between flex-wrap" style={{ gap: 6 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: E.ink }}>{v.reason}</div>
                <div style={{ fontSize: 11.5, color: E.sub }}>{v.date} · {v.vet}</div>
              </div>
              <div style={{ fontSize: 12.5, color: E.sub, lineHeight: 1.55, marginTop: 5 }}>{v.summary}</div>
            </div>
          ))}
        </Card>
      )}

      {tab === "Diagnoses" && (
        <Card style={{ overflow: "hidden" }}>
          {rec.diagnoses.length === 0 && <div style={{ padding: 22, fontSize: 12.5, color: E.sub }}>No diagnoses on record.</div>}
          {rec.diagnoses.map((d, i) => (
            <div key={i} className="flex items-center" style={{ gap: 10, padding: "13px 16px", borderTop: i === 0 ? "none" : `1px solid ${E.borderSubtle}` }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: E.ink }}>{d.name}</div>
                {d.notes && <div style={{ fontSize: 11.5, color: E.sub, marginTop: 2 }}>{d.notes}</div>}
              </div>
              <span style={{ fontSize: 11.5, color: E.sub, flexShrink: 0 }}>{d.date}</span>
              <Chip tone={d.status === "Active" ? "amber" : "green"}>{d.status}</Chip>
            </div>
          ))}
        </Card>
      )}

      {tab === "Medications" && (
        <Card style={{ overflow: "hidden" }}>
          {rec.medications.length === 0 && <div style={{ padding: 22, fontSize: 12.5, color: E.sub }}>No medications on record.</div>}
          {rec.medications.map((m, i) => (
            <div key={i} className="flex items-center" style={{ gap: 10, padding: "13px 16px", borderTop: i === 0 ? "none" : `1px solid ${E.borderSubtle}` }}>
              <span className="flex items-center justify-center" style={{ width: 32, height: 32, borderRadius: 9, background: E.pale, color: E.accent, flexShrink: 0 }}>
                <Pill size={15} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: E.ink }}>{m.name} <span style={{ fontWeight: 500, color: E.sub }}>· {m.dose}</span></div>
                <div style={{ fontSize: 11.5, color: E.sub, marginTop: 2 }}>{m.route} · {m.frequency} · {m.duration} · from {m.prescribed}</div>
              </div>
              <Chip tone={m.status === "Active" ? "blue" : "grey"}>{m.status}</Chip>
            </div>
          ))}
        </Card>
      )}

      {tab === "Vaccinations" && (
        <Card style={{ overflow: "hidden" }}>
          <div className="flex items-center justify-between" style={{ padding: "13px 16px", borderBottom: `1px solid ${E.borderSubtle}` }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: E.ink }}>Vaccination History</div>
            <PrimaryBtn onClick={() => setVaxOpen(true)} style={{ height: 32, fontSize: 12 }}><Plus size={13} /> Add Vaccination</PrimaryBtn>
          </div>
          {[...rec.vaccinations, ...addedVax].map((v, i) => (
            <div key={i} className="flex items-center" style={{ gap: 10, padding: "13px 16px", borderTop: i === 0 ? "none" : `1px solid ${E.borderSubtle}` }}>
              <span className="flex items-center justify-center" style={{ width: 32, height: 32, borderRadius: 9, background: E.greenSoft, color: E.green, flexShrink: 0 }}>
                <Syringe size={15} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: E.ink }}>{v.name}</div>
                <div style={{ fontSize: 11.5, color: E.sub, marginTop: 2 }}>Given {v.date} · Next due {v.nextDue}</div>
              </div>
              <Chip tone={v.status === "Administered" ? "green" : v.status === "Due" ? "amber" : "red"}>{v.status}</Chip>
            </div>
          ))}
        </Card>
      )}

      {tab === "Lab Results" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {rec.labs.map((l) => {
            const open = expandedLab === l.id;
            const abnormal = l.values.filter((v) => v.flag !== "normal").length;
            return (
              <Card key={l.id} style={{ overflow: "hidden" }}>
                <button
                  onClick={() => setExpandedLab(open ? null : l.id)}
                  className="w-full flex items-center text-left"
                  style={{ gap: 11, padding: "13px 16px", border: "none", background: "transparent" }}
                >
                  <span className="flex items-center justify-center" style={{ width: 32, height: 32, borderRadius: 9, background: E.blueSoft, color: E.blue, flexShrink: 0 }}>
                    <FileText size={15} />
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: E.ink }}>{l.name}</span>
                    <span style={{ display: "block", fontSize: 11.5, color: E.sub, marginTop: 1 }}>{l.date}{abnormal > 0 ? ` · ${abnormal} abnormal value${abnormal > 1 ? "s" : ""}` : ""}</span>
                  </span>
                  <Chip tone={l.status === "available" ? "green" : "amber"} dot>{l.status === "available" ? "Available" : "Pending"}</Chip>
                  {open ? <ChevronUp size={15} style={{ color: E.faint }} /> : <ChevronDown size={15} style={{ color: E.faint }} />}
                </button>
                {open && l.status === "available" && (
                  <div style={{ borderTop: `1px solid ${E.borderSubtle}` }}>
                    {l.values.map((v, i) => (
                      <div key={i} className="flex items-center" style={{ gap: 10, padding: "10px 16px", borderTop: i === 0 ? "none" : `1px solid ${E.borderSubtle}` }}>
                        <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: E.ink }}>{v.name}</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: v.flag === "normal" ? E.ink : E.red, fontVariantNumeric: "tabular-nums" }}>
                          {v.value} <span style={{ fontSize: 10.5, fontWeight: 500, color: E.sub }}>{v.unit}</span>
                        </span>
                        {v.ref && <span className="hidden" style={{ fontSize: 10.5, color: E.faint, width: 90, textAlign: "right" }}>Ref {v.ref}</span>}
                        <Chip tone={v.flag === "normal" ? "green" : "red"}>
                          {v.flag === "normal" ? "Normal" : v.flag === "high" ? "↑ High" : "↓ Low"}
                        </Chip>
                      </div>
                    ))}
                  </div>
                )}
                {open && l.status === "pending" && (
                  <div style={{ borderTop: `1px solid ${E.borderSubtle}`, padding: "12px 16px", fontSize: 12, color: E.sub }}>
                    Sample collected — results expected within 24 hours.
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {tab === "Documents" && (
        <Card style={{ overflow: "hidden" }}>
          <div className="flex items-center justify-between" style={{ padding: "13px 16px", borderBottom: `1px solid ${E.borderSubtle}` }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: E.ink }}>Documents & Photos</div>
            <label>
              <input
                type="file"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setAddedDocs((d) => [...d, { name: f.name, type: f.type.startsWith("image/") ? "Image" : "PDF", date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) }]);
                  toast.success(`${f.name} uploaded to ${patient.name}'s record.`);
                }}
              />
              <span className="inline-flex items-center" style={{ height: 32, padding: "0 13px", borderRadius: 9, background: E.accent, color: "#fff", fontSize: 12, fontWeight: 600, gap: 6, cursor: "pointer" }}>
                <Upload size={13} /> Upload
              </span>
            </label>
          </div>
          {[...rec.documents, ...addedDocs].length === 0 && <div style={{ padding: 22, fontSize: 12.5, color: E.sub }}>No documents on file.</div>}
          {[...rec.documents, ...addedDocs].map((d, i) => (
            <button
              key={i}
              onClick={() => toast.success(`${d.name} opened`)}
              className="w-full flex items-center text-left"
              style={{ gap: 10, padding: "12px 16px", borderTop: i === 0 ? "none" : `1px solid ${E.borderSubtle}`, border: "none", background: "transparent" }}
            >
              <span className="flex items-center justify-center" style={{ width: 30, height: 30, borderRadius: 8, background: E.greySoft, color: E.grey, flexShrink: 0 }}>
                <FileText size={14} />
              </span>
              <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 600, color: E.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</span>
              <Chip tone="grey">{d.type}</Chip>
              <span style={{ fontSize: 11, color: E.sub, flexShrink: 0 }}>{d.date}</span>
            </button>
          ))}
        </Card>
      )}

      {/* Add vaccination modal */}
      {vaxOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(20,28,44,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => setVaxOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: E.card, borderRadius: 16, padding: 22, width: "100%", maxWidth: 380 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: E.ink }}>Add Vaccination — {patient.name}</div>
              <button onClick={() => setVaxOpen(false)} aria-label="Close" style={{ background: "none", border: "none", color: E.sub, padding: 4 }}><X size={17} /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <FieldLabel>Vaccine</FieldLabel>
                <select value={vaxForm.name} onChange={(e) => setVaxForm({ ...vaxForm, name: e.target.value })} style={{ ...inputStyle, appearance: "none" }}>
                  {["Rabies", "DHPP", "Leptospirosis", "Kennel Cough (Bordetella)"].map((v) => <option key={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <FieldLabel>Date administered</FieldLabel>
                <input type="date" value={vaxForm.date} onChange={(e) => setVaxForm({ ...vaxForm, date: e.target.value })} style={inputStyle} />
              </div>
              <div className="flex" style={{ gap: 10 }}>
                <GhostBtn onClick={() => setVaxOpen(false)} style={{ flex: 1 }}>Cancel</GhostBtn>
                <PrimaryBtn onClick={addVaccination} style={{ flex: 1 }}>Record</PrimaryBtn>
              </div>
            </div>
          </div>
        </div>
      )}
    </VetShell>
  );
}

