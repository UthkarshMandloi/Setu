import React from "react";
import Image from "next/image";

export function SetuLogo({
  className = "h-10 w-auto",
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      <img
        src="/logo.png"
        alt="SETU Logo"
        className="h-full w-auto object-contain mix-blend-multiply"
        loading={priority ? "eager" : "lazy"}
      />
    </div>
  );
}
