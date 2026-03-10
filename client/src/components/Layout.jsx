import { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getInitials } from '../utils/helpers';
import {
  HiOutlineHome, HiOutlineHashtag, HiOutlineBell, HiOutlineBookmark,
  HiOutlineUser, HiOutlineCog, HiOutlineSparkles, HiOutlineLightBulb,
  HiOutlineChartBar, HiOutlineShieldCheck, HiOutlineBriefcase,
  HiOutlineDotsHorizontal, HiCheck
} from 'react-icons/hi';
import { HiMagnifyingGlass } from 'react-icons/hi2';
import api from '../services/api';

function Avatar({ src, name }) {
  if (src) return <img src={src} alt={name} className="w-10 h-10 rounded-full object-cover" />;
  return <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center font-bold text-white text-sm">{getInitials(name)}</div>;
}

export default function Layout({ children }) {
  const { user, logout, savedAccounts, switchAccount, prepareAddAccount } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [genres, setGenres] = useState([]);
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  useEffect(() => {
    api.get('/genres').then(res => setGenres(res.data.genres)).catch(() => {});
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    if (searchQuery.trim().length >= 2) navigate('/search?q=' + encodeURIComponent(searchQuery.trim()));
  }

  const navLinks = [
    { to: '/', icon: HiOutlineHome, label: 'Home' },
    { to: '/explore', icon: HiOutlineHashtag, label: 'Explore' },
    { to: '/notifications', icon: HiOutlineBell, label: 'Notifications' },
    { to: '/bookmarks', icon: HiOutlineBookmark, label: 'Bookmarks' },
    { to: '/purchases', icon: HiOutlineBriefcase, label: 'Wallet & NDAs' },
    { to: '/analytics', icon: HiOutlineChartBar, label: 'Analytics' },
    { to: '/tiers', icon: HiOutlineSparkles, label: 'Tiers' },
    { to: '/profile/' + (user ? user.username : ''), icon: HiOutlineUser, label: 'Profile' },
    { to: '/settings', icon: HiOutlineCog, label: 'Settings' }
  ];

  if (user && user.role === 'ADMIN') navLinks.push({ to: '/admin', icon: HiOutlineShieldCheck, label: 'Admin Panel' });

  return (
    <div className="flex justify-center min-h-screen bg-dark-950">
      {showAccountMenu && <div className="fixed inset-0 z-40" onClick={() => setShowAccountMenu(false)}></div>}

      {/* Left Sidebar - Hidden on mobile, Icons on tablet, Full on desktop */}
      <div className="hidden sm:flex flex-col xl:w-[275px] w-[80px] items-center xl:items-stretch">
        <div className="fixed xl:w-[275px] w-[80px] h-screen flex flex-col justify-between py-4 px-2 xl:px-4 overflow-y-auto z-50">
          <div className="flex flex-col items-center xl:items-stretch">
            <Link to="/" className="text-2xl font-bold p-3 mb-2 flex items-center justify-center xl:justify-start hover:bg-dark-900 rounded-full w-fit">
              <span className="text-primary-500 xl:hidden">💡</span>
              <span className="hidden xl:inline"><span className="text-primary-500">Idea</span>X 💡</span>
            </Link>

            <nav className="space-y-2 w-full flex flex-col items-center xl:items-stretch">
              {navLinks.map(item => {
                const Icon = item.icon;
                return (
                  <NavLink key={item.to} to={item.to} end={item.to === '/'}
                    className={({ isActive }) =>
                      `flex items-center gap-4 p-3 xl:px-4 xl:py-3 rounded-full hover:bg-dark-800 w-fit xl:w-full transition-all ${isActive ? 'font-bold text-white' : 'text-dark-300'}`
                    }>
                    <Icon className="w-7 h-7" />
                    <span className="hidden xl:inline text-lg">{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            <button onClick={() => navigate('/')} className="bg-primary-500 hover:bg-primary-600 text-white font-bold w-12 h-12 xl:w-full xl:h-auto xl:py-3 mt-4 rounded-full flex items-center justify-center gap-2 transition-all shadow-lg">
              <HiOutlineLightBulb className="w-6 h-6 xl:hidden" />
              <span className="hidden xl:inline">Post Idea</span>
            </button>
          </div>

          {user && (
            <div className="relative mt-4 flex justify-center xl:justify-start w-full">
              {showAccountMenu && (
                <div className="absolute bottom-16 xl:bottom-20 left-0 w-[300px] bg-dark-950 border border-dark-700 rounded-2xl shadow-[0_0_15px_rgba(255,255,255,0.1)] py-2 z-50 overflow-hidden">
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
                  {savedAccounts && savedAccounts.filter(a => a.user.username !== user.username).map(acc => (
                    <button key={acc.user.username} onClick={() => switchAccount(acc.accessToken, acc.refreshToken)} className="w-full px-4 py-3 hover:bg-dark-800 flex items-center gap-3 transition-colors text-left">
                      <Avatar src={acc.user.avatar} name={acc.user.displayName} />
                      <div>
                        <p className="font-bold text-sm text-white">{acc.user.displayName}</p>
                        <p className="text-xs text-dark-400">@{acc.user.username}</p>
                      </div>
                    </button>
                  ))}
                  <button onClick={prepareAddAccount} className="w-full px-4 py-4 hover:bg-dark-800 text-left border-t border-dark-700 font-bold transition-colors">Add an existing account</button>
                  <button onClick={logout} className="w-full px-4 py-4 hover:bg-dark-800 text-left font-bold transition-colors">Log out @{user.username}</button>
                </div>
              )}
              <button onClick={() => setShowAccountMenu(!showAccountMenu)} className="flex items-center justify-center xl:justify-between p-3 rounded-full hover:bg-dark-800 transition-colors w-full">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar src={user.avatar} name={user.displayName} />
                  <div className="hidden xl:block min-w-0 flex-1 text-left">
                    <p className="font-bold text-sm truncate text-white">{user.displayName}</p>
                    <p className="text-xs text-dark-400 truncate">@{user.username}</p>
                  </div>
                </div>
                <HiOutlineDotsHorizontal className="hidden xl:block text-dark-300 w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="w-full max-w-[600px] border-x border-dark-700 min-h-screen pb-16 sm:pb-0">
        {children}
      </main>

      {/* Right Panel - Hidden on smaller screens */}
      <div className="hidden lg:block w-[350px]">
        <div className="fixed w-[350px] h-screen py-4 px-6 overflow-y-auto">
          <form onSubmit={handleSearch} className="relative mb-6">
            <HiMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search IdeaX" className="w-full bg-dark-900 border border-transparent focus:border-primary-500 rounded-full pl-12 pr-4 py-3 text-sm focus:outline-none focus:bg-dark-950 transition-all" />
          </form>

          <div className="bg-dark-900 rounded-2xl p-4 mb-4">
            <h3 className="text-xl font-bold mb-4">What's happening</h3>
            <div className="space-y-4">
              {genres.slice(0, 5).map(g => (
                <Link key={g.id} to={'/explore?category=' + g.category} className="block hover:bg-dark-800 -mx-4 px-4 py-2 transition-colors">
                  <p className="text-xs text-dark-400 flex justify-between">{g.category.replace('_', ' ')} <HiOutlineDotsHorizontal /></p>
                  <p className="font-bold text-white mt-0.5">{g.icon} {g.name}</p>
                </Link>
              ))}
            </div>
            <Link to="/explore" className="text-primary-500 text-sm hover:underline mt-4 block">Show more</Link>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-dark-950/90 backdrop-blur-md border-t border-dark-700 flex justify-around py-2 sm:hidden z-40">
        <NavLink to="/" end className={({ isActive }) => 'p-3 ' + (isActive ? 'text-white' : 'text-dark-400')}><HiOutlineHome className="w-6 h-6" /></NavLink>
        <NavLink to="/search" className={({ isActive }) => 'p-3 ' + (isActive ? 'text-white' : 'text-dark-400')}><HiMagnifyingGlass className="w-6 h-6" /></NavLink>
        <NavLink to="/notifications" className={({ isActive }) => 'p-3 ' + (isActive ? 'text-white' : 'text-dark-400')}><HiOutlineBell className="w-6 h-6" /></NavLink>
        <NavLink to="/purchases" className={({ isActive }) => 'p-3 ' + (isActive ? 'text-white' : 'text-dark-400')}><HiOutlineBriefcase className="w-6 h-6" /></NavLink>
      </div>
    </div>
  );
}