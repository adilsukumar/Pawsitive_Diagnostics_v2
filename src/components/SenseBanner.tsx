/**
 * Shared sense-page banner for the botanical health design system.
 */
export function SenseBanner({
  subtitleEn,
  titleEn,
  descriptorEn,
  bgGradient,
  subtitleColor,
  score,
}: {
  score?: number;
  subtitleEn: string;
  titleEn: string;
  descriptorEn: string;
  bgGradient: string;
  subtitleColor: string;
}) {
  return (
    <>
      <style>{`
        @keyframes sbLiveDot { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.3);opacity:.55} }
      `}</style>
      <div
        style={{
          position: "relative",
          zIndex: 1,
          minHeight: 178,
          padding: "24px 20px 36px",
          background: bgGradient,
          overflow: "visible",
          boxSizing: "border-box",
          borderRadius: "0 0 30px 30px",
        }}
      >
        <div
          style={{
            position: "relative",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 12,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: subtitleColor,
                letterSpacing: "0.08em",
                lineHeight: 1.2,
                textTransform: "uppercase",
              }}
            >
              {subtitleEn}
            </div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: "var(--text-primary)",
                lineHeight: 1.15,
                marginTop: 4,
                letterSpacing: 0,
              }}
            >
              {titleEn}
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 400,
                color: "var(--text-secondary)",
                marginTop: 6,
                lineHeight: 1.3,
              }}
            >
              {descriptorEn}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
          {score !== undefined && (
            <div style={{ 
              background: "#fff", color: subtitleColor, padding: "4px 10px", borderRadius: 50, 
              fontSize: 12, fontWeight: 800, letterSpacing: "0.05em", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" 
            }}>
              SCORE: {score}
            </div>
          )}
          <span
            className="inline-flex items-center"
            style={{
              flexShrink: 0,
               background: "var(--bg-card)",
              color: "var(--text-primary)",
              borderRadius: 50,
              padding: "5px 11px 5px 9px",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.1em",
              gap: 6,
               boxShadow: "0 3px 14px rgba(22,62,56,0.08)",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--accent-red)",
                animation: "sbLiveDot 1.5s ease-in-out infinite",
              }}
            />
            LIVE
          </span>
          </div>
        </div>
      </div>
    </>
  );
}
