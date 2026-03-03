'use client';

import '../../src/Components/Background/Background.css';
import '../../src/Components/Cards/projectCard.css';
import '../../src/Components/Navbar/navbar.css';
import "../../src/LegacyPages/home.css";
import "../../src/LegacyPages/pages.css";
import "../../src/LegacyPages/projects.css";

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
