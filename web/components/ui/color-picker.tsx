import React from "react";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  id?: string;
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
  className?: string;
}

export function ColorPicker({
  id,
  value,
  onChange,
  disabled,
  className,
}: ColorPickerProps) {
  return (
    <div className="flex items-center">
      <input
        id={id}
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={cn(
          "h-9 w-9 cursor-pointer appearance-none overflow-hidden rounded-md border border-input bg-transparent p-0",
          className
        )}
      />
    </div>
  );
}
