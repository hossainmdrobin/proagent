"use client";

import { useCallback, useRef } from "react";
import { cn } from "@/lib/cn";
import { OTP_LENGTH } from "@/lib/constants";

export interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  length?: number;
  disabled?: boolean;
  invalid?: boolean;
  autoFocus?: boolean;
}

export function OtpInput({
  value,
  onChange,
  onComplete,
  length = OTP_LENGTH,
  disabled = false,
  invalid = false,
  autoFocus = false,
}: OtpInputProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const focusCell = useCallback(
    (index: number) => {
      const input = inputRefs.current[index];

      if (input) {
        input.focus();
        input.select();
      }
    },
    [],
  );

  const commit = useCallback(
    (next: string) => {
      onChange(next);

      if (next.length === length) {
        onComplete?.(next);
      }
    },
    [length, onChange, onComplete],
  );

  const handleChange = useCallback(
    (index: number, rawValue: string) => {
      const digit = rawValue.replace(/\D/g, "").slice(-1);
      const cells = Array.from({ length }, (_, cellIndex) => value[cellIndex] ?? "");

      cells[index] = digit;

      const next = cells.join("");
      commit(next);

      if (digit && index < length - 1) {
        focusCell(index + 1);
      }
    },
    [commit, focusCell, length, value],
  );

  const handleKeyDown = useCallback(
    (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Backspace") {
        event.preventDefault();

        if (value[index]) {
          const cells = Array.from({ length }, (_, cellIndex) => value[cellIndex] ?? "");
          cells[index] = "";
          commit(cells.join(""));
          return;
        }

        if (index > 0) {
          focusCell(index - 1);
          const cells = Array.from({ length }, (_, cellIndex) => value[cellIndex] ?? "");
          cells[index - 1] = "";
          commit(cells.join(""));
        }

        return;
      }

      if (event.key === "ArrowLeft" && index > 0) {
        event.preventDefault();
        focusCell(index - 1);
        return;
      }

      if (event.key === "ArrowRight" && index < length - 1) {
        event.preventDefault();
        focusCell(index + 1);
        return;
      }

      if (event.key === "Enter" && value.length === length) {
        event.preventDefault();
        onComplete?.(value);
      }
    },
    [commit, focusCell, length, onComplete, value],
  );

  const handlePaste = useCallback(
    (event: React.ClipboardEvent<HTMLInputElement>) => {
      event.preventDefault();
      const pasted = event.clipboardData
        .getData("text")
        .replace(/\D/g, "")
        .slice(0, length);

      if (!pasted) {
        return;
      }

      const next = pasted.padEnd(length, " ");
      commit(next.trimEnd());
      focusCell(Math.min(pasted.length, length - 1));
    },
    [commit, focusCell, length],
  );

  return (
    <div className="flex justify-center gap-2 sm:gap-3">
      {Array.from({ length }, (_, index) => (
        <input
          key={index}
          ref={(element) => {
            inputRefs.current[index] = element;
          }}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={1}
          disabled={disabled}
          autoFocus={autoFocus && index === 0}
          aria-label={`Digit ${index + 1} of ${length}`}
          aria-invalid={invalid || undefined}
          value={value[index] ?? ""}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          onFocus={(event) => event.currentTarget.select()}
          className={cn(
            "size-11 rounded-lg border text-center text-lg font-semibold text-zinc-900 shadow-sm transition-colors focus:outline-none sm:size-12 sm:text-xl dark:text-zinc-50",
            invalid
              ? "border-red-500 bg-red-50 dark:border-red-500 dark:bg-red-950"
              : "border-zinc-300 bg-white focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-100",
            disabled && "cursor-not-allowed opacity-60",
          )}
        />
      ))}
    </div>
  );
}
