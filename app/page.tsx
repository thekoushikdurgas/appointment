'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { LogoIcon, ContactsIcon, UsersIcon, DashboardIcon, UploadIcon, ShieldCheckIcon, PlansIcon, ArrowRightIcon, ChartIcon, SparklesIcon, RocketIcon, TrendingUpIcon } from '../components/icons/IconComponents';
import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';
import { FloatingIcons } from '../components/ui/FloatingIcons';

// Header Component
const WelcomeHeader: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`landing-header ${scrolled ? 'landing-header--scrolled' : ''}`}>
      <nav className="landing-header-nav">
        <div className="landing-header-logo">
          <div className={`landing-header-logo-bg ${scrolled ? 'landing-header-logo-bg--scrolled' : ''}`}>
            <LogoIcon className="landing-header-logo-icon" />
          </div>
          <span className="landing-header-logo-text">NexusCRM</span>
        </div>
        <div className="landing-header-actions">
          <Button
            asChild
            variant="ghost"
            size="md"
            className="landing-header-login-btn"
          >
            <Link href="/login">Login</Link>
          </Button>
          <Button
            asChild
            variant="glass-heavy"
            size="md"
            glow
            animate
          >
            <Link href="/register">Get Started</Link>
          </Button>
        </div>
      </nav>
    </header>
  );
};

const FeatureCard: React.FC<{ 
  icon: React.ReactElement<{ className?: string }>; 
  title: string; 
  description: string; 
  delay?: number;
}> = ({ icon, title, description, delay = 0 }) => (
  <GlassCard
    variant="heavy"
    padding="lg"
    hoverLift
    animate
    className="landing-feature-card"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="landing-feature-icon-wrapper">
      {React.cloneElement(icon, { className: 'landing-feature-icon' })}
    </div>
    <h3 className="landing-feature-title">{title}</h3>
    <p className="landing-feature-description">{description}</p>
  </GlassCard>
);

const WelcomePage: React.FC = () => {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [currentYear, setCurrentYear] = useState<number>(2024);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (isLoading) {
    return null;
  }

  if (user) {
    return null;
  }

  return (
    <div className="landing-page">
      {/* Background with animated gradient */}
      <div className="landing-background">
        <div className="landing-background-mesh"></div>
        <div className="landing-grid"></div>
        <div className="landing-gradient gradient-shift"></div>
        <div className="landing-particles">
          <div className="landing-particle"></div>
          <div className="landing-particle"></div>
          <div className="landing-particle"></div>
          <div className="landing-particle"></div>
          <div className="landing-particle"></div>
        </div>
      </div>
      
      <FloatingIcons variant="subtle" iconCount={12} />
      <WelcomeHeader />
      
      <main className="landing-main">
        {/* Hero Section with Parallax */}
        <section 
          className="landing-hero relative parallax-layer-slow"
          style={{
            transform: `translateY(${scrollY * 0.3}px)`,
            transition: 'transform 0.1s ease-out'
          }}
        >
          <div className="landing-hero-content">
            <div className="landing-hero-icon-wrapper">
              <div className="landing-hero-icon-bg">
                <SparklesIcon className="landing-hero-icon" />
              </div>
            </div>
            
            <h1 className="landing-title">
              Your <span className="landing-title-highlight" data-text="Nexus">Nexus</span> for Client Relationships
            </h1>
            <p className="landing-description" style={{ animationDelay: '0.2s' }}>
              Streamline your contact management, track interactions, and grow your business with NexusCRM. 
              All your contacts, in one organized place with powerful AI-driven insights.
            </p>
            <div className="landing-cta" style={{ animationDelay: '0.4s' }}>
              <Button
                asChild
                variant="glass-heavy"
                size="lg"
                glow
                animate
                magnetic
                leftIcon={<RocketIcon className="landing-cta-icon" />}
                className="landing-cta-button"
              >
                <Link href="/register">Get Started Free</Link>
              </Button>
              <Button
                asChild
                variant="glass"
                size="lg"
                animate
                rightIcon={<ArrowRightIcon className="landing-cta-icon" />}
                className="landing-cta-button"
              >
                <Link href="/login">Sign In</Link>
              </Button>
            </div>

            {/* Stats Section */}
            <div className="landing-stats" style={{ animationDelay: '0.6s' }}>
              <GlassCard variant="heavy" padding="md" className="landing-stat-card">
                <div className="landing-stat-content">
                  <TrendingUpIcon className="landing-stat-icon landing-stat-icon--success" />
                  <p className="landing-stat-value" style={{ animationDelay: '0.9s' }}>10K+</p>
                </div>
                <p className="landing-stat-label">Active Users</p>
              </GlassCard>
              <GlassCard variant="heavy" padding="md" className="landing-stat-card">
                <div className="landing-stat-content">
                  <ContactsIcon className="landing-stat-icon landing-stat-icon--primary" />
                  <p className="landing-stat-value" style={{ animationDelay: '1.1s' }}>1M+</p>
                </div>
                <p className="landing-stat-label">Contacts Managed</p>
              </GlassCard>
              <GlassCard variant="heavy" padding="md" className="landing-stat-card">
                <div className="landing-stat-content">
                  <ShieldCheckIcon className="landing-stat-icon landing-stat-icon--info" />
                  <p className="landing-stat-value" style={{ animationDelay: '1.3s' }}>99.9%</p>
                </div>
                <p className="landing-stat-label">Uptime</p>
              </GlassCard>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section 
          id="features" 
          className="landing-features parallax-layer-medium"
          style={{
            transform: `translateY(${scrollY * 0.1}px)`,
            transition: 'transform 0.1s ease-out'
          }}
        >
          <div className="landing-features-header">
            <div className="landing-features-badge glass-heavy animate-fade-in">
              Key Features
            </div>
            <h2 className="landing-features-title animate-fade-in" style={{ animationDelay: '0.1s' }}>
              Streamline Your Workflow
            </h2>
            <p className="landing-features-description animate-fade-in" style={{ animationDelay: '0.2s' }}>
              Everything you need in a modern, integrated platform.
            </p>
          </div>
          <div className="landing-features-grid">
            <FeatureCard
              icon={<ContactsIcon />}
              title="Contact Management"
              description="Store and organize all your contacts in one place with advanced filtering and search capabilities."
              delay={0}
            />
            <FeatureCard
              icon={<UploadIcon />}
              title="Bulk Import"
              description="Import thousands of contacts via CSV with automatic data mapping and validation."
              delay={100}
            />
            <FeatureCard
              icon={<UsersIcon />}
              title="User Management"
              description="Manage multiple users with role-based access control and detailed permissions."
              delay={200}
            />
            <FeatureCard
              icon={<PlansIcon />}
              title="Flexible Plans"
              description="Choose from multiple subscription plans tailored to your business needs."
              delay={300}
            />
            <FeatureCard
              icon={<ChartIcon />}
              title="Analytics Dashboard"
              description="Track your contact growth and manage your business with detailed analytics."
              delay={400}
            />
            <FeatureCard
              icon={<ShieldCheckIcon />}
              title="Secure & Reliable"
              description="Your data is protected with enterprise-grade security and regular backups."
              delay={500}
            />
          </div>
        </section>

        {/* CTA Section */}
        <section className="landing-cta-section">
          <GlassCard variant="heavy" padding="lg" glow className="landing-cta-card">
            <h2 className="landing-cta-title" style={{ animationDelay: '0.1s' }}>
              Ready to Transform Your Business?
            </h2>
            <p className="landing-cta-description" style={{ animationDelay: '0.2s' }}>
              Join thousands of businesses already using NexusCRM to manage their customer relationships effectively.
            </p>
            <div className="landing-cta-actions" style={{ animationDelay: '0.3s' }}>
              <Button
                asChild
                variant="glass-heavy"
                size="lg"
                glow
                animate
                magnetic
                className="landing-cta-button"
              >
                <Link href="/register">Start Free Trial</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                animate
                className="landing-cta-button"
              >
                <Link href="/login">View Demo</Link>
              </Button>
            </div>
          </GlassCard>
        </section>
      </main>
      
      <footer className="landing-footer">
        <div className="landing-footer-content">
          <p className="landing-footer-text">&copy; {currentYear} NexusCRM. All rights reserved.</p>
          <nav className="landing-footer-nav">
            <a href="#" className="landing-footer-link">Terms of Service</a>
            <a href="#" className="landing-footer-link">Privacy</a>
            <a href="#features" className="landing-footer-link">Features</a>
          </nav>
        </div>
      </footer>
    </div>
  );
};

export default WelcomePage;
