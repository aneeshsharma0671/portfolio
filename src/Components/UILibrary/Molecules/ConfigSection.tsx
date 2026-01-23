import React from 'react';
import styled from 'styled-components';

interface ConfigSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

const SectionContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.5rem;
  background-color: #f9f9f9;
  border-radius: 10px;
  border-left: 4px solid #007bff;

  @media (max-width: 640px) {
    padding: 1rem;
    gap: 1rem;
  }
`;

const SectionTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  color: #222;
  margin: 0;

  @media (max-width: 640px) {
    font-size: 1.1rem;
  }
`;

const SectionDescription = styled.p`
  font-size: 0.9rem;
  color: #666;
  margin:  0;

  @media (max-width: 640px) {
    font-size: 0.85rem;
  }
`;

const FieldsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }

  @media (max-width: 640px) {
    gap: 1rem;
  }
`;

const ConfigSection: React.FC<ConfigSectionProps> = ({
  title,
  description,
  children,
}) => {
  return (
    <SectionContainer>
      <div>
        <SectionTitle>{title}</SectionTitle>
        {description && <SectionDescription>{description}</SectionDescription>}
      </div>
      <FieldsContainer>{children}</FieldsContainer>
    </SectionContainer>
  );
};

export default ConfigSection;
