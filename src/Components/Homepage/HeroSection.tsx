import React from 'react';
import { HeroSection as HeroSectionType } from '../../types/homepage';
import styles from './HeroSection.module.css';

interface HeroSectionProps {
  data: HeroSectionType;
}

const HeroSection: React.FC<HeroSectionProps> = ({ data }) => {
  return (
    <section className={styles.heroSection}>
      <div className={styles.heroContent}>
        <h1 className={styles.mainTitle}>{data.mainTitle}</h1>

        <div className={styles.taglines}>
          {data.taglines.map((tagline, index) => (
            <p key={index} className={styles.tagline}>
              {tagline}
            </p>
          ))}
        </div>

        <p className={styles.introduction}>{data.introduction}</p>

        <div className={styles.ctaButtons}>
          {data?.ctaButtons?.map((button, index) => (
            <a
              key={index}
              href={button.href}
              className={`${styles.button} ${styles[button.variant || 'primary']}`}
            >
              {button.label}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
