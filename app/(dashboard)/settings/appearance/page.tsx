'use client';

import React from 'react';
import { useTheme } from '../../../../hooks/useTheme';
import { SunIcon, MoonIcon, PaintBrushIcon } from '../../../../components/icons/IconComponents';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { cn } from '../../../../utils/cn';

const AppearanceSettings: React.FC = () => {
    const { theme, toggleTheme } = useTheme();
  
    return (
      <div className="flex flex-col gap-6 w-full max-w-full">
        <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
                <PaintBrushIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
                <h2 className="text-3xl font-bold text-foreground">Appearance</h2>
                <p className="text-sm text-muted-foreground mt-1">Customize the look and feel of your workspace</p>
            </div>
        </div>
        
        <Card>
            <CardHeader>
                <CardTitle>Theme</CardTitle>
                <CardDescription>Choose between a light or dark theme for the application</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/50">
                    <div className="flex-1">
                        <p className="font-medium text-foreground mb-1">Current Theme</p>
                        <p className="text-sm text-muted-foreground">
                            {theme === 'light' ? 'Light mode' : 'Dark mode'} is currently active
                        </p>
                    </div>
                    <div className="relative inline-flex items-center p-1 bg-background rounded-full border border-border shadow-sm">
                        <Button
                            variant={theme === 'light' ? 'primary' : 'ghost'}
                            size="sm"
                            iconOnly
                            onClick={theme !== 'light' ? toggleTheme : undefined}
                            className={cn(
                                "rounded-full transition-all",
                                theme === 'light' && "shadow-md"
                            )}
                        >
                            <SunIcon className="w-5 h-5"/>
                        </Button>
                        <Button
                            variant={theme === 'dark' ? 'primary' : 'ghost'}
                            size="sm"
                            iconOnly
                            onClick={theme !== 'dark' ? toggleTheme : undefined}
                            className={cn(
                                "rounded-full transition-all",
                                theme === 'dark' && "shadow-md"
                            )}
                        >
                            <MoonIcon className="w-5 h-5"/>
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
      </div>
    );
};

export default AppearanceSettings;

