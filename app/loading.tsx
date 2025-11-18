"use client";

import React from 'react';
import { LogoIcon } from '@components/icons';

const LoadingPage: React.FC = () => {
  return (
    <div className="loading-page">
      <div className="loading-page-content">
        <div className="loading-page-logo-wrapper">
          <div className="loading-page-logo">
            <LogoIcon className="loading-page-logo-icon" />
          </div>
          <div className="loading-page-spinner-wrapper">
            <div className="loading-spinner"></div>
          </div>
        </div>
        <div className="loading-page-text">
          <span>LOADING</span>
          <span className="loading-page-dot loading-page-dot--1">.</span>
          <span className="loading-page-dot loading-page-dot--2">.</span>
          <span className="loading-page-dot loading-page-dot--3">.</span>
        </div>
      </div>
    </div>
  );
};

export default LoadingPage;


