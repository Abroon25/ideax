import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatNumber, formatCurrency } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      toast.error('Unauthorized');
      navigate('/');
      return;
    }

    api.get('/business/admin/stats')
      .then(res => {
        setStats(res.data);
        setLoading(false);
      })
      .catch(() => {
        toast.error('Failed to load admin stats');
        navigate('/');
      });
  }, [user, navigate]);

  if (loading) return <div className="py-20 flex justify-center"><div className="w-8 h-8 border-2 border-primary-500 rounded-full animate-spin border-t-transparent" /></div>;
  if (!stats) return null;

  return (
    <div>
      <div className="sticky top-0 z-30 bg-dark-950/80 backdrop-blur-md border-b border-dark-700 p-4">
        <h1 className="text-xl font-bold text-red-500">Admin Control Panel 🛡️</h1>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="card p-4 border-red-900/50 bg-red-900/10">
            <p className="text-sm text-red-400 mb-1">Total Users</p>
            <p className="text-3xl font-bold">{formatNumber(stats.totalUsers)}</p>
          </div>
          <div className="card p-4 border-blue-900/50 bg-blue-900/10">
            <p className="text-sm text-blue-400 mb-1">Total Ideas</p>
            <p className="text-3xl font-bold">{formatNumber(stats.totalIdeas)}</p>
          </div>
          <div className="card p-4 border-green-900/50 bg-green-900/10">
            <p className="text-sm text-green-400 mb-1">Platform Revenue</p>
            <p className="text-3xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
          </div>
          <div className="card p-4 border-amber-900/50 bg-amber-900/10">
            <p className="text-sm text-amber-400 mb-1">Open Disputes</p>
            <p className="text-3xl font-bold">{formatNumber(stats.openDisputes)}</p>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="font-bold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button className="w-full btn-outline py-3 border-red-500 text-red-500 hover:bg-red-500 hover:text-white">Review Disputes</button>
            <button className="w-full btn-outline py-3">Manage Users</button>
            <button className="w-full btn-outline py-3">View Transactions</button>
          </div>
        </div>
      </div>
    </div>
  );
}