import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { timeAgo, formatNumber, formatCurrency, truncateText, getInitials } from '../utils/helpers';
import { MONETIZE_LABELS, CATEGORY_ICONS, TIER_LIMITS } from '../utils/constants';
import {
  HiOutlineHeart,
  HiHeart,
  HiOutlineChatAlt2,
  HiOutlineEye,
  HiOutlineShare,
  HiOutlineCash,
  HiOutlineLightBulb,
  HiBookmark
} from 'react-icons/hi';
import { HiOutlineBookmark as HiOutlineBM } from 'react-icons/hi2';

function Avatar({ src, name, size }) {
  var s = size || 'w-10 h-10';
  if (src) {
    return <img src={src} alt={name} className={s + ' rounded-full object-cover'} />;
  }
  return (
    <div className={s + ' rounded-full bg-primary-500 flex items-center justify-center font-bold text-white text-sm'}>
      {getInitials(name)}
    </div>
  );
}

function TierBadge({ tier }) {
  var cls = {
    FREE: 'bg-dark-600 text-dark-300',
    BASIC: 'bg-blue-900/50 text-blue-400 border border-blue-800',
    PREMIUM: 'bg-amber-900/50 text-amber-400 border border-amber-800'
  };
  return <span className={'text-xs px-2 py-0.5 rounded-full ' + (cls[tier] || cls.FREE)}>{tier}</span>;
}

function IdeaCard({ idea, onLike, onBookmark }) {
  var navigate = useNavigate();

  return (
    <div className="idea-card" onClick={function(e) { if (!e.target.closest('button') && !e.target.closest('a')) navigate('/idea/' + idea.id); }}>
      <div className="flex gap-3">
        <Link to={'/profile/' + idea.author.username} onClick={function(e) { e.stopPropagation(); }}>
          <Avatar src={idea.author.avatar} name={idea.author.displayName} />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link to={'/profile/' + idea.author.username} onClick={function(e) { e.stopPropagation(); }} className="font-bold hover:underline">
              {idea.author.displayName}
            </Link>
            <TierBadge tier={idea.author.tier} />
            <span className="text-dark-400 text-sm">@{idea.author.username}</span>
            <span className="text-dark-500">·</span>
            <span className="text-dark-400 text-sm">{timeAgo(idea.createdAt)}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs bg-dark-800 text-dark-300 px-2 py-0.5 rounded-full">
              {CATEGORY_ICONS[idea.category]} {idea.genre ? idea.genre.name : ''}
            </span>
            {idea.monetizeType !== 'NONE' && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-900/50 text-green-400 border border-green-800">
                <HiOutlineCash className="w-3 h-3 inline mr-1" />
                {MONETIZE_LABELS[idea.monetizeType]}
                {idea.askingPrice ? ' · ' + formatCurrency(idea.askingPrice) : ''}
                {idea.profitSharePct ? ' · ' + idea.profitSharePct + '%' : ''}
              </span>
            )}
          </div>
          <div className="mt-2 text-[15px] leading-relaxed whitespace-pre-wrap break-words">
            {truncateText(idea.content, 500)}
          </div>
          {idea.attachments && idea.attachments.length > 0 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {idea.attachments.slice(0, 4).map(function(a) {
                if (a.fileType && a.fileType.startsWith('image')) {
                  return <img key={a.id} src={a.fileUrl} alt="" className="h-40 rounded-lg object-cover" />;
                }
                return <div key={a.id} className="bg-dark-800 rounded-lg p-3 text-sm">📎 {a.fileName}</div>;
              })}
            </div>
          )}
          <div className="flex items-center justify-between mt-3 max-w-md">
            <button onClick={function(e) { e.stopPropagation(); navigate('/idea/' + idea.id); }} className="flex items-center gap-1 text-dark-400 hover:text-primary-500">
              <HiOutlineChatAlt2 className="w-5 h-5" />
              <span className="text-sm">{formatNumber(idea._count ? idea._count.comments : 0)}</span>
            </button>
            <button onClick={function(e) { e.stopPropagation(); onLike(idea.id); }} className={'flex items-center gap-1 ' + (idea.isLiked ? 'text-pink-500' : 'text-dark-400 hover:text-pink-500')}>
              {idea.isLiked ? <HiHeart className="w-5 h-5" /> : <HiOutlineHeart className="w-5 h-5" />}
              <span className="text-sm">{formatNumber(idea._count ? idea._count.likes : 0)}</span>
            </button>
            <div className="flex items-center gap-1 text-dark-400">
              <HiOutlineEye className="w-5 h-5" />
              <span className="text-sm">{formatNumber(idea.viewCount)}</span>
            </div>
            <button onClick={function(e) { e.stopPropagation(); onBookmark(idea.id); }} className={idea.isBookmarked ? 'text-primary-500' : 'text-dark-400 hover:text-primary-500'}>
              {idea.isBookmarked ? <HiBookmark className="w-5 h-5" /> : <HiOutlineBM className="w-5 h-5" />}
            </button>
            <button onClick={function(e) { e.stopPropagation(); navigator.clipboard.writeText(window.location.origin + '/idea/' + idea.id); toast.success('Link copied!'); }} className="text-dark-400 hover:text-primary-500">
              <HiOutlineShare className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  var auth = useAuth();
  var user = auth.user;
  var updateUser = auth.updateUser;
  var navigate = useNavigate();
  var [ideas, setIdeas] = useState([]);
  var [loading, setLoading] = useState(true);
  var [genres, setGenres] = useState([]);
  var [content, setContent] = useState('');
  var [selectedGenre, setSelectedGenre] = useState('');
  var [monetizeType, setMonetizeType] = useState('NONE');
  var [askingPrice, setAskingPrice] = useState('');
  var [posting, setPosting] = useState(false);
  var [showComposer, setShowComposer] = useState(false);
  var [showTour, setShowTour] = useState(user ? !user.tourCompleted : false);
  var [tourStep, setTourStep] = useState(0);
  var [page, setPage] = useState(1);
  var [hasMore, setHasMore] = useState(true);

  var limits = TIER_LIMITS[user ? user.tier : 'FREE'] || TIER_LIMITS.FREE;

  useEffect(function() {
    api.get('/genres').then(function(res) { setGenres(res.data.genres); }).catch(function() {});
  }, []);

  useEffect(function() { fetchFeed(1); }, []);

  function fetchFeed(p) {
    api.get('/ideas/feed', { params: { page: p, limit: 20 } })
      .then(function(res) {
        if (p === 1) setIdeas(res.data.ideas);
        else setIdeas(function(prev) { return prev.concat(res.data.ideas); });
        setHasMore(res.data.pagination.hasMore);
        setPage(p);
      })
      .catch(function() {})
      .finally(function() { setLoading(false); });
  }

  function handlePost() {
    if (!content.trim()) return toast.error('Write something!');
    if (!selectedGenre) return toast.error('Select a genre');
    setPosting(true);
    var formData = new FormData();
    formData.append('content', content.trim());
    formData.append('genreId', selectedGenre);
    formData.append('monetizeType', monetizeType);
    if (askingPrice) formData.append('askingPrice', askingPrice);

    api.post('/ideas', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then(function(res) {
        toast.success('Idea posted! 💡');
        setIdeas(function(prev) { return [res.data.idea].concat(prev); });
        setContent(''); setSelectedGenre(''); setMonetizeType('NONE'); setAskingPrice(''); setShowComposer(false);
      })
      .catch(function(err) { toast.error(err.response && err.response.data ? err.response.data.error : 'Failed'); })
      .finally(function() { setPosting(false); });
  }

  function handleLike(id) {
    api.post('/ideas/' + id + '/like').then(function(res) {
      setIdeas(function(prev) {
        return prev.map(function(i) {
          if (i.id === id) return Object.assign({}, i, { isLiked: res.data.liked, _count: Object.assign({}, i._count, { likes: i._count.likes + (res.data.liked ? 1 : -1) }) });
          return i;
        });
      });
    }).catch(function() { toast.error('Failed'); });
  }

  function handleBookmark(id) {
    api.post('/ideas/' + id + '/bookmark').then(function(res) {
      setIdeas(function(prev) {
        return prev.map(function(i) {
          if (i.id === id) return Object.assign({}, i, { isBookmarked: res.data.bookmarked });
          return i;
        });
      });
      toast.success(res.data.bookmarked ? 'Bookmarked!' : 'Removed');
    }).catch(function() { toast.error('Failed'); });
  }

  function finishTour() {
    api.post('/users/complete-tour').then(function() { updateUser({ tourCompleted: true }); }).catch(function() {});
    setShowTour(false);
  }

  var tourSteps = [
    { icon: '🚀', title: 'Welcome to IdeaX!', desc: 'The platform where your ideas have value. Post, sell, and monetize across categories.' },
    { icon: '📝', title: 'Post Your Ideas', desc: 'Click the Post Idea button, select a genre, write your idea, and optionally monetize it.' },
    { icon: '💰', title: 'Monetize', desc: 'Set price, profit share, shareholding, or partnership terms. Buyers can express interest.' },
    { icon: '⭐', title: 'Tier System', desc: 'FREE: 500 chars. BASIC: 15K chars + files. PREMIUM: 50K chars + all options + legal support.' },
    { icon: '🌟', title: 'Ready!', desc: 'Start exploring ideas or post your first brilliant idea!' }
  ];

  return (
    <div>
      {/* Tour Overlay */}
      {showTour && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-950/90 backdrop-blur-md">
          <div className="max-w-md w-full mx-4 card p-8 text-center">
            <span className="text-6xl">{tourSteps[tourStep].icon}</span>
            <h2 className="text-2xl font-bold mt-4 mb-3">{tourSteps[tourStep].title}</h2>
            <p className="text-dark-300 mb-8">{tourSteps[tourStep].desc}</p>
            <div className="flex justify-center gap-2 mb-6">
              {tourSteps.map(function(_, i) {
                return <div key={i} className={'h-2 rounded-full transition-all ' + (i === tourStep ? 'bg-primary-500 w-6' : 'bg-dark-600 w-2')} />;
              })}
            </div>
            <div className="flex gap-3 justify-center">
              <button onClick={finishTour} className="btn-outline py-2 px-6">Skip</button>
              <button onClick={function() { if (tourStep < tourSteps.length - 1) setTourStep(tourStep + 1); else finishTour(); }} className="btn-primary py-2 px-6">
                {tourStep < tourSteps.length - 1 ? 'Next' : "Let's Go! 🚀"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="sticky top-0 z-30 bg-dark-950/80 backdrop-blur-md border-b border-dark-700 px-4 py-3">
        <h1 className="text-xl font-bold">Home</h1>
      </div>

      {/* Composer Toggle */}
      {!showComposer && (
        <button onClick={function() { setShowComposer(true); }} className="w-full p-4 border-b border-dark-700 text-left text-dark-400 hover:bg-dark-800/50">
          <div className="flex items-center gap-3">
            <Avatar src={user ? user.avatar : null} name={user ? user.displayName : ''} />
            <span>Got an idea? Share it... 💡</span>
          </div>
        </button>
      )}

      {/* Composer */}
      {showComposer && (
        <div className="border-b border-dark-700 p-4">
          <div className="flex gap-3">
            <Avatar src={user ? user.avatar : null} name={user ? user.displayName : ''} />
            <div className="flex-1">
              <select value={selectedGenre} onChange={function(e) { setSelectedGenre(e.target.value); }} className="mb-3 text-sm bg-dark-800 border border-dark-600 rounded-full px-3 py-1.5 text-primary-500 focus:outline-none">
                <option value="">Select Genre</option>
                {genres.map(function(g) { return <option key={g.id} value={g.id}>{g.icon} {g.name}</option>; })}
              </select>
              <textarea value={content} onChange={function(e) { setContent(e.target.value); }} placeholder="Got an idea? Share it... 💡" className="w-full bg-transparent text-lg placeholder-dark-500 resize-none focus:outline-none" rows={4} maxLength={limits.maxChars + 100} />
              <div className="flex flex-wrap gap-2 mt-2">
                {limits.monetizeOptions.map(function(opt) {
                  return (
                    <button key={opt} type="button" onClick={function() { setMonetizeType(opt); }}
                      className={'text-xs px-3 py-1 rounded-full border transition-all ' + (monetizeType === opt ? 'bg-primary-500/20 border-primary-500 text-primary-500' : 'border-dark-600 text-dark-400')}>
                      {MONETIZE_LABELS[opt]}
                    </button>
                  );
                })}
              </div>
              {monetizeType === 'MONEY' && (
                <input type="number" value={askingPrice} onChange={function(e) { setAskingPrice(e.target.value); }} placeholder="Asking Price" className="input-field mt-2" min="1" />
              )}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-dark-700">
                <span className={'text-sm ' + (limits.maxChars - content.length < 0 ? 'text-red-500' : limits.maxChars - content.length < 50 ? 'text-yellow-500' : 'text-dark-400')}>
                  {limits.maxChars - content.length} chars left
                </span>
                <button onClick={handlePost} disabled={!content.trim() || content.length > limits.maxChars || !selectedGenre || posting} className="btn-primary py-2 px-6">
                  {posting ? 'Posting...' : '💡 Post Idea'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feed */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="w-8 h-8 border-2 border-dark-600 border-t-primary-500 rounded-full animate-spin" />
        </div>
      ) : ideas.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-6xl mb-4">💡</p>
          <p className="text-xl font-bold">No ideas yet</p>
          <p className="text-dark-400 mt-2">Be the first!</p>
        </div>
      ) : (
        <div>
          {ideas.map(function(idea) {
            return <IdeaCard key={idea.id} idea={idea} onLike={handleLike} onBookmark={handleBookmark} />;
          })}
          {hasMore && (
            <button onClick={function() { fetchFeed(page + 1); }} className="w-full py-4 text-primary-500 hover:bg-dark-800/50">
              Load more
            </button>
          )}
        </div>
      )}
    </div>
  );
}