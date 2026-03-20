import { redirect } from "next/navigation";

const SAMPLE_PAYLOAD = {
  name: "Avantika with a ",
  date: "21st Match 12:01AM",
  place: "Phele chai",
  from: "your Shinchan",
} as const;

function encodePayload(payload: Record<string, string>): string {
  const json = JSON.stringify(payload);
  const base64 = Buffer.from(json, "utf8").toString("base64");

  // URL-safe base64, no padding for cleaner links.
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export default function AskOutForDateSamplePage() {
  const encoded = encodePayload(SAMPLE_PAYLOAD);
  redirect(`/experiments/ask-out-for-date?d=${encoded}`);
}
