'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import Button from '../UILibrary/Atoms/Button';
import Input from '../UILibrary/Atoms/Input';
import ColorInput from '../UILibrary/Atoms/ColorInput';
import FormGroup from '../UILibrary/Molecules/FormGroup';
import ConfigSection from '../UILibrary/Molecules/ConfigSection';
import Card from '../UILibrary/Molecules/Card';
import LifeCalendarPreview from './LifeCalendarPreview';
import {
  CalendarConfig,
  CalendarType,
  LifeCalendarConfig,
  YearCalendarConfig,
  GoalCalendarConfig,
} from './utils/svgGenerator';

const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem 1rem;

  @media (max-width: 640px) {
    padding: 1rem;
  }
`;

const ContentWrapper = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }

  @media (max-width: 640px) {
    gap: 1rem;
  }
`;

const FormCard = styled(Card)`
  background-color: white;
`;

const FormContainer = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  @media (max-width: 640px) {
    gap: 1rem;
  }
`;

const VariantTabs = styled.div`
  display: flex;
  gap: 0.5rem;
  border-bottom: 2px solid #e0e0e0;
  margin-bottom: 1rem;

  @media (max-width: 640px) {
    flex-direction: column;
  }
`;

const TabButton = styled.button<{ $active: boolean }>`
  padding: 0.75rem 1.5rem;
  border: none;
  background-color: transparent;
  border-bottom: 3px solid ${props => (props.$active ? '#007bff' : 'transparent')};
  color: ${props => (props.$active ? '#007bff' : '#666')};
  font-weight: ${props => (props.$active ? '600' : '500')};
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    color: #007bff;
  }

  @media (max-width: 640px) {
    width: 100%;
    border-bottom: none;
    border-left: 3px solid ${props => (props.$active ? '#007bff' : 'transparent')};
    text-align: left;
  }
`;

const PreviewCard = styled(Card)`
  position: sticky;
  top: 2rem;
  max-height: calc(100vh - 4rem);
  overflow-y: auto;

  @media (max-width: 1024px) {
    position: static;
    max-height: none;
  }
`;

const PreviewSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
`;

const PreviewTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  color: #222;
  margin: 0;
  text-align: center;

  @media (max-width: 640px) {
    font-size: 1.1rem;
  }
`;

const ShareSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1rem;
`;

const ShareInput = styled.input`
  padding: 0.75rem;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 0.85rem;
  font-family: 'Courier New', monospace;
  word-break: break-all;
  background-color: #f9f9f9;

  @media (max-width: 640px) {
    font-size: 0.75rem;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;

  @media (max-width: 640px) {
    flex-direction: column;
  }
`;

const LifeCalendarConfigurator: React.FC = () => {
  const [calendarType, setCalendarType] = useState<CalendarType>('life');

  const [lifeConfig, setLifeConfig] = useState<LifeCalendarConfig>({
    type: 'life',
    birthDate: '1995-01-01',
    currentDate: new Date().toISOString().split('T')[0],
    boxSize: 10,
    boxSpacing: 4,
    livedColor: '#6366f1',
    remainingColor: '#fbbf24',
    futureColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    titleColor: '#222222',
    textColor: '#999999',
  });

  const [yearConfig, setYearConfig] = useState<YearCalendarConfig>({
    type: 'year',
    birthDate: '1995-01-01',
    currentDate: new Date().toISOString().split('T')[0],
    targetDate: new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0],
    boxSize: 8,
    boxSpacing: 3,
    livedColor: '#6366f1',
    remainingColor: '#fbbf24',
    futureColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    titleColor: '#222222',
    textColor: '#999999',
  });

  const [goalConfig, setGoalConfig] = useState<GoalCalendarConfig>({
    type: 'goal',
    birthDate: '1995-01-01',
    currentDate: new Date().toISOString().split('T')[0],
    goalDate: new Date(new Date().getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    boxSize: 6,
    boxSpacing: 2,
    livedColor: '#6366f1',
    remainingColor: '#fbbf24',
    futureColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    titleColor: '#222222',
    textColor: '#999999',
  });

  const presetPairs = [
    {
      name: 'Default',
      colors: {
        lived: '#6366f1',
        remaining: '#fbbf24',
        future: '#e5e7eb',
        background: '#ffffff',
        title: '#222222',
        text: '#999999',
      },
    },
    {
      name: 'Dark',
      colors: {
        lived: '#a78bfa',
        remaining: '#fcd34d',
        future: '#d1d5db',
        background: '#1f2937',
        title: '#f3f4f6',
        text: '#d1d5db',
      },
    },
    {
      name: 'Ocean',
      colors: {
        lived: '#0369a1',
        remaining: '#06b6d4',
        future: '#e0f2fe',
        background: '#ffffff',
        title: '#0c4a6e',
        text: '#0369a1',
      },
    },
    {
      name: 'Forest',
      colors: {
        lived: '#15803d',
        remaining: '#84cc16',
        future: '#dcfce7',
        background: '#ffffff',
        title: '#166534',
        text: '#15803d',
      },
    },
    {
      name: 'Sunset',
      colors: {
        lived: '#ea580c',
        remaining: '#fb923c',
        future: '#fed7aa',
        background: '#ffffff',
        title: '#9a3412',
        text: '#ea580c',
      },
    },
    {
      name: 'Minimal',
      colors: {
        lived: '#1f2937',
        remaining: '#9ca3af',
        future: '#f3f4f6',
        background: '#ffffff',
        title: '#111827',
        text: '#6b7280',
      },
    },
  ];

  const presetSizes = [
    { name: 'Compact', boxSize: 6, boxSpacing: 2 },
    { name: 'Standard', boxSize: 10, boxSpacing: 4 },
    { name: 'Large', boxSize: 14, boxSpacing: 6 },
  ];

  const currentConfig: CalendarConfig = (() => {
    switch (calendarType) {
      case 'year':
        return yearConfig;
      case 'goal':
        return goalConfig;
      default:
        return lifeConfig;
    }
  })();

  const handleConfigChange = (key: string, value: any) => {
    switch (calendarType) {
      case 'year':
        setYearConfig(prev => ({ ...prev, [key]: value }));
        break;
      case 'goal':
        setGoalConfig(prev => ({ ...prev, [key]: value }));
        break;
      default:
        setLifeConfig(prev => ({ ...prev, [key]: value }));
    }
  };

  const handleColorPreset = (colors: typeof presetPairs[0]['colors']) => {
    handleConfigChange('livedColor', colors.lived);
    handleConfigChange('remainingColor', colors.remaining);
    handleConfigChange('futureColor', colors.future);
    handleConfigChange('backgroundColor', colors.background);
    handleConfigChange('titleColor', colors.title);
    handleConfigChange('textColor', colors.text);
  };

  const handleSizePreset = (size: typeof presetSizes[0]) => {
    handleConfigChange('boxSize', size.boxSize);
    handleConfigChange('boxSpacing', size.boxSpacing);
  };

  const generateShareableUrl = (): string => {
    const params = new URLSearchParams({
      type: currentConfig.type,
      birthDate: currentConfig.birthDate,
      currentDate: currentConfig.currentDate,
      boxSize: currentConfig.boxSize.toString(),
      boxSpacing: currentConfig.boxSpacing.toString(),
      livedColor: currentConfig.livedColor,
      remainingColor: currentConfig.remainingColor,
      futureColor: currentConfig.futureColor,
      backgroundColor: currentConfig.backgroundColor || '#ffffff',
      titleColor: currentConfig.titleColor || '#222222',
      textColor: currentConfig.textColor || '#999999',
      ...(currentConfig.type === 'year' && { targetDate: (currentConfig as YearCalendarConfig).targetDate }),
      ...(currentConfig.type === 'goal' && { goalDate: (currentConfig as GoalCalendarConfig).goalDate }),
    });

    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/api/calendar?${params.toString()}`;
  };

  const handleDownload = async () => {
    const link = document.createElement('a');
    link.href = generateShareableUrl();
    link.download = `life-calendar-${currentConfig.type}-${currentConfig.currentDate}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generateShareableUrl());
    alert('Link copied to clipboard!');
  };

  return (
    <PageContainer>
      <ContentWrapper>
        {/* Configuration Form */}
        <FormCard>
          <FormContainer>
            <div>
              <h1 style={{ margin: '0 0 1rem', fontSize: '1.75rem', color: '#222' }}>
                Life Calendar
              </h1>
              <p style={{ margin: 0, color: '#666', fontSize: '0.95rem' }}>
                Choose your calendar type and customize it
              </p>
            </div>

            {/* Variant Selector */}
            <VariantTabs>
              <TabButton $active={calendarType === 'life'} onClick={() => setCalendarType('life')} type="button">
                📅 Life (90 years)
              </TabButton>
              <TabButton $active={calendarType === 'year'} onClick={() => setCalendarType('year')} type="button">
                📆 Year (365 days)
              </TabButton>
              <TabButton $active={calendarType === 'goal'} onClick={() => setCalendarType('goal')} type="button">
                🎯 Goal
              </TabButton>
            </VariantTabs>

            {/* Life Calendar Config */}
            {calendarType === 'life' && (
              <>
                <ConfigSection title="Personal Information" description="Enter your birth date">
                  <FormGroup label="Birth Date" fullWidth>
                    <Input
                      type="date"
                      value={lifeConfig.birthDate}
                      onChange={e => handleConfigChange('birthDate', e.target.value)}
                    />
                  </FormGroup>
                  <FormGroup label="Current Date" fullWidth>
                    <Input
                      type="date"
                      value={lifeConfig.currentDate}
                      onChange={e => handleConfigChange('currentDate', e.target.value)}
                    />
                  </FormGroup>
                </ConfigSection>
              </>
            )}

            {/* Year Calendar Config */}
            {calendarType === 'year' && (
              <>
                <ConfigSection title="Year Settings" description="Set your year range">
                  <FormGroup label="Start Date" fullWidth>
                    <Input
                      type="date"
                      value={yearConfig.currentDate}
                      onChange={e => handleConfigChange('currentDate', e.target.value)}
                    />
                  </FormGroup>
                  <FormGroup label="End Date" fullWidth>
                    <Input
                      type="date"
                      value={yearConfig.targetDate}
                      onChange={e => handleConfigChange('targetDate', e.target.value)}
                    />
                  </FormGroup>
                </ConfigSection>
              </>
            )}

            {/* Goal Calendar Config */}
            {calendarType === 'goal' && (
              <>
                <ConfigSection title="Goal Settings" description="Track your goal progress">
                  <FormGroup label="Start Date" fullWidth>
                    <Input
                      type="date"
                      value={goalConfig.currentDate}
                      onChange={e => handleConfigChange('currentDate', e.target.value)}
                    />
                  </FormGroup>
                  <FormGroup label="Goal Date" fullWidth>
                    <Input
                      type="date"
                      value={goalConfig.goalDate}
                      onChange={e => handleConfigChange('goalDate', e.target.value)}
                    />
                  </FormGroup>
                </ConfigSection>
              </>
            )}

            {/* Grid Settings */}
            <ConfigSection title="Grid Settings" description="Control box size and spacing">
              <FormGroup label="Box Size (px)" fullWidth>
                <Input
                  type="number"
                  value={currentConfig.boxSize}
                  onChange={e => handleConfigChange('boxSize', parseInt(e.target.value) || 10)}
                  min="4"
                  max="20"
                />
              </FormGroup>
              <FormGroup label="Box Spacing (px)" fullWidth>
                <Input
                  type="number"
                  value={currentConfig.boxSpacing}
                  onChange={e => handleConfigChange('boxSpacing', parseInt(e.target.value) || 4)}
                  min="1"
                  max="10"
                />
              </FormGroup>
            </ConfigSection>

            {/* Size Presets */}
            <div>
              <p style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', color: '#666' }}>
                Size Presets:
              </p>
              <ButtonGroup>
                {presetSizes.map(preset => (
                  <Button
                    key={preset.name}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleSizePreset(preset)}
                  >
                    {preset.name}
                  </Button>
                ))}
              </ButtonGroup>
            </div>

            {/* Colors */}
            <ConfigSection title="Colors" description="Customize the calendar appearance">
              <FormGroup label="Lived Color" fullWidth>
                <ColorInput
                  value={currentConfig.livedColor}
                  onChange={e => handleConfigChange('livedColor', e.target.value)}
                />
              </FormGroup>
              <FormGroup label="Current/Remaining Color" fullWidth>
                <ColorInput
                  value={currentConfig.remainingColor}
                  onChange={e => handleConfigChange('remainingColor', e.target.value)}
                />
              </FormGroup>
              <FormGroup label="Future Color" fullWidth>
                <ColorInput
                  value={currentConfig.futureColor}
                  onChange={e => handleConfigChange('futureColor', e.target.value)}
                />
              </FormGroup>
              <FormGroup label="Background Color" fullWidth>
                <ColorInput
                  value={currentConfig.backgroundColor || '#ffffff'}
                  onChange={e => handleConfigChange('backgroundColor', e.target.value)}
                />
              </FormGroup>
              <FormGroup label="Title Text Color" fullWidth>
                <ColorInput
                  value={currentConfig.titleColor || '#222222'}
                  onChange={e => handleConfigChange('titleColor', e.target.value)}
                />
              </FormGroup>
              <FormGroup label="Body Text Color" fullWidth>
                <ColorInput
                  value={currentConfig.textColor || '#999999'}
                  onChange={e => handleConfigChange('textColor', e.target.value)}
                />
              </FormGroup>
            </ConfigSection>

            {/* Color Presets */}
            <div>
              <p style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', color: '#666' }}>
                Color Presets:
              </p>
              <ButtonGroup>
                {presetPairs.map(preset => (
                  <Button
                    key={preset.name}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleColorPreset(preset.colors)}
                  >
                    {preset.name}
                  </Button>
                ))}
              </ButtonGroup>
            </div>
          </FormContainer>
        </FormCard>

        {/* Preview Section */}
        <PreviewCard>
          <PreviewSection>
            <PreviewTitle>Live Preview ✨</PreviewTitle>
            <LifeCalendarPreview config={currentConfig} />

            <ShareSection>
              <ShareInput
                type="text"
                value={generateShareableUrl()}
                readOnly
                onClick={e => (e.target as HTMLInputElement).select()}
              />
              <ButtonGroup>
                <Button type="button" variant="primary" size="sm" onClick={handleCopyLink} style={{ flex: 1 }}>
                  Copy Link
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={handleDownload} style={{ flex: 1 }}>
                  Download
                </Button>
              </ButtonGroup>
            </ShareSection>
          </PreviewSection>
        </PreviewCard>
      </ContentWrapper>
    </PageContainer>
  );
};

export default LifeCalendarConfigurator;
