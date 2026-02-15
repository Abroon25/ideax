import { formatDistanceToNow, format } from 'date-fns';

export const timeAgo = (d) => formatDistanceToNow(new Date(d), { addSuffix: true });
export const formatDate = (d) => format(new Date(d), 'MMM dd, yyyy');
export const formatNumber = (n) => { if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'; if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'; return (n || 0).toString(); };
export const formatCurrency = (a) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(a);
export const truncateText = (t, m = 280) => t.length <= m ? t : t.slice(0, m) + '...';
export const getInitials = (n) => (n || '??').split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
export const formatFileSize = (b) => { if (!b) return '0 B'; const k = 1024; const s = ['B', 'KB', 'MB', 'GB']; const i = Math.floor(Math.log(b) / Math.log(k)); return parseFloat((b / Math.pow(k, i)).toFixed(2)) + ' ' + s[i]; };
