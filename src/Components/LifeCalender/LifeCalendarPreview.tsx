'use client';

import React, { useMemo } from 'react';
import styled from 'styled-components';
import { generateCalendarSVG, CalendarConfig } from './utils/svgGenerator';

interface LifeCalendarPreviewProps {
  config: CalendarConfig;
}

const PreviewContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: flex-start;
  overflow: auto;
  max-height: 600px;
  padding: 1rem;
  background-color: #f9f9f9;
  border-radius: 8px;
  border: 1px solid #e0e0e0;

  @media (max-width: 640px) {
    max-height: 400px;
    padding: 0.75rem;
  }
`;

const SVGWrapper = styled.div`
  display: inline-block;
  
  svg {
    width: auto;
    height: auto;
    max-width: 100%;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  }
`;

const LifeCalendarPreview: React.FC<LifeCalendarPreviewProps> = ({ config }) => {
  const svgString = useMemo(() => {
    return generateCalendarSVG(config);
  }, [config]);

  return (
    <PreviewContainer>
      <SVGWrapper
        dangerouslySetInnerHTML={{ __html: svgString }}
      />
    </PreviewContainer>
  );
};

export default LifeCalendarPreview;
