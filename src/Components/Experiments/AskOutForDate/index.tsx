"use client";

import {
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";

import ChoiceArea from "./components/ChoiceArea";
import InvitationResult from "./components/InvitationResult";
import PromptCard from "./components/PromptCard";
import {
  DEFAULT_CONTENT,
  ENCODED_QUERY_HELP_TEXT,
  ENCODED_QUERY_KEY,
  type AskOutContent,
} from "./config";
import styles from "./AskOutPage.module.css";

type ResolvedInvite = {
  content: AskOutContent;
  name: string;
  date: string;
  place: string;
  from: string;
};

type InvitePayload = Partial<{
  name: string;
  date: string;
  place: string;
  from: string;
  question: string;
  heroTitle: string;
  heroSubtitle: string;
  yesText: string;
  noText: string;
  acceptedTitle: string;
  acceptedMessage: string;
}>;

function readPayloadValue(
  payload: InvitePayload,
  key: string,
  fallback: string,
  maxLength = 120,
): string {
  const value = payload[key as keyof InvitePayload];
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return fallback;
  }

  return trimmed.slice(0, maxLength);
}

function decodePayload(encodedPayload: string): InvitePayload {
  try {
    const normalized = encodedPayload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const binary = atob(padded);
    const byteArray = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const decoded = new TextDecoder().decode(byteArray);
    const parsed = JSON.parse(decoded);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    return parsed as InvitePayload;
  } catch {
    return {};
  }
}

function drawWrappedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  color: string,
  font: string,
): number {
  context.font = font;
  context.fillStyle = color;

  const words = text.split(" ");
  let line = "";
  let cursorY = y;

  words.forEach((word) => {
    const nextLine = line ? `${line} ${word}` : word;
    const nextWidth = context.measureText(nextLine).width;

    if (nextWidth > maxWidth && line) {
      context.fillText(line, x, cursorY);
      line = word;
      cursorY += lineHeight;
      return;
    }

    line = nextLine;
  });

  if (line) {
    context.fillText(line, x, cursorY);
  }

  return cursorY + lineHeight;
}

async function buildInvitationBlob(invite: ResolvedInvite): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Unable to draw invitation image");
  }

  const gradient = context.createLinearGradient(
    0,
    0,
    canvas.width,
    canvas.height,
  );
  gradient.addColorStop(0, "#fff1d9");
  gradient.addColorStop(0.55, "#ffd9da");
  gradient.addColorStop(1, "#ffe8f3");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 22; i += 1) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const radius = 8 + Math.random() * 18;
    context.beginPath();
    context.fillStyle = `rgba(255, 102, 145, ${0.09 + Math.random() * 0.18})`;
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }

  context.fillStyle = "#fffaf2";
  context.strokeStyle = "rgba(191, 71, 106, 0.25)";
  context.lineWidth = 5;
  context.beginPath();
  context.roundRect(85, 130, 910, 1070, 36);
  context.fill();
  context.stroke();

  context.fillStyle = "#bf476a";
  context.font = "700 42px Georgia, serif";
  context.textAlign = "center";
  context.fillText(invite.content.acceptedTitle, 540, 230);

  context.fillStyle = "#7b3d4a";
  context.font = "500 32px Georgia, serif";
  context.fillText(`For ${invite.name}`, 540, 290);

  context.textAlign = "left";
  let cursorY = 380;
  cursorY = drawWrappedText(
    context,
    invite.content.acceptedMessage,
    145,
    cursorY,
    790,
    54,
    "#4a2e37",
    "500 34px Georgia, serif",
  );

  cursorY += 30;
  cursorY = drawWrappedText(
    context,
    `${invite.content.dateLabel}: ${invite.date}`,
    145,
    cursorY,
    790,
    56,
    "#4a2e37",
    "600 38px Georgia, serif",
  );

  cursorY = drawWrappedText(
    context,
    `${invite.content.placeLabel}: ${invite.place}`,
    145,
    cursorY,
    790,
    56,
    "#4a2e37",
    "600 38px Georgia, serif",
  );

  cursorY = drawWrappedText(
    context,
    `${invite.content.fromLabel}: ${invite.from}`,
    145,
    cursorY,
    790,
    56,
    "#4a2e37",
    "600 38px Georgia, serif",
  );

  context.font = "500 30px Georgia, serif";
  context.fillStyle = "#8e5563";
  context.fillText("Made with courage and a lot of butterflies.", 145, 1110);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Failed to generate invitation image"));
        return;
      }
      resolve(blob);
    }, "image/png");
  });
}

export default function AskOutForDatePage() {
  const searchParams = useSearchParams();
  const stageRef = useRef<HTMLDivElement | null>(null);

  const [accepted, setAccepted] = useState(false);
  const [noClicks, setNoClicks] = useState(0);
  const [noPosition, setNoPosition] = useState({ x: 16, y: 12 });
  const [statusText, setStatusText] = useState("");
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const invite = useMemo<ResolvedInvite>(() => {
    const params = new URLSearchParams(searchParams.toString());
    const payload = decodePayload(params.get(ENCODED_QUERY_KEY) ?? "");

    const content: AskOutContent = {
      ...DEFAULT_CONTENT,
      question: readPayloadValue(
        payload,
        "question",
        DEFAULT_CONTENT.question,
        180,
      ),
      heroTitle: readPayloadValue(
        payload,
        "heroTitle",
        DEFAULT_CONTENT.heroTitle,
        140,
      ),
      heroSubtitle: readPayloadValue(
        payload,
        "heroSubtitle",
        DEFAULT_CONTENT.heroSubtitle,
        180,
      ),
      yesText: readPayloadValue(
        payload,
        "yesText",
        DEFAULT_CONTENT.yesText,
        40,
      ),
      noText: readPayloadValue(payload, "noText", DEFAULT_CONTENT.noText, 20),
      acceptedTitle: readPayloadValue(
        payload,
        "acceptedTitle",
        DEFAULT_CONTENT.acceptedTitle,
        80,
      ),
      acceptedMessage: readPayloadValue(
        payload,
        "acceptedMessage",
        DEFAULT_CONTENT.acceptedMessage,
        220,
      ),
    };

    return {
      content,
      name: readPayloadValue(payload, "name", "You", 60),
      date: readPayloadValue(payload, "date", "Saturday, 7:00 PM", 70),
      place: readPayloadValue(payload, "place", "Your favorite cafe", 70),
      from: readPayloadValue(
        payload,
        "from",
        "Someone who likes you a lot",
        60,
      ),
    };
  }, [searchParams]);

  useEffect(() => {
    setAccepted(false);
    setNoClicks(0);
    setNoPosition({ x: 16, y: 12 });
    setStatusText("");
    setImageBlob(null);
    setImageUrl((oldUrl) => {
      if (oldUrl) {
        URL.revokeObjectURL(oldUrl);
      }
      return null;
    });
  }, [invite]);

  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  const noMessage =
    invite.content.noMessages[
      Math.max(0, noClicks - 1) % invite.content.noMessages.length
    ] ?? "";

  const generateInvitation = useCallback(async () => {
    setIsGenerating(true);
    setStatusText("");

    try {
      const blob = await buildInvitationBlob(invite);
      setImageBlob(blob);
      const nextUrl = URL.createObjectURL(blob);
      setImageUrl((oldUrl) => {
        if (oldUrl) {
          URL.revokeObjectURL(oldUrl);
        }
        return nextUrl;
      });
      setStatusText("Invitation image is ready.");
    } catch {
      setStatusText("Could not generate the invitation image.");
      setImageBlob(null);
      setImageUrl(null);
    } finally {
      setIsGenerating(false);
    }
  }, [invite]);

  useEffect(() => {
    if (accepted) {
      void generateInvitation();
    }
  }, [accepted, generateInvitation]);

  const handleNo = () => {
    const stage = stageRef.current;
    if (stage) {
      const buttonWidth = 112;
      const buttonHeight = 52;
      const maxX = Math.max(8, stage.clientWidth - buttonWidth - 8);
      const maxY = Math.max(8, stage.clientHeight - buttonHeight - 8);
      setNoPosition({
        x: Math.floor(Math.random() * maxX),
        y: Math.floor(Math.random() * maxY),
      });
    }

    setNoClicks((current) => current + 1);
  };

  const handleShareImage = async () => {
    if (!imageBlob) {
      setStatusText("Please wait for the invitation image first.");
      return;
    }

    const file = new File([imageBlob], "date-invitation.png", {
      type: "image/png",
    });
    const shareData: ShareData = {
      title: invite.content.acceptedTitle,
      text: `${invite.name}, this one is for you.`,
    };

    if (navigator.share) {
      try {
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ ...shareData, files: [file] });
          setStatusText("Invitation shared.");
          return;
        }

        await navigator.share({ ...shareData, url: window.location.href });
        setStatusText("Shared with your current link.");
        return;
      } catch (error) {
        if ((error as DOMException).name === "AbortError") {
          return;
        }
      }
    }

    try {
      await navigator.clipboard.writeText(window.location.href);
      setStatusText("Sharing is not supported here, link copied instead.");
    } catch {
      setStatusText(
        "Sharing is not supported here. Please copy the URL manually.",
      );
    }
  };

  const handleDownloadImage = () => {
    if (!imageUrl) {
      setStatusText("Image is still generating.");
      return;
    }

    const anchor = document.createElement("a");
    anchor.href = imageUrl;
    anchor.download = "date-invitation.png";
    anchor.click();
    setStatusText("Invitation image downloaded.");
  };

  const handleShareLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setStatusText("Page link copied.");
    } catch {
      setStatusText(
        "Unable to copy automatically. Please copy the URL from the address bar.",
      );
    }
  };

  const decorativeStyle = useMemo(
    () =>
      ({
        "--float-delay": `${0.4 + Math.random() * 2.1}s`,
      }) as CSSProperties,
    [],
  );

  return (
    <main className={styles.page}>
      <div className={styles.bgGradient} />
      <div className={styles.blobA} style={decorativeStyle} />
      <div className={styles.blobB} />

      <div className={styles.contentWrap}>
        <PromptCard
          heroBadge={invite.content.heroBadge}
          heroTitle={invite.content.heroTitle}
          heroSubtitle={invite.content.heroSubtitle}
          question={invite.content.question}
          personName={invite.name}
          dateLabel={invite.content.dateLabel}
          dateValue={invite.date}
          placeLabel={invite.content.placeLabel}
          placeValue={invite.place}
          fromLabel={invite.content.fromLabel}
          fromValue={invite.from}
        />

        {!accepted && (
          <ChoiceArea
            yesText={invite.content.yesText}
            noText={invite.content.noText}
            noClicks={noClicks}
            noPosition={noPosition}
            noMessage={noMessage}
            stageRef={stageRef}
            onYes={() => setAccepted(true)}
            onNo={handleNo}
          />
        )}

        {accepted && (
          <InvitationResult
            acceptedTitle={invite.content.acceptedTitle}
            acceptedMessage={invite.content.acceptedMessage}
            personName={invite.name}
            dateLabel={invite.content.dateLabel}
            dateValue={invite.date}
            placeLabel={invite.content.placeLabel}
            placeValue={invite.place}
            fromLabel={invite.content.fromLabel}
            fromValue={invite.from}
            shareHint={invite.content.shareHint}
            imageUrl={imageUrl}
            busy={isGenerating}
            onShareImage={() => void handleShareImage()}
            onDownloadImage={handleDownloadImage}
            onShareLink={() => void handleShareLink()}
          />
        )}

        {/* <p className={styles.hint}>
          Hidden customize mode is enabled with encoded payloads. Use <code>{ENCODED_QUERY_KEY}</code> as
          the only query key. Example: {ENCODED_QUERY_HELP_TEXT}
        </p> */}

        {statusText && <p className={styles.status}>{statusText}</p>}
      </div>
    </main>
  );
}
