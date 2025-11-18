'use client';

import Link from 'next/link';
import { LogoIcon, HomeIcon, ArrowLeftIcon } from '@components/icons';
import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';

export default function NotFound() {
  return (
    <div className="not-found-page">
      <Card variant="elevated" padding="lg" className="not-found-card">
        <div className="not-found-icon-wrapper">
          <div className="not-found-icon-bg">
            <LogoIcon className="not-found-icon" />
          </div>
        </div>
        <div className="not-found-content">
          <h1 className="not-found-title">404</h1>
          <h2 className="not-found-subtitle">Page Not Found</h2>
          <p className="not-found-description">
            The page you are looking for does not exist or has been moved.
          </p>
        </div>
        <div className="not-found-actions">
          <Button
            asChild
            variant="primary"
            size="lg"
            leftIcon={<HomeIcon className="not-found-action-icon" />}
            className="not-found-action-btn"
          >
            <Link href="/">Return Home</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            leftIcon={<ArrowLeftIcon className="not-found-action-icon" />}
            onClick={() => window.history.back()}
            className="not-found-action-btn"
          >
            <Link href="#" onClick={(e) => { e.preventDefault(); window.history.back(); }}>Go Back</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}


