// Type definitions
export type CalendarType = 'life' | 'year' | 'goal';

export interface BaseCalendarConfig {
  birthDate: string;
  currentDate: string;
  livedColor: string;
  remainingColor: string;
  futureColor: string;
  boxSize: number;
  boxSpacing: number;
  backgroundColor?: string;
  titleColor?: string;
  textColor?: string;
}

export interface LifeCalendarConfig extends BaseCalendarConfig {
  type: 'life';
}

export interface YearCalendarConfig extends BaseCalendarConfig {
  type: 'year';
  targetDate: string; // End date for the year
}

export interface GoalCalendarConfig extends BaseCalendarConfig {
  type: 'goal';
  goalDate: string; // Goal completion date
}

export type CalendarConfig = LifeCalendarConfig | YearCalendarConfig | GoalCalendarConfig;

// Utility functions
function calculateDaysDifference(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return Math.floor((d2.getTime() - d1.getTime()) / (24 * 60 * 60 * 1000));
}

function calculateWeeksDifference(date1: string, date2: string): number {
  return Math.floor(calculateDaysDifference(date1, date2) / 7);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

// SVG Building blocks
function createSVGHeader(
  width: number,
  height: number,
  backgroundColor: string = 'white',
  titleColor: string = '#222',
  textColor: string = '#999'
): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .box { rx: 1; ry: 1; }
      .year-label { font-family: Arial, sans-serif; font-size: 12px; fill: ${textColor}; }
      .month-label { font-family: Arial, sans-serif; font-size: 11px; fill: ${textColor}; font-weight: bold; }
      .day-label { font-family: Arial, sans-serif; font-size: 10px; fill: ${textColor}; }
      .title { font-family: Arial, sans-serif; font-size: 20px; font-weight: bold; fill: ${titleColor}; }
      .subtitle { font-family: Arial, sans-serif; font-size: 12px; fill: ${textColor}; }
      .info-text { font-family: Arial, sans-serif; font-size: 11px; fill: ${textColor}; }
      .legend-label { font-family: Arial, sans-serif; font-size: 12px; fill: ${titleColor}; }
    </style>
  </defs>
  
  <!-- Background -->
  <rect width="${width}" height="${height}" fill="${backgroundColor}"/>`;
}

function createSVGFooter(): string {
  return `</svg>`;
}

function createTitle(x: number, y: number, text: string): string {
  return `<text class="title" x="${x}" y="${y}">${text}</text>`;
}

function createInfoText(x: number, y: number, text: string): string {
  return `<text class="info-text" x="${x}" y="${y}">${text}</text>`;
}

function createBox(
  x: number,
  y: number,
  size: number,
  color: string,
  spacing: number = 0
): string {
  return `<rect class="box" x="${x}" y="${y}" width="${size}" height="${size}" fill="${color}" stroke="#f0f0f0" stroke-width="0.5"/>`;
}

function createYearLabel(x: number, y: number, year: number): string {
  return `<text class="year-label" x="${x}" y="${y}">${year}</text>`;
}

function createMonthLabel(x: number, y: number, month: string): string {
  return `<text class="month-label" x="${x}" y="${y}">${month}</text>`;
}

function createLegend(
  x: number,
  y: number,
  boxSize: number,
  livedColor: string,
  remainingColor: string,
  futureColor: string,
  labels: [string, string, string] = ['Lived', 'Current', 'Future']
): string {
  return `
  <g transform="translate(${x}, ${y})">
    <rect x="0" y="0" width="${boxSize}" height="${boxSize}" fill="${livedColor}" stroke="#f0f0f0" stroke-width="0.5"/>
    <text class="legend-label" x="${boxSize + 12}" y="${boxSize / 2 + 4}">${labels[0]}</text>
    
    <rect x="180" y="0" width="${boxSize}" height="${boxSize}" fill="${remainingColor}" stroke="#f0f0f0" stroke-width="0.5"/>
    <text class="legend-label" x="${180 + boxSize + 12}" y="${boxSize / 2 + 4}">${labels[1]}</text>
    
    <rect x="360" y="0" width="${boxSize}" height="${boxSize}" fill="${futureColor}" stroke="#f0f0f0" stroke-width="0.5"/>
    <text class="legend-label" x="${360 + boxSize + 12}" y="${boxSize / 2 + 4}">${labels[2]}</text>
  </g>`;
}

// Life Calendar - 90 years × 52 weeks
export function generateLifeCalendarSVG(config: LifeCalendarConfig): string {
  const {
    birthDate,
    currentDate,
    livedColor,
    remainingColor,
    futureColor,
    boxSize,
    boxSpacing,
    backgroundColor = 'white',
    titleColor = '#222',
    textColor = '#999',
  } = config;

  const weeksLived = calculateWeeksDifference(birthDate, currentDate);
  const lifeExpectancyYears = 90;
  const totalWeeks = lifeExpectancyYears * 52;

  const margin = 40;
  const weeksPerRow = Math.floor((1200 + boxSpacing) / (boxSize + boxSpacing));
  const rows = Math.ceil(totalWeeks / weeksPerRow);
  const containerWidth = weeksPerRow * (boxSize + boxSpacing) + margin * 2;
  const containerHeight = rows * (boxSize + boxSpacing) + margin * 2 + 120;

  const ageYears = Math.floor(weeksLived / 52);
  const ageWeeks = weeksLived % 52;
  const remainingYears = lifeExpectancyYears - ageYears;

  let svg = createSVGHeader(containerWidth, containerHeight, backgroundColor, titleColor, textColor);

  // Title and info
  svg += createTitle(margin, 25, 'Your Life in Weeks');
  svg += createInfoText(
    margin,
    containerHeight - 10,
    `${ageYears} years, ${ageWeeks} weeks lived • ${remainingYears} years remaining`
  );

  // Grid
  svg += `<g transform="translate(${margin}, 50)">`;

  for (let i = 0; i < totalWeeks; i++) {
    const row = Math.floor(i / weeksPerRow);
    const col = i % weeksPerRow;
    const x = col * (boxSize + boxSpacing);
    const y = row * (boxSize + boxSpacing);

    let boxColor = futureColor;
    if (i < weeksLived) {
      boxColor = livedColor;
    } else if (i < weeksLived + 52) {
      boxColor = remainingColor;
    }

    svg += createBox(x, y, boxSize, boxColor);

    if (col === 0 && row % 5 === 0) {
      svg += createYearLabel(-35, y + boxSize / 2 + 4, Math.floor(row / 52));
    }
  }

  svg += `</g>`;
  svg += createLegend(margin, containerHeight - 40, boxSize, livedColor, remainingColor, futureColor);
  svg += createSVGFooter();

  return svg;
}

// Year Calendar - 12 months × days
export function generateYearCalendarSVG(config: YearCalendarConfig): string {
  const {
    currentDate,
    livedColor,
    remainingColor,
    futureColor,
    boxSize,
    boxSpacing,
    backgroundColor = 'white',
    titleColor = '#222',
    textColor = '#999',
  } = config;

  const current = new Date(currentDate);
  const year = current.getFullYear();
  const dayOfYear = Math.floor(
    (current.getTime() - new Date(year, 0, 0).getTime()) / (24 * 60 * 60 * 1000)
  );

  // Month data
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  // Leap year check
  if ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) {
    daysInMonth[1] = 29;
  }

  // Layout: 12 months in a grid
  const monthsPerRow = 4;
  const monthHeight = 200;
  const monthWidth = 280;
  const margin = 30;
  const titleHeight = 50;

  const monthRows = Math.ceil(12 / monthsPerRow);
  const containerWidth = monthsPerRow * monthWidth + margin * 2;
  const containerHeight = titleHeight + monthRows * monthHeight + margin * 2;

  let svg = createSVGHeader(containerWidth, containerHeight, backgroundColor, titleColor, textColor);

  // Title
  svg += createTitle(margin, 35, `Year ${year}`);

//   let dayCounter = 0;

//   for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
//     const monthRow = Math.floor(monthIndex / monthsPerRow);
//     const monthCol = monthIndex % monthsPerRow;

//     const monthX = margin + monthCol * monthWidth;
//     const monthY = titleHeight + margin + monthRow * monthHeight;

//     // Month container
//     svg += `<g transform="translate(${monthX}, ${monthY})">`;

//     // Month title
//     svg += `<text class="month-label" x="10" y="20">${monthNames[monthIndex]}</text>`;

//     // Days grid for this month
//     const daysInCurrentMonth = daysInMonth[monthIndex];
//     const weeksNeeded = Math.ceil(daysInCurrentMonth / 7);
//     const dayBoxSize = Math.floor((monthWidth - 20) / 7) - 2;
//     const dayBoxSpacing = 2;

//     for (let day = 1; day <= daysInCurrentMonth; day++) {
//       dayCounter++;
//       const week = Math.floor((day - 1) / 7);
//       const dayOfWeek = (day - 1) % 7;

//       const x = 10 + dayOfWeek * (dayBoxSize + dayBoxSpacing);
//       const y = 35 + week * (dayBoxSize + dayBoxSpacing);

//       let boxColor = futureColor;
//       if (dayCounter < dayOfYear) {
//         boxColor = livedColor;
//       } else if (dayCounter === dayOfYear) {
//         boxColor = remainingColor;
//       }

//       svg += createBox(x, y, dayBoxSize, boxColor);
//     }

//     svg += `</g>`;
//   }

//   // Info text
//   svg += createInfoText(
//     margin,
//     containerHeight - 10,
//     `Day ${dayOfYear} of ${daysInMonth.reduce((a, b) => a + b, 0)} • ${daysInMonth.reduce((a, b) => a + b, 0) - dayOfYear} days remaining`
//   );

//   // Legend
//   svg += createLegend(margin, containerHeight - 40, 12, livedColor, remainingColor, futureColor, [
//     'Days lived',
//     'Today',
//     'Days left',
//   ]);

//   svg += createSVGFooter();

  return svg;
}

// Goal Calendar - days to goal
export function generateGoalCalendarSVG(config: GoalCalendarConfig): string {
  const { currentDate, livedColor, remainingColor, futureColor, boxSize, boxSpacing, goalDate, backgroundColor = 'white', titleColor = '#222', textColor = '#999' } = config;

  const daysToGoal = calculateDaysDifference(currentDate, goalDate);
  const daysElapsed = 0; // For goal, we start from now
  const totalDays = Math.max(daysToGoal, 365); // Show at least 1 year

  const margin = 40;
  const weeksPerRow = 13;
  const daysPerRow = weeksPerRow * 7;
  const rows = Math.ceil(totalDays / daysPerRow);
  const containerWidth = daysPerRow * (boxSize + boxSpacing) + margin * 2;
  const containerHeight = rows * (boxSize + boxSpacing) + margin * 2 + 120;

  let svg = createSVGHeader(containerWidth, containerHeight, backgroundColor, titleColor, textColor);

  const daysRemaining = Math.max(0, daysToGoal);

  svg += createTitle(margin, 25, 'Your Goal Progress');
  svg += createInfoText(margin, containerHeight - 10, `${daysRemaining} days to goal`);

  // Grid
  svg += `<g transform="translate(${margin}, 50)">`;

  for (let i = 0; i < totalDays; i++) {
    const row = Math.floor(i / daysPerRow);
    const col = i % daysPerRow;
    const x = col * (boxSize + boxSpacing);
    const y = row * (boxSize + boxSpacing);

    let boxColor = futureColor;
    if (i < daysElapsed) {
      boxColor = livedColor;
    } else if (i < daysToGoal) {
      boxColor = remainingColor;
    }

    svg += createBox(x, y, boxSize, boxColor);
  }

  svg += `</g>`;
  svg += createLegend(margin, containerHeight - 40, boxSize, livedColor, remainingColor, futureColor, [
    'Completed',
    'In progress',
    'Future days',
  ]);
  svg += createSVGFooter();

  return svg;
}

// Main export function
export function generateCalendarSVG(config: CalendarConfig): string {
  switch (config.type) {
    case 'life':
      return generateLifeCalendarSVG(config);
    case 'year':
      return generateYearCalendarSVG(config);
    case 'goal':
      return generateGoalCalendarSVG(config);
    default:
      return generateLifeCalendarSVG(config as LifeCalendarConfig);
  }
}
