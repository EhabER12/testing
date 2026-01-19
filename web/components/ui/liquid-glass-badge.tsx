"use client";

import LiquidGlass from "liquid-glass-react";
import { ReactNode } from "react";

interface LiquidGlassBadgeProps {
  children: ReactNode;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
}

/**
 * LiquidGlassBadge - Small pill-shaped glass badge with liquid effects
 *
 * Perfect for tags, labels, and status indicators
 */
export function LiquidGlassBadge({
  children,
  onClick,
  size = "md",
}: LiquidGlassBadgeProps) {
  const sizes = {
    sm: { padding: "6px 12px", fontSize: "12px", height: 28 },
    md: { padding: "8px 16px", fontSize: "14px", height: 36 },
    lg: { padding: "10px 20px", fontSize: "16px", height: 44 },
  };

  const sizeConfig = sizes[size];

  return (
    <LiquidGlass
      displacementScale={32}
      blurAmount={0.08}
      saturation={115}
      aberrationIntensity={1}
      elasticity={0.25}
      cornerRadius={100}
      padding={sizeConfig.padding}
      mode="standard"
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        height: sizeConfig.height,
        fontSize: sizeConfig.fontSize,
        fontWeight: 600,
        color: "#1f2937",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </LiquidGlass>
  );
}
