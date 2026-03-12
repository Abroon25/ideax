import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { timeAgo, formatNumber, formatCurrency, truncateText, getInitials } from '../utils/helpers';
import { MONETIZE_LABELS, CATEGORY_ICONS, TIER_LIMITS } from '../utils/constants';
import {
  HiOutlineHeart, HiHeart, HiOutlineChatAlt2, HiOutlineEye, HiOutlineShare, 
  HiOutlineCash, HiOutlinePhotograph, HiOutlineX, HiOutlineChevronDoubleRight, HiOutlineChevronDoubleLeft
} from 'react-icons/hi';
import { HiOutlineBookmark as HiOutlineBM, HiBookmark } from 'react-icons/hi2';

// --- Rich Text Parser ---
function RichText({ text }) {
  if (!text) return null;
  const parts = text.split(/(@\w+|#\w+)/g);
  return (
    <span className="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-white">
      {parts.map((part, i) => {
        if (part.startsWith('@')) return <Link key={i} to={`/profile/${part.slice(1)}`} onClick={e => e.stopPropagation()} className="text-primary-500 hover:underline">{part}</Link>;
        if (part.startsWith('#')) return <Link key={i} to={`/search?q=${encodeURIComponent(part)}`} onClick={e => e.stopPropagation()} className="text-primary-500 hover:underline">{part}</Link>;
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

function Avatar({ src, name, size }) {
  var s = size || 'w-10 h-10';
  if (src) return <img src={src} alt={name} className={s + ' rounded-full object-cover'} />;
  return <div className={s + ' rounded-full bg-primary-500 flex items-center justify-center font-bold text-white text-sm'}>{getInitials(name)}</div>;
}

// --- Hover Profile Card Component ---
function HoverProfile({ user, children }) {
  return (
    <div className="group relative inline-block">
      {children}
      <div className="absolute top-full left-0 mt-2 w-72 bg-dark-950 border border-dark-700 rounded-2xl p-4 shadow-[0_0_15px_rgba(255,255,255,0.1)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-30 delay-500">
         <div className="flex justify-between items-start">
           <Avatar src={user.avatar} name={user.displayName} size="w-14 h-14" />
           <span className="bg-dark-800 text-xs px-3 py-1 rounded-full text-white font-bold border border-dark-600">{user.tier}</span>
         </div>
         <p className="font-extrabold text-lg mt-2 text-white hover:underline cursor-pointer">{user.displayName}</p>
         <p className="text-dark-400 text-[15px]">@{user.username}</p>
         {user.bio && <p className="text-white text-[15px] mt-3 line-clamp-2">{user.bio}</p>}
         <div className="flex gap-4 mt-4 text-[15px] text-dark-400">
            <span><strong className="text-white">--</strong> Following</span>
            <span><strong className="text-white">--</strong> Followers</span>
         </div>
      </div>
    </div>
  );
}

function CircularProgress({ current, max }) {
  const percentage = Math.min((current / max) * 100, 100);
  const strokeColor = current > max ? '#ef4444' : current > max - 20 ? '#f59e0b' : '#1DA1F2';
  return (
    <div className="relative w-6 h-6 flex items-center justify-center">
      <svg className="transform -rotate-90 w-full h-full">
        <circle cx="12" cy="12" r="10" stroke="#334155" strokeWidth="2" fill="none" />
        <circle cx="12" cy="12" r="10" stroke={strokeColor} strokeWidth="2" fill="none" strokeDasharray="62.83" strokeDashoffset={62.83 - (62.83 * percentage) / 100} className="transition-all duration-300" />
      </svg>
    </div>
  );
}

function IdeaCard({ idea, onLike, onBookmark, onImageClick }) {
  var navigate = useNavigate();
  return (
    <div className="border-b border-dark-700 p-4 hover:bg-dark-900/30 transition-colors cursor-pointer" onClick={(e) => { if (!e.target.closest('button') && !e.target.closest('a')) navigate('/idea/' + idea.id); }}>
      <div className="flex gap-3">
        <HoverProfile user={idea.author}>
          <Link to={'/profile/' + idea.author.username} onClick={e => e.stopPropagation()}>
            <Avatar src={idea.author.avatar} name={idea.author.displayName} />
          </Link>
        </HoverProfile>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-[15px]">
            <HoverProfile user={idea.author}>
              <Link to={'/profile/' + idea.author.username} onClick={e => e.stopPropagation()} className="font-bold hover:underline text-white truncate">
                {idea.author.displayName}
              </Link>
            </HoverProfile>
            <span className="text-dark-400 truncate">@{idea.author.username}</span>
            <span className="text-dark-500">·</span>
            <span className="text-dark-400 hover:underline">{timeAgo(idea.createdAt)}</span>
          </div>
          
          <div className="mt-1">
            <RichText text={idea.content} />
          </div>

          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-primary-500 hover:underline">{CATEGORY_ICONS[idea.category]} {idea.genre ? idea.genre.name : ''}</span>
            {idea.monetizeType !== 'NONE' && (
              <span className="text-xs px-2 py-0.5 rounded bg-green-900/30 text-green-400 font-medium">
                {MONETIZE_LABELS[idea.monetizeType]} {idea.askingPrice ? ` · ${formatCurrency(idea.askingPrice)}` : ''}
              </span>
            )}
          </div>

          {idea.attachments && idea.attachments.length > 0 && (
            <div className={`mt-3 grid gap-2 ${idea.attachments.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {idea.attachments.slice(0, 4).map(a => 
                a.fileType?.startsWith('image') ? (
                  <img 
                    key={a.id} 
                    src={a.fileUrl} 
                    onClick={(e) => { e.stopPropagation(); onImageClick(idea, a.fileUrl); }}
                    className="rounded-2xl border border-dark-700 object-cover w-full max-h-[300px] hover:opacity-80 transition-opacity" 
                    alt="attachment" 
                  />
                ) : null
              )}
            </div>
          )}

          <div className="flex items-center justify-between mt-3 text-dark-400 max-w-md">
            <button onClick={e => { e.stopPropagation(); navigate('/idea/' + idea.id); }} className="flex items-center gap-2 hover:text-primary-500 group transition-colors">
              <div className="p-2 rounded-full group-hover:bg-primary-500/10"><HiOutlineChatAlt2 className="w-5 h-5" /></div>
              <span className="text-sm">{formatNumber(idea._count?.comments)}</span>
            </button>
            <button onClick={e => { e.stopPropagation(); onLike(idea.id); }} className={`flex items-center gap-2 group transition-colors ${idea.isLiked ? 'text-pink-500' : 'hover:text-pink-500'}`}>
              <div className="p-2 rounded-full group-hover:bg-pink-500/10">{idea.isLiked ? <HiHeart className="w-5 h-5" /> : <HiOutlineHeart className="w-5 h-5" />}</div>
              <span className="text-sm">{formatNumber(idea._count?.likes)}</span>
            </button>
            <div className="flex items-center gap-2 group">
              <div className="p-2 rounded-full"><HiOutlineEye className="w-5 h-5" /></div>
              <span className="text-sm">{formatNumber(idea.viewCount)}</span>
            </div>
            <button onClick={e => { e.stopPropagation(); onBookmark(idea.id); }} className={`flex items-center gap-2 group transition-colors ${idea.isBookmarked ? 'text-primary-500' : 'hover:text-primary-500'}`}>
              <div className="p-2 rounded-full group-hover:bg-primary-500/10">{idea.isBookmarked ? <HiBookmark className="w-5 h-5" /> : <HiOutlineBM className="w-5 h-5" />}</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [genres, setGenres] = useState([]);
  
  // Composer state
  const [content, setContent] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [monetizeType, setMonetizeType] = useState('NONE');
  const [askingPrice, setAskingPrice] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [posting, setPosting] = useState(false);
  const fileInputRef = useRef(null);

  // Advanced Lightbox State
  const [lightboxData, setLightboxData] = useState(null); // { idea, imageUrl }
  const [showLightboxSidebar, setShowLightboxSidebar] = useState(true);

  // Infinite Scroll state
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef();

  const limits = TIER_LIMITS[user?.tier || 'FREE'];

  useEffect(() => { api.get('/genres').then(res => setGenres(res.data.genres)).catch(() => {}); }, []);

  const fetchFeed = useCallback(async (p) => {
    try {
      const res = await api.get('/ideas/feed', { params: { page: p, limit: 15 } });
      setIdeas(prev => p === 1 ? res.data.ideas : [...prev, ...res.data.ideas]);
      setHasMore(res.data.pagination.hasMore);
      setPage(p);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchFeed(1); }, [fetchFeed]);

  const lastIdeaRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) fetchFeed(page + 1);
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore, page, fetchFeed]);

  const handleMediaSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + mediaFiles.length > 4) return toast.error('Max 4 images allowed');
    const newFiles = files.map(file => ({ file, preview: URL.createObjectURL(file) }));
    setMediaFiles(prev => [...prev, ...newFiles]);
  };

  const removeMedia = (index) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handlePost = async () => {
    if (!content.trim()) return toast.error('Write something!');
    if (!selectedGenre) return toast.error('Select a genre');
    setPosting(true);
    
    const formData = new FormData();
    formData.append('content', content.trim());
    formData.append('genreId', selectedGenre);
    formData.append('monetizeType', monetizeType);
    if (askingPrice) formData.append('askingPrice', askingPrice);
    mediaFiles.forEach(m => formData.append('files', m.file));

    try {
      const res = await api.post('/ideas', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Your idea was sent.');
      setIdeas(prev => [res.data.idea, ...prev]);
      setContent(''); setSelectedGenre(''); setMonetizeType('NONE'); setAskingPrice(''); setMediaFiles([]);
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setPosting(false); }
  };

  const handleLike = (id) => {
    api.post(`/ideas/${id}/like`).then(res => {
      setIdeas(prev => prev.map(i => i.id === id ? { ...i, isLiked: res.data.liked, _count: { ...i._count, likes: i._count.likes + (res.data.liked ? 1 : -1) } } : i));
      if (lightboxData && lightboxData.idea.id === id) {
        setLightboxData(p => ({ ...p, idea: { ...p.idea, isLiked: res.data.liked, _count: { ...p.idea._count, likes: p.idea._count.likes + (res.data.liked ? 1 : -1) } } }));
      }
    });
  };

  const handleBookmark = (id) => {
    api.post(`/ideas/${id}/bookmark`).then(res => {
      setIdeas(prev => prev.map(i => i.id === id ? { ...i, isBookmarked: res.data.bookmarked } : i));
      toast.success(res.data.bookmarked ? 'Bookmarked' : 'Removed from Bookmarks');
    });
  };

  // Prevent scrolling when Lightbox is open
  useEffect(() => {
    if (lightboxData) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
  }, [lightboxData]);

  return (
    <div>
      {/* --- TWITTER STYLE LIGHTBOX --- */}
      {lightboxData && (
        <div className="fixed inset-0 z-[200] flex bg-black/90 backdrop-blur-sm">
          {/* Close Button */}
          <button onClick={() => setLightboxData(null)} className="absolute top-4 left-4 z-[210] p-3 rounded-full hover:bg-white/10 text-white transition-colors">
            <HiOutlineX className="w-6 h-6" />
          </button>

          {/* Toggle Sidebar Button */}
          <button onClick={() => setShowLightboxSidebar(!showLightboxSidebar)} className="absolute top-4 right-4 z-[210] p-3 rounded-full hover:bg-white/10 text-white transition-colors lg:hidden">
            {showLightboxSidebar ? <HiOutlineChevronDoubleRight className="w-6 h-6" /> : <HiOutlineChatAlt2 className="w-6 h-6" />}
          </button>

          {/* Left: Fullscreen Image */}
          <div className="flex-1 flex items-center justify-center p-4 relative cursor-default" onClick={() => setLightboxData(null)}>
             <img src={lightboxData.imageUrl} className="max-w-full max-h-full object-contain select-none shadow-2xl" onClick={e => e.stopPropagation()} alt="Fullscreen" />
          </div>

          {/* Right: Idea Info & Comments Sidebar */}
          {showLightboxSidebar && (
            <div className="w-[350px] bg-dark-950 border-l border-dark-700 h-full overflow-y-auto flex flex-col shadow-2xl z-[205] transition-all absolute lg:relative right-0">
              <div className="p-4 border-b border-dark-700">
                 <div className="flex items-center gap-3">
                   <Avatar src={lightboxData.idea.author.avatar} name={lightboxData.idea.author.displayName} />
                   <div>
                     <p className="font-bold text-white leading-tight hover:underline cursor-pointer">{lightboxData.idea.author.displayName}</p>
                     <p className="text-dark-400 text-[15px]">@{lightboxData.idea.author.username}</p>
                   </div>
                 </div>
                 <div className="mt-4 text-[15px] leading-relaxed text-white whitespace-pre-wrap">
                   <RichText text={lightboxData.idea.content} />
                 </div>
                 <p className="text-dark-400 text-[15px] mt-4">{timeAgo(lightboxData.idea.createdAt)}</p>
                 
                 <div className="flex items-center justify-around mt-4 pt-4 border-t border-dark-700">
                    <button className="text-dark-400 hover:text-primary-500 flex items-center gap-2"><HiOutlineChatAlt2 className="w-5 h-5"/>{lightboxData.idea._count?.comments}</button>
                    <button onClick={() => handleLike(lightboxData.idea.id)} className={`flex items-center gap-2 ${lightboxData.idea.isLiked ? 'text-pink-500' : 'text-dark-400 hover:text-pink-500'}`}>
                      {lightboxData.idea.isLiked ? <HiHeart className="w-5 h-5"/> : <HiOutlineHeart className="w-5 h-5"/>}{lightboxData.idea._count?.likes}
                    </button>
                    <button className="text-dark-400 hover:text-primary-500"><HiOutlineShare className="w-5 h-5"/></button>
                 </div>
              </div>
              <div className="flex-1 p-4 flex flex-col items-center justify-center text-dark-400">
                <p>Comments load here...</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Page Content */}
      <div className="sticky top-0 z-30 bg-dark-950/80 backdrop-blur-md border-b border-dark-700 px-4 py-3 cursor-pointer" onClick={() => window.scrollTo({top:0, behavior:'smooth'})}>
        <h1 className="text-xl font-bold">Home</h1>
      </div>

      <div className="border-b border-dark-700 p-4 flex gap-3">
        <Avatar src={user?.avatar} name={user?.displayName} />
        <div className="flex-1">
          <select value={selectedGenre} onChange={e => setSelectedGenre(e.target.value)} className="mb-2 text-sm bg-transparent text-primary-500 font-bold focus:outline-none appearance-none cursor-pointer">
            <option value="" className="bg-dark-900 text-white">Select Genre ▾</option>
            {genres.map(g => <option key={g.id} value={g.id} className="bg-dark-900 text-white">{g.icon} {g.name}</option>)}
          </select>
          
          <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="What is happening?!" className="w-full bg-transparent text-xl placeholder-dark-500 resize-none focus:outline-none min-h-[60px]" maxLength={limits.maxChars} />

          {mediaFiles.length > 0 && (
            <div className="flex gap-2 overflow-x-auto py-2">
              {mediaFiles.map((m, i) => (
                <div key={i} className="relative flex-shrink-0">
                  <img src={m.preview} alt="preview" className="h-32 rounded-2xl object-cover" />
                  <button onClick={() => removeMedia(i)} className="absolute top-1 right-1 bg-dark-950/80 p-1 rounded-full text-white hover:bg-dark-800 transition"><HiOutlineX /></button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-2 pt-2 border-t border-dark-700">
            <div className="flex gap-1 text-primary-500">
              <button onClick={() => fileInputRef.current.click()} className="p-2 rounded-full hover:bg-primary-500/10 transition-colors tooltip"><HiOutlinePhotograph className="w-5 h-5" /></button>
              <input type="file" ref={fileInputRef} hidden accept="image/*" multiple onChange={handleMediaSelect} />
            </div>
            
            <div className="flex items-center gap-3">
              {content.length > 0 && <CircularProgress current={content.length} max={limits.maxChars} />}
              <button onClick={handlePost} disabled={!content.trim() || posting} className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-1.5 px-5 rounded-full disabled:opacity-50">
                {posting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading && ideas.length === 0 ? (
        <div className="py-20 flex justify-center"><div className="w-8 h-8 border-2 border-dark-600 border-t-primary-500 rounded-full animate-spin" /></div>
      ) : (
        <>
          {ideas.map((idea, index) => {
            if (ideas.length === index + 1) return <div ref={lastIdeaRef} key={idea.id}><IdeaCard idea={idea} onLike={handleLike} onBookmark={handleBookmark} onImageClick={(idea, url) => setLightboxData({idea, imageUrl: url})} /></div>;
            return <IdeaCard key={idea.id} idea={idea} onLike={handleLike} onBookmark={handleBookmark} onImageClick={(idea, url) => setLightboxData({idea, imageUrl: url})} />;
          })}
        </>
      )}
    </div>
  );
}