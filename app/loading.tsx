"use client";

import React from 'react';
import { LogoIcon } from '../components/icons/IconComponents';

const LoadingPage: React.FC = () => {
  return (
    <div className="loading-page">
      <div className="relative flex-center">
        <div className="p-6 bg-primary/10 rounded-2xl">
          <LogoIcon className="w-20 h-20 sm:w-24 sm:h-24 text-primary" />
        </div>
        <div className="absolute inset-0 flex-center">
          <div className="loading-spinner"></div>
        </div>
      </div>
      <div className="mt-8 text-lg sm:text-xl font-medium text-muted-foreground tracking-widest flex items-center gap-1">
        <span>LOADING</span>
        <span className="animate-dot-1">.</span>
        <span className="animate-dot-2">.</span>
        <span className="animate-dot-3">.</span>
      </div>
    </div>
  );
};

export default LoadingPage;


