'use client';

import { useState } from 'react';
import styles from './FolderAnimationPage.module.css';

export default function FolderAnimationPage() {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenFile = () => {
    setIsOpen(true);
  };

  const handleCloseFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.scene}>
        <div
          className={`${styles.fileAssembly} ${isOpen ? styles.open : ''}`}
        >
          {/* INSIDE PAGE */}
          <div className={styles.insidePage}>
            <div className={styles.paper}>
              <div className={styles.binding}>
                <div className={styles.hole}></div>
                <div className={styles.hole}></div>
                <div className={styles.hole}></div>
              </div>
              <div className={styles.spineShadow}></div>
              <div className={styles.insideContent}>
                <button
                  className={styles.closeBtn}
                  onClick={handleCloseFile}
                  aria-label="Close"
                >
                  ✕ CLOSE FILE
                </button>

                <div className={styles.navHeader}>
                  <div className={styles.navEyebrow}>DOSSIER CONTENTS</div>
                  <div className={styles.navName}>
                    Your<br />
                    Name Here
                  </div>
                </div>

                <ul className={styles.navItems}>
                  <li className={styles.navItem}>
                    <a href="#" className={styles.navItemLink}>
                      <span className={styles.navNum}>01</span>
                      <span className={styles.navLabel}>About</span>
                      <span className={styles.navTag}>IDENTITY</span>
                      <span className={styles.navArrow}>→</span>
                    </a>
                  </li>
                  <li className={styles.navItem}>
                    <a href="#" className={styles.navItemLink}>
                      <span className={styles.navNum}>02</span>
                      <span className={styles.navLabel}>Projects</span>
                      <span className={styles.navTag}>OPERATIONS</span>
                      <span className={styles.navArrow}>→</span>
                    </a>
                  </li>
                  <li className={styles.navItem}>
                    <a href="#" className={styles.navItemLink}>
                      <span className={styles.navNum}>03</span>
                      <span className={styles.navLabel}>Skills</span>
                      <span className={styles.navTag}>CAPABILITIES</span>
                      <span className={styles.navArrow}>→</span>
                    </a>
                  </li>
                  <li className={styles.navItem}>
                    <a href="#" className={styles.navItemLink}>
                      <span className={styles.navNum}>04</span>
                      <span className={styles.navLabel}>Writing</span>
                      <span className={styles.navTag}>INTEL</span>
                      <span className={styles.navArrow}>→</span>
                    </a>
                  </li>
                  <li className={styles.navItem}>
                    <a href="#" className={styles.navItemLink}>
                      <span className={styles.navNum}>05</span>
                      <span className={styles.navLabel}>Contact</span>
                      <span className={styles.navTag}>SECURE LINE</span>
                      <span className={styles.navArrow}>→</span>
                    </a>
                  </li>
                </ul>

                <div
                  className={`${styles.cornerStamp} ${styles.bl}`}
                >
                  CLEARANCE GRANTED · TS/SCI
                </div>
                <div
                  className={`${styles.cornerStamp} ${styles.br}`}
                >
                  PAGE 1 OF 1
                </div>
              </div>
            </div>
          </div>

          {/* COVER PAGE */}
          <div
            className={styles.coverPage}
            onClick={!isOpen ? handleOpenFile : undefined}
          >
            <div className={styles.coverBack}></div>
            <div className={styles.coverFront}>
              <div className={styles.paper}>
                <div className={styles.fileTab}>FILE-7741</div>
                <div className={styles.binding}>
                  <div className={styles.hole}></div>
                  <div className={styles.hole}></div>
                  <div className={styles.hole}></div>
                </div>
                <div className={styles.coverContent}>
                  <div className={styles.fileHeader}>
                    <div className={styles.fileId}>
                      REF: 7741-ALPHA<br />
                      DATE: 2026.02.21<br />
                      CLEARANCE: TOP SECRET
                    </div>
                    <div className={styles.agency}>
                      PORTFOLIO<br />
                      DIVISION
                    </div>
                  </div>

                  <div className={styles.stamp}>CLASSIFIED</div>
                  <div className={styles.photoBox}>
                    SUBJECT<br />
                    PHOTO<br />
                    [REDACTED]
                  </div>

                  <div className={styles.subjectBlock}>
                    <div className={styles.subjectLabel}>SUBJECT IDENTITY</div>
                    <div className={styles.subjectName}>
                      YOUR<br />
                      NAME HERE
                    </div>
                  </div>

                  <div className={styles.infoLine}>
                    <span className={styles.infoLabel}>ROLE</span>
                    <span className={styles.infoValue}>
                      Designer & Developer
                    </span>
                  </div>
                  <div className={styles.infoLine}>
                    <span className={styles.infoLabel}>STATUS</span>
                    <span className={styles.infoValue}>
                      Active · Available for hire
                    </span>
                  </div>
                  <div className={styles.infoLine}>
                    <span className={styles.infoLabel}>ORIGIN</span>
                    <span className={styles.infoValue}>
                      <span className={styles.redacted}>████████</span>,
                      Earth
                    </span>
                  </div>
                  <div className={styles.infoLine}>
                    <span className={styles.infoLabel}>SPECIALTY</span>
                    <span className={styles.infoValue}>
                      UI/UX, Web Dev, Motion
                    </span>
                  </div>

                  <div className={styles.summary}>
                    FURTHER DETAILS WITHIN FILE.<br />
                    UNAUTHORIZED ACCESS STRICTLY<br />
                    PROHIBITED. PROCEED WITH CAUTION.
                  </div>

                  <div className={styles.openCta}>
                    <div className={styles.ctaLine}></div>
                    <div className={styles.ctaText}>CLICK TO ACCESS</div>
                    <div className={styles.ctaLine}></div>
                  </div>

                  <div
                    className={`${styles.cornerStamp} ${styles.bl}`}
                  >
                    EYES ONLY · TS/SCI
                  </div>
                  <div
                    className={`${styles.cornerStamp} ${styles.br}`}
                  >
                    DO NOT DUPLICATE
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.hint}>CLICK FILE TO ACCESS</div>
    </div>
  );
}
