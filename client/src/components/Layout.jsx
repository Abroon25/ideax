import { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getInitials } from '../utils/helpers';
import {
  HiOutlineHome,
  HiOutlineHashtag,
  HiOutlineBell,
  HiOutlineBookmark,
  HiOutlineUser,
  HiOutlineCog,
  HiOutlineSparkles,
  HiOutlineLightBulb,
  HiOutlineChartBar,
  HiOutlineShieldCheck,
  HiOutlineBriefcase,
  HiOutlineDotsHorizontal,
  HiCheck
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
    if (searchQuery.trim().length >= 2) {
      navigate('/search?q=' + encodeURIComponent(searchQuery.trim()));
    }
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

  if (user && user.role === 'ADMIN') {
    navLinks.push({ to: '/admin', icon: HiOutlineShieldCheck, label: 'Admin Panel' });
  }

  return (
    <div className="flex justify-center min-h-screen bg-dark-950">
      
      {/* Invisible overlay to close menu when clicking outside */}
      {showAccountMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setShowAccountMenu(false)}></div>
      )}

      {/* Left Sidebar */}
      <div className="hidden lg:block w-[260px]">
        <div className="fixed w-[260px] h-screen flex flex-col justify-between py-4 px-3 overflow-y-auto z-50">
          <div>
            <Link to="/" className="text-2xl font-bold px-4 block mb-4">
              <span className="text-primary-500">Idea</span>X 💡
            </Link>
            <nav className="space-y-1">
              {navLinks.map(item => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      'flex items-center gap-4 px-4 py-3 rounded-full hover:bg-dark-800 ' +
                      (isActive ? 'font-bold text-white' : 'text-dark-300')
                    }
                  >
                    <Icon className="w-6 h-6" />
                    <span className="hidden xl:inline">{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
            <button
              onClick={() => navigate('/')}
              className="btn-primary w-full mt-4 py-3 text-lg flex items-center justify-center gap-2"
            >
              <HiOutlineLightBulb className="w-5 h-5" /> Post Idea
            </button>
          </div>

          {/* TWITTER STYLE ACCOUNT SWITCHER AT BOTTOM */}
          {user && (
            <div className="relative mt-4">
              {/* The Popup Menu */}
              {showAccountMenu && (
                <div className="absolute bottom-20 left-0 w-[300px] bg-dark-950 border border-dark-700 rounded-2xl shadow-[0_0_15px_rgba(255,255,255,0.1)] py-2 z-50 overflow-hidden">
                  
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

                  {/* Other Saved Accounts */}
                  {savedAccounts && savedAccounts.filter(a => a.user.username !== user.username).map(acc => (
                    <button 
                      key={acc.user.username} 
                      onClick={() => switchAccount(acc.accessToken, acc.refreshToken)} 
                      className="w-full px-4 py-3 hover:bg-dark-800 flex items-center gap-3 transition-colors text-left"
                      >
                      <Avatar src={acc.user.avatar} name={acc.user.displayName} />
                      <div>
                        <p className="font-bold text-sm text-white">{acc.user.displayName}</p>
                        <p className="text-xs text-dark-400">@{acc.user.username}</p>
                      </div>
                    </button>
                  ))}

                  {/* Add Existing Account Button */}
                  <button 
                    onClick={prepareAddAccount} 
                    className="w-full px-4 py-4 hover:bg-dark-800 text-left border-t border-dark-700 font-bold transition-colors"
                  >
                    Add an existing account
                  </button>

                  {/* Logout Button */}
                  <button 
                    onClick={logout} 
                    className="w-full px-4 py-4 hover:bg-dark-800 text-left font-bold transition-colors"
                  >
                    Log out @{user.username}
                  </button>
                </div>
              )}

              {/* The Profile Button that opens the menu */}
              <button
                onClick={() => setShowAccountMenu(!showAccountMenu)}
                className="flex items-center justify-between p-3 rounded-full hover:bg-dark-800 transition-colors w-full text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar src={user.avatar} name={user.displayName} />
                  <div className="hidden xl:block min-w-0 flex-1">
                    <p className="font-bold text-sm truncate text-white">{user.displayName}</p>
                    <p className="text-xs text-dark-400 truncate">@{user.username}</p>
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
      <main className="w-full max-w-[600px] border-x border-dark-700 min-h-screen pb-16 lg:pb-0">
        {children}
      </main>

      {/* Right Panel */}
      <div className="hidden xl:block w-[350px]">
        <div className="fixed w-[350px] h-screen py-4 px-6 overflow-y-auto">
          <form onSubmit={handleSearch} className="relative mb-6">
            <HiMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search ideas, users..."
              className="w-full bg-dark-800 border border-dark-700 rounded-full pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-primary-500"
            />
          </form>

          <div className="card p-4 mb-4">
            <h3 className="text-xl font-bold mb-4">Trending 🔥</h3>
            <div className="space-y-1">
              {genres.slice(0, 8).map(g => (
                <Link
                  key={g.id}
                  to={'/explore?category=' + g.category}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-dark-700 transition-colors"
                >
                  <span className="text-xl">{g.icon}</span>
                  <div>
                    <p className="font-medium text-sm text-white">{g.name}</p>
                    <p className="text-xs text-dark-400">{g.category.replace('_', ' ')}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="card p-4 mb-4">
            <h3 className="font-bold mb-3 text-white">💳 Pay Per Post</h3>
            <div className="space-y-2 text-sm text-dark-300">
              <p>₹1 / 50 extra characters</p>
              <p>₹1 / 5MB extra storage</p>
              <p>₹10 to unlock monetization</p>
            </div>
            <Link to="/tiers" className="text-primary-500 text-sm hover:underline mt-3 inline-block">
              View all tiers →
            </Link>
          </div>

          <div className="text-xs text-dark-500 space-y-1 px-2 pb-4">
            <p>© 2024 IdeaX. All rights reserved.</p>
            <div className="flex gap-3">
              <span className="hover:underline cursor-pointer">Terms</span>
              <span className="hover:underline cursor-pointer">Privacy</span>
              <span className="hover:underline cursor-pointer">About</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-dark-900 border-t border-dark-700 flex justify-around py-2 lg:hidden z-40">
        <NavLink to="/" end className={({ isActive }) => 'p-3 ' + (isActive ? 'text-primary-500' : 'text-dark-400')}>
          <HiOutlineHome className="w-6 h-6" />
        </NavLink>
        <NavLink to="/search" className={({ isActive }) => 'p-3 ' + (isActive ? 'text-primary-500' : 'text-dark-400')}>
          <HiMagnifyingGlass className="w-6 h-6" />
        </NavLink>
        <NavLink to="/explore" className={({ isActive }) => 'p-3 ' + (isActive ? 'text-primary-500' : 'text-dark-400')}>
          <HiOutlineHashtag className="w-6 h-6" />
        </NavLink>
        <NavLink to="/notifications" className={({ isActive }) => 'p-3 ' + (isActive ? 'text-primary-500' : 'text-dark-400')}>
          <HiOutlineBell className="w-6 h-6" />
        </NavLink>
        <NavLink to={'/profile/' + (user ? user.username : '')} className={({ isActive }) => 'p-3 ' + (isActive ? 'text-primary-500' : 'text-dark-400')}>
          <HiOutlineUser className="w-6 h-6" />
        </NavLink>
      </div>
    </div>
  );
}