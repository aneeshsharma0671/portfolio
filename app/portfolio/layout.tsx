'use client';

import '../../src/Components/Background/Background.css';
import '../../src/Components/Cards/projectCard.css';
import '../../src/Components/Navbar/navbar.css';
import '../../src/Pages/home.css';
import '../../src/Pages/pages.css';
import '../../src/Pages/projects.css';

import Navbar from '../../src/Components/Navbar/index';
import BackGround from '../../src/Components/Background';

export default function PortfolioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <BackGround />
      <Navbar />
      {children}
    </>
  );
}
