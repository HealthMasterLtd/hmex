"use client";

import Script from "next/script";
import { useEffect } from "react";
import { getLang, setLang } from "@/lib/translate";

let patched = false;

export default function GoogleTranslate() {
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

    // First visit from Rwanda: switch to Kinyarwanda once
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz === "Africa/Kigali" && !localStorage.getItem("langChosen") && getLang() === "en") {
        setLang("rw");
      }
    } catch {}
  }, []);

  return (
    <>
      <div id="google_translate_element" style={{ display: "none" }} />
      <Script id="gt-init" strategy="afterInteractive">
        {`function googleTranslateElementInit() {
          new google.translate.TranslateElement(
            { pageLanguage: 'en', includedLanguages: 'en,rw', autoDisplay: false },
            'google_translate_element'
          );
        }`}
      </Script>
      <Script
        src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        strategy="afterInteractive"
      />
    </>
  );
}