import { useCallback, useEffect, useState } from "react";

/** Counts down from `seconds`; `restart()` starts it again. Used for the OTP resend timer. */
export function useCountdown(seconds: number) {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (left <= 0) return;
    const id = window.setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => window.clearTimeout(id);
  }, [left]);
  const restart = useCallback(() => setLeft(seconds), [seconds]);
  return { left, restart };
}
