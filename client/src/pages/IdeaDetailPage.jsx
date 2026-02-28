import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { timeAgo, formatNumber, formatCurrency, getInitials } from '../utils/helpers';
import { MONETIZE_LABELS, CATEGORY_ICONS } from '../utils/constants';
import { HiOutlineHeart, HiHeart, HiOutlineChatAlt2, HiBookmark, HiOutlineEye, HiOutlineCash, HiOutlineTrash, HiOutlinePencil } from 'react-icons/hi';
import { HiOutlineBookmark, HiArrowLeft } from 'react-icons/hi2';

export default function IdeaDetailPage() {
  var { id } = useParams();
  var navigate = useNavigate();
  var auth = useAuth();
  var user = auth.user;
  var [idea, setIdea] = useState(null);
  var [loading, setLoading] = useState(true);
  var [comment, setComment] = useState('');
  var [commenting, setCommenting] = useState(false);
  var [showInterest, setShowInterest] = useState(false);
  var [interestMsg, setInterestMsg] = useState('');
  var [offerAmt, setOfferAmt] = useState('');
  var [showShare, setShowShare] = useState(false);
  var [editing, setEditing] = useState(false);
  var [editContent, setEditContent] = useState('');
  var [savingEdit, setSavingEdit] = useState(false);

  useEffect(function() {
    api.get('/ideas/' + id).then(function(res) { setIdea(res.data.idea); setEditContent(res.data.idea.content); setLoading(false); }).catch(function() { toast.error('Not found'); navigate('/'); });
  }, [id]);

  function handleLike() {
    api.post('/ideas/' + id + '/like').then(function(res) {
      setIdea(function(p) { return Object.assign({}, p, { isLiked: res.data.liked, _count: Object.assign({}, p._count, { likes: p._count.likes + (res.data.liked ? 1 : -1) }) }); });
    });
  }

  function handleBookmark() {
    api.post('/ideas/' + id + '/bookmark').then(function(res) {
      setIdea(function(p) { return Object.assign({}, p, { isBookmarked: res.data.bookmarked }); });
    });
  }

  function handleComment() {
    if (!comment.trim()) return;
    setCommenting(true);
    api.post('/ideas/' + id + '/comment', { content: comment }).then(function(res) {
      setIdea(function(p) { return Object.assign({}, p, { comments: [res.data.comment].concat(p.comments || []), _count: Object.assign({}, p._count, { comments: p._count.comments + 1 }) }); });
      setComment('');
      toast.success('Reply posted!');
    }).catch(function() { toast.error('Failed'); }).finally(function() { setCommenting(false); });
  }

  function handleInterest() {
    api.post('/ideas/' + id + '/interest', { message: interestMsg, offerAmount: offerAmt || null }).then(function() {
      toast.success('Interest sent!');
      setShowInterest(false);
    }).catch(function(err) { toast.error(err.response ? err.response.data.error : 'Failed'); });
  }

  const handlePurchase = async () => {
    if (!window.confirm(`Buy this idea for ${formatCurrency(idea.askingPrice)}?`)) return;
    
    // 1. Generate NDA
    try {
      toast.loading('Generating NDA...', { id: 'purchase' });
      await api.post('/business/ndas/generate', { ideaId: idea.id });
      
      // 2. Mock Razorpay Flow (Since we don't have keys yet)
      setTimeout(() => {
        toast.success('Payment Successful! Idea Purchased.', { id: 'purchase' });
        // Update local state to show as sold
        setIdea(p => ({ ...p, isSold: true, soldTo: user.id }));
      }, 2000);
      
    } catch (err) {
      toast.error('Transaction failed', { id: 'purchase' });
    }
  };

  function handleDelete() {
    if (!window.confirm('Are you sure you want to delete this idea?')) return;
    api.delete('/ideas/' + id).then(function() { toast.success('Idea deleted'); navigate('/'); }).catch(function() { toast.error('Failed'); });
  }

  function handleSaveEdit() {
    setSavingEdit(true);
    api.put('/ideas/' + id, { content: editContent }).then(function(res) {
      setIdea(function(p) { return Object.assign({}, p, { content: res.data.idea.content }); });
      setEditing(false);
      toast.success('Idea updated!');
    }).catch(function(err) { toast.error(err.response ? err.response.data.error : 'Failed'); }).finally(function() { setSavingEdit(false); });
  }

  function shareToTwitter() { window.open('https://twitter.com/intent/tweet?text=' + encodeURIComponent(idea.content.substring(0, 200)) + '&url=' + encodeURIComponent(window.location.href), '_blank'); }
  function shareToLinkedIn() { window.open('https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(window.location.href), '_blank'); }
  function shareToWhatsApp() { window.open('https://wa.me/?text=' + encodeURIComponent(idea.content.substring(0, 200) + ' ' + window.location.href), '_blank'); }
  function copyLink() { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!'); setShowShare(false); }

  if (loading) return <div className="py-20 flex justify-center"><div className="w-8 h-8 border-2 border-dark-600 border-t-primary-500 rounded-full animate-spin" /></div>;
  if (!idea) return null;

  return (
    <div>
      <div className="sticky top-0 z-30 bg-dark-950/80 backdrop-blur-md border-b border-dark-700 p-4 flex items-center gap-4">
        <button onClick={function() { navigate(-1); }} className="p-2 hover:bg-dark-800 rounded-full"><HiArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-xl font-bold">Idea</h1>
      </div>

      <div className="p-4 border-b border-dark-700">
        <div className="flex items-start gap-3 justify-between">
          <div className="flex items-start gap-3">
            <Link to={'/profile/' + idea.author.username}>
              {idea.author.avatar ? <img src={idea.author.avatar} className="w-10 h-10 rounded-full object-cover" /> : <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center font-bold text-sm">{getInitials(idea.author.displayName)}</div>}
            </Link>
            <div>
              <span className="font-bold">{idea.author.displayName}</span>
              <span className="text-xs ml-2 px-2 py-0.5 rounded-full bg-dark-600 text-dark-300">{idea.author.tier}</span>
              <p className="text-dark-400 text-sm">@{idea.author.username}</p>
            </div>
          </div>
          {idea.isOwner && (
            <div className="flex gap-2">
              <button onClick={function() { setEditing(!editing); }} className="p-2 hover:bg-dark-800 rounded-full text-dark-400 hover:text-primary-500"><HiOutlinePencil className="w-5 h-5" /></button>
              <button onClick={handleDelete} className="p-2 hover:bg-dark-800 rounded-full text-dark-400 hover:text-red-500"><HiOutlineTrash className="w-5 h-5" /></button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 mt-4">
          <span className="text-sm bg-dark-800 text-dark-300 px-3 py-1 rounded-full">{CATEGORY_ICONS[idea.category]} {idea.genre ? idea.genre.name : ''}</span>
          {idea.monetizeType !== 'NONE' && <span className="text-sm px-3 py-1 rounded-full bg-green-900/50 text-green-400 border border-green-800">💰 {MONETIZE_LABELS[idea.monetizeType]}{idea.askingPrice ? ' · ' + formatCurrency(idea.askingPrice) : ''}{idea.profitSharePct ? ' · ' + idea.profitSharePct + '%' : ''}</span>}
        </div>

        {editing ? (
          <div className="mt-4">
            <textarea value={editContent} onChange={function(e) { setEditContent(e.target.value); }} className="input-field" rows={6} />
            <div className="flex gap-2 mt-3">
              <button onClick={handleSaveEdit} disabled={savingEdit} className="btn-primary py-2 px-6">{savingEdit ? 'Saving...' : 'Save'}</button>
              <button onClick={function() { setEditing(false); setEditContent(idea.content); }} className="btn-outline py-2 px-6">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="mt-4 text-lg leading-relaxed whitespace-pre-wrap">{idea.content}</div>
        )}

        {idea.attachments && idea.attachments.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {idea.attachments.map(function(a) {
              if (a.fileType && a.fileType.startsWith('image')) return <img key={a.id} src={a.fileUrl} className="rounded-xl w-full" />;
              return <a key={a.id} href={a.fileUrl} target="_blank" rel="noreferrer" className="bg-dark-800 rounded-xl p-4">📎 {a.fileName}</a>;
            })}
          </div>
        )}

        <p className="text-dark-400 text-sm mt-4 pb-4 border-b border-dark-700">{timeAgo(idea.createdAt)} · {formatNumber(idea.viewCount)} views</p>

        <div className="flex gap-6 py-3 border-b border-dark-700 text-sm">
          <span><strong>{formatNumber(idea._count ? idea._count.likes : 0)}</strong> <span className="text-dark-400">Likes</span></span>
          <span><strong>{formatNumber(idea._count ? idea._count.comments : 0)}</strong> <span className="text-dark-400">Comments</span></span>
        </div>

        <div className="flex items-center justify-around py-2 border-b border-dark-700">
          <button onClick={handleLike} className={idea.isLiked ? 'text-pink-500' : 'text-dark-400'}>{idea.isLiked ? <HiHeart className="w-6 h-6" /> : <HiOutlineHeart className="w-6 h-6" />}</button>
          <HiOutlineChatAlt2 className="w-6 h-6 text-dark-400" />
          <button onClick={handleBookmark} className={idea.isBookmarked ? 'text-primary-500' : 'text-dark-400'}>{idea.isBookmarked ? <HiBookmark className="w-6 h-6" /> : <HiOutlineBookmark className="w-6 h-6" />}</button>
          <button onClick={function() { setShowShare(!showShare); }} className="text-dark-400 hover:text-primary-500">📤</button>
        </div>

        {/* Share Options */}
        {showShare && (
          <div className="py-3 border-b border-dark-700 flex flex-wrap gap-2">
            <button onClick={shareToTwitter} className="text-xs px-4 py-2 rounded-full bg-dark-800 hover:bg-dark-700 text-dark-300">𝕏 Twitter</button>
            <button onClick={shareToLinkedIn} className="text-xs px-4 py-2 rounded-full bg-dark-800 hover:bg-dark-700 text-dark-300">🔗 LinkedIn</button>
            <button onClick={shareToWhatsApp} className="text-xs px-4 py-2 rounded-full bg-dark-800 hover:bg-dark-700 text-dark-300">💬 WhatsApp</button>
            <button onClick={copyLink} className="text-xs px-4 py-2 rounded-full bg-dark-800 hover:bg-dark-700 text-dark-300">📋 Copy Link</button>
          </div>
        )}

        {/* Monetization Actions (Buy / Express Interest) */}
        {idea.monetizeType !== 'NONE' && !idea.isOwner && (
          <div className="py-4 border-b border-dark-700">
            {idea.isSold ? (
              <div className="bg-green-900/20 border border-green-900 text-green-400 p-4 rounded-xl text-center font-bold">
                🔒 Idea Sold & Protected by NDA
              </div>
            ) : (
              <>
                {idea.monetizeType === 'MONEY' && idea.askingPrice ? (
                  <button onClick={handlePurchase} className="btn-primary w-full py-3 mb-3 bg-green-600 hover:bg-green-700">
                    <HiOutlineCash className="inline w-5 h-5 mr-2 -mt-1" />
                    Buy Idea for {formatCurrency(idea.askingPrice)}
                  </button>
                ) : null}

                <button onClick={() => setShowInterest(!showInterest)} className="btn-outline w-full py-3">
                  Negotiate / Express Interest
                </button>

                {showInterest && (
                  <div className="mt-4 space-y-3">
                    <textarea value={interestMsg} onChange={e => setInterestMsg(e.target.value)} placeholder="Message to creator..." className="input-field" rows={3} />
                    {idea.monetizeType === 'MONEY' && <input type="number" value={offerAmt} onChange={e => setOfferAmt(e.target.value)} placeholder={`Your Offer (asking: ${formatCurrency(idea.askingPrice)})`} className="input-field" />}
                    <button onClick={handleInterest} className="btn-primary w-full">Send Message</button>
                  </div>
                )}
              </>
            )}
          </div>
        )}


        {/* Comment Input */}
        <div className="flex gap-3 py-4">
          <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center font-bold text-xs">{getInitials(user ? user.displayName : '')}</div>
          <div className="flex-1 flex gap-2">
            <input value={comment} onChange={function(e) { setComment(e.target.value); }} placeholder="Post reply..." className="input-field flex-1" maxLength={1000} />
            <button onClick={handleComment} disabled={!comment.trim() || commenting} className="btn-primary px-4">{commenting ? '...' : 'Reply'}</button>
          </div>
        </div>
      </div>

      {/* Comments */}
      {idea.comments && idea.comments.map(function(c) {
        return (
          <div key={c.id} className="p-4 border-b border-dark-700">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center font-bold text-xs">{getInitials(c.user.displayName)}</div>
              <div>
                <div className="flex items-center gap-2"><span className="font-bold text-sm">{c.user.displayName}</span><span className="text-dark-400 text-sm">@{c.user.username}</span><span className="text-dark-500 text-sm">{timeAgo(c.createdAt)}</span></div>
                <p className="mt-1">{c.content}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}