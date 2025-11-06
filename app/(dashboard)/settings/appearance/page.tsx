'use client';

import React from 'react';
import { useTheme } from '../../../../hooks/useTheme';
import { SunIcon, MoonIcon } from '../../../../components/icons/IconComponents';

const AppearanceSettings: React.FC = () => {
    const { theme, toggleTheme } = useTheme();
  
    return (
      <div>
        <h2 className="text-2xl font-bold mb-6 text-card-foreground">Appearance</h2>
        <p className="text-muted-foreground mb-6">
          Customize the look and feel of your workspace.
        </p>
        
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-card-foreground">Theme</h3>
          <div className="flex items-center space-x-4 p-4 border border-border rounded-lg bg-secondary">
            <p className="text-muted-foreground flex-1">
              Choose between a light or dark theme for the application.
            </p>
            <div className="relative inline-flex items-center cursor-pointer p-1 bg-background rounded-full">
              <button onClick={theme !== 'light' ? toggleTheme : undefined} className={`p-2 rounded-full ${theme === 'light' ? 'bg-primary text-white' : 'text-muted-foreground'}`}>
                <SunIcon className="w-5 h-5"/>
              </button>
              <button onClick={theme !== 'dark' ? toggleTheme : undefined} className={`p-2 rounded-full ${theme === 'dark' ? 'bg-primary text-white' : 'text-muted-foreground'}`}>
                <MoonIcon className="w-5 h-5"/>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
};

export default AppearanceSettings;

