"use client";

import LiquidGlass from "liquid-glass-react";
import { ReactNode } from "react";

interface LiquidGlassCardProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  displacementScale?: number;
  blurAmount?: number;
  saturation?: number;
  aberrationIntensity?: number;
  elasticity?: number;
  cornerRadius?: number;
  mode?: "standard" | "prominent" | "shader";
}

/**
 * LiquidGlassCard - Reusable card component with liquid glass effects
 *
 * Wraps content in an interactive glass surface with physics-based refraction
 */
export function LiquidGlassCard({
  children,
  onClick,
  className = "",
  displacementScale = 48,
  blurAmount = 0.08,
  saturation = 120,
  aberrationIntensity = 1.5,
  elasticity = 0.3,
  cornerRadius = 28,
  mode = "standard",
}: LiquidGlassCardProps) {
  return (
    <LiquidGlass
      displacementScale={displacementScale}
      blurAmount={blurAmount}
      saturation={saturation}
      aberrationIntensity={aberrationIntensity}
      elasticity={elasticity}
      cornerRadius={cornerRadius}
      padding="24px"
      mode={mode}
      onClick={onClick}
      className={className}
      style={{
        width: "100%",
        minHeight: "200px",
      }}
    >
      {children}
    </LiquidGlass>
  );
}
