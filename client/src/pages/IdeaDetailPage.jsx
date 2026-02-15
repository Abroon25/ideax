import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { timeAgo, formatNumber, formatCurrency, getInitials } from '../utils/helpers';
import { MONETIZE_LABELS, CATEGORY_ICONS } from '../utils/constants';
import { HiOutlineHeart, HiHeart, HiOutlineChatAlt2, HiOutlineBookmark, HiBookmark, HiArrowLeft, HiOutlineCash, HiOutlineEye } from 'react-icons/hi';

export default function IdeaDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [idea, setIdea] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [interestMsg, setInterestMsg] = useState('');
  const [offerAmt, setOfferAmt] = useState('');
  const [showInterest, setShowInterest] = useState(false);

  useEffect(() => {
    api.get('/ideas/' + id).then(({ data }) => { setIdea(data.idea); setLoading(false); }).catch(() => { toast.error('Not found'); navigate('/'); });
  }, [id]);

  const handleLike = async () => {
    const { data } = await api.post('/ideas/' + id + '/like');
    setIdea((p) => ({ ...p, isLiked: data.liked, _count: { ...p._count, likes: p._count.likes + (data.liked ? 1 : -1) } }));
  };

  const handleBookmark = async () => {
    const { data } = await api.post('/ideas/' + id + '/bookmark');
    setIdea((p) => ({ ...p, isBookmarked: data.bookmarked }));
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    setCommenting(true);
    try {
      const { data } = await api.post('/ideas/' + id + '/comment', { content: comment });
      setIdea((p) => ({ ...p, comments: [data.comment, ...(p.comments || [])], _count: { ...p._count, comments: p._count.comments + 1 } }));
      setComment('');
      toast.success('Reply posted!');
    } catch { toast.error('Failed'); }
    finally { setCommenting(false); }
  };

  const handleInterest = async () => {
    try {
      await api.post('/ideas/' + id + '/interest', { message: interestMsg, offerAmount: offerAmt || null });
      toast.success('Interest sent!');
      setShowInterest(false);
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-dark-950"><div className="w-8 h-8 border-2 border-dark-600 border-t-primary-500 rounded-full animate-spin" /></div>;
  if (!idea) return null;

  const Avatar = ({ src, name }) => src ? <img src={src} alt={name} className="w-10 h-10 rounded-full object-cover" /> : <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center font-bold text-sm">{getInitials(name)}</div>;

  return (
    <div className="flex justify-center min-h-screen bg-dark-950">
      <main className="w-full max-w-[600px] border-x border-dark-700 min-h-screen">
        <div className="sticky top-0 z-30 bg-dark-950/80 backdrop-blur-md border-b border-dark-700 p-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-dark-800 rounded-full"><HiArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-xl font-bold">Idea</h1>
        </div>

        <div className="p-4 border-b border-dark-700">
          <div className="flex items-start gap-3">
            <Link to={'/profile/' + idea.author.username}><Avatar src={idea.author.avatar} name={idea.author.displayName} /></Link>
            <div>
              <span className="font-bold">{idea.author.displayName}</span>
              <span className="text-xs ml-2 px-2 py-0.5 rounded-full bg-dark-600 text-dark-300">{idea.author.tier}</span>
              <p className="text-dark-400 text-sm">@{idea.author.username}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <span className="text-sm bg-dark-800 text-dark-300 px-3 py-1 rounded-full">{CATEGORY_ICONS[idea.category]} {idea.genre?.name}</span>
            {idea.monetizeType !== 'NONE' && <span className="text-sm px-3 py-1 rounded-full bg-green-900/50 text-green-400 border border-green-800">💰 {MONETIZE_LABELS[idea.monetizeType]}{idea.askingPrice ? ' · ' + formatCurrency(idea.askingPrice) : ''}{idea.profitSharePct ? ' · ' + idea.profitSharePct + '%' : ''}</span>}
          </div>

          <div className="mt-4 text-lg leading-relaxed whitespace-pre-wrap">{idea.content}</div>

          {idea.attachments?.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              {idea.attachments.map((a) => a.fileType?.startsWith('image') ? <img key={a.id} src={a.fileUrl} className="rounded-xl w-full" /> : <a key={a.id} href={a.fileUrl} target="_blank" className="bg-dark-800 rounded-xl p-4">📎 {a.fileName}</a>)}
            </div>
          )}

          <p className="text-dark-400 text-sm mt-4 pb-4 border-b border-dark-700">{timeAgo(idea.createdAt)} · {formatNumber(idea.viewCount)} views</p>

          <div className="flex gap-6 py-3 border-b border-dark-700 text-sm">
            <span><strong>{formatNumber(idea._count?.likes)}</strong> <span className="text-dark-400">Likes</span></span>
            <span><strong>{formatNumber(idea._count?.comments)}</strong> <span className="text-dark-400">Comments</span></span>
          </div>

          <div className="flex items-center justify-around py-2 border-b border-dark-700">
            <button onClick={handleLike} className={idea.isLiked ? 'text-pink-500' : 'text-dark-400'}>{idea.isLiked ? <HiHeart className="w-6 h-6" /> : <HiOutlineHeart className="w-6 h-6" />}</button>
            <HiOutlineChatAlt2 className="w-6 h-6 text-dark-400" />
            <button onClick={handleBookmark} className={idea.isBookmarked ? 'text-primary-500' : 'text-dark-400'}>{idea.isBookmarked ? <HiBookmark className="w-6 h-6" /> : <HiOutlineBookmark className="w-6 h-6" />}</button>
          </div>

          {idea.monetizeType !== 'NONE' && !idea.isOwner && !idea.isSold && (
            <div className="py-4 border-b border-dark-700">
              <button onClick={() => setShowInterest(!showInterest)} className="btn-primary w-full py-3">💰 I'm Interested</button>
              {showInterest && (
                <div className="mt-4 space-y-3">
                  <textarea value={interestMsg} onChange={(e) => setInterestMsg(e.target.value)} placeholder="Message to creator..." className="input-field" rows={3} />
                  {idea.monetizeType === 'MONEY' && <input type="number" value={offerAmt} onChange={(e) => setOfferAmt(e.target.value)} placeholder={'Offer (asking: ' + formatCurrency(idea.askingPrice) + ')'} className="input-field" />}
                  <button onClick={handleInterest} className="btn-primary w-full">Send Interest</button>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 py-4">
            <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center font-bold text-xs">{getInitials(user?.displayName)}</div>
            <div className="flex-1 flex gap-2">
              <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Post reply..." className="input-field flex-1" maxLength={1000} />
              <button onClick={handleComment} disabled={!comment.trim() || commenting} className="btn-primary px-4">{commenting ? '...' : 'Reply'}</button>
            </div>
          </div>
        </div>

        {idea.comments?.map((c) => (
          <div key={c.id} className="p-4 border-b border-dark-700">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center font-bold text-xs">{getInitials(c.user.displayName)}</div>
              <div>
                <div className="flex items-center gap-2"><span className="font-bold text-sm">{c.user.displayName}</span><span className="text-dark-400 text-sm">@{c.user.username}</span><span className="text-dark-500 text-sm">{timeAgo(c.createdAt)}</span></div>
                <p className="mt-1">{c.content}</p>
              </div>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
