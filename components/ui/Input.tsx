import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input({ className, label, hint, error, id, ...rest }, ref) {
    const inputId = id ?? React.useId();
    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-[#1a1916]"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full h-11 px-3 rounded-lg border bg-white text-base text-[#1a1916] placeholder:text-[#b0afab]",
            "focus:outline-none focus:ring-2 focus:border-[#01696f] transition-all",
            error
              ? "border-[#c0392b]/60 focus:ring-[#c0392b]/30"
              : "border-black/10 focus:ring-[#01696f]/30",
            className
          )}
          {...rest}
        />
        {error ? (
          <p className="text-xs text-[#c0392b]">{error}</p>
        ) : hint ? (
          <p className="text-xs text-[#6b6a66]">{hint}</p>
        ) : null}
      </div>
    );
  }
);

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className, label, hint, error, id, rows = 3, ...rest }, ref) {
    const inputId = id ?? React.useId();
    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-[#1a1916]"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          rows={rows}
          className={cn(
            "w-full px-3 py-2.5 rounded-lg border bg-white text-base text-[#1a1916] placeholder:text-[#b0afab]",
            "focus:outline-none focus:ring-2 focus:border-[#01696f] transition-all resize-y",
            error
              ? "border-[#c0392b]/60 focus:ring-[#c0392b]/30"
              : "border-black/10 focus:ring-[#01696f]/30",
            className
          )}
          {...rest}
        />
        {error ? (
          <p className="text-xs text-[#c0392b]">{error}</p>
        ) : hint ? (
          <p className="text-xs text-[#6b6a66]">{hint}</p>
        ) : null}
      </div>
    );
  }
);
