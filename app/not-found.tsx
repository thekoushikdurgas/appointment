'use client';

import Link from 'next/link';
import { LogoIcon, HomeIcon, ArrowLeftIcon } from '../components/icons/IconComponents';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export default function NotFound() {
  return (
    <div className="not-found-page">
      <Card variant="elevated" padding="lg" className="max-w-md w-full text-center flex flex-col gap-6">
        <div className="flex-center">
          <div className="p-4 bg-primary/10 rounded-full">
            <LogoIcon className="w-16 h-16 sm:w-20 sm:h-20 text-primary" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="not-found-title">404</h1>
          <h2 className="text-xl sm:text-2xl font-semibold text-muted-foreground">Page Not Found</h2>
          <p className="not-found-description">
            The page you are looking for does not exist or has been moved.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            asChild
            variant="primary"
            size="lg"
            leftIcon={<HomeIcon className="w-5 h-5" />}
          >
            <Link href="/">Return Home</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            leftIcon={<ArrowLeftIcon className="w-5 h-5" />}
            onClick={() => window.history.back()}
          >
            <Link href="#" onClick={(e) => { e.preventDefault(); window.history.back(); }}>Go Back</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}


