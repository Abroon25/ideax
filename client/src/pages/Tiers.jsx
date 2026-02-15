import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/helpers';
import { HiCheck, HiX, HiArrowLeft } from 'react-icons/hi';
import toast from 'react-hot-toast';

const tiers = [
  { key: 'FREE', name: 'Free', price: 0, color: 'border-dark-600', features: [
    { t: '500 characters per idea', y: true }, { t: 'No file attachments', y: false }, { t: 'No monetization', y: false }, { t: 'No legal support', y: false }] },
  { key: 'BASIC', name: 'Basic', price: 499, color: 'border-blue-500', popular: true, features: [
    { t: '15,000 characters', y: true }, { t: '100MB files per post', y: true }, { t: 'Money & Profit Share', y: true }, { t: 'Legal rights guidance', y: true }, { t: 'Shareholding & Partnership', y: false }] },
  { key: 'PREMIUM', name: 'Premium', price: 1999, color: 'border-amber-500', features: [
    { t: '50,000 characters', y: true }, { t: '1GB files per post', y: true }, { t: 'All monetization options', y: true }, { t: 'Platform legal support', y: true }, { t: 'Priority support', y: true }] },
];

export default function Tiers() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="flex justify-center min-h-screen bg-dark-950">
      <main className="w-full max-w-[900px] border-x border-dark-700 min-h-screen">
        <div className="sticky top-0 z-30 bg-dark-950/80 backdrop-blur-md border-b border-dark-700 p-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-dark-800 rounded-full"><HiArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-xl font-bold">Choose Your Plan ⭐</h1>
        </div>
        <div className="p-6 grid md:grid-cols-3 gap-6">
          {tiers.map((t) => (
            <div key={t.key} className={`relative card border-2 ${t.color} p-6 flex flex-col`}>
              {t.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2"><span className="bg-blue-500 text-white text-xs px-3 py-1 rounded-full font-bold">POPULAR</span></div>}
              <h3 className="text-2xl font-bold">{t.name}</h3>
              <p className="text-3xl font-bold my-4">{t.price === 0 ? 'Free' : formatCurrency(t.price)}{t.price > 0 && <span className="text-sm text-dark-400 font-normal">/mo</span>}</p>
              <ul className="space-y-3 flex-1 mb-6">
                {t.features.map((f, i) => <li key={i} className="flex items-start gap-2">{f.y ? <HiCheck className="w-5 h-5 text-green-400 mt-0.5" /> : <HiX className="w-5 h-5 text-dark-500 mt-0.5" />}<span className={f.y ? 'text-dark-200' : 'text-dark-500'}>{f.t}</span></li>)}
              </ul>
              <button disabled={user?.tier === t.key} onClick={() => toast('Payment coming soon! 💳')}
                className={`w-full py-2 px-6 rounded-full font-bold transition-all ${user?.tier === t.key ? 'btn-outline opacity-50' : 'btn-primary'}`}>
                {user?.tier === t.key ? 'Current Plan' : t.price === 0 ? 'Get Started' : 'Upgrade'}
              </button>
            </div>
          ))}
        </div>
        <div className="p-6 card mx-6 mb-6">
          <h3 className="text-xl font-bold mb-3">💳 Pay Per Post</h3>
          <p className="text-dark-300 mb-2">Need extra on any post? Pay as you go:</p>
          <ul className="space-y-2 text-dark-300">
            <li>• ₹1 per 50 extra characters</li><li>• ₹1 per 5MB extra storage</li><li>• ₹10 to unlock monetization on any single post</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
