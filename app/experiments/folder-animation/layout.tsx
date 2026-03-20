"use client";

import '../../../src/Components/Background/Background.css';
import '../../../src/Components/Cards/projectCard.css';
import '../../../src/Components/Navbar/navbar.css';
import "../../../src/page-components/home.css";
import "../../../src/page-components/pages.css";
import "../../../src/page-components/projects.css";

import Navbar from '../../../src/Components/Navbar/index';
import BackGround from '../../../src/Components/Background';

export default function ExperimentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
    </>
  );
}
