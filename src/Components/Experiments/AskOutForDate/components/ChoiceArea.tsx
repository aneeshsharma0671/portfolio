import { type RefObject, useMemo } from 'react';
import styles from '../AskOutPage.module.css';

type ChoiceAreaProps = {
  yesText: string;
  noText: string;
  noClicks: number;
  noPosition: { x: number; y: number };
  noMessage: string;
  stageRef: RefObject<HTMLDivElement | null>;
  onYes: () => void;
  onNo: () => void;
};

export default function ChoiceArea({
  yesText,
  noText,
  noClicks,
  noPosition,
  noMessage,
  stageRef,
  onYes,
  onNo
}: ChoiceAreaProps) {
  const yesScale = useMemo(() => {
    return Math.min(1 + noClicks * 0.14, 2.2);
  }, [noClicks]);

  return (
    <section className={styles.choiceBlock}>
      <button
        type="button"
        className={styles.yesButton}
        onClick={onYes}
        style={{ transform: `scale(${yesScale})` }}
      >
        {yesText}
      </button>

      <div className={styles.noButtonStage} ref={stageRef}>
        <button
          type="button"
          className={styles.noButton}
          onClick={onNo}
          style={{ left: `${noPosition.x}px`, top: `${noPosition.y}px` }}
        >
          {noText}
        </button>
      </div>

      {noClicks > 0 && <p className={styles.noMessage}>{noMessage}</p>}
    </section>
  );
}
