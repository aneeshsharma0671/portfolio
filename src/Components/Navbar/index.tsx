'use client';

import React, { useState } from 'react';
import {
  Nav,
  NavList,
  NavMenu,
  Sidebar,
  IconContainer,
} from './NavbarElements';
import { FaBars } from 'react-icons/fa';
import { ImCross } from 'react-icons/im';
import Link from 'next/link';

const Navbar: React.FC = () => {
  const [navbaropen, setNavbarOpen] = useState(false);
  const handleToggle = () => { setNavbarOpen(!navbaropen); };
  return (
    <>
      <Nav>
        <Link href="/portfolio" onClick={() => setNavbarOpen(false)}><img src="/LogoA.svg" alt="Aneesh" /></Link>
        <IconContainer onClick={handleToggle}>{navbaropen ? <ImCross /> : <FaBars />}</IconContainer>
        <NavMenu>
          <Link href='/portfolio/projects' className="nav-link">Projects</Link>
          <Link href='/portfolio/about' className="nav-link">About</Link>
          <Link href='/portfolio/contact' className="nav-link">Contact</Link>
        </NavMenu>
      </Nav>
      <Sidebar isOpen={navbaropen}>
        <NavList>
          <li><Link href='/portfolio/projects' className="sidebar-link" onClick={handleToggle}>Projects</Link></li>
          <li><Link href='/portfolio' className="sidebar-link" onClick={handleToggle}>Portfolio</Link></li>
          <li><Link href='/portfolio/about' className="sidebar-link" onClick={handleToggle}>About</Link></li>
          <li><Link href='/portfolio/contact' className="sidebar-link" onClick={handleToggle}>Contact</Link></li>
        </NavList>
      </Sidebar>
    </>
  );
};

export default Navbar;
