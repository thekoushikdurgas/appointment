'use client';

import React, { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  tx: number;
  ty: number;
  color: string;
  size: number;
  delay: number;
}

export interface ParticleEffectProps {
  trigger: boolean;
  particleCount?: number;
  colors?: string[];
  duration?: number;
  onComplete?: () => void;
  className?: string;
}

export const ParticleEffect: React.FC<ParticleEffectProps> = ({
  trigger,
  particleCount = 20,
  colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'],
  duration = 800,
  onComplete,
  className,
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (trigger) {
      // Generate particles
      const newParticles: Particle[] = [];
      for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount;
        const velocity = 80 + Math.random() * 40;
        newParticles.push({
          id: i,
          x: 0,
          y: 0,
          tx: Math.cos(angle) * velocity,
          ty: Math.sin(angle) * velocity,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 4 + Math.random() * 4,
          delay: Math.random() * 100,
        });
      }
      setParticles(newParticles);

      // Clear particles after animation
      const timer = setTimeout(() => {
        setParticles([]);
        if (onComplete) onComplete();
      }, duration + 200);

      return () => clearTimeout(timer);
    }
  }, [trigger, particleCount, colors, duration, onComplete]);

  if (particles.length === 0) return null;

  const containerClassName = `particle-effect${className ? ' ' + className : ''}`;
  
  return (
    <div className={containerClassName}>
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="particle-effect__particle"
          style={{
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
            '--tx': `${particle.tx}px`,
            '--ty': `${particle.ty}px`,
            animationDelay: `${particle.delay}ms`,
            animationDuration: `${duration}ms`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
};

ParticleEffect.displayName = 'ParticleEffect';

