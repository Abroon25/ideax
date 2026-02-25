import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
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
import Search from './pages/Search';
import Bookmarks from './pages/Bookmarks';
import Messages from './pages/Messages';
import ForgotPassword from './pages/ForgotPassword';
import NotFound from './pages/NotFound';


function ProtectedRoute({ children, withLayout }) {
  var auth = useAuth();
  if (auth.loading) return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950">
      <div className="text-center">
        <h1 className="text-4xl font-bold"><span className="text-primary-500">Idea</span>X 💡</h1>
        <div className="mt-4 w-8 h-8 border-2 border-dark-600 border-t-primary-500 rounded-full animate-spin mx-auto" />
      </div>
    </div>
  );
  if (!auth.user) return <Navigate to="/login" replace />;
  if (withLayout) return <Layout>{children}</Layout>;
  return children;
}

export default function App() {
  var auth = useAuth();
  var user = auth.user;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/" /> : <Signup />} />
      <Route path="/forgot-password" element={user ? <Navigate to="/" /> : <ForgotPassword />} />
      <Route path="/genres" element={<ProtectedRoute><GenreSelection /></ProtectedRoute>} />
      <Route path="/" element={<ProtectedRoute withLayout>{user && !user.isOnboarded ? <Navigate to="/genres" /> : <Home />}</ProtectedRoute>} />
      <Route path="/search" element={<ProtectedRoute withLayout><Search /></ProtectedRoute>} />
      <Route path="/explore" element={<ProtectedRoute withLayout><Explore /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute withLayout><Notifications /></ProtectedRoute>} />
      <Route path="/bookmarks" element={<ProtectedRoute withLayout><Bookmarks /></ProtectedRoute>} />
      <Route path="/tiers" element={<ProtectedRoute withLayout><Tiers /></ProtectedRoute>} />
      <Route path="/profile/:username" element={<ProtectedRoute withLayout><Profile /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute withLayout><Settings /></ProtectedRoute>} />
      <Route path="/idea/:id" element={<ProtectedRoute withLayout><IdeaDetailPage /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
      <Route path="/messages" element={<ProtectedRoute withLayout><Messages /></ProtectedRoute>} />
    </Routes>
  );
}