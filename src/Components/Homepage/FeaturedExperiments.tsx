import React from 'react';
import { FeaturedProject } from '../../types/homepage';
import styles from './FeaturedExperiments.module.css';

interface FeaturedExperimentsProps {
  experiments: FeaturedProject[];
}

const FeaturedExperiments: React.FC<FeaturedExperimentsProps> = ({ experiments }) => {
  return (
    <section className={styles.experimentsSection}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>Experiments</h2>
        <p className={styles.subtitle}>Interactive Projects & Ideas</p>

        <div className={styles.experimentsList}>
          {experiments.map((experiment, index) => (
            <div key={index} className={styles.experimentItem}>
              <div className={styles.experimentContent}>
                <h3 className={styles.experimentName}>→ {experiment.name}</h3>
                <p className={styles.experimentDescription}>{experiment.description}</p>
              </div>
              {experiment.link && (
                <a href={experiment.link} className={styles.experimentLink}>
                  Explore →
                </a>
              )}
            </div>
          ))}
        </div>

        {/* <div className={styles.viewAllCta}>
          <a href="/experiments" className={styles.viewAllButton}>
            See all experiments →
          </a>
        </div> */}
      </div>
    </section>
  );
};

export default FeaturedExperiments;
