import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { timeAgo, formatNumber, formatCurrency, getInitials, truncateText } from '../utils/helpers';
import { MONETIZE_LABELS, CATEGORY_ICONS, TIER_LIMITS } from '../utils/constants';
import {
  HiOutlineHeart, HiHeart, HiOutlineChatAlt2, HiBookmark, HiOutlineEye, 
  HiOutlineCash, HiOutlineTrash, HiOutlinePencil, HiOutlineShare,
  HiOutlineX, HiOutlinePhotograph, HiOutlineRefresh
} from 'react-icons/hi';
import { HiOutlineBookmark, HiArrowLeft } from 'react-icons/hi2';

function loadScript(src) {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function Avatar({ src, name, size }) {
  var s = size || 'w-10 h-10';
  if (src) return <img src={src} alt={name} className={`${s} rounded-full object-cover`} />;
  return <div className={`${s} rounded-full bg-primary-500 flex items-center justify-center font-bold text-white text-sm`}>{getInitials(name)}</div>;
}

function RichText({ text }) {
  if (!text) return null;
  const parts = text.split(/(@\w+|#\w+)/g);
  return (
    <span className="whitespace-pre-wrap break-words leading-relaxed text-white">
      {parts.map((part, i) => {
        if (part.startsWith('@')) return <Link key={i} to={`/profile/${part.slice(1)}`} onClick={e => e.stopPropagation()} className="text-primary-500 hover:underline">{part}</Link>;
        if (part.startsWith('#')) return <Link key={i} to={`/search?q=${encodeURIComponent(part)}`} onClick={e => e.stopPropagation()} className="text-primary-500 hover:underline">{part}</Link>;
        return <span key={i}>{part}</span>;
      })}
    </span>
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

// Mini IdeaCard specifically for replies in the thread view
function ReplyCard({ idea, onLike, onBookmark, onImageClick, onRepost }) {
  const navigate = useNavigate();
  return (
    <div className="border-b border-dark-700 p-4 hover:bg-dark-900/30 transition-colors cursor-pointer" onClick={(e) => { if (!e.target.closest('button') && !e.target.closest('a')) navigate('/idea/' + idea.id); }}>
      <div className="flex gap-3">
        <Link to={'/profile/' + idea.author.username} onClick={e => e.stopPropagation()}>
          <Avatar src={idea.author.avatar} name={idea.author.displayName} />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-[15px]">
            <Link to={'/profile/' + idea.author.username} onClick={e => e.stopPropagation()} className="font-bold hover:underline text-white truncate">
              {idea.author.displayName}
            </Link>
            <span className="text-dark-400 truncate">@{idea.author.username}</span>
            <span className="text-dark-500">·</span>
            <span className="text-dark-400 hover:underline">{timeAgo(idea.createdAt)}</span>
          </div>
          
          <div className="mt-1 text-[15px]">
            <RichText text={idea.content} />
          </div>

          {idea.attachments && idea.attachments.length > 0 && (
            <div className={`mt-3 grid gap-2 ${idea.attachments.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {idea.attachments.slice(0, 4).map(a => 
                a.fileType?.startsWith('image') ? (
                  <img key={a.id} src={a.fileUrl} onClick={(e) => { e.stopPropagation(); onImageClick(idea, a.fileUrl); }} className="rounded-2xl border border-dark-700 object-cover w-full max-h-[300px] hover:opacity-80 transition-opacity" alt="attachment" />
                ) : null
              )}
            </div>
          )}

          <div className="flex items-center justify-between mt-3 text-dark-400 max-w-md">
            <button onClick={e => { e.stopPropagation(); navigate('/idea/' + idea.id); }} className="flex items-center gap-2 hover:text-primary-500 group transition-colors">
              <div className="p-2 rounded-full group-hover:bg-primary-500/10"><HiOutlineChatAlt2 className="w-5 h-5" /></div>
              <span className="text-sm">{formatNumber(idea._count?.replies)}</span>
            </button>
            <button onClick={e => { e.stopPropagation(); onRepost(idea.id); }} className="flex items-center gap-2 hover:text-green-500 group transition-colors">
              <div className="p-2 rounded-full group-hover:bg-green-500/10"><HiOutlineRefresh className="w-5 h-5" /></div>
              <span className="text-sm">{formatNumber(idea._count?.repostedIdeas || 0)}</span>
            </button>
            <button onClick={e => { e.stopPropagation(); onLike(idea.id); }} className={`flex items-center gap-2 group transition-colors ${idea.isLiked ? 'text-pink-500' : 'hover:text-pink-500'}`}>
              <div className="p-2 rounded-full group-hover:bg-pink-500/10">{idea.isLiked ? <HiHeart className="w-5 h-5" /> : <HiOutlineHeart className="w-5 h-5" />}</div>
              <span className="text-sm">{formatNumber(idea._count?.likes)}</span>
            </button>
            <div className="flex items-center gap-2 group">
              <div className="p-2 rounded-full"><HiOutlineEye className="w-5 h-5" /></div>
              <span className="text-sm">{formatNumber(idea.viewCount)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function IdeaDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [idea, setIdea] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Composer for Replies
  const [replyContent, setReplyContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [posting, setPosting] = useState(false);
  const fileInputRef = useRef(null);
  const limits = TIER_LIMITS[user?.tier || 'FREE'];

  const [showInterest, setShowInterest] = useState(false);
  const [interestMsg, setInterestMsg] = useState('');
  const [offerAmt, setOfferAmt] = useState('');
  const [showShare, setShowShare] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  // Lightbox
  const [lightboxData, setLightboxData] = useState(null);

  const fetchIdea = () => {
    api.get('/ideas/' + id)
      .then(res => { 
        setIdea(res.data.idea); 
        setEditContent(res.data.idea.content); 
        setLoading(false); 
      })
      .catch(() => { 
        toast.error('Idea not found'); 
        navigate('/'); 
      });
  };

  useEffect(() => {
    setLoading(true);
    fetchIdea();
    window.scrollTo({ top: 0 });
  }, [id]);

  const handleLike = (targetId) => {
    api.post(`/ideas/${targetId}/like`).then(res => {
      // Optimistic UI update for main idea
      if (targetId === idea.id) {
        setIdea(p => ({ ...p, isLiked: res.data.liked, _count: { ...p._count, likes: p._count.likes + (res.data.liked ? 1 : -1) } }));
      } else {
        // Optimistic update for replies
        setIdea(p => ({
          ...p,
          replies: p.replies.map(r => r.id === targetId ? { ...r, isLiked: res.data.liked, _count: { ...r._count, likes: r._count.likes + (res.data.liked ? 1 : -1) } } : r)
        }));
      }
    });
  };

  const handleBookmark = (targetId) => {
    api.post(`/ideas/${targetId}/bookmark`).then(res => {
      if (targetId === idea.id) setIdea(p => ({ ...p, isBookmarked: res.data.bookmarked }));
      toast.success(res.data.bookmarked ? 'Bookmarked' : 'Removed');
    });
  };

  const handleRepost = (targetId) => {
    api.post(`/ideas/${targetId}/repost`, { content: '' }).then(res => {
      toast.success(res.data.reposted ? 'Reposted!' : 'Repost removed');
      fetchIdea(); // Hard refresh to get new counts
    }).catch(() => toast.error('Failed'));
  };

  const handleMediaSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + mediaFiles.length > 4) return toast.error('Max 4 images allowed');
    const newFiles = files.map(file => ({ file, preview: URL.createObjectURL(file) }));
    setMediaFiles(prev => [...prev, ...newFiles]);
  };

  const handlePostReply = async () => {
    if (!replyContent.trim()) return toast.error('Write a reply!');
    setPosting(true);
    
    const formData = new FormData();
    formData.append('content', replyContent.trim());
    formData.append('parentIdeaId', idea.id); // Links it to this thread!
    mediaFiles.forEach(m => formData.append('files', m.file));

    try {
      await api.post('/ideas', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Reply posted!');
      setReplyContent(''); 
      setMediaFiles([]);
      fetchIdea(); // Hard refresh to show new reply immediately
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setPosting(false); }
  };

  const handleInterest = () => {
    api.post('/ideas/' + id + '/interest', { message: interestMsg, offerAmount: offerAmt || null }).then(() => {
      toast.success('Interest sent!');
      setShowInterest(false);
    }).catch(err => toast.error(err.response?.data?.error || 'Failed'));
  };

  const handleDelete = () => {
    if (!window.confirm('Are you sure you want to delete this idea?')) return;
    api.delete('/ideas/' + id).then(() => { toast.success('Idea deleted'); navigate('/'); }).catch(() => toast.error('Failed'));
  };

  const handleSaveEdit = () => {
    setSavingEdit(true);
    api.put('/ideas/' + id, { content: editContent }).then(res => {
      setIdea(p => ({ ...p, content: res.data.idea.content }));
      setEditing(false);
      toast.success('Idea updated!');
    }).catch(err => toast.error(err.response?.data?.error || 'Failed')).finally(() => setSavingEdit(false));
  };

  const shareToTwitter = () => window.open('https://twitter.com/intent/tweet?text=' + encodeURIComponent(idea.content.substring(0, 200)) + '&url=' + encodeURIComponent(window.location.href), '_blank');
  const copyLink = () => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!'); setShowShare(false); };

  const handlePurchase = async () => {
    if (!window.confirm('Buy this idea for ' + formatCurrency(idea.askingPrice) + '?')) return;
    setPurchasing(true);
    const toastId = toast.loading('Initiating secure checkout...');

    try {
      const orderRes = await api.post('/payments/idea/create-order', { ideaId: idea.id });
      const { mock, orderId, amount, currency, keyId } = orderRes.data;

      if (mock) {
        toast.loading('Razorpay keys not found. Running Mock Payment...', { id: toastId });
        await api.post('/payments/idea/verify', { ideaId: idea.id, orderId, isMock: true });
        toast.success('Mock Purchase Successful! NDA & Invoice Generated.', { id: toastId });
        setIdea(p => ({ ...p, isSold: true, soldTo: user.id }));
        setPurchasing(false);
        return;
      }

      const res = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
      if (!res) { toast.error('Failed to load Razorpay SDK.', { id: toastId }); setPurchasing(false); return; }

      const options = {
        key: keyId, amount: amount.toString(), currency: currency, name: 'IdeaX', description: 'Purchase Idea Ownership', order_id: orderId,
        prefill: { name: user.displayName, email: user.email, contact: user.phone || '9999999999' },
        theme: { color: '#1DA1F2' },
        handler: async function (response) {
          toast.loading('Verifying payment & generating NDA...', { id: toastId });
          try {
            await api.post('/payments/idea/verify', { ideaId: idea.id, orderId: response.razorpay_order_id, paymentId: response.razorpay_payment_id, signature: response.razorpay_signature, isMock: false });
            toast.success('Payment Successful! Idea Purchased.', { id: toastId });
            setIdea(p => ({ ...p, isSold: true, soldTo: user.id }));
          } catch (err) { toast.error('Verification failed.', { id: toastId }); }
        }
      };
      const paymentObject = new window.Razorpay(options);
      paymentObject.on('payment.failed', function () { toast.error('Payment failed.', { id: toastId }); });
      paymentObject.open();
      toast.dismiss(toastId);
    } catch (err) { toast.error(err.response?.data?.error || 'Transaction failed', { id: toastId }); }
    setPurchasing(false);
  };

  useEffect(() => {
    if (lightboxData) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
  }, [lightboxData]);

  if (loading) return <div className="py-20 flex justify-center"><div className="w-8 h-8 border-2 border-dark-600 border-t-primary-500 rounded-full animate-spin" /></div>;
  if (!idea) return null;

  return (
    <div>
      {/* Lightbox Modal */}
      {lightboxData && (
        <div className="fixed inset-0 z-[200] flex bg-black/90 backdrop-blur-sm">
          <button onClick={() => setLightboxData(null)} className="absolute top-4 left-4 z-[210] p-3 rounded-full hover:bg-white/10 text-white transition-colors">
            <HiOutlineX className="w-6 h-6" />
          </button>
          <div className="flex-1 flex items-center justify-center p-4 cursor-zoom-out" onClick={() => setLightboxData(null)}>
             <img src={lightboxData.imageUrl} className="max-w-full max-h-full object-contain shadow-2xl" onClick={e => e.stopPropagation()} alt="Fullscreen" />
          </div>
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 z-30 bg-dark-950/80 backdrop-blur-md border-b border-dark-700 p-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-dark-800 rounded-full"><HiArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-xl font-bold">Post</h1>
      </div>

      {/* PARENT IDEA (If this is a reply) */}
      {idea.parentIdea && (
        <div className="px-4 pt-4 flex gap-3 cursor-pointer" onClick={() => navigate('/idea/' + idea.parentIdea.id)}>
          <div className="flex flex-col items-center">
            <Avatar src={idea.parentIdea.author.avatar} name={idea.parentIdea.author.displayName} />
            <div className="w-[2px] h-full bg-dark-700 mt-2"></div>
          </div>
          <div className="flex-1 pb-4">
            <div className="flex items-center gap-2 text-[15px]">
              <span className="font-bold text-white hover:underline">{idea.parentIdea.author.displayName}</span>
              <span className="text-dark-400">@{idea.parentIdea.author.username} · {timeAgo(idea.parentIdea.createdAt)}</span>
            </div>
            <div className="mt-1 text-[15px]"><RichText text={idea.parentIdea.content} /></div>
          </div>
        </div>
      )}

      {/* MAIN IDEA CONTENT */}
      <div className="px-4 pt-4 border-b border-dark-700">
        <div className="flex items-start gap-3 justify-between">
          <div className="flex items-start gap-3">
            <Link to={'/profile/' + idea.author.username}>
              <Avatar src={idea.author.avatar} name={idea.author.displayName} size="w-12 h-12" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[17px] hover:underline cursor-pointer">{idea.author.displayName}</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-dark-800 border border-dark-600 font-bold">{idea.author.tier}</span>
              </div>
              <p className="text-dark-400 text-[15px]">@{idea.author.username}</p>
            </div>
          </div>
          {idea.isOwner && (
            <div className="flex gap-2">
              <button onClick={() => setEditing(!editing)} className="p-2 hover:bg-dark-800 rounded-full text-dark-400 hover:text-primary-500"><HiOutlinePencil className="w-5 h-5" /></button>
              <button onClick={handleDelete} className="p-2 hover:bg-dark-800 rounded-full text-dark-400 hover:text-red-500"><HiOutlineTrash className="w-5 h-5" /></button>
            </div>
          )}
        </div>

        {/* Replying To Context */}
        {idea.parentIdea && (
          <p className="text-[15px] text-dark-400 mt-3">Replying to <Link to={`/profile/${idea.parentIdea.author.username}`} className="text-primary-500 hover:underline">@{idea.parentIdea.author.username}</Link></p>
        )}

        {editing ? (
          <div className="mt-4">
            <textarea value={editContent} onChange={e => setEditContent(e.target.value)} className="w-full bg-transparent text-xl placeholder-dark-500 resize-none focus:outline-none" rows={6} />
            <div className="flex gap-2 mt-3 mb-4">
              <button onClick={handleSaveEdit} disabled={savingEdit} className="btn-primary py-1.5 px-6">{savingEdit ? 'Saving...' : 'Save'}</button>
              <button onClick={() => { setEditing(false); setEditContent(idea.content); }} className="btn-outline py-1.5 px-6">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="mt-4 text-[17px] leading-relaxed whitespace-pre-wrap"><RichText text={idea.content} /></div>
        )}

        {/* Attachments */}
        {idea.attachments && idea.attachments.length > 0 && (
          <div className="mt-4 grid grid-cols-1 gap-2">
            {idea.attachments.map(a => 
              a.fileType?.startsWith('image') ? <img key={a.id} src={a.fileUrl} onClick={() => setLightboxData({idea, imageUrl: a.fileUrl})} className="rounded-2xl border border-dark-700 w-full cursor-pointer hover:opacity-90 transition-opacity" /> : <a key={a.id} href={a.fileUrl} target="_blank" rel="noreferrer" className="bg-dark-800 rounded-xl p-4 block">📎 {a.fileName}</a>
            )}
          </div>
        )}

        {/* Meta info */}
        <div className="flex items-center gap-2 mt-4 text-[15px] text-dark-400">
          <span>{new Date(idea.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          <span>·</span>
          <span>{new Date(idea.createdAt).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}</span>
          <span>·</span>
          <span className="font-bold text-white">{formatNumber(idea.viewCount)} <span className="font-normal text-dark-400">Views</span></span>
        </div>

        {/* Monetization Badge */}
        <div className="flex items-center gap-2 mt-4 py-4 border-t border-dark-700">
          <span className="text-sm bg-dark-800 text-dark-300 px-3 py-1 rounded-full">{CATEGORY_ICONS[idea.category]} {idea.genre ? idea.genre.name : ''}</span>
          {idea.monetizeType !== 'NONE' && <span className="text-sm px-3 py-1 rounded-full bg-green-900/30 text-green-400 font-bold">💰 {MONETIZE_LABELS[idea.monetizeType]}{idea.askingPrice ? ' · ' + formatCurrency(idea.askingPrice) : ''}{idea.profitSharePct ? ' · ' + idea.profitSharePct + '%' : ''}</span>}
        </div>

        {/* Stats Row */}
        <div className="flex gap-6 py-4 border-t border-dark-700 text-[15px]">
          <span className="cursor-pointer hover:underline"><strong>{formatNumber(idea._count?.repostedIdeas || 0)}</strong> <span className="text-dark-400">Reposts</span></span>
          <span className="cursor-pointer hover:underline"><strong>{formatNumber(idea._count?.likes)}</strong> <span className="text-dark-400">Likes</span></span>
          <span className="cursor-pointer hover:underline"><strong>{formatNumber(idea._count?.bookmarks)}</strong> <span className="text-dark-400">Bookmarks</span></span>
        </div>

        {/* Action Row */}
        <div className="flex items-center justify-around py-2 border-t border-dark-700">
          <button className="flex items-center gap-2 hover:text-primary-500 group transition-colors"><div className="p-2 rounded-full group-hover:bg-primary-500/10"><HiOutlineChatAlt2 className="w-6 h-6" /></div></button>
          <button onClick={() => handleRepost(idea.id)} className="flex items-center gap-2 hover:text-green-500 group transition-colors"><div className="p-2 rounded-full group-hover:bg-green-500/10"><HiOutlineRefresh className="w-6 h-6" /></div></button>
          <button onClick={() => handleLike(idea.id)} className={`flex items-center gap-2 group transition-colors ${idea.isLiked ? 'text-pink-500' : 'hover:text-pink-500'}`}><div className="p-2 rounded-full group-hover:bg-pink-500/10">{idea.isLiked ? <HiHeart className="w-6 h-6" /> : <HiOutlineHeart className="w-6 h-6" />}</div></button>
          <button onClick={() => handleBookmark(idea.id)} className={`flex items-center gap-2 group transition-colors ${idea.isBookmarked ? 'text-primary-500' : 'hover:text-primary-500'}`}><div className="p-2 rounded-full group-hover:bg-primary-500/10">{idea.isBookmarked ? <HiBookmark className="w-6 h-6" /> : <HiOutlineBookmark className="w-6 h-6" />}</div></button>
          <button onClick={() => setShowShare(!showShare)} className="flex items-center gap-2 hover:text-primary-500 group transition-colors"><div className="p-2 rounded-full group-hover:bg-primary-500/10"><HiOutlineShare className="w-6 h-6" /></div></button>
        </div>

        {showShare && (
          <div className="py-3 border-t border-dark-700 flex flex-wrap gap-2">
            <button onClick={shareToTwitter} className="text-xs px-4 py-2 rounded-full bg-dark-800 text-dark-300 hover:bg-dark-700">𝕏 Twitter</button>
            <button onClick={copyLink} className="text-xs px-4 py-2 rounded-full bg-dark-800 text-dark-300 hover:bg-dark-700">📋 Copy Link</button>
          </div>
        )}

        {/* Business Actions */}
        {idea.monetizeType !== 'NONE' && !idea.isOwner && (
          <div className="py-4 border-t border-dark-700">
            {idea.isSold ? (
              <div className="bg-green-900/20 border border-green-900 text-green-400 p-4 rounded-xl text-center font-bold">🔒 Idea Sold & Protected by NDA</div>
            ) : (
              <>
                {idea.monetizeType === 'MONEY' && idea.askingPrice && (
                  <button onClick={handlePurchase} disabled={purchasing} className="btn-primary w-full py-3 mb-3 bg-green-600 hover:bg-green-700">
                    <HiOutlineCash className="inline w-6 h-6 mr-2 -mt-1" />
                    {purchasing ? 'Processing...' : 'Buy Idea for ' + formatCurrency(idea.askingPrice)}
                  </button>
                )}
                <button onClick={() => setShowInterest(!showInterest)} className="btn-outline w-full py-3">Negotiate / Express Interest</button>
                {showInterest && (
                  <div className="mt-4 space-y-3">
                    <textarea value={interestMsg} onChange={e => setInterestMsg(e.target.value)} placeholder="Message..." className="input-field" rows={3} />
                    <button onClick={handleInterest} className="btn-primary w-full py-3">Send Message</button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Post a Reply Composer */}
        <div className="flex gap-3 py-4 border-t border-dark-700">
          <Avatar src={user?.avatar} name={user?.displayName} />
          <div className="flex-1">
            <p className="text-[15px] text-dark-400 mb-2">Replying to <span className="text-primary-500">@{idea.author.username}</span></p>
            <textarea value={replyContent} onChange={e => setReplyContent(e.target.value)} placeholder="Post your reply" className="w-full bg-transparent text-xl placeholder-dark-500 resize-none focus:outline-none min-h-[60px]" maxLength={limits.maxChars} />
            
            {mediaFiles.length > 0 && (
              <div className="flex gap-2 overflow-x-auto py-2">
                {mediaFiles.map((m, i) => (
                  <div key={i} className="relative flex-shrink-0">
                    <img src={m.preview} className="h-24 rounded-xl object-cover" />
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
                {replyContent.length > 0 && <CircularProgress current={replyContent.length} max={limits.maxChars} />}
                <button onClick={handlePostReply} disabled={!replyContent.trim() || posting} className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-1.5 px-5 rounded-full disabled:opacity-50">
                  {posting ? 'Posting...' : 'Reply'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Render Replies as Idea Cards */}
      {idea.replies && idea.replies.map(reply => (
        <ReplyCard key={reply.id} idea={reply} onLike={handleLike} onBookmark={handleBookmark} onImageClick={(i, url) => setLightboxData({idea: i, imageUrl: url})} onRepost={handleRepost} />
      ))}
      
      {idea.replies && idea.replies.length === 0 && (
        <div className="py-20 text-center text-dark-400">No replies yet. Be the first!</div>
      )}
    </div>
  );
}