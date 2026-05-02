import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 py-24 text-center">
      <div className="w-16 h-16 bg-kado-red/10 rounded-full flex items-center justify-center mb-6">
        <span className="font-display text-2xl font-bold text-kado-red">404</span>
      </div>
      <h1 className="font-display text-3xl md:text-4xl font-bold text-kado-dark mb-3">Page not found</h1>
      <p className="text-sm text-kado-dark/60 max-w-md mb-8">
        The page you're looking for doesn't exist or has been moved. Let's get you back on track.
      </p>
      <Link
        to="/"
        className="inline-flex rounded-full bg-kado-red text-kado-cream px-8 py-3.5 text-xs font-bold uppercase tracking-wider hover:bg-kado-dark transition-colors"
      >
        Back to home
      </Link>
    </div>
  );
}
