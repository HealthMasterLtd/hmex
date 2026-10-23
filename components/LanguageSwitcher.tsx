"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { getLang, setLang, type Lang } from "@/lib/translate";

export default function LanguageSwitcher() {
  const [lang, setCurrent] = useState<Lang>("en");
  const { accentColor, surface: S } = useTheme();

  useEffect(() => {
    setCurrent(getLang());
  }, []);

  return (
    <div
      className="notranslate"
      style={{
        display: "flex",
        alignItems: "center",
        height: 32,
        padding: 2,
        gap: 2,
        background: S.surfaceAlt,
        border: `1px solid ${S.border}`,
        borderRadius: 8,
        flexShrink: 0,
      }}
    >
      {(["en", "rw"] as const).map((l) => (
        <button
          key={l}
          onClick={() => l !== lang && setLang(l)}
          style={{
            height: "100%",
            padding: "0 10px",
            fontSize: 12,
            fontWeight: 600,
            borderRadius: 6,
            border: "none",
            cursor: "pointer",
            background: lang === l ? accentColor : "transparent",
            color: lang === l ? "#fff" : S.muted,
            transition: "background 0.2s, color 0.2s",
          }}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}