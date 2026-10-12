"use client";

import { useCallback, useEffect, useState } from "react";

export function useCountdown(initialSeconds = 0) {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    if (seconds <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setSeconds((current) => (current > 0 ? current - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [seconds]);

  const reset = useCallback((value: number) => {
    setSeconds(value);
  }, []);

  return { seconds, isCoolingDown: seconds > 0, reset };
}
