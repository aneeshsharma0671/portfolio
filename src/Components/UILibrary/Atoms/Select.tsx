import React from 'react';
import styled from 'styled-components';

interface Option {
  value: string | number;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: Option[];
  error?: string;
}

const SelectContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: #333;

  @media (max-width: 640px) {
    font-size: 0.8rem;
  }
`;

const StyledSelect = styled.select<{ $hasError?: boolean }>`
  padding: 0.75rem;
  border: 2px solid ${props => props.$hasError ? '#dc3545' : '#ddd'};
  border-radius: 6px;
  font-size: 1rem;
  font-family: inherit;
  background-color: white;
  cursor: pointer;
  transition: border-color 0.3s ease;

  &:focus {
    outline: none;
    border-color: ${props => props.$hasError ? '#dc3545' : '#007bff'};
    box-shadow: 0 0 0 3px ${props => props.$hasError ? 'rgba(220, 53, 69, 0.1)' : 'rgba(0, 123, 255, 0.1)'};
  }

  &:disabled {
    background-color: #f5f5f5;
    cursor: not-allowed;
  }

  @media (max-width: 640px) {
    font-size: 16px;
    padding: 0.6rem;
  }
`;

const ErrorText = styled.span`
  font-size: 0.75rem;
  color: #dc3545;
  font-weight: 500;
`;

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, ...props }, ref) => (
    <SelectContainer>
      {label && <Label>{label}</Label>}
      <StyledSelect ref={ref} $hasError={!!error} {...props}>
        <option value="">Select an option</option>
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </StyledSelect>
      {error && <ErrorText>{error}</ErrorText>}
    </SelectContainer>
  )
);

Select.displayName = 'Select';

export default Select;
