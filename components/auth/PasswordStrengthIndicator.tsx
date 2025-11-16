'use client';

import React, { useMemo } from 'react';
import { CheckIcon, XIcon } from '@components/icons/IconComponents';

export interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
  showRequirements?: boolean;
}

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

interface StrengthLevel {
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  className,
  showRequirements = true,
}) => {
  const requirements: PasswordRequirement[] = [
    { label: 'At least 8 characters', test: (pwd) => pwd.length >= 8 },
    { label: 'Contains uppercase letter', test: (pwd) => /[A-Z]/.test(pwd) },
    { label: 'Contains lowercase letter', test: (pwd) => /[a-z]/.test(pwd) },
    { label: 'Contains number', test: (pwd) => /\d/.test(pwd) },
    { label: 'Contains special character', test: (pwd) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd) },
  ];

  const strengthLevels: StrengthLevel[] = [
    { label: 'Weak', color: 'weak', bgColor: 'weak', textColor: 'weak' },
    { label: 'Fair', color: 'fair', bgColor: 'fair', textColor: 'fair' },
    { label: 'Good', color: 'good', bgColor: 'good', textColor: 'good' },
    { label: 'Strong', color: 'strong', bgColor: 'strong', textColor: 'strong' },
    { label: 'Very Strong', color: 'very-strong', bgColor: 'very-strong', textColor: 'very-strong' },
  ];

  const { strength, metRequirements } = useMemo(() => {
    if (!password) return { strength: 0, metRequirements: [] };
    
    const met = requirements.filter((req) => req.test(password));
    const strengthScore = Math.min(met.length, 5);
    
    return {
      strength: strengthScore,
      metRequirements: met.map((req) => req.label),
    };
  }, [password]);

  const strengthLevel = strengthLevels[Math.max(0, strength - 1)] || strengthLevels[0];
  const strengthPercentage = (strength / requirements.length) * 100;

  if (!password) return null;

  return (
    <div className={`password-strength-indicator${className ? ' ' + className : ''}`}>
      {/* Strength Bar */}
      <div className="password-strength-indicator__strength-section">
        <div className="password-strength-indicator__header">
          <span className="password-strength-indicator__label">Password Strength</span>
          <span className={`password-strength-indicator__level password-strength-indicator__level--${strengthLevel.textColor}`}>
            {strengthLevel.label}
          </span>
        </div>
        <div className="password-strength-indicator__bar-container">
          <div
            className={`password-strength-indicator__bar password-strength-indicator__bar--${strengthLevel.color}`}
            style={{ width: `${strengthPercentage}%` }}
          />
        </div>
      </div>

      {/* Requirements List */}
      {showRequirements && (
        <div className={`password-strength-indicator__requirements password-strength-indicator__requirements--${strengthLevel.bgColor}`}>
          <div className="password-strength-indicator__requirements-list">
            {requirements.map((requirement, index) => {
              const isMet = metRequirements.includes(requirement.label);
              return (
                <div
                  key={requirement.label}
                  className="password-strength-indicator__requirement"
                  style={{
                    animationDelay: `${index * 50}ms`,
                  }}
                >
                  <div className={`password-strength-indicator__requirement-icon-wrapper password-strength-indicator__requirement-icon-wrapper--${isMet ? 'met' : 'unmet'}`}>
                    {isMet ? (
                      <CheckIcon className="password-strength-indicator__requirement-icon" />
                    ) : (
                      <XIcon className="password-strength-indicator__requirement-icon password-strength-indicator__requirement-icon--unmet" />
                    )}
                  </div>
                  <span className={`password-strength-indicator__requirement-label password-strength-indicator__requirement-label--${isMet ? 'met' : 'unmet'}`}>
                    {requirement.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

PasswordStrengthIndicator.displayName = 'PasswordStrengthIndicator';

