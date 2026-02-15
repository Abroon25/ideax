import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { HiArrowLeft } from 'react-icons/hi';

export default function Settings() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await api.put('/users/profile', { displayName, bio });
      updateUser(data.user);
      toast.success('Saved!');
    } catch { toast.error('Failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="flex justify-center min-h-screen bg-dark-950">
      <main className="w-full max-w-[600px] border-x border-dark-700 min-h-screen">
        <div className="sticky top-0 z-30 bg-dark-950/80 backdrop-blur-md border-b border-dark-700 p-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-dark-800 rounded-full"><HiArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-xl font-bold">Settings</h1>
        </div>
        <div className="p-6 space-y-6">
          <div><label className="block text-sm text-dark-400 mb-2">Display Name</label><input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="input-field" /></div>
          <div><label className="block text-sm text-dark-400 mb-2">Bio</label><textarea value={bio} onChange={(e) => setBio(e.target.value)} className="input-field" rows={3} maxLength={500} /></div>
          <button onClick={handleSave} disabled={saving} className="btn-primary py-2 px-8">{saving ? 'Saving...' : 'Save Changes'}</button>
          <div className="border-t border-dark-700 pt-6">
            <h3 className="text-lg font-bold text-red-500 mb-3">Account</h3>
            <button onClick={() => { logout(); navigate('/login'); }} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-full">Logout</button>
          </div>
        </div>
      </main>
    </div>
  );
}
