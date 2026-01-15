import React from 'react';
import { FeaturedProject } from '../../types/homepage';
import styles from './FeaturedProjects.module.css';

interface FeaturedProjectsProps {
  projects: FeaturedProject[];
}

const FeaturedProjects: React.FC<FeaturedProjectsProps> = ({ projects }) => {
  return (
    <section className={styles.projectsSection}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>Featured Work</h2>
        <p className={styles.subtitle}>Selected Projects</p>

        <div className={styles.projectsList}>
          {projects.map((project, index) => (
            <div key={index} className={styles.projectItem}>
              <div className={styles.projectContent}>
                <h3 className={styles.projectName}>→ {project.name}</h3>
                <p className={styles.projectDescription}>{project.description}</p>
              </div>
              {project.link && (
                <a href={project.link} className={styles.projectLink}>
                  View →
                </a>
              )}
            </div>
          ))}
        </div>

        <div className={styles.viewAllCta}>
          <a href="/projects" className={styles.viewAllButton}>
            See all projects →
          </a>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProjects;
