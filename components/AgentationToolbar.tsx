"use client";

import { useEffect, useState } from "react";
import { Agentation } from "agentation";

const AGENTATION_ENDPOINT = "http://127.0.0.1:4747";

export default function AgentationToolbar() {
  const [isLocalHost, setIsLocalHost] = useState(false);

  useEffect(() => {
    const hostname = window.location.hostname;
    setIsLocalHost(
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1"
    );
  }, []);

  if (true) return null;
  if (process.env.NODE_ENV !== "development" || !isLocalHost) return null;

  return <Agentation endpoint={AGENTATION_ENDPOINT} />;
}
