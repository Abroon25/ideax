import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { timeAgo, formatNumber, formatCurrency, truncateText, getInitials } from '../utils/helpers';
import { MONETIZE_LABELS, CATEGORY_ICONS, TIER_LIMITS } from '../utils/constants';
import { HiOutlineHome, HiOutlineHashtag, HiOutlineBell, HiOutlineBookmark, HiOutlineUser, HiOutlineCog,
  HiOutlineSparkles, HiOutlineLightBulb, HiOutlineHeart, HiHeart, HiOutlineChatAlt2, HiOutlineBookmark as HiOutlineBM,
  HiBookmark, HiOutlineEye, HiOutlineShare, HiOutlineCash, HiOutlinePhotograph, HiOutlineChartBar } from 'react-icons/hi';

const Avatar = ({ src, name, size = 'w-10 h-10' }) => src
  ? <img src={src} alt={name} className={`${size} rounded-full object-cover`} />
  : <div className={`${size} rounded-full bg-primary-500 flex items-center justify-center font-bold text-white text-sm`}>{getInitials(name)}</div>;

const TierBadge = ({ tier }) => {
  const cls = { FREE: 'bg-dark-600 text-dark-300', BASIC: 'bg-blue-900/50 text-blue-400 border border-blue-800', PREMIUM: 'bg-amber-900/50 text-amber-400 border border-amber-800' };
  return <span className={`text-xs px-2 py-0.5 rounded-full ${cls[tier] || cls.FREE}`}>{tier}</span>;
};

const IdeaCard = ({ idea, onLike, onBookmark }) => {
  const navigate = useNavigate();
  return (
    <div className="idea-card" onClick={(e) => { if (!e.target.closest('button') && !e.target.closest('a')) navigate('/idea/' + idea.id); }}>
      <div className="flex gap-3">
        <Link to={'/profile/' + idea.author.username} onClick={(e) => e.stopPropagation()}><Avatar src={idea.author.avatar} name={idea.author.displayName} /></Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link to={'/profile/' + idea.author.username} onClick={(e) => e.stopPropagation()} className="font-bold hover:underline">{idea.author.displayName}</Link>
            <TierBadge tier={idea.author.tier} />
            <span className="text-dark-400 text-sm">@{idea.author.username}</span>
            <span className="text-dark-500">·</span>
            <span className="text-dark-400 text-sm">{timeAgo(idea.createdAt)}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs bg-dark-800 text-dark-300 px-2 py-0.5 rounded-full">{CATEGORY_ICONS[idea.category]} {idea.genre?.name}</span>
            {idea.monetizeType !== 'NONE' && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-900/50 text-green-400 border border-green-800">
                💰 {MONETIZE_LABELS[idea.monetizeType]}{idea.askingPrice ? ' · ' + formatCurrency(idea.askingPrice) : ''}{idea.profitSharePct ? ' · ' + idea.profitSharePct + '%' : ''}
              </span>
            )}
          </div>
          <div className="mt-2 text-[15px] leading-relaxed whitespace-pre-wrap break-words">{truncateText(idea.content, 500)}</div>
          {idea.attachments?.length > 0 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {idea.attachments.slice(0, 4).map((a) => a.fileType?.startsWith('image')
                ? <img key={a.id} src={a.fileUrl} alt="" className="h-40 rounded-lg object-cover" />
                : <div key={a.id} className="bg-dark-800 rounded-lg p-3 text-sm">📎 {a.fileName}</div>
              )}
            </div>
          )}
          <div className="flex items-center justify-between mt-3 max-w-md">
            <button onClick={(e) => { e.stopPropagation(); navigate('/idea/' + idea.id); }} className="flex items-center gap-1 text-dark-400 hover:text-primary-500">
              <HiOutlineChatAlt2 className="w-5 h-5" /><span className="text-sm">{formatNumber(idea._count?.comments)}</span>
            </button>
            <button onClick={(e) => { e.stopPropagation(); onLike(idea.id); }} className={`flex items-center gap-1 ${idea.isLiked ? 'text-pink-500' : 'text-dark-400 hover:text-pink-500'}`}>
              {idea.isLiked ? <HiHeart className="w-5 h-5" /> : <HiOutlineHeart className="w-5 h-5" />}<span className="text-sm">{formatNumber(idea._count?.likes)}</span>
            </button>
            <div className="flex items-center gap-1 text-dark-400"><HiOutlineEye className="w-5 h-5" /><span className="text-sm">{formatNumber(idea.viewCount)}</span></div>
            <button onClick={(e) => { e.stopPropagation(); onBookmark(idea.id); }} className={idea.isBookmarked ? 'text-primary-500' : 'text-dark-400 hover:text-primary-500'}>
              {idea.isBookmarked ? <HiBookmark className="w-5 h-5" /> : <HiOutlineBM className="w-5 h-5" />}
            </button>
            <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(window.location.origin + '/idea/' + idea.id); toast.success('Link copied!'); }} className="text-dark-400 hover:text-primary-500">
              <HiOutlineShare className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [genres, setGenres] = useState([]);
  const [content, setContent] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [monetizeType, setMonetizeType] = useState('NONE');
  const [askingPrice, setAskingPrice] = useState('');
  const [posting, setPosting] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const [showTour, setShowTour] = useState(!user?.tourCompleted);
  const [tourStep, setTourStep] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const limits = TIER_LIMITS[user?.tier || 'FREE'];

  useEffect(() => { api.get('/genres').then(({ data }) => setGenres(data.genres)).catch(() => {}); }, []);
  useEffect(() => { fetchFeed(1); }, []);

  const fetchFeed = async (p) => {
    try {
      const { data } = await api.get('/ideas/feed', { params: { page: p, limit: 20 } });
      if (p === 1) setIdeas(data.ideas); else setIdeas((prev) => [...prev, ...data.ideas]);
      setHasMore(data.pagination.hasMore);
      setPage(p);
    } catch {} finally { setLoading(false); }
  };

  const handlePost = async () => {
    if (!content.trim()) return toast.error('Write something!');
    if (!selectedGenre) return toast.error('Select a genre');
    setPosting(true);
    try {
      const formData = new FormData();
      formData.append('content', content.trim());
      formData.append('genreId', selectedGenre);
      formData.append('monetizeType', monetizeType);
      if (askingPrice) formData.append('askingPrice', askingPrice);

      const { data } = await api.post('/ideas', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Idea posted! 💡');
      setIdeas((p) => [data.idea, ...p]);
      setContent(''); setSelectedGenre(''); setMonetizeType('NONE'); setAskingPrice(''); setShowComposer(false);
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setPosting(false); }
  };

  const handleLike = async (id) => {
    try {
      const { data } = await api.post('/ideas/' + id + '/like');
      setIdeas((p) => p.map((i) => i.id === id ? { ...i, isLiked: data.liked, _count: { ...i._count, likes: i._count.likes + (data.liked ? 1 : -1) } } : i));
    } catch { toast.error('Failed'); }
  };

  const handleBookmark = async (id) => {
    try {
      const { data } = await api.post('/ideas/' + id + '/bookmark');
      setIdeas((p) => p.map((i) => i.id === id ? { ...i, isBookmarked: data.bookmarked } : i));
      toast.success(data.bookmarked ? 'Bookmarked!' : 'Removed');
    } catch { toast.error('Failed'); }
  };

  const finishTour = async () => {
    try { await api.post('/users/complete-tour'); updateUser({ tourCompleted: true }); } catch {}
    setShowTour(false);
  };

  const tourSteps = [
    { icon: '🚀', title: 'Welcome to IdeaX!', desc: 'The platform where your ideas have value. Post, sell, and monetize across categories.' },
    { icon: '📝', title: 'Post Your Ideas', desc: 'Click the Post Idea button, select a genre, write your idea, and optionally monetize it.' },
    { icon: '💰', title: 'Monetize', desc: 'Set price, profit share, shareholding, or partnership terms. Buyers can express interest.' },
    { icon: '⭐', title: 'Tier System', desc: 'FREE: 500 chars. BASIC (₹499/mo): 15K chars + files + money/profit. PREMIUM (₹1999/mo): 50K chars + all options + legal support.' },
    { icon: '🌟', title: 'Ready!', desc: 'Start exploring ideas or post your first brilliant idea!' },
  ];

  const navLinks = [
    { to: '/', icon: HiOutlineHome, label: 'Home' },
    { to: '/explore', icon: HiOutlineHashtag, label: 'Explore' },
    { to: '/notifications', icon: HiOutlineBell, label: 'Notifications' },
    { to: '/bookmarks', icon: HiOutlineBookmark, label: 'Bookmarks' },
    { to: '/tiers', icon: HiOutlineSparkles, label: 'Tiers' },
    { to: '/profile/' + user?.username, icon: HiOutlineUser, label: 'Profile' },
    { to: '/settings', icon: HiOutlineCog, label: 'Settings' },
  ];

  return (
    <div className="flex justify-center min-h-screen bg-dark-950">
      {/* Tour */}
      {showTour && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-950/90 backdrop-blur-md">
          <div className="max-w-md w-full mx-4 card p-8 text-center">
            <span className="text-6xl">{tourSteps[tourStep].icon}</span>
            <h2 className="text-2xl font-bold mt-4 mb-3">{tourSteps[tourStep].title}</h2>
            <p className="text-dark-300 mb-8">{tourSteps[tourStep].desc}</p>
            <div className="flex justify-center gap-2 mb-6">{tourSteps.map((_, i) => <div key={i} className={`h-2 rounded-full transition-all ${i === tourStep ? 'bg-primary-500 w-6' : 'bg-dark-600 w-2'}`} />)}</div>
            <div className="flex gap-3 justify-center">
              <button onClick={finishTour} className="btn-outline py-2 px-6">Skip</button>
              <button onClick={() => tourStep < tourSteps.length - 1 ? setTourStep(tourStep + 1) : finishTour()} className="btn-primary py-2 px-6">
                {tourStep < tourSteps.length - 1 ? 'Next' : "Let's Go! 🚀"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className="hidden lg:block w-[275px]">
        <div className="fixed w-[275px] h-screen flex flex-col justify-between py-2 px-3">
          <div>
            <div className="p-3 mb-2"><h1 className="text-2xl font-bold"><span className="text-primary-500">Idea</span>X 💡</h1></div>
            <nav className="space-y-1">
              {navLinks.map(({ to, icon: Icon, label }) => (
                <NavLink key={to} to={to} className={({ isActive }) => `sidebar-link ${isActive ? 'active font-bold' : 'text-dark-300'}`}>
                  <Icon className="w-7 h-7" /><span>{label}</span>
                </NavLink>
              ))}
            </nav>
            <button onClick={() => setShowComposer(true)} className="btn-primary w-full mt-4 py-3 text-lg flex items-center justify-center gap-2">
              <HiOutlineLightBulb className="w-5 h-5" /> Post Idea
            </button>
          </div>
          <button onClick={() => navigate('/profile/' + user?.username)} className="flex items-center gap-3 p-3 rounded-full hover:bg-dark-800 transition-colors mb-2">
            <Avatar src={user?.avatar} name={user?.displayName} size="w-8 h-8" />
            <div className="text-left min-w-0"><p className="font-bold text-sm truncate">{user?.displayName}</p><p className="text-sm text-dark-400 truncate">@{user?.username}</p></div>
          </button>
        </div>
      </div>

      {/* Main */}
      <main className="w-full max-w-[600px] border-x border-dark-700 min-h-screen">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-dark-950/80 backdrop-blur-md border-b border-dark-700 px-4 py-3">
          <h1 className="text-xl font-bold">Home</h1>
        </div>

        {/* Composer */}
        {showComposer && (
          <div className="border-b border-dark-700 p-4">
            <div className="flex gap-3">
              <Avatar src={user?.avatar} name={user?.displayName} />
              <div className="flex-1">
                <select value={selectedGenre} onChange={(e) => setSelectedGenre(e.target.value)} className="mb-3 text-sm bg-dark-800 border border-dark-600 rounded-full px-3 py-1.5 text-primary-500 focus:outline-none">
                  <option value="">Select Genre</option>
                  {genres.map((g) => <option key={g.id} value={g.id}>{g.icon} {g.name}</option>)}
                </select>
                <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Got an idea? Share it... 💡" className="w-full bg-transparent text-lg placeholder-dark-500 resize-none focus:outline-none" rows={4} maxLength={limits.maxChars + 100} />

                {/* Monetize selector */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {limits.monetizeOptions.map((opt) => (
                    <button key={opt} type="button" onClick={() => setMonetizeType(opt)}
                      className={`text-xs px-3 py-1 rounded-full border transition-all ${monetizeType === opt ? 'bg-primary-500/20 border-primary-500 text-primary-500' : 'border-dark-600 text-dark-400'}`}>
                      {MONETIZE_LABELS[opt]}
                    </button>
                  ))}
                </div>
                {monetizeType === 'MONEY' && <input type="number" value={askingPrice} onChange={(e) => setAskingPrice(e.target.value)} placeholder="Asking Price (₹)" className="input-field mt-2" min="1" />}

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-dark-700">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${limits.maxChars - content.length < 0 ? 'text-red-500' : limits.maxChars - content.length < 50 ? 'text-yellow-500' : 'text-dark-400'}`}>
                      {limits.maxChars - content.length} chars left
                    </span>
                  </div>
                  <button onClick={handlePost} disabled={!content.trim() || content.length > limits.maxChars || !selectedGenre || posting} className="btn-primary py-2 px-6">
                    {posting ? 'Posting...' : '💡 Post Idea'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Composer toggle (mobile) */}
        {!showComposer && (
          <button onClick={() => setShowComposer(true)} className="w-full p-4 border-b border-dark-700 text-left text-dark-400 hover:bg-dark-800/50">
            <div className="flex items-center gap-3">
              <Avatar src={user?.avatar} name={user?.displayName} />
              <span>Got an idea? Share it... 💡</span>
            </div>
          </button>
        )}

        {/* Feed */}
        {loading ? (
          <div className="py-20 flex justify-center"><div className="w-8 h-8 border-2 border-dark-600 border-t-primary-500 rounded-full animate-spin" /></div>
        ) : ideas.length === 0 ? (
          <div className="py-20 text-center"><p className="text-6xl mb-4">💡</p><p className="text-xl font-bold">No ideas yet</p><p className="text-dark-400 mt-2">Be the first!</p></div>
        ) : (
          <>
            {ideas.map((idea) => <IdeaCard key={idea.id} idea={idea} onLike={handleLike} onBookmark={handleBookmark} />)}
            {hasMore && <button onClick={() => fetchFeed(page + 1)} className="w-full py-4 text-primary-500 hover:bg-dark-800/50">Load more</button>}
          </>
        )}
      </main>

      {/* Right panel */}
      <div className="hidden xl:block w-[350px]">
        <div className="fixed w-[350px] h-screen py-4 px-6 overflow-y-auto">
          <div className="card p-4 mb-4">
            <h3 className="font-bold mb-3">💳 Pay Per Post</h3>
            <div className="space-y-1 text-sm text-dark-300">
              <p>₹1 / 50 extra characters</p><p>₹1 / 5MB extra storage</p><p>₹10 to unlock monetization</p>
            </div>
            <Link to="/tiers" className="text-primary-500 text-sm hover:underline mt-3 inline-block">View tiers →</Link>
          </div>
          <div className="card p-4">
            <h3 className="font-bold mb-3">🔥 Trending Genres</h3>
            {genres.slice(0, 6).map((g) => (
              <Link key={g.id} to={'/explore?category=' + g.category} className="flex items-center gap-2 p-2 hover:bg-dark-700 rounded-lg">
                <span>{g.icon}</span><span className="text-sm">{g.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-dark-900 border-t border-dark-700 flex justify-around py-2 lg:hidden z-40">
        {[{ to: '/', icon: HiOutlineHome }, { to: '/explore', icon: HiOutlineHashtag }, { to: '/notifications', icon: HiOutlineBell }, { to: '/bookmarks', icon: HiOutlineBookmark }, { to: '/profile/' + user?.username, icon: HiOutlineUser }].map(({ to, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `p-3 ${isActive ? 'text-primary-500' : 'text-dark-400'}`}><Icon className="w-6 h-6" /></NavLink>
        ))}
      </div>
    </div>
  );
}
