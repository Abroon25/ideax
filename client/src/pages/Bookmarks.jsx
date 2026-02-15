import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { timeAgo, formatNumber, truncateText, getInitials } from '../utils/helpers';
import { CATEGORY_ICONS, MONETIZE_LABELS } from '../utils/constants';
import { HiArrowLeft, HiOutlineHeart, HiOutlineChatAlt2 } from 'react-icons/hi';

export default function Bookmarks() {
  const navigate = useNavigate();
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users/bookmarks').then(({ data }) => { setIdeas(data.ideas); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="flex justify-center min-h-screen bg-dark-950">
      <main className="w-full max-w-[600px] border-x border-dark-700 min-h-screen">
        <div className="sticky top-0 z-30 bg-dark-950/80 backdrop-blur-md border-b border-dark-700 p-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-dark-800 rounded-full"><HiArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-xl font-bold">Bookmarks</h1>
        </div>
        {loading ? <div className="py-20 flex justify-center"><div className="w-8 h-8 border-2 border-dark-600 border-t-primary-500 rounded-full animate-spin" /></div>
        : ideas.length === 0 ? <div className="py-20 text-center"><p className="text-4xl mb-4">🔖</p><p className="font-bold text-xl">No bookmarks yet</p></div>
        : ideas.map((idea) => (
          <div key={idea.id} onClick={() => navigate('/idea/' + idea.id)} className="idea-card">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center font-bold text-sm">{getInitials(idea.author?.displayName)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2"><span className="font-bold">{idea.author?.displayName}</span><span className="text-dark-400 text-sm">{timeAgo(idea.createdAt)}</span></div>
                <span className="text-xs bg-dark-800 text-dark-300 px-2 py-0.5 rounded-full">{CATEGORY_ICONS[idea.category]} {idea.genre?.name}</span>
                <p className="mt-2 text-[15px]">{truncateText(idea.content, 300)}</p>
              </div>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
