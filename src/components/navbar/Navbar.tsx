import React from 'react';
import styles from './Navbar.module.css';

const Navbar: React.FC = () => {
  return (
    <header className={styles.navbar}>
      <div className={styles.logo}>
        <a className={styles.logoLink} href="/">Aneesh Sharma</a>
      </div>
      <nav className={styles.menu}>
        <a className={styles.menuItem} href="#about">About</a>
        <a className={styles.menuItem} href="#projects">Projects</a>
        <a className={styles.menuItem} href="#contact">Contact</a>
      </nav>
    </header>
  );
};

export default Navbar;
