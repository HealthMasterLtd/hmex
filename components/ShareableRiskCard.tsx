"use client";

/**
 * ShareableRiskCard.tsx — FIXED VERSION
 *
 * KEY FIXES:
 * 1. PNG export: card rendered off-screen at true 480px, no transform scaling
 *    involved during capture → words/spaces render correctly
 * 2. Domain link: rendered as a single <span> with explicit spaces between
 *    segments — no flex gap artefacts in html2canvas
 * 3. Button in footer: constrained height so "Start now" never gets cut off
 * 4. Share / WhatsApp: uses Web Share API with file on mobile;
 *    WhatsApp web deep-link on desktop (wa.me)
 * 5. Card thumbnails: CSS transform scale only for visual preview, never
 *    touched during export
 */

import React, { useRef, useState, useCallback, useEffect } from "react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const SITE_URL  = "https://hmex.healthmasterco.com";
const SITE_HOST = "hmex.healthmasterco.com";

const SANS  = "'DM Sans', 'Segoe UI', Arial, sans-serif";
const SERIF = "Georgia, 'Times New Roman', serif";
const MONO  = "'Courier New', Courier, monospace";

const CARD_W = 480;
const CARD_H = 300;

// ─── DOMAIN — single string, no flex tricks ───────────────────────────────────
// html2canvas handles a plain <span> perfectly. Avoid flex/gap for dots.
function Domain({ color, size = 14, weight = 700, ff = SANS }: {
  color: string; size?: number; weight?: number; ff?: string;
}) {
  return (
    <span style={{
      fontSize: size, fontWeight: weight, color, fontFamily: ff,
      letterSpacing: 0, display: "inline-block", lineHeight: 1,
      whiteSpace: "nowrap",
    }}>
      {SITE_HOST}
    </span>
  );
}

// ─── FOOTER ROW — fixed height so button never gets clipped ──────────────────
function FooterRow({ left, btnBg, btnColor, btnText, borderColor }: {
  left: React.ReactNode;
  btnBg: string; btnColor: string; btnText: string; borderColor: string;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      borderTop: `1px solid ${borderColor}`, paddingTop: 16,
      height: 52, boxSizing: "border-box", flexShrink: 0,
      position: "relative", zIndex: 1,
    }}>
      {left}
      <div style={{
        background: btnBg, color: btnColor,
        borderRadius: 10, padding: "8px 18px",
        fontSize: 13, fontWeight: 700, letterSpacing: "0.04em",
        fontFamily: SANS, whiteSpace: "nowrap", flexShrink: 0,
        lineHeight: 1.2, display: "flex", alignItems: "center",
      }}>
        {btnText}
      </div>
    </div>
  );
}

interface CP { userName?: string }

// ─── CARD SHELL ───────────────────────────────────────────────────────────────
// All cards use column flex with space-between and FIXED padding.
// Total: paddingTop(28) + header(~24) + gap + headline(~80) + gap + footer(52) + paddingBottom(22) ≤ 300
function shell(bg: string, extra?: React.CSSProperties): React.CSSProperties {
  return {
    width: CARD_W, height: CARD_H, background: bg, borderRadius: 20,
    fontFamily: SANS, position: "relative", overflow: "hidden",
    display: "flex", flexDirection: "column", justifyContent: "space-between",
    padding: "28px 34px 22px", boxSizing: "border-box",
    ...extra,
  };
}

// ─── CARD 1 – COSMIC ─────────────────────────────────────────────────────────
function Card1({ userName }: CP) {
  const headline = userName ? `${userName} knows their NCD risk. Do you?` : "I just checked my NCD risk. Have you?";
  return (
    <div style={shell("#06060f")}>
      <div style={{ position:"absolute",top:-60,right:-60,width:280,height:280,borderRadius:"50%",background:"radial-gradient(circle,rgba(99,102,241,.45) 0%,transparent 70%)",pointerEvents:"none" }} />
      <svg style={{ position:"absolute",inset:0,width:"100%",height:"100%",opacity:.18,pointerEvents:"none" }}>
        <defs><pattern id="p1c" x="0" y="0" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r="1.5" fill="#818cf8"/></pattern></defs>
        <rect width="100%" height="100%" fill="url(#p1c)" />
      </svg>

      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",position:"relative",zIndex:1 }}>
        <div style={{ display:"flex",alignItems:"center",gap:8 }}>
          <div style={{ width:7,height:7,borderRadius:"50%",background:"#6366f1" }} />
          <span style={{ fontSize:11,fontWeight:700,letterSpacing:"0.15em",textTransform:"uppercase",color:"#818cf8",fontFamily:SANS }}>Health Master</span>
        </div>
        <span style={{ fontSize:10,color:"#4c4f7a",fontFamily:SANS,letterSpacing:"0.06em",textTransform:"uppercase" }}>NCD Assessment</span>
      </div>

      <p style={{ fontSize:26,fontWeight:700,color:"#f1f5f9",lineHeight:1.2,letterSpacing:"-0.03em",margin:0,fontFamily:SANS,position:"relative",zIndex:1,flexGrow:1,display:"flex",alignItems:"center" }}>
        {headline}
      </p>

      <FooterRow
        left={<Domain color="#818cf8" ff={SANS} />}
        btnBg="linear-gradient(135deg,#6366f1,#8b5cf6)" btnColor="#fff"
        btnText="Free · 2 min" borderColor="rgba(99,102,241,0.2)"
      />
    </div>
  );
}

// ─── CARD 2 – CREAM ──────────────────────────────────────────────────────────
function Card2({ userName }: CP) {
  const headline = userName ? `${userName}'s future self said thank you.` : "Your future self will thank you.";
  return (
    <div style={shell("#faf6f0",{ border:"1px solid #e8e0d4",fontFamily:SERIF })}>
      <svg style={{ position:"absolute",inset:0,width:"100%",height:"100%",opacity:.25,pointerEvents:"none" }}>
        <defs><pattern id="p2c" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0 L0 0 0 32" fill="none" stroke="#c4b49a" strokeWidth=".6"/></pattern></defs>
        <rect width="100%" height="100%" fill="url(#p2c)" />
      </svg>

      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",position:"relative",zIndex:1 }}>
        <span style={{ fontSize:11,fontWeight:700,letterSpacing:"0.2em",textTransform:"uppercase",color:"#8b7355",fontFamily:SANS }}>Health Master</span>
        <span style={{ fontSize:10,color:"#a09080",fontFamily:SANS,letterSpacing:"0.06em",textTransform:"uppercase" }}>NCD Assessment</span>
      </div>

      <div style={{ position:"relative",zIndex:1,flexGrow:1,display:"flex",flexDirection:"column",justifyContent:"center" }}>
        <p style={{ fontSize:26,fontWeight:400,color:"#1a1208",lineHeight:1.25,margin:0,fontStyle:"italic",fontFamily:SERIF }}>
          {headline}
        </p>
        <span style={{ fontStyle:"normal",fontWeight:700,fontSize:17,color:"#8b7355",marginTop:6,fontFamily:SANS,letterSpacing:"-0.01em",display:"block" }}>
          Take the 2-minute assessment.
        </span>
      </div>

      <FooterRow
        left={<Domain color="#8b7355" ff={SANS} />}
        btnBg="#2a2015" btnColor="#faf6f0"
        btnText="Start now" borderColor="#e0d4c4"
      />
    </div>
  );
}

// ─── CARD 3 – FOREST ─────────────────────────────────────────────────────────
function Card3({ userName }: CP) {
  const headline = userName ? `${userName} checked. Prevention starts here.` : "Prevention starts with awareness.";
  return (
    <div style={shell("#071510")}>
      <div style={{ position:"absolute",left:0,top:0,bottom:0,width:4,background:"#22c55e",borderRadius:"20px 0 0 20px" }} />
      <div style={{ position:"absolute",top:-40,right:-40,width:220,height:220,borderRadius:"50%",background:"radial-gradient(circle,rgba(34,197,94,.25) 0%,transparent 70%)",pointerEvents:"none" }} />

      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",position:"relative",zIndex:1 }}>
        <span style={{ fontSize:11,fontWeight:700,letterSpacing:"0.18em",textTransform:"uppercase",color:"#4ade80",fontFamily:SANS }}>Health Master</span>
        <span style={{ fontSize:10,color:"#166534",fontFamily:SANS,letterSpacing:"0.06em",textTransform:"uppercase" }}>Free · 2 min</span>
      </div>

      <div style={{ position:"relative",zIndex:1,flexGrow:1,display:"flex",alignItems:"center" }}>
        <p style={{ fontSize:25,fontWeight:700,color:"#ecfdf5",lineHeight:1.2,margin:0,fontFamily:SANS }}>
          {headline}
          <span style={{ color:"#4ade80",display:"block" }}>I checked mine.</span>
        </p>
      </div>

      <FooterRow
        left={<Domain color="#4ade80" ff={SANS} />}
        btnBg="#22c55e" btnColor="#071510"
        btnText="Check yours" borderColor="rgba(74,222,128,0.15)"
      />
    </div>
  );
}

// ─── CARD 4 – TERMINAL ───────────────────────────────────────────────────────
function Card4({ userName }: CP) {
  const cmd = userName ? `$ assess --user="${userName}"` : "$ ncd-check --assess";
  return (
    <div style={shell("#0d0f0c",{ border:"1px solid #1a2510",fontFamily:MONO })}>
      <div style={{ position:"absolute",inset:0,pointerEvents:"none",background:"repeating-linear-gradient(0deg,transparent,transparent 28px,rgba(163,230,53,.03) 28px,rgba(163,230,53,.03) 29px)" }} />
      <div style={{ position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,transparent,#a3e635,transparent)",opacity:.6,pointerEvents:"none" }} />

      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",position:"relative",zIndex:1 }}>
        <div>
          <div style={{ fontSize:11,fontWeight:700,color:"#a3e635",letterSpacing:"0.12em",marginBottom:2,fontFamily:MONO }}>HEALTH_MASTER v2.0</div>
          <div style={{ fontSize:11,color:"#4d7c0f",fontFamily:MONO }}>{cmd}</div>
        </div>
        <span style={{ fontSize:10,color:"#4d7c0f",fontFamily:MONO,letterSpacing:"0.1em",textTransform:"uppercase" }}>NCD Check</span>
      </div>

      <div style={{ position:"relative",zIndex:1,flexGrow:1,display:"flex",flexDirection:"column",justifyContent:"center" }}>
        <div style={{ fontSize:10,color:"#4d7c0f",marginBottom:6,fontFamily:MONO }}>&gt; output.result:</div>
        <p style={{ fontSize:22,fontWeight:400,color:"#d9f99d",lineHeight:1.3,margin:0,fontFamily:MONO }}>
          Know your risk.<br/>Own your health.<br/><span style={{ color:"#a3e635" }}>Act today.</span>
        </p>
      </div>

      <FooterRow
        left={
          <div>
            <div style={{ fontSize:10,color:"#4d7c0f",marginBottom:3,fontFamily:MONO }}>&gt; visit:</div>
            <Domain color="#a3e635" ff={MONO} size={12} />
          </div>
        }
        btnBg="#a3e635" btnColor="#0d0f0c"
        btnText="START" borderColor="#1a2e05"
      />
    </div>
  );
}

// ─── CARD 5 – CORPORATE ──────────────────────────────────────────────────────
function Card5({ userName }: CP) {
  const headline = userName ? `${userName} took 2 minutes to understand their health.` : "I took 2 minutes to understand my health risks.";
  return (
    <div style={shell("#ffffff",{ border:"1px solid #e2e8f0" })}>
      <div style={{ position:"absolute",left:0,top:0,bottom:0,width:6,background:"linear-gradient(180deg,#2563eb,#1d4ed8)",borderRadius:"20px 0 0 20px" }} />

      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",position:"relative",zIndex:1 }}>
        <div>
          <div style={{ fontSize:11,fontWeight:700,letterSpacing:"0.18em",textTransform:"uppercase",color:"#2563eb",marginBottom:2,fontFamily:SANS }}>Health Master</div>
          <div style={{ fontSize:11,color:"#94a3b8",fontFamily:SANS }}>NCD Risk Assessment</div>
        </div>
        <span style={{ fontSize:10,color:"#94a3b8",fontFamily:SANS,letterSpacing:"0.06em",textTransform:"uppercase" }}>Free · 2 min</span>
      </div>

      <p style={{ fontSize:24,fontWeight:700,color:"#0f172a",lineHeight:1.25,margin:0,fontFamily:SANS,position:"relative",zIndex:1,flexGrow:1,display:"flex",alignItems:"center" }}>
        {headline}
      </p>

      <FooterRow
        left={<Domain color="#2563eb" ff={SANS} />}
        btnBg="#2563eb" btnColor="#fff"
        btnText="Start now" borderColor="#e2e8f0"
      />
    </div>
  );
}

// ─── CARD 6 – ROSE ───────────────────────────────────────────────────────────
function Card6({ userName }: CP) {
  const headline = userName ? `${userName} took a step for their health today.` : "Small steps today. Healthier future tomorrow.";
  return (
    <div style={shell("#fdf2f8",{ border:"1px solid #fce7f3" })}>
      <svg style={{ position:"absolute",inset:0,width:"100%",height:"100%",opacity:.3,pointerEvents:"none" }}>
        <defs><pattern id="p6c" x="0" y="0" width="44" height="44" patternUnits="userSpaceOnUse"><circle cx="22" cy="22" r="16" fill="none" stroke="#f472b6" strokeWidth=".6"/></pattern></defs>
        <rect width="100%" height="100%" fill="url(#p6c)" />
      </svg>
      <div style={{ position:"absolute",top:0,left:0,right:0,height:4,background:"linear-gradient(90deg,#f472b6,#db2777)",borderRadius:"20px 20px 0 0" }} />

      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",position:"relative",zIndex:1 }}>
        <span style={{ fontSize:11,fontWeight:700,letterSpacing:"0.18em",textTransform:"uppercase",color:"#db2777",fontFamily:SANS }}>Health Master</span>
        <span style={{ fontSize:10,color:"#f472b6",fontFamily:SANS,letterSpacing:"0.06em",textTransform:"uppercase" }}>Free · 2 min</span>
      </div>

      <div style={{ position:"relative",zIndex:1,flexGrow:1,display:"flex",alignItems:"center" }}>
        <p style={{ fontSize:25,fontWeight:700,color:"#1a0010",lineHeight:1.25,margin:0,fontFamily:SANS }}>
          {headline}
          {!userName && <span style={{ color:"#db2777",display:"block" }}>Check yours today.</span>}
        </p>
      </div>

      <FooterRow
        left={<Domain color="#db2777" ff={SANS} />}
        btnBg="#db2777" btnColor="#fff"
        btnText="Start now" borderColor="#fbcfe8"
      />
    </div>
  );
}

// ─── CARD 7 – PARCHMENT ──────────────────────────────────────────────────────
function Card7({ userName }: CP) {
  const headline = userName ? `${userName} made knowledge their first step.` : "Knowledge is the first step to prevention.";
  return (
    <div style={shell("#f7f3ed",{ border:"1px solid #d9d0c4",fontFamily:SERIF })}>
      <svg style={{ position:"absolute",inset:0,width:"100%",height:"100%",opacity:.18,pointerEvents:"none" }}>
        <defs><pattern id="p7c" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M30 0 L0 0 0 30" fill="none" stroke="#a09070" strokeWidth=".5"/></pattern></defs>
        <rect width="100%" height="100%" fill="url(#p7c)" />
      </svg>

      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",position:"relative",zIndex:1 }}>
        <span style={{ fontSize:11,fontWeight:700,letterSpacing:"0.2em",textTransform:"uppercase",color:"#7a6a50",fontFamily:SANS }}>Health Master</span>
        <span style={{ fontSize:10,color:"#9a8a70",fontFamily:SANS,letterSpacing:"0.06em",textTransform:"uppercase" }}>Free NCD Assessment</span>
      </div>

      <p style={{ fontSize:26,fontWeight:400,color:"#1c1408",lineHeight:1.3,margin:0,fontStyle:"italic",fontFamily:SERIF,position:"relative",zIndex:1,flexGrow:1,display:"flex",alignItems:"center" }}>
        &quot;{headline}&quot;
      </p>

      <FooterRow
        left={<Domain color="#5a4a30" ff={SANS} />}
        btnBg="#2a2015" btnColor="#f7f3ed"
        btnText="Check yours" borderColor="#d0c4b4"
      />
    </div>
  );
}

// ─── CARD 8 – AURORA ─────────────────────────────────────────────────────────
function Card8({ userName }: CP) {
  const headline = userName ? `${userName} checked their NCD risk. It's free.` : "Check your NCD risk in 2 minutes. It's free.";
  return (
    <div style={shell("#130820")}>
      <div style={{ position:"absolute",top:-80,left:-80,width:300,height:300,borderRadius:"50%",background:"radial-gradient(circle,rgba(124,58,237,.4) 0%,transparent 65%)",pointerEvents:"none" }} />
      <div style={{ position:"absolute",bottom:-60,right:-40,width:260,height:260,borderRadius:"50%",background:"radial-gradient(circle,rgba(236,72,153,.35) 0%,transparent 65%)",pointerEvents:"none" }} />

      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",position:"relative",zIndex:1 }}>
        <span style={{ fontSize:11,fontWeight:700,letterSpacing:"0.18em",textTransform:"uppercase",color:"#c084fc",fontFamily:SANS }}>Health Master</span>
        <span style={{ fontSize:10,color:"#7c3aed",fontFamily:SANS,letterSpacing:"0.06em",textTransform:"uppercase" }}>Free · 2 min</span>
      </div>

      <p style={{ fontSize:25,fontWeight:700,color:"#faf5ff",lineHeight:1.25,margin:0,letterSpacing:"-0.02em",fontFamily:SANS,position:"relative",zIndex:1,flexGrow:1,display:"flex",alignItems:"center" }}>
        {headline}
      </p>

      <FooterRow
        left={<Domain color="#c084fc" ff={SANS} />}
        btnBg="linear-gradient(135deg,#7c3aed,#db2777)" btnColor="#fff"
        btnText="Start free" borderColor="rgba(192,132,252,0.15)"
      />
    </div>
  );
}

// ─── REGISTRY ─────────────────────────────────────────────────────────────────
interface CardDef { id: string; name: string; Component: React.ComponentType<CP>; accent: string }
const CARDS: CardDef[] = [
  { id:"cosmic",    name:"Cosmic",    Component:Card1, accent:"#6366f1" },
  { id:"cream",     name:"Cream",     Component:Card2, accent:"#8b7355" },
  { id:"forest",    name:"Forest",    Component:Card3, accent:"#22c55e" },
  { id:"terminal",  name:"Terminal",  Component:Card4, accent:"#a3e635" },
  { id:"corporate", name:"Corporate", Component:Card5, accent:"#2563eb" },
  { id:"rose",      name:"Rose",      Component:Card6, accent:"#db2777" },
  { id:"parchment", name:"Parchment", Component:Card7, accent:"#5a4a30" },
  { id:"aurora",    name:"Aurora",    Component:Card8, accent:"#c084fc" },
];

// ─── EXPORT UTIL ──────────────────────────────────────────────────────────────
// CRITICAL: The hidden export container renders the card at EXACT 480×300 px
// with NO CSS transform applied. html2canvas then captures it at 3× scale.
// This is the ONLY reliable way to get correct text spacing in the PNG.
async function captureCard(el: HTMLElement): Promise<Blob> {
  const html2canvas = (await import("html2canvas")).default;
  const canvas = await html2canvas(el, {
    scale: 3,
    useCORS: true,
    allowTaint: true,
    backgroundColor: null,
    logging: false,
    width: CARD_W,
    height: CARD_H,
    windowWidth: CARD_W,
    windowHeight: CARD_H,
    imageTimeout: 0,
    removeContainer: false,
  });
  return new Promise((res, rej) =>
    canvas.toBlob(b => b ? res(b) : rej(new Error("toBlob failed")), "image/png", 1.0)
  );
}

// ─── SHARE HELPERS ────────────────────────────────────────────────────────────
async function doNativeShare(blob: Blob) {
  const file = new File([blob], "health-master-ncd.png", { type:"image/png" });
  const text = `I just checked my NCD risk on Health Master — it's free and takes 2 minutes!\n\nCheck yours: ${SITE_URL}`;
  if (navigator.share && navigator.canShare?.({ files:[file] })) {
    await navigator.share({ files:[file], text, url:SITE_URL });
    return "shared";
  }
  triggerDownload(blob, "health-master-ncd.png");
  return "downloaded";
}

async function doWhatsApp(blob: Blob) {
  const file = new File([blob], "health-master-ncd.png", { type:"image/png" });
  const text = `I just checked my NCD risk on Health Master — free & 2 min!\n\nCheck yours: ${SITE_URL}`;
  if (navigator.share && navigator.canShare?.({ files:[file] })) {
    await navigator.share({ files:[file], text, url:SITE_URL });
    return;
  }
  // Desktop: download image + open WhatsApp web
  triggerDownload(blob, "health-master-ncd.png");
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
}

function triggerDownload(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export interface ShareableRiskCardProps { userName?: string }

export default function ShareableRiskCard({ userName }: ShareableRiskCardProps) {
  const [selId, setSelId]   = useState(CARDS[0].id);
  const [busy, setBusy]     = useState<null|"share"|"whatsapp"|"download">(null);
  const [copied, setCopied] = useState(false);
  const [toast, setToast]   = useState<string|null>(null);

  // Hidden export node — rendered off-screen at true pixel dimensions
  const exportRef = useRef<HTMLDivElement>(null);

  const active = CARDS.find(c => c.id === selId) ?? CARDS[0];
  const ActiveCard = active.Component;

  const showToast = useCallback((msg: string, ms = 2800) => {
    setToast(msg);
    setTimeout(() => setToast(null), ms);
  }, []);

  const capture = useCallback(async (): Promise<Blob|null> => {
    if (!exportRef.current) return null;
    try { return await captureCard(exportRef.current); }
    catch (e) { console.error(e); showToast("Export failed — try again."); return null; }
  }, [showToast]);

  const handleDownload = useCallback(async () => {
    setBusy("download");
    const blob = await capture();
    if (blob) { triggerDownload(blob, `health-master-${selId}.png`); showToast("Card saved!"); }
    setBusy(null);
  }, [capture, selId, showToast]);

  const handleShare = useCallback(async () => {
    setBusy("share");
    const blob = await capture();
    if (blob) {
      try {
        const r = await doNativeShare(blob);
        showToast(r === "shared" ? "Shared!" : "Image saved — share it from your gallery!");
      } catch(e) {
        if ((e as Error).name !== "AbortError") showToast("Sharing failed — try Download.");
      }
    }
    setBusy(null);
  }, [capture, showToast]);

  const handleWhatsApp = useCallback(async () => {
    setBusy("whatsapp");
    const blob = await capture();
    if (blob) {
      try { await doWhatsApp(blob); showToast("Opened WhatsApp!"); }
      catch(e) { if ((e as Error).name !== "AbortError") showToast("Image saved — open WhatsApp manually."); }
    }
    setBusy(null);
  }, [capture, showToast]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(SITE_URL);
      setCopied(true); showToast("Link copied!");
      setTimeout(() => setCopied(false), 3000);
    } catch { showToast("Copy failed — copy the link manually."); }
  }, [showToast]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        .hm-thumb { transition: transform .18s ease, outline-color .15s ease; }
        .hm-thumb:hover { transform: translateY(-2px) scale(1.02); }
        .hm-btn { transition: opacity .15s, transform .12s; }
        .hm-btn:hover:not(:disabled) { transform: translateY(-1px); opacity:.9; }
        .hm-btn:active:not(:disabled) { transform: translateY(0); }
        @keyframes hm-pop { from{opacity:0;transform:translateY(10px) scale(.96)} to{opacity:1;transform:translateY(0) scale(1)} }
        .hm-toast { animation: hm-pop .22s cubic-bezier(.34,1.56,.64,1); }
      `}</style>

      {/* ── HIDDEN EXPORT CONTAINER ───────────────────────────────────────────
          Positioned off-screen. No transform. html2canvas reads it at true
          480×300 so spacing/dots/text all render correctly.
      ───────────────────────────────────────────────────────────────────────── */}
      <div
        ref={exportRef}
        style={{
          position: "fixed",
          top: -9999, left: -9999,
          width: CARD_W, height: CARD_H,
          pointerEvents: "none", zIndex: -1,
          overflow: "hidden",
        }}
        aria-hidden="true"
      >
        <ActiveCard userName={userName} />
      </div>

      {/* ── VISIBLE UI ────────────────────────────────────────────────────── */}
      <div style={{ fontFamily:SANS, maxWidth:600, margin:"0 auto", padding:"32px 16px", position:"relative" }}>

        {/* Toast */}
        {toast && (
          <div className="hm-toast" style={{
            position:"fixed", bottom:28, left:"50%", transform:"translateX(-50%)",
            background:"#111", color:"#fff", borderRadius:12, padding:"13px 26px",
            fontSize:13, fontWeight:600, zIndex:9999,
            boxShadow:"0 6px 30px rgba(0,0,0,.35)", whiteSpace:"nowrap", fontFamily:SANS,
          }}>{toast}</div>
        )}

        {/* Header */}
        <div style={{ marginBottom:28 }}>
          <p style={{ fontSize:11,fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase",color:"#999",margin:"0 0 6px",fontFamily:SANS }}>
            Share your result
          </p>
          <h2 style={{ fontSize:22,fontWeight:700,color:"#111",margin:"0 0 6px",letterSpacing:"-0.02em",fontFamily:SANS }}>
            Create your shareable card
          </h2>
          <p style={{ fontSize:13,color:"#888",margin:0,lineHeight:1.55,fontFamily:SANS }}>
            Pick a design, then share to WhatsApp, Instagram, X, or save as PNG.
          </p>
        </div>

        {/* Card grid */}
        <div style={{ marginBottom:28 }}>
          <p style={{ fontSize:11,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"#999",margin:"0 0 12px",fontFamily:SANS }}>
            Choose a design
          </p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:12 }}>
            {CARDS.map(def => {
              const Thumb = def.Component;
              const isSel = def.id === selId;
              return (
                <button key={def.id} className="hm-thumb"
                  onClick={() => setSelId(def.id)}
                  style={{
                    all:"unset", cursor:"pointer", borderRadius:14, overflow:"hidden",
                    display:"block", position:"relative", boxSizing:"border-box",
                    outline: isSel ? "3px solid #111" : "3px solid transparent",
                    outlineOffset:3,
                  }}
                  aria-label={`Select ${def.name} card`} aria-pressed={isSel}
                >
                  {/* Thumbnail: scaled via CSS transform — NEVER used for export */}
                  <div style={{ width:"100%", aspectRatio:"480/300", overflow:"hidden", position:"relative", borderRadius:12 }}>
                    <div style={{
                      position:"absolute", top:0, left:0,
                      transform:"scale(0.46)", transformOrigin:"top left",
                      width:CARD_W, height:CARD_H, pointerEvents:"none",
                    }}>
                      <Thumb userName={userName} />
                    </div>
                  </div>
                  {isSel && (
                    <div style={{ position:"absolute",top:8,right:8,width:22,height:22,borderRadius:"50%",background:"#111",display:"flex",alignItems:"center",justifyContent:"center" }}>
                      <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                        <path d="M2 5.5l2.5 2.5 4.5-4.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                  <div style={{
                    position:"absolute", bottom:0, left:0, right:0,
                    background:"linear-gradient(transparent,rgba(0,0,0,.6))",
                    padding:"20px 10px 8px",
                    display:"flex", alignItems:"center", justifyContent:"space-between",
                    borderRadius:"0 0 12px 12px",
                  }}>
                    <span style={{ fontSize:11,fontWeight:700,color:"#fff",letterSpacing:"0.06em",textTransform:"uppercase",fontFamily:SANS }}>{def.name}</span>
                    <div style={{ width:8,height:8,borderRadius:"50%",background:def.accent,flexShrink:0 }} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Preview (CSS-scaled, visual only) */}
        <div style={{ marginBottom:24 }}>
          <p style={{ fontSize:11,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"#999",margin:"0 0 12px",fontFamily:SANS }}>Preview</p>
          <div style={{
            background:"#f4f4f4", borderRadius:18, padding:"24px 20px",
            display:"flex", justifyContent:"center", alignItems:"center",
            border:"1px solid #e8e8e8", overflow:"hidden",
          }}>
            <div style={{ width:"100%", maxWidth:CARD_W, overflowX:"auto" }}>
              <div style={{ transform:"scale(0.88)", transformOrigin:"top center", width:CARD_W, margin:"0 auto" }}>
                <ActiveCard userName={userName} />
              </div>
            </div>
          </div>
          <p style={{ fontSize:12,color:"#aaa",margin:"8px 0 0",textAlign:"center",fontFamily:SANS }}>
            Exported at 3× — crisp on all screens
          </p>
        </div>

        {/* Action buttons */}
        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>

          {/* Share (native) */}
          <button className="hm-btn" onClick={handleShare} disabled={!!busy}
            style={{ flex:"2 1 180px", padding:"13px 18px", borderRadius:12,
              background:"#111", color:"#fff", fontSize:14, fontWeight:700,
              border:"none", cursor:busy?"not-allowed":"pointer",
              opacity:busy==="share"?.55:1, fontFamily:SANS,
              display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <path d="M12 10.667a2 2 0 100 2.666 2 2 0 000-2.666zm0 0L6 7.333m6-4a2 2 0 10-2.667 1.886L6 7.334m0 0a2 2 0 100 2.666A2 2 0 006 7.334z" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {busy==="share" ? "Preparing…" : "Share card"}
          </button>

          {/* WhatsApp */}
          <button className="hm-btn" onClick={handleWhatsApp} disabled={!!busy}
            style={{ flex:"1 1 140px", padding:"13px 18px", borderRadius:12,
              background:"#25D366", color:"#fff", fontSize:14, fontWeight:700,
              border:"none", cursor:busy?"not-allowed":"pointer",
              opacity:busy==="whatsapp"?.55:1, fontFamily:SANS,
              display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="#fff">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            {busy==="whatsapp" ? "Opening…" : "WhatsApp"}
          </button>

          {/* Download */}
          <button className="hm-btn" onClick={handleDownload} disabled={!!busy}
            style={{ flex:"1 1 120px", padding:"13px 18px", borderRadius:12,
              background:"transparent", color:"#111", fontSize:14, fontWeight:600,
              border:"1.5px solid #ddd", cursor:busy?"not-allowed":"pointer",
              opacity:busy==="download"?.55:1, fontFamily:SANS,
              display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
            <svg width="14" height="14" viewBox="0 0 15 15" fill="none">
              <path d="M7.5 2v8m0 0L4.5 7M7.5 10l3-3M2.5 12.5h10" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {busy==="download" ? "Saving…" : "Save PNG"}
          </button>

          {/* Copy link */}
          <button className="hm-btn" onClick={handleCopyLink}
            style={{ flex:"1 1 110px", padding:"13px 18px", borderRadius:12,
              background:"transparent",
              color: copied ? "#22c55e" : "#555",
              fontSize:14, fontWeight:600,
              border:`1.5px solid ${copied ? "#22c55e60":"#ddd"}`,
              cursor:"pointer", fontFamily:SANS,
              display:"flex", alignItems:"center", justifyContent:"center", gap:8,
              transition:"color .2s, border-color .2s" }}>
            {copied ? (
              <><svg width="14" height="14" viewBox="0 0 15 15" fill="none"><path d="M2 7.5l3.5 3.5 7.5-7.5" stroke="#22c55e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>Copied!</>
            ) : (
              <><svg width="14" height="14" viewBox="0 0 15 15" fill="none"><rect x="5" y="5" width="8" height="8" rx="1.5" stroke="#555" strokeWidth="1.4"/><path d="M3 10V3.5A1.5 1.5 0 014.5 2H11" stroke="#555" strokeWidth="1.4" strokeLinecap="round"/></svg>Copy link</>
            )}
          </button>
        </div>

        {/* Site link */}
        <div style={{ marginTop:20, textAlign:"center" }}>
          <a href={SITE_URL} target="_blank" rel="noopener noreferrer"
            style={{ fontSize:13, color:"#bbb", textDecoration:"none", borderBottom:"1px solid #e0e0e0", paddingBottom:1, fontFamily:SANS }}>
            {SITE_HOST} ↗
          </a>
        </div>
      </div>
    </>
  );
}