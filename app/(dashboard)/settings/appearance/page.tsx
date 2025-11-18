'use client';

import React, { useState } from 'react';
import { useTheme } from '@hooks/useTheme';
import { SunIcon, MoonIcon, PaintBrushIcon, SparklesIcon } from '@components/icons';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Tooltip } from '@components/ui/Tooltip';
import { CollapsibleSection } from '@components/ui/CollapsibleSection';

const AppearanceSettings: React.FC = () => {
    const { theme, toggleTheme } = useTheme();
    const [isToggling, setIsToggling] = useState(false);

    const handleThemeToggle = () => {
      setIsToggling(true);
      toggleTheme();
      setTimeout(() => setIsToggling(false), 600);
    };
  
    return (
      <div className="settings-appearance-page">
        
        {/* Theme Card - Desktop */}
        <Card variant="glass-frosted" className="settings-appearance-theme-card settings-appearance-theme-card--desktop">
            <CardHeader>
                <div className="settings-appearance-theme-header">
                  <div className="settings-appearance-theme-icon-wrapper">
                    <PaintBrushIcon className="settings-appearance-theme-icon" />
                  </div>
                  <div>
                    <CardTitle className="settings-appearance-theme-title">
                      Theme
                      <Tooltip content="Switch between light and dark mode" side="top">
                        <span className="settings-appearance-theme-info">ℹ️</span>
                      </Tooltip>
                    </CardTitle>
                    <CardDescription>Choose between a light or dark theme for the application</CardDescription>
                  </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="settings-appearance-theme-content">
                    <div className="settings-appearance-theme-info">
                        <p className={`settings-appearance-theme-status settings-appearance-theme-status--${theme}`}>
                          {theme === 'light' ? (
                            <>
                              <SunIcon className="settings-appearance-theme-status-icon" />
                              Light Mode Active
                            </>
                          ) : (
                            <>
                              <MoonIcon className="settings-appearance-theme-status-icon" />
                              Dark Mode Active
                            </>
                          )}
                        </p>
                        <p className="settings-appearance-theme-description">
                            {theme === 'light' 
                              ? 'Bright and clear interface for daytime use' 
                              : 'Easy on the eyes for low-light environments'}
                        </p>
                    </div>
                    
                    {/* Animated Theme Toggle */}
                    <div className="settings-appearance-theme-toggle-wrapper">
                      <div className={`settings-appearance-theme-toggle-glow settings-appearance-theme-toggle-glow--${theme} ${isToggling ? 'settings-appearance-theme-toggle-glow--toggling' : ''}`} />
                      <div className="settings-appearance-theme-toggle">
                          <Tooltip content="Switch to Light Mode" side="top">
                            <Button
                                variant={theme === 'light' ? 'primary' : 'ghost'}
                                size="sm"
                                iconOnly
                                onClick={theme !== 'light' ? handleThemeToggle : undefined}
                                className={`settings-appearance-theme-toggle-btn ${theme === 'light' ? 'settings-appearance-theme-toggle-btn--active' : ''}`}
                            >
                                <SunIcon className={`settings-appearance-theme-toggle-icon ${theme === 'light' ? 'settings-appearance-theme-toggle-icon--active' : 'settings-appearance-theme-toggle-icon--inactive'}`} />
                            </Button>
                          </Tooltip>
                          
                          <div className={`settings-appearance-theme-toggle-divider settings-appearance-theme-toggle-divider--${theme}`} />
                          
                          <Tooltip content="Switch to Dark Mode" side="top">
                            <Button
                                variant={theme === 'dark' ? 'primary' : 'ghost'}
                                size="sm"
                                iconOnly
                                onClick={theme !== 'dark' ? handleThemeToggle : undefined}
                                className={`settings-appearance-theme-toggle-btn ${theme === 'dark' ? 'settings-appearance-theme-toggle-btn--active' : ''}`}
                            >
                                <MoonIcon className={`settings-appearance-theme-toggle-icon ${theme === 'dark' ? 'settings-appearance-theme-toggle-icon--active' : 'settings-appearance-theme-toggle-icon--inactive'}`} />
                            </Button>
                          </Tooltip>
                      </div>
                    </div>
                </div>

                {/* Theme Preview Cards */}
                <div className="settings-appearance-theme-preview-grid">
                  <Tooltip content="Preview of Light Mode" side="top">
                    <div 
                      onClick={theme !== 'light' ? handleThemeToggle : undefined}
                      className={`settings-appearance-theme-preview-card settings-appearance-theme-preview-card--light ${theme === 'light' ? 'settings-appearance-theme-preview-card--active' : ''}`}
                    >
                      <div className="settings-appearance-theme-preview-card-badge">
                        {theme === 'light' && (
                          <SparklesIcon className="settings-appearance-theme-preview-card-badge-icon" />
                        )}
                      </div>
                      <SunIcon className="settings-appearance-theme-preview-card-icon settings-appearance-theme-preview-card-icon--light" />
                      <p className="settings-appearance-theme-preview-card-title settings-appearance-theme-preview-card-title--light">Light</p>
                      <p className="settings-appearance-theme-preview-card-description settings-appearance-theme-preview-card-description--light">Bright & Clear</p>
                    </div>
                  </Tooltip>

                  <Tooltip content="Preview of Dark Mode" side="top">
                    <div 
                      onClick={theme !== 'dark' ? handleThemeToggle : undefined}
                      className={`settings-appearance-theme-preview-card settings-appearance-theme-preview-card--dark ${theme === 'dark' ? 'settings-appearance-theme-preview-card--active' : ''}`}
                    >
                      <div className="settings-appearance-theme-preview-card-badge">
                        {theme === 'dark' && (
                          <SparklesIcon className="settings-appearance-theme-preview-card-badge-icon" />
                        )}
                      </div>
                      <MoonIcon className="settings-appearance-theme-preview-card-icon settings-appearance-theme-preview-card-icon--dark" />
                      <p className="settings-appearance-theme-preview-card-title settings-appearance-theme-preview-card-title--dark">Dark</p>
                      <p className="settings-appearance-theme-preview-card-description settings-appearance-theme-preview-card-description--dark">Easy on Eyes</p>
                    </div>
                  </Tooltip>
                </div>
            </CardContent>
        </Card>

        {/* Theme Card - Mobile (Collapsible) */}
        <div className="settings-appearance-theme-mobile">
          <CollapsibleSection 
            title="Theme" 
            defaultOpen={true}
            icon={<PaintBrushIcon className="settings-appearance-theme-icon" />}
          >
            <div className="settings-appearance-theme-mobile-content">
              <div className="settings-appearance-theme-mobile-box">
                  <div className="settings-appearance-theme-mobile-info">
                      <p className={`settings-appearance-theme-status settings-appearance-theme-status--${theme} settings-appearance-theme-status--mobile`}>
                        {theme === 'light' ? (
                          <>
                            <SunIcon className="settings-appearance-theme-status-icon" />
                            Light Mode Active
                          </>
                        ) : (
                          <>
                            <MoonIcon className="settings-appearance-theme-status-icon" />
                            Dark Mode Active
                          </>
                        )}
                      </p>
                      <p className="settings-appearance-theme-description settings-appearance-theme-description--mobile">
                          {theme === 'light' 
                            ? 'Bright interface for daytime' 
                            : 'Easy on eyes in low-light'}
                      </p>
                  </div>
                  
                  {/* Animated Theme Toggle - Mobile */}
                  <div className="settings-appearance-theme-toggle-wrapper">
                    <div className={`settings-appearance-theme-toggle-glow settings-appearance-theme-toggle-glow--${theme} ${isToggling ? 'settings-appearance-theme-toggle-glow--toggling' : ''}`} />
                    <div className="settings-appearance-theme-toggle">
                        <Button
                            variant={theme === 'light' ? 'primary' : 'ghost'}
                            size="sm"
                            iconOnly
                            onClick={theme !== 'light' ? handleThemeToggle : undefined}
                            className={`settings-appearance-theme-toggle-btn settings-appearance-theme-toggle-btn--mobile ${theme === 'light' ? 'settings-appearance-theme-toggle-btn--active' : ''}`}
                        >
                            <SunIcon className={`settings-appearance-theme-toggle-icon ${theme === 'light' ? 'settings-appearance-theme-toggle-icon--active' : 'settings-appearance-theme-toggle-icon--inactive'}`} />
                        </Button>
                        
                        <div className={`settings-appearance-theme-toggle-divider settings-appearance-theme-toggle-divider--${theme}`} />
                        
                        <Button
                            variant={theme === 'dark' ? 'primary' : 'ghost'}
                            size="sm"
                            iconOnly
                            onClick={theme !== 'dark' ? handleThemeToggle : undefined}
                            className={`settings-appearance-theme-toggle-btn settings-appearance-theme-toggle-btn--mobile ${theme === 'dark' ? 'settings-appearance-theme-toggle-btn--active' : ''}`}
                        >
                            <MoonIcon className={`settings-appearance-theme-toggle-icon ${theme === 'dark' ? 'settings-appearance-theme-toggle-icon--active' : 'settings-appearance-theme-toggle-icon--inactive'}`} />
                        </Button>
                    </div>
                  </div>
              </div>

              {/* Theme Preview Cards - Mobile */}
              <div className="settings-appearance-theme-preview-grid settings-appearance-theme-preview-grid--mobile">
                <div 
                  onClick={theme !== 'light' ? handleThemeToggle : undefined}
                  className={`settings-appearance-theme-preview-card settings-appearance-theme-preview-card--light settings-appearance-theme-preview-card--mobile ${theme === 'light' ? 'settings-appearance-theme-preview-card--active' : ''}`}
                >
                  {theme === 'light' && (
                    <div className="settings-appearance-theme-preview-card-badge">
                      <SparklesIcon className="settings-appearance-theme-preview-card-badge-icon" />
                    </div>
                  )}
                  <SunIcon className="settings-appearance-theme-preview-card-icon settings-appearance-theme-preview-card-icon--light settings-appearance-theme-preview-card-icon--mobile" />
                  <p className="settings-appearance-theme-preview-card-title settings-appearance-theme-preview-card-title--light settings-appearance-theme-preview-card-title--mobile">Light</p>
                  <p className="settings-appearance-theme-preview-card-description settings-appearance-theme-preview-card-description--light settings-appearance-theme-preview-card-description--mobile">Bright</p>
                </div>

                <div 
                  onClick={theme !== 'dark' ? handleThemeToggle : undefined}
                  className={`settings-appearance-theme-preview-card settings-appearance-theme-preview-card--dark settings-appearance-theme-preview-card--mobile ${theme === 'dark' ? 'settings-appearance-theme-preview-card--active' : ''}`}
                >
                  {theme === 'dark' && (
                    <div className="settings-appearance-theme-preview-card-badge">
                      <SparklesIcon className="settings-appearance-theme-preview-card-badge-icon" />
                    </div>
                  )}
                  <MoonIcon className="settings-appearance-theme-preview-card-icon settings-appearance-theme-preview-card-icon--dark settings-appearance-theme-preview-card-icon--mobile" />
                  <p className="settings-appearance-theme-preview-card-title settings-appearance-theme-preview-card-title--dark settings-appearance-theme-preview-card-title--mobile">Dark</p>
                  <p className="settings-appearance-theme-preview-card-description settings-appearance-theme-preview-card-description--dark settings-appearance-theme-preview-card-description--mobile">Easy</p>
                </div>
              </div>
            </div>
          </CollapsibleSection>
        </div>
      </div>
    );
};

export default AppearanceSettings;

