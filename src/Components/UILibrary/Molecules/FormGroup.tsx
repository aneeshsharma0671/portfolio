import React from 'react';
import styled from 'styled-components';
import Input from '../Atoms/Input';

interface FormGroupProps {
  label: string;
  description?: string;
  children: React.ReactNode;
  fullWidth?: boolean;
}

const FormGroupContainer = styled.div<{ $fullWidth?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: ${props => props.$fullWidth ? '100%' : 'auto'};
`;

const FormLabel = styled.label`
  font-size: 0.95rem;
  font-weight: 600;
  color: #222;

  @media (max-width: 640px) {
    font-size: 0.875rem;
  }
`;

const FormDescription = styled.p`
  font-size: 0.8rem;
  color: #666;
  margin: 0;
  margin-bottom: 0.25rem;

  @media (max-width: 640px) {
    font-size: 0.75rem;
  }
`;

const FormGroup: React.FC<FormGroupProps> = ({
  label,
  description,
  children,
  fullWidth = true,
}) => {
  return (
    <FormGroupContainer $fullWidth={fullWidth}>
      <FormLabel>{label}</FormLabel>
      {description && <FormDescription>{description}</FormDescription>}
      {children}
    </FormGroupContainer>
  );
};

export default FormGroup;
