"use client";

import { cn } from "@/lib/utils";

interface SarIconProps {
  className?: string;
  size?: number;
}

/**
 * Saudi Riyal (SAR) currency icon
 * Uses currentColor to inherit text color from parent
 */
export function SarIcon({ className, size = 16 }: SarIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("inline-block", className)}
      aria-label="SAR"
    >
      <g
        style={{
          fontSize: "8px",
          lineHeight: 0,
          fontFamily: "Andika",
        }}
      >
        <path
          d="m6.836 8.468 2.595-.55q-.045.454-.236.876l-2.589.55q.04-.46.23-.876Zm2.359-1.325-2.589.55v-1.65l-.808.173v.916q0 .123-.068.224l-.421.623q-.168.242-.45.298l-2.29.489q.045-.455.236-.876l2.184-.466v-1.04l-2.038.433q.045-.455.235-.87l1.803-.388V2.353q.342-.416.809-.68v3.718l.808-.174v-2.46q.343-.415.803-.68v2.971l2.022-.432q-.045.455-.236.876l-1.786.382v.82l2.022-.427q-.045.46-.236.876Z"
          fill="currentColor"
          aria-label="⃁"
        />
      </g>
    </svg>
  );
}
