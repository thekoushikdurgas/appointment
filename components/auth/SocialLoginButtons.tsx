'use client';

import React, { useState } from 'react';
import { GoogleIcon, FacebookIcon, GithubIcon, AppleIcon, TwitterIcon } from '@components/icons';

interface SocialButton {
  name: string;
  Icon: React.ComponentType<{ className?: string }>;
  bgColor: string;
  hoverColor: string;
  textColor: string;
}

export interface SocialLoginButtonsProps {
  onSocialLogin?: (provider: string) => void;
  className?: string;
  variant?: 'default' | 'glass';
  layout?: 'grid' | 'row';
}

export const SocialLoginButtons: React.FC<SocialLoginButtonsProps> = ({
  onSocialLogin,
  className,
  variant = 'glass',
  layout = 'grid',
}) => {
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  const socialButtons: SocialButton[] = [
    {
      name: 'Google',
      Icon: GoogleIcon,
      bgColor: 'bg-white dark:bg-gray-800',
      hoverColor: 'hover:bg-gray-50 dark:hover:bg-gray-700',
      textColor: 'text-gray-700 dark:text-gray-200',
    },
    {
      name: 'Facebook',
      Icon: FacebookIcon,
      bgColor: 'bg-[#1877F2]',
      hoverColor: 'hover:bg-[#166FE5]',
      textColor: 'text-white',
    },
    {
      name: 'GitHub',
      Icon: GithubIcon,
      bgColor: 'bg-gray-900 dark:bg-gray-800',
      hoverColor: 'hover:bg-gray-800 dark:hover:bg-gray-700',
      textColor: 'text-white',
    },
    {
      name: 'Apple',
      Icon: AppleIcon,
      bgColor: 'bg-black dark:bg-gray-900',
      hoverColor: 'hover:bg-gray-900 dark:hover:bg-gray-800',
      textColor: 'text-white',
    },
    {
      name: 'Twitter',
      Icon: TwitterIcon,
      bgColor: 'bg-black dark:bg-gray-900',
      hoverColor: 'hover:bg-gray-900 dark:hover:bg-gray-800',
      textColor: 'text-white',
    },
  ];

  const handleSocialLogin = (provider: string) => {
    if (onSocialLogin) {
      onSocialLogin(provider);
    } else {
      console.log(`Login with ${provider}`);
      // Placeholder for actual social login implementation
      alert(`${provider} login will be implemented soon!`);
    }
  };

  const getButtonClassName = (button: SocialButton, isHovered: boolean) => {
    if (variant === 'glass') {
      return `social-login__button social-login__button--glass${isHovered ? ' social-login__button--hovered' : ''}`;
    }
    return `social-login__button social-login__button--${button.name.toLowerCase()}${isHovered ? ' social-login__button--hovered' : ''}`;
  };

  return (
    <div className={`social-login-container${className ? ' ' + className : ''}`}>
      <div className="social-login-divider">
        <div className="social-login-divider__line"></div>
        <div className="social-login-divider__text">
          <span>Or continue with</span>
        </div>
      </div>

      <div className={`social-login-buttons social-login-buttons--${layout}`}>
        {socialButtons.map((button) => {
          const isHovered = hoveredButton === button.name;
          return (
            <button
              key={button.name}
              onClick={() => handleSocialLogin(button.name)}
              onMouseEnter={() => setHoveredButton(button.name)}
              onMouseLeave={() => setHoveredButton(null)}
              className={getButtonClassName(button, isHovered)}
              style={{
                animationDelay: `${socialButtons.indexOf(button) * 50}ms`,
              }}
              aria-label={`Sign in with ${button.name}`}
            >
              <button.Icon className={`social-login__icon${isHovered ? ' social-login__icon--hovered' : ''}`} />
              <span className="social-login__text">
                {button.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

SocialLoginButtons.displayName = 'SocialLoginButtons';

