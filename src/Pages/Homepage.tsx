'use client';

import React from 'react';
import homepageData from '../data/homepage.json';
import { HomepageContent } from '../types/homepage';
import HeroSection from '../Components/Homepage/HeroSection';
import ContentBlock from '../Components/Homepage/ContentBlock';
import WorkAreasGrid from '../Components/Homepage/WorkAreasGrid';
import FeaturedProjects from '../Components/Homepage/FeaturedProjects';
import PhilosophySection from '../Components/Homepage/PhilosophySection';
import CurrentStatus from '../Components/Homepage/CurrentStatus';
import FooterCTA from '../Components/Homepage/FooterCTA';
import styles from './Homepage.module.css';

const Homepage: React.FC = () => {
  const data: HomepageContent = homepageData as unknown as HomepageContent;

  return (
    <div className={styles.homepage}>
      {/* <div className={styles.brandLine}>{data.brandLine}</div> */}
      <HeroSection data={data.hero} />
      <ContentBlock data={data.whatIsThis} />
      <WorkAreasGrid areas={data.workAreas} />
      <PhilosophySection text={data.philosophy} />
      <FeaturedProjects projects={data.featuredProjects} />
      <CurrentStatus data={data.current} />
      <FooterCTA text={data.footerCta.text} link={data.footerCta.link} />
    </div>
  );
};

export default Homepage;
