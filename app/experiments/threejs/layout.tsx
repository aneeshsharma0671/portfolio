"use client";

import dynamic from "next/dynamic";

const ClientOnlyWrapper = dynamic(
  () => import("@/src/Components/Experiments/ThreeJs/ClientOnlyWrapper"),
  {
    ssr: false,
    loading: () => (
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
    ),
  },
);

export default function ThreeJsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClientOnlyWrapper>{children}</ClientOnlyWrapper>;
}
