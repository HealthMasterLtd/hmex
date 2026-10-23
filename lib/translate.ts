export type Lang = "en" | "rw" | "sw";

export const LANGUAGES: { code: Lang; name: string; flag: string | null }[] = [
  { code: "en", name: "English",     flag: null },
  { code: "rw", name: "Kinyarwanda", flag: "rw" },
  { code: "sw", name: "Kiswahili",   flag: "ke" },
];

export function getLang(): Lang {
  const m = document.cookie.match(/googtrans=\/en\/(\w+)/);
  const c = m?.[1];
  return c === "rw" || c === "sw" ? c : "en";
}

// Guess a language from device timezone and browser language
export function detectSuggestion(): Lang | null {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const langs = navigator.languages?.length ? navigator.languages : [navigator.language];
    const codes = langs.map((l) => l.toLowerCase());

    if (tz === "Africa/Kigali" || codes.some((c) => c.startsWith("rw"))) return "rw";
    if (
      tz === "Africa/Nairobi" ||
      tz === "Africa/Dar_es_Salaam" ||
      codes.some((c) => c.startsWith("sw"))
    ) {
      return "sw";
    }
  } catch {}
  return null;
}

export function setLang(lang: Lang) {
  try {
    localStorage.setItem("langChosen", "1");
  } catch {}

  const host = location.hostname;
  const expired = "expires=Thu, 01 Jan 1970 00:00:00 GMT";

  if (lang === "en") {
    document.cookie = `googtrans=; path=/; ${expired}`;
    document.cookie = `googtrans=; path=/; domain=${host}; ${expired}`;
  } else {
    document.cookie = `googtrans=/en/${lang}; path=/`;
    document.cookie = `googtrans=/en/${lang}; path=/; domain=${host}`;
  }
  location.reload();
}