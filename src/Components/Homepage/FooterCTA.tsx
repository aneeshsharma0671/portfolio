import React from 'react';
import styles from './FooterCTA.module.css';

interface FooterCTAProps {
  text: string;
  link: string;
}

const FooterCTA: React.FC<FooterCTAProps> = ({ text, link }) => {
  return (
    <section className={styles.footerCtaSection}>
      <div className={styles.container}>
        <p className={styles.ctaText}>{text}</p>
        <a href={link} className={styles.ctaButton}>
          Get in touch
        </a>
      </div>
    </section>
  );
};

export default FooterCTA;
