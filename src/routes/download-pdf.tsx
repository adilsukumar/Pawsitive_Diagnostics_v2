import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { usePet } from "@/context/PetContext";
import { PdfTemplate } from "@/components/PdfTemplate";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/download-pdf")({
  component: DownloadPdfPage,
});

function DownloadPdfPage() {
  const { pet } = usePet();
  const search = Route.useSearch() as { timeline?: string };
  const timeline = search.timeline || "1 Week";
  const pdfRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("Generating PDF for " + pet.name + "...");

  useEffect(() => {
    if (!pdfRef.current) return;
    
    const generate = async () => {
      try {
        const canvas = await html2canvas(pdfRef.current!, { scale: 2 });
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save(pet.name + "_HealthReport_" + timeline.replace(/\s+/g, '') + ".pdf");
        setStatus("Download complete! You can close this window.");
      } catch (e) {
        setStatus("Failed to generate PDF.");
      }
    };
    
    // Give it a brief moment to render fonts
    setTimeout(generate, 1000);
  }, [pet.name, timeline]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", background: "#163E38", color: "white", fontFamily: "sans-serif" }}>
      {status.includes("Generating") && <Loader2 className="animate-spin" size={48} style={{ marginBottom: 24 }} />}
      <div style={{ fontSize: 20, fontWeight: "bold" }}>{status}</div>
      <div style={{ position: "absolute", top: -9999, left: -9999 }}>
        <PdfTemplate ref={pdfRef} pet={pet} timeline={timeline} />
      </div>
    </div>
  );
}
