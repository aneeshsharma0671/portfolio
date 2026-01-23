import React from 'react';
import styled from 'styled-components';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const InputContainer = styled.div`
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

const StyledInput = styled.input<{ $hasError?: boolean }>`
  padding: 0.75rem;
  border: 2px solid ${props => props.$hasError ? '#dc3545' : '#ddd'};
  border-radius: 6px;
  font-size: 1rem;
  font-family: inherit;
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

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, ...props }, ref) => (
    <InputContainer>
      {label && <Label>{label}</Label>}
      <StyledInput ref={ref} $hasError={!!error} {...props} />
      {error && <ErrorText>{error}</ErrorText>}
    </InputContainer>
  )
);

Input.displayName = 'Input';

export default Input;
