"use client";

import React from "react";
import Image from "next/image";

/**
 * HmexLogo — single source of truth for the HMEX logo across the whole app.
 *
 * variant="full"      → wide logo, for expanded sidebars and auth pages
 * variant="icon"      → crops to just the heartbeat glyph, for collapsed sidebars
 * variant="auth"      → larger centred version for login/signup headers
 *
 * The logo has a black background. We clip it cleanly and use `mix-blend-mode: screen`
 * so the black disappears on any background colour — the gradient letters/glyph show through.
 */

type LogoVariant = "full" | "icon" | "auth";

interface HmexLogoProps {
  variant?: LogoVariant;
  /** Override width in px (height is always auto-calculated to keep ratio) */
  width?: number;
  className?: string;
  style?: React.CSSProperties;
}

// The source image natural ratio is approx 3.05 : 1  (wide landscape)
const NATURAL_RATIO = 3.05;

export default function HmexLogo({
  variant = "full",
  width,
  className,
  style,
}: HmexLogoProps) {
  // ─── Sizes ──────────────────────────────────────────────────────────────
  const sizes: Record<LogoVariant, { w: number; h: number }> = {
    full: { w: width ?? 110, h: Math.round((width ?? 110) / NATURAL_RATIO) },
    icon: { w: width ?? 36,  h: width ?? 36 },
    auth: { w: width ?? 180, h: Math.round((width ?? 180) / NATURAL_RATIO) },
  };

  const { w, h } = sizes[variant];

  if (variant === "icon") {
    // Show only the middle heartbeat portion of the image.
    // We do this by making a square container that clips, then shifting the image left
    // so the heartbeat glyph (roughly the horizontal centre of the source) is visible.
    return (
      <div
        className={className}
        style={{
          width: w,
          height: h,
          overflow: "hidden",
          flexShrink: 0,
          position: "relative",
          ...style,
        }}
      >
        <Image
          src="/mainlogo.png"
          alt="HMEX"
          width={w * NATURAL_RATIO}   // render image at full natural width
          height={h}
          style={{
            // shift left so the heartbeat centre lands in our square viewport
            // the heartbeat glyph sits roughly at 38–62 % of image width
            marginLeft: `-${Math.round(w * NATURAL_RATIO * 0.33)}px`,
            display: "block",
            mixBlendMode: "screen",
          }}
          priority
        />
      </div>
    );
  }

  // "full" and "auth" — show the full wide logo
  return (
    <div
      className={className}
      style={{
        width: w,
        height: h,
        overflow: "hidden",
        flexShrink: 0,
        position: "relative",
        ...style,
      }}
    >
      <Image
        src="/mainlogo.png"
        alt="HMEX"
        width={w}
        height={h}
        style={{
          display: "block",
          width: "100%",
          height: "auto",
          mixBlendMode: "screen",
        }}
        priority
      />
    </div>
  );
}