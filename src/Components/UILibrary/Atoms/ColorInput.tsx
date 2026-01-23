import React from 'react';
import styled from 'styled-components';

interface ColorInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
}

const ColorContainer = styled.div`
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

const ColorInputWrapper = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
`;

const StyledColorInput = styled.input`
  width: 60px;
  height: 45px;
  border: 2px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  transition: border-color 0.3s ease;

  &:focus {
    outline: none;
    border-color: #007bff;
  }

  @media (max-width: 640px) {
    width: 50px;
    height: 40px;
  }
`;

const HexInput = styled.input`
  flex: 1;
  padding: 0.75rem;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  font-family: 'Courier New', monospace;
  font-weight: 500;
  transition: border-color 0.3s ease;

  &:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
  }

  @media (max-width: 640px) {
    font-size: 0.875rem;
    padding: 0.6rem;
  }
`;

const ErrorText = styled.span`
  font-size: 0.75rem;
  color: #dc3545;
  font-weight: 500;
`;

const ColorInput = React.forwardRef<HTMLInputElement, ColorInputProps>(
  ({ label, error, value, onChange, ...props }, ref) => {
    const hexValue = (value as string) || '#000000';

    const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e);
    };

    const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const hex = e.target.value;
      if (hex.match(/^#[0-9A-F]{6}$/i)) {
        onChange?.({
          target: { value: hex },
        } as any);
      }
    };

    return (
      <ColorContainer>
        {label && <Label>{label}</Label>}
        <ColorInputWrapper>
          <StyledColorInput
            type="color"
            value={hexValue}
            onChange={handleColorChange}
            {...props}
          />
          <HexInput
            type="text"
            value={hexValue}
            onChange={handleHexChange}
            placeholder="#000000"
            maxLength={7}
          />
        </ColorInputWrapper>
        {error && <ErrorText>{error}</ErrorText>}
      </ColorContainer>
    );
  }
);

ColorInput.displayName = 'ColorInput';

export default ColorInput;
