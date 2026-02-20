import Search from './pages/Search';
import Bookmarks from './pages/Bookmarks';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import GenreSelection from './pages/GenreSelection';
import Explore from './pages/Explore';
import Notifications from './pages/Notifications';
import Tiers from './pages/Tiers';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import IdeaDetailPage from './pages/IdeaDetailPage';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-center"><h1 className="text-4xl font-bold"><span className="text-primary-500">Idea</span>X 💡</h1><div className="mt-4 w-8 h-8 border-2 border-dark-600 border-t-primary-500 rounded-full animate-spin mx-auto" /></div></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
      <Route path="/bookmarks" element={<ProtectedRoute><Bookmarks /></ProtectedRoute>} />
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/" /> : <Signup />} />
      <Route path="/genres" element={<ProtectedRoute><GenreSelection /></ProtectedRoute>} />
      <Route path="/" element={<ProtectedRoute>{user && !user.isOnboarded ? <Navigate to="/genres" /> : <Home />}</ProtectedRoute>} />
      <Route path="/explore" element={<ProtectedRoute><Explore /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
      <Route path="/tiers" element={<ProtectedRoute><Tiers /></ProtectedRoute>} />
      <Route path="/profile/:username" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/idea/:id" element={<ProtectedRoute><IdeaDetailPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
