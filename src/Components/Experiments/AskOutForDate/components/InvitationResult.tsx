import styles from '../AskOutPage.module.css';

type InvitationResultProps = {
  acceptedTitle: string;
  acceptedMessage: string;
  personName: string;
  dateLabel: string;
  dateValue: string;
  placeLabel: string;
  placeValue: string;
  fromLabel: string;
  fromValue: string;
  shareHint: string;
  imageUrl: string | null;
  busy: boolean;
  onShareImage: () => void;
  onDownloadImage: () => void;
  onShareLink: () => void;
};

export default function InvitationResult({
  acceptedTitle,
  acceptedMessage,
  personName,
  dateLabel,
  dateValue,
  placeLabel,
  placeValue,
  fromLabel,
  fromValue,
  shareHint,
  imageUrl,
  busy,
  onShareImage,
  onDownloadImage,
  onShareLink
}: InvitationResultProps) {
  return (
    <section className={styles.acceptedCard}>
      <p className={styles.acceptedBadge}>Yay</p>
      <h2>{acceptedTitle}</h2>
      <p>{acceptedMessage}</p>

      <div className={styles.inviteBody}>
        <p>Dear {personName},</p>
        <p>This confirms our cute date plan.</p>
        <p>
          {dateLabel}: <strong>{dateValue}</strong>
        </p>
        <p>
          {placeLabel}: <strong>{placeValue}</strong>
        </p>
        <p>
          {fromLabel}: <strong>{fromValue}</strong>
        </p>
      </div>

      <p className={styles.shareHint}>{shareHint}</p>
      <div className={styles.actionRow}>
        <button type="button" onClick={onShareImage} disabled={busy || !imageUrl}>
          Share Invitation
        </button>
        <button type="button" onClick={onDownloadImage} disabled={busy || !imageUrl}>
          Download Image
        </button>
        <button type="button" onClick={onShareLink}>
          Copy Link
        </button>
      </div>
      {busy && <p className={styles.generating}>Generating your invitation image...</p>}
    </section>
  );
}
