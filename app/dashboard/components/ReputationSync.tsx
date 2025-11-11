"use client";

import { useEffect, useRef } from "react";

export default function ReputationSync() {
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    fetch("/api/reputation/settle-missed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tz }),
    }).catch(() => {});
  }, []);

  return null;
}
