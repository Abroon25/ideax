import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Signup() {
  const [form, setForm] = useState({ displayName: '', username: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) return toast.error("Passwords don't match");
    if (form.password.length < 8) return toast.error('Password min 8 chars');

    setLoading(true);
    try {
      await signup({ displayName: form.displayName, username: form.username, email: form.email, phone: form.phone, password: form.password });
      toast.success('Account created! 🎉');
      navigate('/genres');
    } catch (err) { toast.error(err.response?.data?.error || 'Signup failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-dark-950">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold">Join <span className="text-primary-500">Idea</span>X 💡</h1>
          <p className="text-dark-400 mt-2">Start monetizing your ideas</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input name="displayName" value={form.displayName} onChange={handleChange} placeholder="Display Name" className="input-field" required />
          <input name="username" value={form.username} onChange={handleChange} placeholder="Username" className="input-field" required />
          <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="Email" className="input-field" required />
          <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone (10 digits)" className="input-field" required maxLength={10} />
          <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Password (min 8 chars)" className="input-field" required />
          <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} placeholder="Confirm Password" className="input-field" required />
          <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-lg">
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>
        <p className="text-center text-dark-400 mt-6">Already have an account? <Link to="/login" className="text-primary-500 hover:underline">Sign in</Link></p>
      </div>
    </div>
  );
}
