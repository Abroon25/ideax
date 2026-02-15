import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { formatNumber, formatDate, timeAgo, getInitials, truncateText, formatCurrency } from '../utils/helpers';
import { MONETIZE_LABELS, CATEGORY_ICONS } from '../utils/constants';
import { HiArrowLeft, HiOutlineCalendar, HiOutlineHeart, HiOutlineChatAlt2, HiOutlineEye } from 'react-icons/hi';

export default function Profile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/users/' + username),
      api.get('/users/' + username + '/ideas'),
    ]).then(([profileRes, ideasRes]) => {
      setProfile(profileRes.data.user);
      setIdeas(ideasRes.data.ideas);
      setLoading(false);
    }).catch(() => { toast.error('User not found'); navigate('/'); });
  }, [username]);

  const handleFollow = async () => {
    try {
      const { data } = await api.post('/users/follow/' + profile.id);
      setProfile((p) => ({ ...p, isFollowing: data.following, _count: { ...p._count, followers: p._count.followers + (data.following ? 1 : -1) } }));
    } catch { toast.error('Failed'); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-dark-950"><div className="w-8 h-8 border-2 border-dark-600 border-t-primary-500 rounded-full animate-spin" /></div>;
  if (!profile) return null;

  return (
    <div className="flex justify-center min-h-screen bg-dark-950">
      <main className="w-full max-w-[600px] border-x border-dark-700 min-h-screen">
        <div className="sticky top-0 z-30 bg-dark-950/80 backdrop-blur-md border-b border-dark-700 p-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-dark-800 rounded-full"><HiArrowLeft className="w-5 h-5" /></button>
          <div><h1 className="font-bold">{profile.displayName}</h1><p className="text-sm text-dark-400">{formatNumber(profile._count?.ideas)} ideas</p></div>
        </div>

        <div className="h-48 bg-gradient-to-r from-primary-500/30 to-purple-500/30" />
        <div className="px-4 pb-4 border-b border-dark-700">
          <div className="flex justify-between items-end -mt-16 mb-4">
            <div className="w-24 h-24 rounded-full bg-primary-500 flex items-center justify-center font-bold text-3xl text-white border-4 border-dark-950">{getInitials(profile.displayName)}</div>
            {profile.isOwn ? <button onClick={() => navigate('/settings')} className="btn-outline py-2 px-5 text-sm">Edit Profile</button>
            : <button onClick={handleFollow} className={`py-2 px-5 text-sm rounded-full font-bold ${profile.isFollowing ? 'btn-outline' : 'btn-primary'}`}>{profile.isFollowing ? 'Following' : 'Follow'}</button>}
          </div>
          <h2 className="text-xl font-bold">{profile.displayName} <span className="text-xs px-2 py-0.5 rounded-full bg-dark-600 text-dark-300 ml-1">{profile.tier}</span></h2>
          <p className="text-dark-400">@{profile.username}</p>
          {profile.bio && <p className="mt-3">{profile.bio}</p>}
          <div className="flex items-center gap-2 mt-3 text-sm text-dark-400"><HiOutlineCalendar className="w-4 h-4" /><span>Joined {formatDate(profile.createdAt)}</span></div>
          <div className="flex gap-5 mt-3 text-sm">
            <span><strong>{formatNumber(profile._count?.following)}</strong> <span className="text-dark-400">Following</span></span>
            <span><strong>{formatNumber(profile._count?.followers)}</strong> <span className="text-dark-400">Followers</span></span>
          </div>
        </div>

        {ideas.length === 0 ? <div className="py-20 text-center text-dark-400">No ideas yet</div>
        : ideas.map((idea) => (
          <div key={idea.id} onClick={() => navigate('/idea/' + idea.id)} className="idea-card">
            <div className="flex gap-2 items-center mb-2">
              <span className="text-xs bg-dark-800 text-dark-300 px-2 py-0.5 rounded-full">{CATEGORY_ICONS[idea.category]} {idea.genre?.name}</span>
              {idea.monetizeType !== 'NONE' && <span className="text-xs px-2 py-0.5 rounded-full bg-green-900/50 text-green-400 border border-green-800">💰 {MONETIZE_LABELS[idea.monetizeType]}</span>}
              <span className="text-xs text-dark-500">{timeAgo(idea.createdAt)}</span>
            </div>
            <p className="text-[15px]">{truncateText(idea.content, 300)}</p>
            <div className="flex gap-6 mt-2 text-dark-400 text-sm">
              <span className="flex items-center gap-1"><HiOutlineHeart className="w-4 h-4" />{formatNumber(idea._count?.likes)}</span>
              <span className="flex items-center gap-1"><HiOutlineChatAlt2 className="w-4 h-4" />{formatNumber(idea._count?.comments)}</span>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
