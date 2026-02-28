import { useState, useEffect } from 'react';
import api from '../services/api';
import { formatNumber, formatCurrency } from '../utils/helpers';
import { HiOutlineEye, HiOutlineHeart, HiOutlineChatAlt2, HiOutlineCash } from 'react-icons/hi';

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/business/analytics')
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-20 flex justify-center"><div className="w-8 h-8 border-2 border-primary-500 rounded-full animate-spin border-t-transparent" /></div>;
  if (!data) return <div className="p-6 text-center text-dark-400">Failed to load analytics</div>;

  return (
    <div>
      <div className="sticky top-0 z-30 bg-dark-950/80 backdrop-blur-md border-b border-dark-700 p-4">
        <h1 className="text-xl font-bold">My Analytics 📈</h1>
      </div>

      <div className="p-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="card p-4 bg-dark-800/50">
            <p className="text-sm text-dark-400 mb-1">Total Views</p>
            <p className="text-2xl font-bold">{formatNumber(data.summary.totalViews)}</p>
          </div>
          <div className="card p-4 bg-dark-800/50">
            <p className="text-sm text-dark-400 mb-1">Total Earnings</p>
            <p className="text-2xl font-bold text-green-500">{formatCurrency(data.summary.totalEarnings)}</p>
          </div>
          <div className="card p-4 bg-dark-800/50">
            <p className="text-sm text-dark-400 mb-1">Ideas Posted</p>
            <p className="text-2xl font-bold">{data.summary.ideasCount}</p>
          </div>
          <div className="card p-4 bg-dark-800/50">
            <p className="text-sm text-dark-400 mb-1">Total Interests</p>
            <p className="text-2xl font-bold text-amber-500">{data.summary.totalInterests}</p>
          </div>
        </div>

        <h2 className="font-bold text-lg mb-4">Top Performing Ideas</h2>
        
        <div className="space-y-4">
          {data.ideas.map(idea => (
            <div key={idea.id} className="card p-4">
              <p className="text-sm text-dark-200 mb-3 line-clamp-2">{idea.content}</p>
              
              <div className="flex justify-between items-center text-xs text-dark-400 border-t border-dark-700 pt-3">
                <span className="flex items-center gap-1"><HiOutlineEye className="w-4 h-4" /> {formatNumber(idea.viewCount)}</span>
                <span className="flex items-center gap-1"><HiOutlineHeart className="w-4 h-4" /> {formatNumber(idea._count.likes)}</span>
                <span className="flex items-center gap-1"><HiOutlineChatAlt2 className="w-4 h-4" /> {formatNumber(idea._count.comments)}</span>
                <span className="flex items-center gap-1 text-green-500"><HiOutlineCash className="w-4 h-4" /> {formatCurrency(idea.totalEarnings)}</span>
              </div>
            </div>
          ))}
          {data.ideas.length === 0 && <p className="text-center text-dark-400">Post some ideas to see stats!</p>}
        </div>
      </div>
    </div>
  );
}