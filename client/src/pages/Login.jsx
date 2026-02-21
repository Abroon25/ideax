import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login({ email, password });
      toast.success('Welcome back!');
      navigate(data.user.isOnboarded ? '/' : '/genres');
    } catch (err) { toast.error(err.response?.data?.error || 'Login failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-dark-950">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold"><span className="text-primary-500">Idea</span>X 💡</h1>
          <p className="text-dark-400 mt-2">Sign in to monetize your ideas</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="input-field" required />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="input-field" required />
          <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-lg">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p className="text-center text-dark-400 mt-4">
          <Link to="/forgot-password" className="text-primary-500 hover:underline">Forgot password?</Link>
        </p>
        <p className="text-center text-dark-400 mt-2">Don't have an account? <Link to="/signup" className="text-primary-500 hover:underline">Sign up</Link></p>
      </div>
    </div>
  );
}
