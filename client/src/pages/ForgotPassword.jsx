import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  var [email, setEmail] = useState('');
  var [loading, setLoading] = useState(false);
  var [sent, setSent] = useState(false);
  var [resetToken, setResetToken] = useState('');
  var [newPassword, setNewPassword] = useState('');
  var [confirmPassword, setConfirmPassword] = useState('');
  var [resetting, setResetting] = useState(false);

  function handleRequest(e) {
    e.preventDefault();
    if (!email) return toast.error('Enter your email');
    setLoading(true);
    api.post('/users/request-reset', { email: email })
      .then(function(res) {
        setSent(true);
        if (res.data.resetToken) setResetToken(res.data.resetToken);
        toast.success('Reset instructions sent!');
      })
      .catch(function(err) { toast.error(err.response ? err.response.data.error : 'Failed'); })
      .finally(function() { setLoading(false); });
  }

  function handleReset(e) {
    e.preventDefault();
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match');
    if (newPassword.length < 8) return toast.error('Min 8 characters');
    setResetting(true);
    api.post('/users/reset-password', { token: resetToken, newPassword: newPassword })
      .then(function() { toast.success('Password reset! Please login.'); window.location.href = '/login'; })
      .catch(function(err) { toast.error(err.response ? err.response.data.error : 'Failed'); })
      .finally(function() { setResetting(false); });
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-dark-950">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold"><span className="text-primary-500">Idea</span>X 💡</h1>
          <p className="text-dark-400 mt-2">{sent ? 'Reset your password' : 'Forgot your password?'}</p>
        </div>

        {!sent ? (
          <form onSubmit={handleRequest} className="space-y-4">
            <input type="email" value={email} onChange={function(e) { setEmail(e.target.value); }} placeholder="Enter your email" className="input-field" required />
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <input type="text" value={resetToken} onChange={function(e) { setResetToken(e.target.value); }} placeholder="Reset Token" className="input-field" required />
            <input type="password" value={newPassword} onChange={function(e) { setNewPassword(e.target.value); }} placeholder="New Password (min 8 chars)" className="input-field" required />
            <input type="password" value={confirmPassword} onChange={function(e) { setConfirmPassword(e.target.value); }} placeholder="Confirm New Password" className="input-field" required />
            <button type="submit" disabled={resetting} className="btn-primary w-full py-3">
              {resetting ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        <p className="text-center text-dark-400 mt-6">
          <Link to="/login" className="text-primary-500 hover:underline">Back to Login</Link>
        </p>
      </div>
    </div>
  );
}