import React from "react";

export function Emblem({ className = "w-10 h-12" }: { className?: string }) {
  return (
    <div className={`relative flex flex-col items-center justify-center shrink-0 ${className}`}>
      <svg
        viewBox="0 0 100 130"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-xs"
        aria-label="Emblem of India"
      >
        {/* Ashoka Pillar Capitals / Lions silhouette */}
        {/* Central Lion Head */}
        <path
          d="M50 12 C44 12, 40 16, 40 22 C40 27, 43 31, 46 33 L46 45 C42 45, 38 48, 38 52 C38 56, 42 59, 46 59 L54 59 C58 59, 62 56, 62 52 C62 48, 58 45, 54 45 L54 33 C57 31, 60 27, 60 22 C60 16, 56 12, 50 12 Z"
          fill="#1B3A6B"
        />
        {/* Left Lion Head */}
        <path
          d="M32 20 C27 20, 23 24, 23 30 C23 35, 26 39, 30 41 L30 52 C26 53, 23 57, 23 61 C23 65, 27 68, 32 68 L36 68 C38 68, 39 66, 39 63 L39 42 C36 40, 34 36, 34 32 C34 26, 33 22, 32 20 Z"
          fill="#1B3A6B"
        />
        {/* Right Lion Head */}
        <path
          d="M68 20 C73 20, 77 24, 77 30 C77 35, 74 39, 70 41 L70 52 C74 53, 77 57, 77 61 C77 65, 73 68, 68 68 L64 68 C62 68, 61 66, 61 63 L61 42 C64 40, 66 36, 66 32 C66 26, 67 22, 68 20 Z"
          fill="#1B3A6B"
        />
        {/* Detailed features / manes */}
        <path
          d="M48 24 L52 24 L50 29 Z M44 38 C46 36, 54 36, 56 38 L55 42 L45 42 Z"
          fill="#F59E0B"
        />
        <circle cx="47" cy="22" r="1.5" fill="#FFFFFF" />
        <circle cx="53" cy="22" r="1.5" fill="#FFFFFF" />
        <circle cx="28" cy="28" r="1.2" fill="#FFFFFF" />
        <circle cx="72" cy="28" r="1.2" fill="#FFFFFF" />

        {/* Abacus Base Platform */}
        <rect x="18" y="70" width="64" height="12" rx="2" fill="#1B3A6B" />
        <rect x="22" y="72" width="56" height="8" rx="1" fill="#FFFFFF" opacity="0.15" />

        {/* Ashoka Chakra in Center of Abacus */}
        <circle cx="50" cy="76" r="5" stroke="#F59E0B" strokeWidth="1.5" fill="#FFFFFF" />
        <circle cx="50" cy="76" r="1.2" fill="#1B3A6B" />
        {/* Spokes */}
        <line x1="50" y1="71.5" x2="50" y2="80.5" stroke="#1B3A6B" strokeWidth="0.75" />
        <line x1="45.5" y1="76" x2="54.5" y2="76" stroke="#1B3A6B" strokeWidth="0.75" />
        <line x1="46.8" y1="72.8" x2="53.2" y2="79.2" stroke="#1B3A6B" strokeWidth="0.75" />
        <line x1="46.8" y1="79.2" x2="53.2" y2="72.8" stroke="#1B3A6B" strokeWidth="0.75" />

        {/* Galloping Horse (Left) & Bull (Right) Accents */}
        <path d="M25 78 C25 74, 29 74, 30 76 C31 78, 29 79, 27 79 Z" fill="#F59E0B" />
        <path d="M75 78 C75 74, 71 74, 70 76 C69 78, 71 79, 73 79 Z" fill="#F59E0B" />

        {/* Inverted Lotus Base */}
        <path
          d="M24 84 C28 88, 36 92, 50 92 C64 92, 72 88, 76 84 L73 95 C63 99, 37 99, 27 95 Z"
          fill="#1B3A6B"
        />
        <path
          d="M34 86 C42 90, 58 90, 66 86 C60 93, 40 93, 34 86 Z"
          fill="#E2E8F0"
          opacity="0.3"
        />

        {/* Satyameva Jayate Banner / Text Plate */}
        <rect x="26" y="102" width="48" height="8" rx="2" fill="#1E293B" />
        <text
          x="50"
          y="108"
          textAnchor="middle"
          fill="#F8FAFC"
          fontSize="5"
          fontWeight="bold"
          fontFamily="serif"
          letterSpacing="0.8"
        >
          सत्यमेव जयते
        </text>
      </svg>
    </div>
  );
}
