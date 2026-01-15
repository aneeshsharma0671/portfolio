/**
 * Types for Homepage content and components
 */

export interface HeroSection {
  mainTitle: string;
  taglines: string[];
  introduction: string;
  ctaButtons: CTAButton[];
}

export interface CTAButton {
  label: string;
  href: string;
  variant?: 'primary' | 'secondary';
}

export interface ContentSection {
  title: string;
  description: string;
  icon?: string;
}

export interface WorkArea {
  title: string;
  description: string;
  icon: string;
}

export interface FeaturedProject {
  name: string;
  description: string;
  link?: string;
}

export interface CurrentStatus {
  working: string;
  learning: string;
  exploring: string;
}

export interface HomepageContent {
  brandLine: string;
  hero: HeroSection;
  whatIsThis: ContentSection;
  workAreas: WorkArea[];
  philosophy: string;
  featuredProjects: FeaturedProject[];
  current: CurrentStatus;
  footerCta: {
    text: string;
    link: string;
  };
}
