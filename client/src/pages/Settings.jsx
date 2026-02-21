import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Settings() {
  var auth = useAuth();
  var user = auth.user;
  var logout = auth.logout;
  var updateUser = auth.updateUser;
  var navigate = useNavigate();
  var [displayName, setDisplayName] = useState(user ? user.displayName : '');
  var [bio, setBio] = useState(user ? user.bio || '' : '');
  var [saving, setSaving] = useState(false);

  function handleSave() {
    setSaving(true);
    api.put('/users/profile', { displayName: displayName, bio: bio })
      .then(function(res) { updateUser(res.data.user); toast.success('Saved!'); })
      .catch(function() { toast.error('Failed'); })
      .finally(function() { setSaving(false); });
  }

  return (
    <div>
      <div className="sticky top-0 z-30 bg-dark-950/80 backdrop-blur-md border-b border-dark-700 p-4">
        <h1 className="text-xl font-bold">Settings</h1>
      </div>
      <div className="p-6 space-y-6">
        <div>
          <label className="block text-sm text-dark-400 mb-2">Display Name</label>
          <input value={displayName} onChange={function(e) { setDisplayName(e.target.value); }} className="input-field" />
        </div>
        <div>
          <label className="block text-sm text-dark-400 mb-2">Bio</label>
          <textarea value={bio} onChange={function(e) { setBio(e.target.value); }} className="input-field" rows={3} maxLength={500} />
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary py-2 px-8">{saving ? 'Saving...' : 'Save Changes'}</button>
        <div className="border-t border-dark-700 pt-6">
          <h3 className="text-lg font-bold text-red-500 mb-3">Account</h3>
          <button onClick={function() { logout(); navigate('/login'); }} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-full">Logout</button>
        </div>
      </div>
    </div>
  );
}