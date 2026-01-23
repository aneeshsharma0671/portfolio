import React from 'react';
import styled from 'styled-components';

interface CardProps {
  children: React.ReactNode;
  padding?: string;
  shadow?: boolean;
}

const CardContainer = styled.div<{ $padding: string; $shadow: boolean }>`
  padding: ${props => props.$padding};
  background-color: white;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
  ${props => props.$shadow && `
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
  `}
  transition: box-shadow 0.3s ease;

  &:hover {
    ${props => props.$shadow && `
      box-shadow: 0 8px 12px rgba(0, 0, 0, 0.1);
    `}
  }

  @media (max-width: 640px) {
    padding: ${props => {
      const [vertical, horizontal] = props.$padding.split(' ');
      return `${vertical} ${Math.max(parseInt(horizontal) - 0.5, 0.5)}rem`;
    }};
  }
`;

const Card: React.FC<CardProps> = ({
  children,
  padding = '1.5rem',
  shadow = true,
}) => {
  return (
    <CardContainer $padding={padding} $shadow={shadow}>
      {children}
    </CardContainer>
  );
};

export default Card;
