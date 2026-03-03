"use client";

import { useEffect, useState } from "react";

export default function ClientOnlyWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#0a0e27",
          color: "#e2e8f0",
        }}
      >
        Loading Three.js experiment...
      </div>
    );
  }

  return <>{children}</>;
}
