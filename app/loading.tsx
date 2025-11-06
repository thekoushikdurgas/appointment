"use client";

import React from 'react';
import { LogoIcon } from '../components/icons/IconComponents';

const LoadingPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground">
      <div className="relative flex items-center justify-center">
        <LogoIcon className="w-24 h-24 text-primary-500" />
        <div className="absolute top-0 left-0 w-24 h-24 border-2 border-primary-500/50 rounded-full animate-ping-slow"></div>
      </div>
      <div className="mt-8 text-xl font-medium text-muted-foreground tracking-widest flex items-center space-x-1">
        <span>LOADING</span>
        <span className="animate-dot-1">.</span>
        <span className="animate-dot-2">.</span>
        <span className="animate-dot-3">.</span>
      </div>
      <style jsx>{`
        @keyframes ping-slow {
          75%, 100% {
            transform: scale(1.8);
            opacity: 0;
          }
        }
        .animate-ping-slow {
          animation: ping-slow 2.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        @keyframes dot-pulse {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 1; }
        }
        .animate-dot-1 { animation: dot-pulse 1.4s infinite; animation-delay: 0s; }
        .animate-dot-2 { animation: dot-pulse 1.4s infinite; animation-delay: 0.2s; }
        .animate-dot-3 { animation: dot-pulse 1.4s infinite; animation-delay: 0.4s; }
      `}</style>
    </div>
  );
};

export default LoadingPage;


