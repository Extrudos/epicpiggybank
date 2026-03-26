"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";

interface PinPadProps {
  onSubmit: (pin: string) => void;
  loading?: boolean;
  error?: string | null;
  maxLength?: number;
}

export function PinPad({ onSubmit, loading, error, maxLength = 6 }: PinPadProps) {
  const [pin, setPin] = useState("");

  const addDigit = useCallback(
    (digit: string) => {
      setPin((prev) => {
        if (prev.length >= maxLength) return prev;
        const next = prev + digit;
        if (next.length >= 4 && next.length <= maxLength) {
          // Auto-submit after 4+ digits when user pauses
        }
        return next;
      });
    },
    [maxLength]
  );

  const removeDigit = useCallback(() => {
    setPin((prev) => prev.slice(0, -1));
  }, []);

  const handleSubmit = useCallback(() => {
    if (pin.length >= 4) {
      onSubmit(pin);
    }
  }, [pin, onSubmit]);

  const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

  return (
    <div className="w-full max-w-xs mx-auto">
      {/* PIN display */}
      <div className="flex justify-center gap-3 mb-6">
        {Array.from({ length: maxLength }).map((_, i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full transition-all duration-200 ${
              i < pin.length
                ? "bg-primary scale-110"
                : "bg-muted border-2 border-border"
            }`}
          />
        ))}
      </div>

      {error && (
        <p className="text-center text-sm text-destructive mb-4 animate-bounce-in">
          {error}
        </p>
      )}

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-3">
        {digits.map((d) => (
          <Button
            key={d}
            variant="outline"
            className="h-16 text-2xl font-bold rounded-2xl hover:bg-primary/10 active:scale-95 transition-transform"
            style={{ fontFamily: "var(--font-fredoka)" }}
            onClick={() => addDigit(d)}
            disabled={loading}
          >
            {d}
          </Button>
        ))}
        <Button
          variant="ghost"
          className="h-16 text-lg rounded-2xl"
          onClick={removeDigit}
          disabled={loading || pin.length === 0}
        >
          ⌫
        </Button>
        <Button
          variant="outline"
          className="h-16 text-2xl font-bold rounded-2xl hover:bg-primary/10 active:scale-95 transition-transform"
          style={{ fontFamily: "var(--font-fredoka)" }}
          onClick={() => addDigit("0")}
          disabled={loading}
        >
          0
        </Button>
        <Button
          className="h-16 text-lg font-bold rounded-2xl"
          onClick={handleSubmit}
          disabled={loading || pin.length < 4}
        >
          {loading ? "..." : "Go"}
        </Button>
      </div>
    </div>
  );
}
