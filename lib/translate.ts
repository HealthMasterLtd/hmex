export type Lang = "en" | "rw";

export function getLang(): Lang {
  const m = document.cookie.match(/googtrans=\/en\/(\w+)/);
  return m?.[1] === "rw" ? "rw" : "en";
}

export function setLang(lang: Lang) {
  try {
    localStorage.setItem("langChosen", "1");
  } catch {}

  const host = location.hostname;
  const expired = "expires=Thu, 01 Jan 1970 00:00:00 GMT";

  if (lang === "rw") {
    document.cookie = `googtrans=/en/rw; path=/`;
    document.cookie = `googtrans=/en/rw; path=/; domain=${host}`;
  } else {
    document.cookie = `googtrans=; path=/; ${expired}`;
    document.cookie = `googtrans=; path=/; domain=${host}; ${expired}`;
  }
  location.reload();
}