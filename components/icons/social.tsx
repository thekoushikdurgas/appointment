/**
 * Social Media Icons
 * 
 * Icons for social media platforms and social login
 */

import React from 'react';
import { Linkedin, Facebook, Twitter } from 'lucide-react';
import { FaGoogle, FaGithub, FaApple } from 'react-icons/fa';
import { iconProps } from './utils';

// Social Media Icons (using lucide-react social icons)
export const LinkedInIcon: React.FC<{className?: string}> = ({ className }) => (
  <Linkedin className={className} fill="currentColor" strokeWidth={0} />
);

export const FacebookIcon: React.FC<{className?: string}> = ({ className }) => (
  <Facebook className={className} fill="currentColor" strokeWidth={0} />
);

export const TwitterIcon: React.FC<{className?: string}> = ({ className }) => (
  <Twitter className={className} fill="currentColor" strokeWidth={0} />
);

// Icon props type
interface IconProps {
  className?: string;
  [key: string]: any;
}

// Social Login Icons
export const GoogleIcon: React.FC<IconProps> = ({ className = "w-5 h-5", ...props }) => (
  <FaGoogle className={className} {...props} />
);

export const GithubIcon: React.FC<IconProps> = ({ className = "w-5 h-5", ...props }) => (
  <FaGithub className={className} {...props} />
);

export const AppleIcon: React.FC<IconProps> = ({ className = "w-5 h-5", ...props }) => (
  <FaApple className={className} {...props} />
);

