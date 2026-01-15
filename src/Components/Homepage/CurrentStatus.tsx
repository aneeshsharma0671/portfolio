import React from 'react';
import { CurrentStatus } from '../../types/homepage';
import styles from './CurrentStatus.module.css';

interface CurrentStatusProps {
  data: CurrentStatus;
}

const CurrentStatusComponent: React.FC<CurrentStatusProps> = ({ data }) => {
  return (
    <section className={styles.currentSection}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>Currently</h2>

        <div className={styles.statusGrid}>
          <div className={styles.statusItem}>
            <h3 className={styles.label}>Working on</h3>
            <p className={styles.value}>{data.working}</p>
          </div>

          <div className={styles.statusItem}>
            <h3 className={styles.label}>Learning</h3>
            <p className={styles.value}>{data.learning}</p>
          </div>

          <div className={styles.statusItem}>
            <h3 className={styles.label}>Exploring</h3>
            <p className={styles.value}>{data.exploring}</p>
          </div>
        </div>

        <p className={styles.note}>
          Optional but adds a "living site" feel
        </p>
      </div>
    </section>
  );
};

export default CurrentStatusComponent;
