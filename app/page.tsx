'use client';

import React from 'react';
import Link from 'next/link';
import { LogoIcon, ContactsIcon, UsersIcon, DashboardIcon, UploadIcon, ShieldCheckIcon, PlansIcon, ArrowRightIcon, ChartIcon } from '../components/icons/IconComponents';
import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

// Header Component
const WelcomeHeader: React.FC = () => (
  <header className="header">
    <nav className="header-nav">
      <div className="header-logo">
        <div className="p-2 bg-primary/10 rounded-lg">
          <LogoIcon className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
        </div>
        <span className="text-xl sm:text-2xl font-bold text-foreground">NexusCRM</span>
      </div>
      <div className="header-actions">
        <Button
          asChild
          variant="ghost"
          size="md"
          className="hidden sm:flex"
        >
          <Link href="/login">Login</Link>
        </Button>
        <Button
          asChild
          variant="primary"
          size="md"
        >
          <Link href="/register">Get Started</Link>
        </Button>
      </div>
    </nav>
  </header>
);

const FeatureCard: React.FC<{ icon: React.ReactElement<{ className?: string }>; title: string; description: string; delay?: number }> = ({ icon, title, description, delay = 0 }) => (
  <Card
    variant="interactive"
    padding="lg"
    className="text-center flex flex-col items-center hover-lift animate-fade-in"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="inline-flex items-center justify-center p-4 mb-4 bg-primary/10 rounded-xl">
      {React.cloneElement(icon, { className: 'w-10 h-10 text-primary' })}
    </div>
    <h3 className="text-xl font-bold mb-3 text-foreground">{title}</h3>
    <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
  </Card>
);

const WelcomePage: React.FC = () => {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [currentYear, setCurrentYear] = useState<number>(2024);

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  if (isLoading) {
    return null; // Will be handled by loading.tsx
  }

  if (user) {
    return null; // Will redirect
  }

  return (
    <div className="landing-page">
      {/* Background Grid with gradient overlay */}
      <div className="landing-background">
        <div className="landing-grid"></div>
        <div className="landing-gradient"></div>
      </div>
      
      <WelcomeHeader />
      
      <main className="landing-main">
        <section className="landing-hero">
          <h1 className="landing-title">
            Your <span className="landing-title-highlight">Nexus</span> for Client Relationships
          </h1>
          <p className="landing-description">
            Streamline your contact management, track interactions, and grow your business with NexusCRM. All your contacts, in one organized place.
          </p>
          <div className="landing-cta">
            <Button
              asChild
              variant="primary"
              size="lg"
            >
              <Link href="/register">Get Started Free</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              rightIcon={<ArrowRightIcon className="w-5 h-5" />}
            >
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </section>

        <section id="features" className="landing-features">
          <div className="landing-features-header">
            <div className="landing-features-badge">Key Features</div>
            <h2 className="landing-features-title">Streamline Your Workflow</h2>
            <p className="landing-features-description">
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
      </main>
      
      <footer className="footer">
        <div className="footer-content">
          <p>&copy; {currentYear} NexusCRM. All rights reserved.</p>
          <nav className="footer-nav">
            <a href="#" className="footer-link">Terms of Service</a>
            <a href="#" className="footer-link">Privacy</a>
          </nav>
        </div>
      </footer>
    </div>
  );
};

export default WelcomePage;


