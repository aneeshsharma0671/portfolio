import React from 'react';
import styled from 'styled-components';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const StyledButton = styled.button<{ $variant: string; $size: string }>`
  font-family: inherit;
  font-size: ${props => {
    switch (props.$size) {
      case 'sm': return '0.875rem';
      case 'lg': return '1.125rem';
      default: return '1rem';
    }
  }};
  padding: ${props => {
    switch (props.$size) {
      case 'sm': return '0.5rem 1rem';
      case 'lg': return '1rem 1.5rem';
      default: return '0.75rem 1.25rem';
    }
  }};
  border-radius: 8px;
  border: 2px solid;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;

  ${props => {
    switch (props.$variant) {
      case 'primary':
        return `
          background-color: #007bff;
          color: white;
          border-color: #007bff;
          &:hover {
            background-color: #0056b3;
            border-color: #0056b3;
          }
        `;
      case 'secondary':
        return `
          background-color: #6c757d;
          color: white;
          border-color: #6c757d;
          &:hover {
            background-color: #545b62;
            border-color: #545b62;
          }
        `;
      case 'outline':
        return `
          background-color: transparent;
          color: #007bff;
          border-color: #007bff;
          &:hover {
            background-color: #007bff;
            color: white;
          }
        `;
      default:
        return '';
    }
  }}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (max-width: 640px) {
    font-size: 0.875rem;
    padding: ${props => {
      switch (props.$size) {
        case 'sm': return '0.4rem 0.8rem';
        case 'lg': return '0.8rem 1.2rem';
        default: return '0.6rem 1rem';
      }
    }};
  }
`;

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', children, ...props }, ref) => (
    <StyledButton ref={ref} $variant={variant} $size={size} {...props}>
      {children}
    </StyledButton>
  )
);

Button.displayName = 'Button';

export default Button;
