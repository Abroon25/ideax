import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950 p-4">
      <div className="text-center">
        <p className="text-8xl mb-4">🔍</p>
        <h1 className="text-4xl font-bold mb-2">Page Not Found</h1>
        <p className="text-dark-400 text-lg mb-8">The page you are looking for does not exist.</p>
        <Link to="/" className="btn-primary py-3 px-8 text-lg">Go Home</Link>
      </div>
    </div>
  );
}