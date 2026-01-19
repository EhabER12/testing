"use client";

import LiquidGlass from "liquid-glass-react";
import { Search, Mic } from "lucide-react";

/**
 * LiquidGlassSearchButton - Interactive liquid glass button using liquid-glass-react
 *
 * Features real physics-based glass refraction, displacement, and chromatic aberration.
 * Based on https://github.com/rdev/liquid-glass-react
 */
export default function LiquidGlassSearchButton() {
  return (
    <LiquidGlass
      // Stronger edge bending/refraction for dramatic effect
      displacementScale={64}
      // More "frosty" blurred look (0.0625 is default)
      blurAmount={0.1}
      // Vivid background saturation behind the glass
      saturation={130}
      // Subtle chromatic edge aberration
      aberrationIntensity={2}
      // Liquid "squish" elasticity on hover/press
      elasticity={0.35}
      // Pill shape with large corner radius
      cornerRadius={100}
      // Roomy padding for cinematic look
      padding="18px 24px"
      // Standard mode - try "prominent" or "shader" for stronger refraction
      mode="standard"
      onClick={() => console.log("Search")}
      style={{
        width: 640,
        height: 88,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
          width: "100%",
        }}
      >
        {/* Left: Search icon */}
        <Search
          size={28}
          color="white"
          strokeWidth={2}
          style={{ opacity: 0.95 }}
        />

        {/* Center: Label */}
        <span
          style={{
            color: "#fff",
            opacity: 0.96,
            fontFamily: "Inter, system-ui, sans-serif",
            fontWeight: 600,
            fontSize: 28,
            lineHeight: "34px",
            letterSpacing: "2.5px",
            textTransform: "uppercase",
            textAlign: "center",
            flex: 1,
          }}
        >
          Liquid Glass
        </span>

        {/* Right: Microphone icon */}
        <Mic
          size={26}
          color="white"
          strokeWidth={2}
          style={{ opacity: 0.95 }}
        />
      </div>
    </LiquidGlass>
  );
}
