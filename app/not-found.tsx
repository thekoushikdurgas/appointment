import Link from 'next/link';
import { LogoIcon } from '../components/icons/IconComponents';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
      <LogoIcon className="w-24 h-24 text-primary-500 mb-8" />
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-4 text-muted-foreground">Page Not Found</h2>
      <p className="text-muted-foreground mb-8">The page you are looking for does not exist.</p>
      <Link
        href="/"
        className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
      >
        Return Home
      </Link>
    </div>
  );
}


