import React from 'react';
import styles from './PhilosophySection.module.css';

interface PhilosophySectionProps {
  text: string;
}

const PhilosophySection: React.FC<PhilosophySectionProps> = ({ text }) => {
  return (
    <section className={styles.philosophySection}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>Philosophy</h2>
        <p className={styles.philosophyText}>{text}</p>
      </div>
    </section>
  );
};

export default PhilosophySection;
