import React from 'react';
import { WorkArea } from '../../types/homepage';
import styles from './WorkAreasGrid.module.css';

interface WorkAreasGridProps {
  areas: WorkArea[];
}

const WorkAreasGrid: React.FC<WorkAreasGridProps> = ({ areas }) => {
  return (
    <section className={styles.workAreasSection}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>What I Work On</h2>
        <div className={styles.grid}>
          {areas.map((area, index) => (
            <div key={index} className={styles.card}>
              <div className={styles.icon}>{area.icon}</div>
              <h3 className={styles.cardTitle}>{area.title}</h3>
              <p className={styles.cardDescription}>{area.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WorkAreasGrid;
