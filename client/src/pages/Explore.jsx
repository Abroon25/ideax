import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { CATEGORY_ICONS, MONETIZE_LABELS } from '../utils/constants';
import { timeAgo, formatNumber, truncateText, getInitials } from '../utils/helpers';
import { HiOutlineHeart, HiOutlineChatAlt2, HiOutlineEye } from 'react-icons/hi';

export default function Explore() {
  var [searchParams] = useSearchParams();
  var navigate = useNavigate();
  var [ideas, setIdeas] = useState([]);
  var [genres, setGenres] = useState([]);
  var [loading, setLoading] = useState(true);
  var [selectedCat, setSelectedCat] = useState(searchParams.get('category') || '');

  useEffect(function() {
    api.get('/genres').then(function(res) { setGenres(res.data.genres); }).catch(function() {});
  }, []);

  useEffect(function() {
    setLoading(true);
    var params = selectedCat ? { category: selectedCat } : {};
    api.get('/ideas/feed', { params: Object.assign({}, params, { limit: 50 }) })
      .then(function(res) { setIdeas(res.data.ideas); setLoading(false); })
      .catch(function() { setLoading(false); });
  }, [selectedCat]);

  var categories = [];
  genres.forEach(function(g) {
    if (categories.indexOf(g.category) === -1) categories.push(g.category);
  });

  return (
    <div>
      <div className="sticky top-0 z-30 bg-dark-950/80 backdrop-blur-md border-b border-dark-700 p-4">
        <h1 className="text-xl font-bold mb-3">Explore 🔍</h1>
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button onClick={function() { setSelectedCat(''); }} className={'px-4 py-1.5 rounded-full text-sm whitespace-nowrap ' + (!selectedCat ? 'bg-primary-500 text-white' : 'bg-dark-800 text-dark-300')}>All</button>
          {categories.map(function(c) {
            return (
              <button key={c} onClick={function() { setSelectedCat(c); }} className={'px-4 py-1.5 rounded-full text-sm whitespace-nowrap ' + (selectedCat === c ? 'bg-primary-500 text-white' : 'bg-dark-800 text-dark-300')}>
                {CATEGORY_ICONS[c]} {c.replace('_', ' ')}
              </button>
            );
          })}
        </div>
      </div>
      {loading ? (
        <div className="py-20 flex justify-center"><div className="w-8 h-8 border-2 border-dark-600 border-t-primary-500 rounded-full animate-spin" /></div>
      ) : ideas.length === 0 ? (
        <div className="py-20 text-center text-dark-400">No ideas in this category yet</div>
      ) : (
        ideas.map(function(idea) {
          return (
            <div key={idea.id} onClick={function() { navigate('/idea/' + idea.id); }} className="idea-card">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center font-bold text-sm">{getInitials(idea.author.displayName)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{idea.author.displayName}</span>
                    <span className="text-dark-400 text-sm">@{idea.author.username} · {timeAgo(idea.createdAt)}</span>
                  </div>
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs bg-dark-800 text-dark-300 px-2 py-0.5 rounded-full">{CATEGORY_ICONS[idea.category]} {idea.genre ? idea.genre.name : ''}</span>
                    {idea.monetizeType !== 'NONE' && <span className="text-xs px-2 py-0.5 rounded-full bg-green-900/50 text-green-400 border border-green-800">💰 {MONETIZE_LABELS[idea.monetizeType]}</span>}
                  </div>
                  <p className="mt-2 text-[15px]">{truncateText(idea.content, 300)}</p>
                  <div className="flex gap-6 mt-2 text-dark-400 text-sm">
                    <span className="flex items-center gap-1"><HiOutlineHeart className="w-4 h-4" />{formatNumber(idea._count ? idea._count.likes : 0)}</span>
                    <span className="flex items-center gap-1"><HiOutlineChatAlt2 className="w-4 h-4" />{formatNumber(idea._count ? idea._count.comments : 0)}</span>
                    <span className="flex items-center gap-1"><HiOutlineEye className="w-4 h-4" />{formatNumber(idea.viewCount)}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}