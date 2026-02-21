'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import styles from './ClassifiedPortfolio.module.css';

// ─────────────────────────────────────────────
// STYLE CONFIG — edit colors / sizes here
// ─────────────────────────────────────────────
export const theme = {
  bg:           '#0e0c07',
  ink:          '#1a1209',
  red:          '#c0392b',
  redStamp:     'rgba(192,57,43,0.85)',
  green:        '#2d5a27',
  statusGreen:  '#2d6e28',

  // Cover (manila folder)
  coverGrad:    'linear-gradient(160deg, #d8be82 0%, #caa86a 35%, #b99050 65%, #a87c3c 100%)',
  coverTabBg:   '#c8a96e',

  // Inner pages (aged cream paper)
  pageGrad:     'linear-gradient(170deg, #f0e8d2 0%, #e8dfc5 40%, #dfd5b8 100%)',
  pageTabBg:    '#ede5cf',

  // Spine
  spineGrad:    'linear-gradient(90deg, #9a7e4a 0%, #b49460 55%, #c8a870 100%)',

  // Dimensions
  spineW:       '30px',
  pageW:        '420px',
  pageH:        '580px',
  tabH:         '26px',
};

// ─────────────────────────────────────────────
// DATA — edit all portfolio content here
// ─────────────────────────────────────────────
export const data = {
  meta: {
    ref:          '7741-ALPHA',
    date:         '2026.02.21',
    clearance:    'TOP SECRET',
    agency:       'PORTFOLIO\nDIVISION',
    spineLabel:   'TS/SCI · 7741-A',
    fileId:       '7741',
  },

  cover: {
    name:         'ANEESH\nSHARMA',
    role:         'Game & Web Developer',
    status:       'Active · Available',
    origin:       'Haryana, India',
    specialty:    'Unity 3D, React, Phaser',
    summary:      'FURTHER DETAILS WITHIN FILE.\nUNAUTHORIZED ACCESS STRICTLY\nPROHIBITED. PROCEED WITH CAUTION.',
    cta:          'CLICK FILE TO OPEN',
  },

  about: {
    education:    'B.Tech IT — IIIT Sonepat (CGPA: 8.67)',
    location:     'Haryana, India',
    email:        'work.aneeshsharma@gmail.com',
    experience: [
      {
        role:     'Developer',
        company:  'Winzo',
        period:   'FEB 2025 – PRESENT',
        location: 'DELHI',
        tags:     ['PHASER', 'TYPESCRIPT', 'REACT'],
      },
      {
        role:     'Unity Developer',
        company:  'Studio Sirah',
        period:   'JAN 2023 – FEB 2025',
        location: 'BANGALORE',
        tags:     ['UNITY 3D', 'C#', 'GO'],
      },
      {
        role:     'Developer',
        company:  'Black March Studios',
        period:   'JAN 2022 – JUN 2022',
        location: 'DEHRADUN',
        tags:     ['UNITY 3D', 'C#', 'BLENDER'],
      },
      {
        role:     'Developer Intern',
        company:  'Aimed Labs',
        period:   'MAR 2021 – APR 2021',
        location: '',
        tags:     ['UNITY 2D', 'HTML/CSS'],
      },
    ],
  },

  projects: [
    {
      opCode:   'OP-001 · KURUKSHETRA: ASCENSION',
      name:     'Studio Sirah — Unity 3D Game',
      desc:     'Cross-platform responsive UI systems. Backend maintenance. Commercial title on playkurukshetra.com',
      tags:     ['UNITY 3D', 'C#', 'GO'],
      status:   '● SHIPPED',
      statusColor: '',   // empty = use theme.green
    },
    {
      opCode:   'OP-002 · CRIMSON TACTICS',
      name:     'Black March Studios — Steam Title',
      desc:     'Action manager handling 150+ action types. Available on Steam: Crimson Tactics: Rise of The White Banner.',
      tags:     ['UNITY 3D', 'C#', 'BLENDER'],
      status:   '● SHIPPED',
      statusColor: '',
    },
    {
      opCode:   'OP-003 · EDUCATION WITH AR',
      name:     'AR Demo — itch.io',
      desc:     'AR plane detection to place educational 3D objects on real surfaces. aneesh-sharma.itch.io',
      tags:     ['UNITY', 'AR'],
      status:   '● COMPLETE',
      statusColor: '',
    },
    {
      opCode:   'OP-004 · PANDEMIC SIMULATOR',
      name:     'Simulation Tool — itch.io',
      desc:     '3D pandemic simulation with real-time graph plotting over time.',
      tags:     ['UNITY 3D', 'SIMULATION'],
      status:   '● COMPLETE',
      statusColor: '',
    },
  ],

  skills: {
    groups: [
      {
        label: 'GAME DEV',
        items: [
          { name: 'Unity 3D',  level: 95 },
          { name: 'C#',        level: 90 },
          { name: 'Phaser',    level: 82 },
          { name: 'Blender',   level: 70 },
        ],
      },
      {
        label: 'WEB DEV',
        items: [
          { name: 'React / TS',  level: 85 },
          { name: 'JavaScript',  level: 88 },
          { name: 'HTML / CSS',  level: 85 },
          { name: 'Photoshop',   level: 75 },
        ],
      },
    ],
    achievements: [
      'Runner-up — Winzo Ignite Hackathon (30+ teams)',
      '3★ Codechef · Max rating 1643 · Global rank 109/2609',
      'Facebook Hackercup 2022 · Rank 12331/27604',
      'GeeksForGeeks Institute Rank 95',
    ],
  },

  contact: {
    intro: 'All channels monitored. Use below methods\nto initiate contact. Response: 24–48 hours.',
    channels: [
      { icon: '✉',  label: 'PRIMARY CHANNEL',  value: 'work.aneeshsharma@gmail.com',            href: 'mailto:work.aneeshsharma@gmail.com' },
      { icon: '🔗', label: 'DIGITAL FOOTPRINT', value: 'linkedin.com/in/aneeshsharma0671',        href: 'https://www.linkedin.com/in/aneeshsharma0671/' },
      { icon: '⌨',  label: 'CODE REPOSITORY',   value: 'github.com/aneeshsharma0671',             href: 'https://github.com/aneeshsharma0671' },
      // { icon: '🌐', label: 'RESUME',          value: 'aneeshsharma0671.github.io/portfolio',    href: 'https://aneeshsharma0671.github.io/portfolio/' },
    ],
    signoff: 'THIS DOSSIER WILL SELF-DESTRUCT\nUPON UNAUTHORIZED DUPLICATION',
  },
};

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
type PageIndex = 0 | 1 | 2 | 3 | 4 | 5;

const PAGE_LABELS = ['FILE', 'INDEX', 'ABOUT', 'PROJECTS', 'SKILLS', 'CONTACT'] as const;
const FLIP_DUR    = 850;
const STAGGER     = 90;

// ─────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────

function PageHeader({ ref: refText, section, classification }: {
  ref: string; section: string; classification: string;
}) {
  return (
    <div className={styles.pgHeader}>
      <div className={styles.pgRef}>
        REF: {data.meta.ref}<br />
        SECTION: {section}<br />
        {classification}
      </div>
      <div className={styles.pgSec}>{refText}</div>
    </div>
  );
}

function Stamp({ text, style, inner }: { text: string; style?: React.CSSProperties; inner?: boolean }) {
  return (
    <div
      className={`${styles.stamp} ${inner ? styles.innerStamp : ''}`}
      style={style}
    >
      {text}
    </div>
  );
}

function CornerLabels({ left, right, innerPage }: { left: string; right: string; innerPage?: boolean }) {
  return (
    <>
      <div className={`${styles.cs} ${styles.csL} ${innerPage ? styles.csInner : ''}`}>{left}</div>
      <div className={`${styles.cs} ${styles.csR} ${innerPage ? styles.csRInner : ''}`}>{right}</div>
    </>
  );
}

// ── Cover Page ──────────────────────────────
function CoverContent({ onOpen }: { onOpen: () => void }) {
  const { cover, meta } = data;
  return (
    <div className={styles.pageBody} onClick={onOpen}>
      <div className={styles.coverHdr}>
        <div className={styles.coverRef}>
          REF: {meta.ref}<br />
          DATE: {meta.date}<br />
          CLEARANCE: {meta.clearance}
        </div>
        <div className={styles.coverAgency}>
          {meta.agency.split('\n').map((l, i) => <span key={i}>{l}<br /></span>)}
        </div>
      </div>

      <Stamp text="CLASSIFIED" style={{ top: 38, right: 18 }} />
      <div className={styles.photoBox}>SUBJECT<br />PHOTO<br />[REDACTED]</div>

      <div className={styles.subjectBlock}>
        <div className={styles.subjectLabel}>SUBJECT IDENTITY</div>
        <div className={styles.subjectName}>
          {cover.name.split('\n').map((l, i) => <span key={i}>{l}<br /></span>)}
        </div>
      </div>

      <div className={styles.infoLine}>
        <span className={styles.ilLbl}>ROLE</span>
        <span className={styles.ilVal}>{cover.role}</span>
      </div>
      <div className={styles.infoLine}>
        <span className={styles.ilLbl}>STATUS</span>
        <span className={`${styles.ilVal} ${styles.ilStatus}`}>{cover.status}</span>
      </div>
      <div className={styles.infoLine}>
        <span className={styles.ilLbl}>ORIGIN</span>
        <span className={styles.ilVal}>{cover.origin}</span>
      </div>
      <div className={styles.infoLine}>
        <span className={styles.ilLbl}>SPECIALTY</span>
        <span className={styles.ilVal}>{cover.specialty}</span>
      </div>

      <p className={styles.coverSummary}>
        {cover.summary.split('\n').map((l, i) => <span key={i}>{l}<br /></span>)}
      </p>

      <div className={styles.openCta}>
        <div className={styles.ctaLine} />
        <div className={styles.ctaTxt}>{cover.cta}</div>
        <div className={styles.ctaLine} />
      </div>

      <CornerLabels left="EYES ONLY · TS/SCI" right="PAGE 1 OF 6" />
    </div>
  );
}

// ── Index Page ───────────────────────────────
function IndexContent({ goTo }: { goTo: (n: number) => void }) {
  const { cover } = data;
  const entries = [
    { label: 'About',    tag: 'IDENTITY',    page: 2 },
    { label: 'Projects', tag: 'OPERATIONS',  page: 3 },
    { label: 'Skills',   tag: 'CAPABILITIES',page: 4 },
    { label: 'Contact',  tag: 'SECURE LINE', page: 5 },
  ];
  return (
    <div className={styles.pageBody}>
      <PageHeader ref="DOSSIER\nCONTENTS" section="INDEX" classification="CLEARANCE: TS" />
      <div className={styles.navEyebrow}>SUBJECT DOSSIER</div>
      <div className={styles.navName}>{cover.name.split('\n').map((l,i)=><span key={i}>{l}<br/></span>)}</div>
      <ul className={styles.navList}>
        {entries.map((e, i) => (
          <li key={e.page}>
            <a onClick={() => goTo(e.page)}>
              <span className={styles.nlNum}>0{i + 1}</span>
              <span className={styles.nlLabel}>{e.label}</span>
              <span className={styles.nlTag}>{e.tag}</span>
              <span className={styles.nlArrow}>→</span>
            </a>
          </li>
        ))}
      </ul>
      <CornerLabels left="CLEARANCE GRANTED" right="PAGE 2 OF 6" innerPage />
    </div>
  );
}

// ── About Page ───────────────────────────────
function AboutContent() {
  const { about } = data;
  return (
    <div className={styles.pageBody}>
      <PageHeader ref="SUBJECT\nPROFILE" section="IDENTITY" classification="CLASSIFICATION: SECRET" />
      <Stamp text="EYES ONLY" style={{ top: 34, right: 14, fontSize: 13, letterSpacing: 3, lineHeight: '1.4' }} inner />
      <div className={styles.sectionTitle}>Subject Profile</div>

      <div className={styles.aboutField}>
        <span className={styles.afLbl}>EDUCATION</span>
        <span className={styles.afVal}>{about.education}</span>
      </div>
      <div className={styles.aboutField}>
        <span className={styles.afLbl}>BASED IN</span>
        <span className={styles.afVal}>{about.location}</span>
      </div>
      <div className={`${styles.aboutField}`} style={{ marginBottom: 10 }}>
        <span className={styles.afLbl}>CONTACT</span>
        <span className={styles.afVal}>{about.email}</span>
      </div>

      {about.experience.map((exp, i) => (
        <div className={styles.expItem} key={i}>
          <div className={styles.expRole}>{exp.role} — {exp.company}</div>
          <div className={styles.expMeta}>{exp.period}{exp.location ? ` · ${exp.location}` : ''}</div>
          <div className={styles.expTags}>
            {exp.tags.map(t => <span className={styles.eTag} key={t}>{t}</span>)}
          </div>
        </div>
      ))}

      <CornerLabels left="SECTION: IDENTITY" right="PAGE 3 OF 6" innerPage />
    </div>
  );
}

// ── Projects Page ────────────────────────────
function ProjectsContent() {
  return (
    <div className={styles.pageBody}>
      <PageHeader ref="FIELD\nOPERATIONS" section="OPERATIONS" classification="CLASSIFICATION: SECRET" />
      <div className={styles.sectionTitle}>Operations Log</div>

      {data.projects.map((proj, i) => (
        <div className={styles.projCard} key={i}>
          <div className={styles.projNum}>{proj.opCode}</div>
          <div className={styles.projName}>{proj.name}</div>
          <div className={styles.projDesc}>{proj.desc}</div>
          <div className={styles.projTags}>
            {proj.tags.map(t => <span className={styles.pTag} key={t}>{t}</span>)}
          </div>
          <div
            className={styles.projStatus}
            style={proj.statusColor ? { color: proj.statusColor } : undefined}
          >
            {proj.status}
          </div>
        </div>
      ))}

      <CornerLabels left="SECTION: OPERATIONS" right="PAGE 4 OF 6" innerPage />
    </div>
  );
}

// ── Skills Page ──────────────────────────────
function SkillsContent({ skillsAnimated }: { skillsAnimated: boolean }) {
  const { skills } = data;
  return (
    <div className={styles.pageBody}>
      <PageHeader ref="SUBJECT\nCAPABILITIES" section="CAPABILITIES" classification="CLASSIFICATION: SECRET" />
      <div className={styles.sectionTitle}>Capability Assessment</div>

      <div className={styles.skillsGrid}>
        {skills.groups.map((group) => (
          <div key={group.label}>
            <div className={styles.sgTitle}>{group.label}</div>
            {group.items.map((skill) => (
              <div className={styles.skillItem} key={skill.name}>
                <div className={styles.skillName}>
                  <span>{skill.name}</span>
                  <span>{skill.level}%</span>
                </div>
                <div className={styles.skillBar}>
                  <div
                    className={styles.skillFill}
                    style={{ width: skillsAnimated ? `${skill.level}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className={`${styles.sgTitle}`} style={{ marginTop: 14 }}>ACHIEVEMENTS</div>
      {skills.achievements.map((a, i) => (
        <div className={styles.achieveItem} key={i}>{a}</div>
      ))}

      <CornerLabels left="SECTION: CAPABILITIES" right="PAGE 5 OF 6" innerPage />
    </div>
  );
}

// ── Contact Page ─────────────────────────────
function ContactContent() {
  const { contact } = data;
  return (
    <div className={styles.pageBody}>
      <PageHeader ref="CONTACT\nPROTOCOLS" section="SECURE LINE" classification="CLASSIFICATION: SECRET" />
      <Stamp
        text={'USE SECURE\nCHANNEL'}
        style={{ top: 34, right: 14, fontSize: 11, letterSpacing: 2, lineHeight: '1.4', whiteSpace: 'pre' }}
        inner
      />
      <div className={styles.sectionTitle}>Establish Contact</div>
      <p className={styles.contactIntro}>
        {contact.intro.split('\n').map((l, i) => <span key={i}>{l}<br /></span>)}
      </p>

      {contact.channels.map((ch) => (
        <div className={styles.contactItem} key={ch.label}>
          <div className={styles.ciIcon}>{ch.icon}</div>
          <div>
            <div className={styles.ciLbl}>{ch.label}</div>
            <div className={styles.ciVal}>
              {ch.href
                ? <a href={ch.href} target={ch.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">{ch.value}</a>
                : ch.value
              }
            </div>
          </div>
        </div>
      ))}

      <div className={styles.contactStamp}>
        {contact.signoff.split('\n').map((l, i) => <span key={i}>{l}<br /></span>)}
      </div>

      <CornerLabels left="END OF FILE" right="PAGE 6 OF 6" innerPage />
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
export default function ClassifiedPortfolio() {
  const [cur, setCur]                     = useState<PageIndex>(0);
  const [flipped, setFlipped]             = useState<boolean[]>(Array(6).fill(false));
  const [folderOpen, setFolderOpen]       = useState(false);
  const [wrapOpen, setWrapOpen]           = useState(false);
  const [skillsAnimated, setSkillsAnimated] = useState(false);
  const [showHint, setShowHint]           = useState(true);

  // Per-page z-index array
  const [zIndices, setZIndices] = useState<number[]>(() =>
    Array.from({ length: 6 }, (_, i) => 12 - i)
  );

  const busyRef = useRef(false);

  // Compute resting z for a page
  const restZ = (idx: number, isFlipped: boolean) =>
    isFlipped ? idx + 1 : 6 * 2 - idx;

  const goTo = useCallback((target: number) => {
    if (target < 0 || target >= 6 || target === cur || busyRef.current) return;

    const fromCur  = cur;
    const steps    = Math.abs(target - fromCur);
    const totalDur = (steps - 1) * STAGGER + FLIP_DUR;

    busyRef.current = true;
    setTimeout(() => { busyRef.current = false; }, totalDur + 150);

    const newFlipped = [...flipped];
    const newZ       = [...zIndices];

    if (target > fromCur) {
      // Forward: flip pages fromCur … target-1
      for (let i = fromCur; i < target; i++) {
        const idx  = i;
        const step = idx - fromCur;
        setTimeout(() => {
          setZIndices(z => { const nz = [...z]; nz[idx] = 990 - step; return nz; });
          setFlipped(f => { const nf = [...f]; nf[idx] = true; return nf; });
        }, step * STAGGER);
      }
      // Bulk z-reset
      setTimeout(() => {
        setZIndices(z => {
          const nz = [...z];
          for (let i = fromCur; i < target; i++) nz[i] = restZ(i, true);
          return nz;
        });
      }, totalDur + 20);

    } else {
      // Backward: unflip pages fromCur-1 … target
      for (let i = fromCur - 1; i >= target; i--) {
        const idx  = i;
        const step = (fromCur - 1) - idx;
        setTimeout(() => {
          setZIndices(z => { const nz = [...z]; nz[idx] = 990 - step; return nz; });
          setFlipped(f => { const nf = [...f]; nf[idx] = false; return nf; });
        }, step * STAGGER);
      }
      setTimeout(() => {
        setZIndices(z => {
          const nz = [...z];
          for (let i = fromCur - 1; i >= target; i--) nz[i] = restZ(i, false);
          return nz;
        });
      }, totalDur + 20);
    }

    const isOpen = target > 0;
    setWrapOpen(isOpen);
    const halfFlip = FLIP_DUR / 2;
    if (isOpen) {
      setTimeout(() => setFolderOpen(true), halfFlip);
    } else {
      setTimeout(() => setFolderOpen(false), halfFlip);
    }

    setCur(target as PageIndex);
    setShowHint(false);

    if (target === 4 && !skillsAnimated) {
      setTimeout(() => setSkillsAnimated(true), totalDur + 80);
    }
  }, [cur, flipped, zIndices, skillsAnimated]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goTo(cur + 1);
      if (e.key === 'ArrowLeft')  goTo(cur - 1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [cur, goTo]);

  const pageContents = [
    <CoverContent key="cover" onOpen={() => goTo(1)} />,
    <IndexContent key="index" goTo={goTo} />,
    <AboutContent key="about" />,
    <ProjectsContent key="projects" />,
    <SkillsContent key="skills" skillsAnimated={skillsAnimated} />,
    <ContactContent key="contact" />,
  ];

  return (
    <div className={styles.root}>
      <div className={styles.bgGlow} />

      <div className={`${styles.floatWrap} ${wrapOpen ? styles.isOpen : ''}`}>

        {/* TABS */}
        <div className={`${styles.tabsRow} ${wrapOpen ? styles.tabsOpen : ''}`}>
          {PAGE_LABELS.map((label, i) => (
            <div
              key={label}
              className={`${styles.tab} ${cur === i ? styles.tabActive : ''} ${cur === i && i === 0 ? styles.tabActiveCover : ''} ${cur === i && i > 0 ? styles.tabActivePage : ''}`}
              onClick={() => goTo(i)}
            >
              {label}
            </div>
          ))}
        </div>

        {/* SCENE */}
        <div className={styles.scene}>
          <div className={`${styles.folder} ${folderOpen ? styles.folderOpen : ''}`}>

            {/* SPINE */}
            <div className={styles.spine}>
              <div className={styles.spineHole} />
              <div className={styles.spineHole} />
              <div className={styles.spineHole} />
              <div className={styles.spineLabel}>{data.meta.spineLabel}</div>
            </div>

            {/* PAGE STACK */}
            <div className={`${styles.stackWrap} ${folderOpen ? styles.stackOpen : ''}`}>
              {pageContents.map((content, i) => (
                <div
                  key={i}
                  className={`${styles.page} ${flipped[i] ? styles.flipped : ''}`}
                  style={{ zIndex: zIndices[i] }}
                >
                  {/* Back face */}
                  <div className={styles.pb} onClick={() => goTo(cur - 1)} />
                  {/* Front face */}
                  <div className={`${styles.pf} ${i === 0 ? styles.pfCover : ''}`}>
                    {content}
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>

      {/* HINT */}
      {showHint && (
        <div className={styles.hint}>CLICK THE FILE TO OPEN</div>
      )}
    </div>
  );
}
