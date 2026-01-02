"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, ...props }, ref) => {
    return (
      <label
        className={cn(
          "relative inline-flex items-center cursor-pointer select-none",
          className
        )}
      >
        <input
          type="checkbox"
          ref={ref}
          className="peer sr-only"
          {...props}
        />
        <span
          className={cn(
            // track
            "block h-8 w-14 rounded-full transition-all duration-400",
            "bg-gradient-to-r from-neutral-200 to-neutral-800 bg-[length:205%] bg-left",
            "peer-checked:bg-[length:205%] peer-checked:bg-right"
          )}
        />
        <span
          className={cn(
            // thumb
            "absolute top-1 left-1 h-6 w-6 rounded-full shadow-md transition-all duration-400",
            "bg-gradient-to-r from-neutral-200 to-neutral-800 bg-[length:205%] bg-right",
            "peer-checked:left-[calc(100%-1.5rem-0.25rem)] peer-checked:bg-left"
          )}
        />
      </label>
    );
  }
);

Switch.displayName = "Switch";

export { Switch };