/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Globe } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { LANGUAGES, getLang, setLang, type Lang } from "@/lib/translate";

function Flag({ code }: { code: string | null }) {
  if (!code) return <Globe size={16} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/w40/${code}.png`}
      alt=""
      width={20}
      height={14}
      style={{ borderRadius: 2, objectFit: "cover", display: "block" }}
    />
  );
}

export default function LanguageSwitcher() {
  const [lang, setCurrent] = useState<Lang>("en");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { accentColor, surface: S } = useTheme();

  useEffect(() => {
    setCurrent(getLang());
  }, []);

  // Close when clicking outside
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  return (
    <div ref={ref} className="notranslate" style={{ position: "relative", flexShrink: 0 }}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Change language"
        style={{
          height: 32,
          padding: "0 8px",
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12,
          fontWeight: 600,
          color: S.text,
          background: S.surfaceAlt,
          border: `1px solid ${S.border}`,
          borderRadius: 8,
          cursor: "pointer",
        }}
      >
        <Flag code={current.flag} />
        <span>{current.code.toUpperCase()}</span>
        <ChevronDown
          size={12}
          style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
        />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: 38,
            right: 0,
            minWidth: 170,
            padding: 4,
            background: S.surface,
            border: `1px solid ${S.border}`,
            borderRadius: 10,
            boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
            zIndex: 10000,
          }}
        >
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => {
                setOpen(false);
                if (l.code !== lang) setLang(l.code);
              }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 10px",
                fontSize: 13,
                fontWeight: l.code === lang ? 700 : 500,
                color: l.code === lang ? accentColor : S.text,
                background: l.code === lang ? `${accentColor}14` : "transparent",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <Flag code={l.flag} />
              <span style={{ flex: 1 }}>{l.name}</span>
              {l.code === lang && <Check size={14} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}