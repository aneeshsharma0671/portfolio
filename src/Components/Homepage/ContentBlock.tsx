import React from 'react';
import { ContentSection } from '../../types/homepage';
import styles from './ContentBlock.module.css';

interface ContentBlockProps {
  data: ContentSection;
}

const ContentBlock: React.FC<ContentBlockProps> = ({ data }) => {
  return (
    <section className={styles.contentBlock}>
      <div className={styles.content}>
        <h2 className={styles.title}>{data.title}</h2>
        <p className={styles.description}>{data.description}</p>
      </div>
    </section>
  );
};

export default ContentBlock;
