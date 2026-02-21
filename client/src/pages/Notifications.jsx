import { useState, useEffect } from 'react';
import api from '../services/api';
import { timeAgo } from '../utils/helpers';
import { HiOutlineHeart, HiOutlineChatAlt2, HiOutlineUserAdd, HiOutlineCash, HiOutlineSparkles } from 'react-icons/hi';

var icons = { LIKE: HiOutlineHeart, COMMENT: HiOutlineChatAlt2, FOLLOW: HiOutlineUserAdd, IDEA_INTEREST: HiOutlineCash, TIER_UPGRADED: HiOutlineSparkles };
var colors = { LIKE: 'text-pink-500', COMMENT: 'text-blue-400', FOLLOW: 'text-green-400', IDEA_INTEREST: 'text-amber-400', TIER_UPGRADED: 'text-purple-400' };

export default function Notifications() {
  var [notifs, setNotifs] = useState([]);
  var [loading, setLoading] = useState(true);

  useEffect(function() {
    api.get('/notifications').then(function(res) {
      setNotifs(res.data.notifications);
      setLoading(false);
      api.post('/notifications/mark-read').catch(function() {});
    }).catch(function() { setLoading(false); });
  }, []);

  return (
    <div>
      <div className="sticky top-0 z-30 bg-dark-950/80 backdrop-blur-md border-b border-dark-700 p-4">
        <h1 className="text-xl font-bold">Notifications</h1>
      </div>
      {loading ? (
        <div className="py-20 flex justify-center"><div className="w-8 h-8 border-2 border-dark-600 border-t-primary-500 rounded-full animate-spin" /></div>
      ) : notifs.length === 0 ? (
        <div className="py-20 text-center"><p className="text-4xl mb-4">🔔</p><p className="text-xl font-bold">No notifications</p></div>
      ) : (
        notifs.map(function(n) {
          var Icon = icons[n.type] || HiOutlineSparkles;
          return (
            <div key={n.id} className={'flex items-start gap-3 p-4 border-b border-dark-700 ' + (!n.isRead ? 'bg-primary-500/5' : '')}>
              <Icon className={'w-5 h-5 mt-1 ' + (colors[n.type] || 'text-dark-400')} />
              <div>
                <p className="text-sm">{n.message}</p>
                <p className="text-xs text-dark-500 mt-1">{timeAgo(n.createdAt)}</p>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}