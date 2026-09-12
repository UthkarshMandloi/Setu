"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { Languages } from "lucide-react";

// Whole-site translation via Google's "Website Translator" widget — the same mechanism used by
// most Indian government portals (mygov.in, state department sites) for instant multi-language
// support without hand-translating every string. We hide Google's own UI and drive it with our
// own pill buttons by setting the `googtrans` cookie it reads on load, then reloading the page.
const LANGUAGES = [
  { code: "en", label: "English", short: "EN" },
  { code: "hi", label: "हिंदी", short: "हि" },
  { code: "mr", label: "मराठी", short: "मरा" },
] as const;

type LangCode = (typeof LANGUAGES)[number]["code"];

declare global {
  interface Window {
    google?: { translate?: { TranslateElement: any } };
    googleTranslateElementInit?: () => void;
  }
}

function currentLanguage(): LangCode {
  const match = document.cookie.match(/googtrans=\/en\/(\w+)/);
  return (match?.[1] as LangCode) ?? "en";
}

function setLanguage(code: LangCode) {
  if (code === "en") {
    document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  } else {
    document.cookie = `googtrans=/en/${code}; path=/;`;
  }
  window.location.reload();
}

export function LanguageSwitcher() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<LangCode>("en");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActive(currentLanguage());

    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      {/* Google's widget needs this node in the DOM; visually hidden — we never show its own UI. */}
      <div id="google_translate_element" className="hidden" />
      <Script
        id="google-translate-init"
        strategy="afterInteractive"
        onLoad={() => {
          if (window.google?.translate) return;
          window.googleTranslateElementInit = () => {
            new window.google!.translate!.TranslateElement(
              { pageLanguage: "en", includedLanguages: "hi,mr", autoDisplay: false },
              "google_translate_element"
            );
          };
        }}
        src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
      />

      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full bg-slate-100 hover:bg-slate-200/70 text-slate-600 px-3 h-9 text-xs font-semibold transition-colors notranslate"
        title="Change language"
        aria-label="Change language"
        aria-expanded={open}
      >
        <Languages size={15} />
        <span className="hidden sm:inline">{LANGUAGES.find((l) => l.code === active)?.short}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-40 rounded-2xl border border-slate-200/80 bg-white shadow-gov-card overflow-hidden z-50 notranslate">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${
                active === lang.code ? "bg-slate-50 text-[#1B3A6B] font-bold" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
