import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import OWWALogo from '../components/shared/OWWALogo';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center p-4">
      <div className="text-center text-white animate-fade-in">
        <div className="flex justify-center mb-6">
          <OWWALogo size="lg" />
        </div>
        <h1 className="text-7xl font-bold mb-2">404</h1>
        <p className="text-xl text-blue-200 mb-8">Page not found</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-white text-blue-800 font-semibold px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors"
        >
          <Home className="w-4 h-4" />
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
