import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { timeAgo, formatNumber, truncateText, getInitials, formatCurrency } from '../utils/helpers';
import { MONETIZE_LABELS, CATEGORY_ICONS } from '../utils/constants';
import { HiArrowLeft, HiOutlineSearch, HiOutlineHeart, HiOutlineChatAlt2, HiOutlineEye } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function Search() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [activeTab, setActiveTab] = useState('ideas');
  const [ideas, setIdeas] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async (searchQuery) => {
    if (!searchQuery || searchQuery.trim().length < 2) return;

    setLoading(true);
    setSearched(true);
    setSearchParams({ q: searchQuery });

    try {
      const [ideasRes, usersRes] = await Promise.all([
        api.get('/ideas/search', { params: { q: searchQuery, limit: 30 } }),
        api.get('/users/search', { params: { q: searchQuery, limit: 20 } }),
      ]);
      setIdeas(ideasRes.data.ideas);
      setUsers(usersRes.data.users);
    } catch (err) {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  }, [setSearchParams]);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setQuery(q);
      handleSearch(q);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSearch(query);
  };

  return (
    <div className="flex justify-center min-h-screen bg-dark-950">
      <main className="w-full max-w-[600px] border-x border-dark-700 min-h-screen">
        
        {/* Header */}
        <div className="sticky top-0 z-30 bg-dark-950/80 backdrop-blur-md border-b border-dark-700 p-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-dark-800 rounded-full">
              <HiArrowLeft className="w-5 h-5" />
            </button>

            <form onSubmit={handleSubmit} className="flex-1 relative">
              <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search ideas, users, genres..."
                className="w-full bg-dark-800 border border-dark-700 rounded-full pl-12 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary-500"
                autoFocus
              />
            </form>
          </div>

          {/* Tabs */}
          {searched && (
            <div className="flex mt-3 border-b border-dark-700">
              <button
                onClick={() => setActiveTab('ideas')}
                className={`flex-1 py-3 text-center text-sm font-medium relative ${activeTab === 'ideas' ? 'text-white' : 'text-dark-400'}`}
              >
                Ideas ({ideas.length})
                {activeTab === 'ideas' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary-500 rounded-full" />}
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`flex-1 py-3 text-center text-sm font-medium relative ${activeTab === 'users' ? 'text-white' : 'text-dark-400'}`}
              >
                People ({users.length})
                {activeTab === 'users' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary-500 rounded-full" />}
              </button>
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="py-20 flex justify-center">
            <div className="w-8 h-8 border-2 border-dark-600 border-t-primary-500 rounded-full animate-spin" />
          </div>
        )}

        {/* No search yet */}
        {!searched && !loading && (
          <div className="py-20 text-center">
            <HiOutlineSearch className="w-16 h-16 text-dark-600 mx-auto mb-4" />
            <p className="text-xl font-bold">Search IdeaX</p>
            <p className="text-dark-400 mt-2">Find ideas, users, and genres</p>
          </div>
        )}

        {/* Ideas Results */}
        {searched && !loading && activeTab === 'ideas' && (
          ideas.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-xl font-bold">No ideas found</p>
              <p className="text-dark-400 mt-2">Try different keywords</p>
            </div>
          ) : (
            ideas.map((idea) => (
              <div key={idea.id} onClick={() => navigate('/idea/' + idea.id)} className="idea-card">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center font-bold text-sm">
                    {getInitials(idea.author.displayName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{idea.author.displayName}</span>
                      <span className="text-dark-400 text-sm">@{idea.author.username}</span>
                      <span className="text-dark-500 text-sm">{timeAgo(idea.createdAt)}</span>
                    </div>
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs bg-dark-800 text-dark-300 px-2 py-0.5 rounded-full">
                        {CATEGORY_ICONS[idea.category]} {idea.genre?.name}
                      </span>
                      {idea.monetizeType !== 'NONE' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-900/50 text-green-400 border border-green-800">
                          {MONETIZE_LABELS[idea.monetizeType]}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-[15px]">{truncateText(idea.content, 200)}</p>
                    <div className="flex gap-6 mt-2 text-dark-400 text-sm">
                      <span className="flex items-center gap-1"><HiOutlineHeart className="w-4 h-4" />{formatNumber(idea._count?.likes)}</span>
                      <span className="flex items-center gap-1"><HiOutlineChatAlt2 className="w-4 h-4" />{formatNumber(idea._count?.comments)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )
        )}

        {/* Users Results */}
        {searched && !loading && activeTab === 'users' && (
          users.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-xl font-bold">No users found</p>
              <p className="text-dark-400 mt-2">Try different keywords</p>
            </div>
          ) : (
            users.map((user) => (
              <Link
                key={user.id}
                to={'/profile/' + user.username}
                className="flex items-center gap-3 p-4 border-b border-dark-700 hover:bg-dark-800/50 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center font-bold">
                  {getInitials(user.displayName)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{user.displayName}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-dark-600 text-dark-300">{user.tier}</span>
                  </div>
                  <p className="text-dark-400 text-sm">@{user.username}</p>
                  {user.bio && <p className="text-dark-300 text-sm mt-1 line-clamp-2">{user.bio}</p>}
                  <div className="flex gap-4 mt-1 text-xs text-dark-400">
                    <span>{formatNumber(user._count?.ideas)} ideas</span>
                    <span>{formatNumber(user._count?.followers)} followers</span>
                  </div>
                </div>
              </Link>
            ))
          )
        )}
      </main>
    </div>
  );
}
