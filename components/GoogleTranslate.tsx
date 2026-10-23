/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LANGUAGES, detectSuggestion, getLang, setLang, type Lang } from "@/lib/translate";

// false = show the popup asking the user, true = translate automatically
const AUTO_TRANSLATE = false;
const SHOW_FOR_MS = 10000;

let patched = false;

export default function GoogleTranslate() {
  const [suggest, setSuggest] = useState<Lang | null>(null);

  useEffect(() => {
    // Stops React crashing when Google rewrites text nodes on the page
    if (!patched) {
      patched = true;
      const origRemove = Node.prototype.removeChild;
      Node.prototype.removeChild = function <T extends Node>(child: T): T {
        if (child.parentNode !== this) return child;
        return origRemove.call(this, child) as T;
      };
      const origInsert = Node.prototype.insertBefore;
      Node.prototype.insertBefore = function <T extends Node>(newNode: T, ref: Node | null): T {
        if (ref && ref.parentNode !== this) return newNode;
        return origInsert.call(this, newNode, ref) as T;
      };
    }

    let timer: ReturnType<typeof setTimeout>;
    try {
      // Skip if the user already chose, dismissed, is translated, or saw it this session
      if (
        localStorage.getItem("langChosen") ||
        sessionStorage.getItem("langSuggested") ||
        getLang() !== "en"
      ) {
        return;
      }
      const s = detectSuggestion();
      if (!s) return;

      if (AUTO_TRANSLATE) {
        setLang(s);
        return;
      }

      // Small delay so it pops in after the page has loaded
      timer = setTimeout(() => {
        sessionStorage.setItem("langSuggested", "1");
        setSuggest(s);
      }, 1200);
    } catch {}
    return () => clearTimeout(timer);
  }, []);

  // Auto-hide after a few seconds
  useEffect(() => {
    if (!suggest) return;
    const t = setTimeout(() => setSuggest(null), SHOW_FOR_MS);
    return () => clearTimeout(t);
  }, [suggest]);

  const dismiss = () => {
    try {
      localStorage.setItem("langChosen", "1");
    } catch {}
    setSuggest(null);
  };

  const target = suggest ? LANGUAGES.find((l) => l.code === suggest) : null;

  return (
    <>
      <div id="google_translate_element" style={{ display: "none" }} />
      <Script id="gt-init" strategy="afterInteractive">
        {`function googleTranslateElementInit() {
          new google.translate.TranslateElement(
            { pageLanguage: 'en', includedLanguages: 'en,rw,sw', autoDisplay: false },
            'google_translate_element'
          );
        }`}
      </Script>
      <Script
        src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        strategy="afterInteractive"
      />

      <AnimatePresence>
        {target && (
          <motion.div
            key="lang-suggest"
            className="notranslate"
            initial={{ y: -90, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -90, opacity: 0 }}
            transition={{ type: "spring", damping: 24, stiffness: 260 }}
            style={{
              position: "fixed",
              top: 72,
              left: 0,
              right: 0,
              margin: "0 auto",
              width: "calc(100% - 32px)",
              maxWidth: 420,
              zIndex: 10000,
              overflow: "hidden",
              background: "#111827",
              color: "#fff",
              borderRadius: 14,
              boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px" }}>
              {target.flag && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`https://flagcdn.com/w40/${target.flag}.png`}
                  alt=""
                  width={28}
                  height={20}
                  style={{ borderRadius: 3, objectFit: "cover", flexShrink: 0 }}
                />
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  This site is available in {target.name}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button
                    onClick={() => setLang(target.code)}
                    style={{
                      padding: "6px 14px",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#fff",
                      background: "#16a34a",
                      border: "none",
                      borderRadius: 8,
                      cursor: "pointer",
                    }}
                  >
                    Switch
                  </button>
                  <button
                    onClick={dismiss}
                    style={{
                      padding: "6px 10px",
                      fontSize: 13,
                      color: "#d1d5db",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    No thanks
                  </button>
                </div>
              </div>

              <button
                onClick={() => setSuggest(null)}
                aria-label="Close"
                style={{
                  alignSelf: "flex-start",
                  color: "#9ca3af",
                  background: "transparent",
                  border: "none",
                  fontSize: 18,
                  lineHeight: 1,
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>

            {/* Shrinking timer bar */}
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: SHOW_FOR_MS / 1000, ease: "linear" }}
              style={{ height: 3, background: "#16a34a" }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}