import React from 'react';
import styles from './Navbar.module.css';

const Navbar: React.FC = () => {
  return (
    <header className={styles.navbar}>
      <div className={styles.logo}>
        <a href="">Aneesh Sharma</a>
      </div>
      <nav className={styles.navLinks}>
        <a href="">About</a>
        <a href="">Projects</a>
      </nav>
    </header>
  );
};

export default Navbar;
