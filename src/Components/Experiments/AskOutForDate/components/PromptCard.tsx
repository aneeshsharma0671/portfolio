import styles from '../AskOutPage.module.css';

type PromptCardProps = {
  heroBadge: string;
  heroTitle: string;
  heroSubtitle: string;
  question: string;
  personName: string;
  dateLabel: string;
  dateValue: string;
  placeLabel: string;
  placeValue: string;
  fromLabel: string;
  fromValue: string;
};

export default function PromptCard({
  heroBadge,
  heroTitle,
  heroSubtitle,
  question,
  personName,
  dateLabel,
  dateValue,
  placeLabel,
  placeValue,
  fromLabel,
  fromValue
}: PromptCardProps) {
  return (
    <section className={styles.card}>
      <p className={styles.badge}>{heroBadge}</p>
      <h1 className={styles.title}>{heroTitle}</h1>
      <p className={styles.subtitle}>{heroSubtitle}</p>
      <p className={styles.question}>{personName}, {question}</p>
      <div className={styles.metaGrid}>
        <article className={styles.metaItem}>
          <p>{dateLabel}</p>
          <h3>{dateValue}</h3>
        </article>
        <article className={styles.metaItem}>
          <p>{placeLabel}</p>
          <h3>{placeValue}</h3>
        </article>
        <article className={styles.metaItem}>
          <p>{fromLabel}</p>
          <h3>{fromValue}</h3>
        </article>
      </div>
    </section>
  );
}
