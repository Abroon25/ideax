import { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getInitials } from '../utils/helpers';
import { TIER_LIMITS, MONETIZE_LABELS } from '../utils/constants';
import toast from 'react-hot-toast';

import {
  HiOutlineHome, HiHome,
  HiOutlineHashtag, HiHashtag,
  HiOutlineBell, HiBell,
  HiOutlineBookmark, HiBookmark,
  HiOutlineUser, HiUser,
  HiOutlineCog, HiCog,
  HiOutlineLightBulb,
  HiOutlineChartBar, HiChartBar,
  HiOutlineShieldCheck, HiShieldCheck,
  HiOutlineBriefcase, HiBriefcase,
  HiOutlineDotsHorizontal, HiCheck,
  HiOutlineMail, HiMail,
  HiOutlineX,
  HiOutlinePhotograph,
  HiOutlineCash
} from 'react-icons/hi';
import { HiMagnifyingGlass } from 'react-icons/hi2';
import api from '../services/api';

function Avatar({ src, name }) {
  if (src) return <img src={src} alt={name} className="w-10 h-10 rounded-full object-cover" />;
  return <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center font-bold text-white text-sm">{getInitials(name)}</div>;
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

export default function Layout({ children }) {
  // ★ FIX 1: Use otherAccounts from context (not savedAccounts)
  const { user, logout, otherAccounts, switchAccount, prepareAddAccount } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [genres, setGenres] = useState([]);
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  // Global Composer Modal State
  const [showComposerModal, setShowComposerModal] = useState(false);
  const [content, setContent] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [monetizeType, setMonetizeType] = useState('NONE');
  const [askingPrice, setAskingPrice] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [posting, setPosting] = useState(false);
  const fileInputRef = useRef(null);

  const limits = TIER_LIMITS[user?.tier || 'FREE'];

  // ★ FIX 2: REMOVED the manual filter line that was here
  // const otherAccounts = ... ← DELETED (now comes from context)

  useEffect(() => {
    if (showComposerModal) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [showComposerModal]);

  useEffect(() => {
    api.get('/genres').then(res => setGenres(res.data.genres)).catch(() => {});
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    if (searchQuery.trim().length >= 2) navigate('/search?q=' + encodeURIComponent(searchQuery.trim()));
  }

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
      await api.post('/ideas', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Your idea was sent.');
      setContent(''); setSelectedGenre(''); setMonetizeType('NONE'); setAskingPrice(''); setMediaFiles([]);
      setShowComposerModal(false);

      if (location.pathname === '/') window.location.reload();
      else navigate('/');
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setPosting(false); }
  };

  const navLinks = [
    { to: '/', outline: HiOutlineHome, solid: HiHome, label: 'Home' },
    { to: '/explore', outline: HiOutlineHashtag, solid: HiHashtag, label: 'Explore' },
    { to: '/notifications', outline: HiOutlineBell, solid: HiBell, label: 'Notifications' },
    { to: '/messages', outline: HiOutlineMail, solid: HiMail, label: 'Messages' },
    { to: '/bookmarks', outline: HiOutlineBookmark, solid: HiBookmark, label: 'Bookmarks' },
    { to: '/purchases', outline: HiOutlineBriefcase, solid: HiBriefcase, label: 'Wallet & NDAs' },
    { to: '/analytics', outline: HiOutlineChartBar, solid: HiChartBar, label: 'Analytics' },
    { to: '/profile/' + (user ? user.username : ''), outline: HiOutlineUser, solid: HiUser, label: 'Profile' },
    { to: '/settings', outline: HiOutlineCog, solid: HiCog, label: 'Settings' }
  ];

  if (user && user.role === 'ADMIN') {
    navLinks.push({ to: '/admin', outline: HiOutlineShieldCheck, solid: HiShieldCheck, label: 'Admin Panel' });
  }

  return (
    <div className="flex justify-center min-h-screen bg-dark-950">

      {/* GLOBAL COMPOSER MODAL */}
      {showComposerModal && (
        <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center bg-dark-950/80 sm:bg-dark-950/60 backdrop-blur-sm pt-0 sm:pt-10">
          <div className="bg-dark-950 sm:bg-dark-900 w-full max-w-[600px] h-full sm:h-auto sm:rounded-2xl shadow-2xl flex flex-col relative sm:border border-dark-700">

            <div className="flex items-center justify-between px-4 py-3 border-b border-dark-700 sm:border-transparent">
              <button onClick={() => setShowComposerModal(false)} className="p-2 hover:bg-dark-800 rounded-full transition-colors text-white">
                <HiOutlineX className="w-5 h-5" />
              </button>
              <div className="sm:hidden">
                <button onClick={handlePost} disabled={!content.trim() || content.length > limits.maxChars || !selectedGenre || posting} className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-1.5 px-5 rounded-full disabled:opacity-50 transition-colors">
                  {posting ? 'Posting...' : 'Post'}
                </button>
              </div>
            </div>

            <div className="p-4 flex gap-3 overflow-y-auto">
              <Avatar src={user?.avatar} name={user?.displayName} />
              <div className="flex-1 min-w-0 pb-10">
                <select value={selectedGenre} onChange={e => setSelectedGenre(e.target.value)} className="mb-2 text-sm bg-transparent text-primary-500 font-bold focus:outline-none appearance-none cursor-pointer">
                  <option value="" className="bg-dark-900 text-white">Select Genre ▾</option>
                  {genres.map(g => <option key={g.id} value={g.id} className="bg-dark-900 text-white">{g.icon} {g.name}</option>)}
                </select>

                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="What is happening?!"
                  className="w-full bg-transparent text-xl placeholder-dark-500 resize-none focus:outline-none min-h-[120px] text-white"
                  maxLength={limits.maxChars}
                />

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

                {monetizeType !== 'NONE' && (
                  <div className="bg-dark-800 p-3 rounded-xl mt-3 border border-dark-700">
                    <p className="text-xs text-dark-400 font-bold mb-2">MONETIZATION: {MONETIZE_LABELS[monetizeType]}</p>
                    {monetizeType === 'MONEY' && <input type="number" value={askingPrice} onChange={e => setAskingPrice(e.target.value)} placeholder="Asking Price (INR)" className="w-full bg-transparent border-b border-dark-600 focus:border-primary-500 focus:outline-none py-1 text-white" />}
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-dark-700 p-3 flex items-center justify-between sticky bottom-0 bg-dark-950 sm:bg-dark-900 sm:rounded-b-2xl">
              <div className="flex gap-1 text-primary-500">
                <button onClick={() => fileInputRef.current.click()} className="p-2 rounded-full hover:bg-primary-500/10 transition-colors tooltip"><HiOutlinePhotograph className="w-5 h-5" /></button>
                <input type="file" ref={fileInputRef} hidden accept="image/*" multiple onChange={handleMediaSelect} />
                <button onClick={() => setMonetizeType(monetizeType === 'NONE' ? 'MONEY' : 'NONE')} className="p-2 rounded-full hover:bg-primary-500/10 transition-colors"><HiOutlineCash className="w-5 h-5" /></button>
              </div>

              <div className="flex items-center gap-3">
                {content.length > 0 && (
                  <>
                    <CircularProgress current={content.length} max={limits.maxChars} />
                    <div className="hidden sm:block w-[1px] h-6 bg-dark-700 mx-1"></div>
                  </>
                )}
                <button onClick={handlePost} disabled={!content.trim() || content.length > limits.maxChars || !selectedGenre || posting} className="hidden sm:block bg-primary-500 hover:bg-primary-600 text-white font-bold py-1.5 px-5 rounded-full disabled:opacity-50 transition-colors">
                  {posting ? 'Posting...' : 'Post'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Overlay to close account menu — z-40 stays BELOW sidebar */}
      {showAccountMenu && <div className="fixed inset-0 z-40" onClick={() => setShowAccountMenu(false)}></div>}

      {/* Left Sidebar */}
      <div className="hidden sm:flex flex-col xl:w-[275px] w-[80px] items-center xl:items-stretch">
        {/* ★ FIX 3: z-30 → z-50 so sidebar sits ABOVE the overlay */}
        <div className="fixed xl:w-[275px] w-[80px] h-screen flex flex-col justify-between py-4 px-2 xl:px-4 overflow-y-auto z-50">
          <div className="flex flex-col items-center xl:items-stretch">
            <Link to="/" className="text-2xl font-bold p-3 mb-2 flex items-center justify-center xl:justify-start hover:bg-dark-900 rounded-full w-fit transition-colors">
              <span className="text-primary-500 xl:hidden">💡</span>
              <span className="hidden xl:inline"><span className="text-primary-500">Idea</span>X 💡</span>
            </Link>

            <nav className="space-y-1 w-full flex flex-col items-center xl:items-stretch">
              {navLinks.map(item => (
                <NavLink key={item.to} to={item.to} end={item.to === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-4 p-3 xl:px-4 xl:py-3 rounded-full hover:bg-dark-900 w-fit xl:w-full transition-colors ${isActive ? 'font-bold text-white' : 'text-dark-200 hover:text-white'}`
                  }>
                  {({ isActive }) => (
                    <>
                      {isActive ? <item.solid className="w-7 h-7" /> : <item.outline className="w-7 h-7" />}
                      <span className="hidden xl:inline text-[20px]">{item.label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </nav>

            <button onClick={() => setShowComposerModal(true)} className="bg-primary-500 hover:bg-primary-600 text-white font-bold w-14 h-14 xl:w-full xl:h-auto xl:py-3.5 mt-4 rounded-full flex items-center justify-center gap-2 transition-all shadow-[0_4px_14px_rgba(29,161,242,0.4)]">
              <HiOutlineLightBulb className="w-6 h-6 xl:hidden" />
              <span className="hidden xl:inline text-lg">Post Idea</span>
            </button>
          </div>

          {/* ACCOUNT SWITCHER */}
          {user && (
            <div className="relative mt-4">
              {showAccountMenu && (
                // ★ FIX 4: z-50 → z-[60] so popup sits ABOVE sidebar
                <div className="absolute bottom-20 left-0 w-[300px] bg-dark-950 border border-dark-700 rounded-2xl shadow-[0_0_15px_rgba(255,255,255,0.1)] py-2 z-[60] overflow-hidden">

                  {/* Current Active Account */}
                  <div className="px-4 py-3 border-b border-dark-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar src={user.avatar} name={user.displayName} />
                      <div>
                        <p className="font-bold text-sm text-white">{user.displayName}</p>
                        <p className="text-xs text-dark-400">@{user.username}</p>
                      </div>
                    </div>
                    <HiCheck className="text-primary-500 w-5 h-5" />
                  </div>

                  {/* ★ FIX 5: otherAccounts from context + switchAccount(username) */}
                  {otherAccounts.map(acc => (
                    <button
                      key={acc.user.username}
                      onClick={() => switchAccount(acc.user.username)}
                      className="w-full px-4 py-3 hover:bg-dark-800 flex items-center gap-3 transition-colors text-left"
                    >
                      <Avatar src={acc.user.avatar} name={acc.user.displayName} />
                      <div>
                        <p className="font-bold text-sm text-white">{acc.user.displayName}</p>
                        <p className="text-xs text-dark-400">@{acc.user.username}</p>
                      </div>
                    </button>
                  ))}

                  <button
                    onClick={prepareAddAccount}
                    className="w-full px-4 py-4 hover:bg-dark-800 text-left border-t border-dark-700 font-bold transition-colors"
                  >
                    Add an existing account
                  </button>

                  <button
                    onClick={logout}
                    className="w-full px-4 py-4 hover:bg-dark-800 text-left font-bold transition-colors"
                  >
                    Log out @{user.username}
                  </button>
                </div>
              )}

              <button
                onClick={() => setShowAccountMenu(!showAccountMenu)}
                className="flex items-center justify-center xl:justify-between p-3 rounded-full hover:bg-dark-900 transition-colors w-full text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar src={user.avatar} name={user.displayName} />
                  <div className="hidden xl:block min-w-0 flex-1">
                    <p className="font-bold text-[15px] leading-tight truncate text-white">{user.displayName}</p>
                    <p className="text-[15px] text-dark-400 truncate">@{user.username}</p>
                  </div>
                </div>
                <div className="hidden xl:block text-dark-300">
                  <HiOutlineDotsHorizontal className="w-5 h-5" />
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="w-full max-w-[600px] border-x border-dark-700 min-h-screen pb-16 sm:pb-0">
        {children}
      </main>

      {/* Right Panel */}
      <div className="hidden lg:block w-[350px]">
        <div className="fixed w-[350px] h-screen py-3 px-6 overflow-y-auto flex flex-col gap-4">
          <form onSubmit={handleSearch} className="relative shrink-0 sticky top-0 bg-dark-950 pt-1 pb-2 z-10">
            <HiMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search IdeaX" className="w-full bg-dark-900 border border-transparent focus:border-primary-500 rounded-full pl-12 pr-4 py-3 text-[15px] focus:outline-none focus:bg-dark-950 transition-all" />
          </form>

          <div className="bg-dark-900 rounded-2xl p-4 shrink-0 border border-dark-800">
            <h3 className="font-extrabold text-xl mb-2 text-white">💳 Pay Per Post</h3>
            <div className="space-y-1.5 text-[15px] text-dark-200">
              <p>₹1 / 50 extra characters</p>
              <p>₹1 / 5MB extra storage</p>
              <p>₹10 to unlock monetization</p>
            </div>
            <Link to="/tiers" className="text-primary-500 text-[15px] font-bold hover:underline mt-3 inline-block">
              View all tiers →
            </Link>
          </div>

          <div className="bg-dark-900 rounded-2xl pt-4 pb-2 shrink-0 border border-dark-800">
            <h3 className="text-xl font-extrabold mb-2 px-4 text-white">What's happening</h3>
            <div className="flex flex-col">
              {genres.slice(0, 5).map(g => (
                <Link key={g.id} to={'/explore?category=' + g.category} className="hover:bg-dark-800 px-4 py-3 transition-colors">
                  <p className="text-[13px] text-dark-400 flex justify-between">{g.category.replace('_', ' ')} <HiOutlineDotsHorizontal className="w-4 h-4" /></p>
                  <p className="font-bold text-[15px] text-white mt-0.5">{g.icon} {g.name}</p>
                </Link>
              ))}
            </div>
            <Link to="/explore" className="text-primary-500 text-[15px] px-4 py-3 hover:bg-dark-800 rounded-b-2xl block transition-colors">Show more</Link>
          </div>

          <div className="text-[13px] text-dark-400 px-4 pb-6 mt-2 flex flex-wrap gap-x-3 gap-y-1">
            <span className="hover:underline cursor-pointer">Terms of Service</span>
            <span className="hover:underline cursor-pointer">Privacy Policy</span>
            <span className="hover:underline cursor-pointer">Cookie Policy</span>
            <span className="hover:underline cursor-pointer">Accessibility</span>
            <span className="hover:underline cursor-pointer">Ads info</span>
            <span>© 2026 IdeaX Corp.</span>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-dark-950/90 backdrop-blur-md border-t border-dark-700 flex justify-around py-2 sm:hidden z-40">
        {[
          { to: '/', outline: HiOutlineHome, solid: HiHome },
          { to: '/search', outline: HiMagnifyingGlass, solid: HiMagnifyingGlass },
          { to: '/notifications', outline: HiOutlineBell, solid: HiBell },
          { to: '/messages', outline: HiOutlineMail, solid: HiMail },
          { to: '/purchases', outline: HiOutlineBriefcase, solid: HiBriefcase }
        ].map(item => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'} className="p-3">
            {({ isActive }) => (
              <div className={isActive ? 'text-white' : 'text-dark-400'}>
                {isActive ? <item.solid className="w-7 h-7" /> : <item.outline className="w-7 h-7" />}
              </div>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  );
}