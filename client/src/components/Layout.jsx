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
  HiOutlineLightBulb
} from 'react-icons/hi';
import { HiMagnifyingGlass } from 'react-icons/hi2';
import api from '../services/api';

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

export default function Layout({ children }) {
  var auth = useAuth();
  var user = auth.user;
  var navigate = useNavigate();
  var [searchQuery, setSearchQuery] = useState('');
  var [genres, setGenres] = useState([]);

  useEffect(function() {
    api.get('/genres').then(function(res) {
      setGenres(res.data.genres);
    }).catch(function() {});
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    if (searchQuery.trim().length >= 2) {
      navigate('/search?q=' + encodeURIComponent(searchQuery.trim()));
    }
  }

  var navLinks = [
    { to: '/', icon: HiOutlineHome, label: 'Home' },
    { to: '/explore', icon: HiOutlineHashtag, label: 'Explore' },
    { to: '/notifications', icon: HiOutlineBell, label: 'Notifications' },
    { to: '/bookmarks', icon: HiOutlineBookmark, label: 'Bookmarks' },
    { to: '/tiers', icon: HiOutlineSparkles, label: 'Tiers' },
    { to: '/profile/' + (user ? user.username : ''), icon: HiOutlineUser, label: 'Profile' },
    { to: '/settings', icon: HiOutlineCog, label: 'Settings' }
  ];

  return (
    <div className="flex justify-center min-h-screen bg-dark-950">

      {/* Left Sidebar — Always visible on desktop */}
      <div className="hidden lg:block w-[275px]">
        <div className="fixed w-[275px] h-screen flex flex-col justify-between py-2 px-3 overflow-y-auto">
          <div>
            <Link to="/" className="p-3 mb-2 block">
              <h1 className="text-2xl font-bold"><span className="text-primary-500">Idea</span>X 💡</h1>
            </Link>
            <nav className="space-y-1">
              {navLinks.map(function(item) {
                var Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={function(props) {
                      return 'sidebar-link ' + (props.isActive ? 'active font-bold' : 'text-dark-300');
                    }}
                  >
                    <Icon className="w-7 h-7" /><span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
            <button
              onClick={function() { navigate('/'); }}
              className="btn-primary w-full mt-4 py-3 text-lg flex items-center justify-center gap-2"
            >
              <HiOutlineLightBulb className="w-5 h-5" /> Post Idea
            </button>
          </div>

          {/* User info at bottom */}
          <button
            onClick={function() { navigate('/profile/' + (user ? user.username : '')); }}
            className="flex items-center gap-3 p-3 rounded-full hover:bg-dark-800 transition-colors mb-2"
          >
            <Avatar src={user ? user.avatar : null} name={user ? user.displayName : ''} size="w-8 h-8" />
            <div className="text-left min-w-0">
              <p className="font-bold text-sm truncate">{user ? user.displayName : ''}</p>
              <p className="text-sm text-dark-400 truncate">@{user ? user.username : ''}</p>
            </div>
          </button>
        </div>
      </div>

      {/* Main Content — Children pages render here */}
      <main className="w-full max-w-[600px] border-x border-dark-700 min-h-screen pb-16 lg:pb-0">
        {children}
      </main>

      {/* Right Panel — Search bar at top + trending */}
      <div className="hidden xl:block w-[350px]">
        <div className="fixed w-[350px] h-screen py-3 px-6 overflow-y-auto">

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative mb-4">
            <HiMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={function(e) { setSearchQuery(e.target.value); }}
              placeholder="Search ideas, users..."
              className="w-full bg-dark-800 border border-dark-700 rounded-full pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-primary-500 focus:bg-dark-900 transition-all"
            />
          </form>

          {/* Trending Genres */}
          <div className="card p-4 mb-4">
            <h3 className="text-xl font-bold mb-4">Trending 🔥</h3>
            <div className="space-y-1">
              {genres.slice(0, 8).map(function(g) {
                return (
                  <Link
                    key={g.id}
                    to={'/explore?category=' + g.category}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-dark-700 transition-colors"
                  >
                    <span className="text-xl">{g.icon}</span>
                    <div>
                      <p className="font-medium text-sm">{g.name}</p>
                      <p className="text-xs text-dark-400">{g.category.replace('_', ' ')}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Pay Per Post Info */}
          <div className="card p-4 mb-4">
            <h3 className="font-bold mb-3">💳 Pay Per Post</h3>
            <div className="space-y-2 text-sm text-dark-300">
              <p>₹1 / 50 extra characters</p>
              <p>₹1 / 5MB extra storage</p>
              <p>₹10 to unlock monetization</p>
            </div>
            <Link to="/tiers" className="text-primary-500 text-sm hover:underline mt-3 inline-block">
              View all tiers →
            </Link>
          </div>

          {/* Footer */}
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
        <NavLink to="/" end className={function(p) { return 'p-3 ' + (p.isActive ? 'text-primary-500' : 'text-dark-400'); }}>
          <HiOutlineHome className="w-6 h-6" />
        </NavLink>
        <NavLink to="/search" className={function(p) { return 'p-3 ' + (p.isActive ? 'text-primary-500' : 'text-dark-400'); }}>
          <HiMagnifyingGlass className="w-6 h-6" />
        </NavLink>
        <NavLink to="/explore" className={function(p) { return 'p-3 ' + (p.isActive ? 'text-primary-500' : 'text-dark-400'); }}>
          <HiOutlineHashtag className="w-6 h-6" />
        </NavLink>
        <NavLink to="/notifications" className={function(p) { return 'p-3 ' + (p.isActive ? 'text-primary-500' : 'text-dark-400'); }}>
          <HiOutlineBell className="w-6 h-6" />
        </NavLink>
        <NavLink to={'/profile/' + (user ? user.username : '')} className={function(p) { return 'p-3 ' + (p.isActive ? 'text-primary-500' : 'text-dark-400'); }}>
          <HiOutlineUser className="w-6 h-6" />
        </NavLink>
      </div>
    </div>
  );
}