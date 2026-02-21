import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { getInitials } from '../utils/helpers';

export default function Settings() {
  var auth = useAuth();
  var user = auth.user;
  var logout = auth.logout;
  var updateUser = auth.updateUser;
  var navigate = useNavigate();
  var fileInputRef = useRef(null);

  var [displayName, setDisplayName] = useState(user ? user.displayName : '');
  var [bio, setBio] = useState(user ? user.bio || '' : '');
  var [saving, setSaving] = useState(false);
  var [uploadingAvatar, setUploadingAvatar] = useState(false);

  var [currentPassword, setCurrentPassword] = useState('');
  var [newPassword, setNewPassword] = useState('');
  var [confirmNewPassword, setConfirmNewPassword] = useState('');
  var [changingPassword, setChangingPassword] = useState(false);

  function handleSave() {
    setSaving(true);
    api.put('/users/profile', { displayName: displayName, bio: bio })
      .then(function(res) { updateUser(res.data.user); toast.success('Profile saved!'); })
      .catch(function() { toast.error('Failed'); })
      .finally(function() { setSaving(false); });
  }

  function handleAvatarClick() {
    fileInputRef.current.click();
  }

  function handleAvatarUpload(e) {
    var file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('Please select an image');
    if (file.size > 5 * 1024 * 1024) return toast.error('Image must be under 5MB');

    setUploadingAvatar(true);
    var formData = new FormData();
    formData.append('avatar', file);

    api.post('/users/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then(function(res) {
        updateUser({ avatar: res.data.avatar });
        toast.success('Avatar updated!');
      })
      .catch(function() { toast.error('Upload failed'); })
      .finally(function() { setUploadingAvatar(false); });
  }

  function handleChangePassword() {
    if (!currentPassword || !newPassword) return toast.error('Fill all password fields');
    if (newPassword.length < 8) return toast.error('New password must be at least 8 characters');
    if (newPassword !== confirmNewPassword) return toast.error('Passwords do not match');

    setChangingPassword(true);
    api.post('/users/change-password', { currentPassword: currentPassword, newPassword: newPassword })
      .then(function() {
        toast.success('Password changed!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      })
      .catch(function(err) { toast.error(err.response ? err.response.data.error : 'Failed'); })
      .finally(function() { setChangingPassword(false); });
  }

  return (
    <div>
      <div className="sticky top-0 z-30 bg-dark-950/80 backdrop-blur-md border-b border-dark-700 p-4">
        <h1 className="text-xl font-bold">Settings</h1>
      </div>

      <div className="p-6 space-y-8">

        {/* Avatar Section */}
        <div>
          <h2 className="text-lg font-bold mb-4">Profile Picture</h2>
          <div className="flex items-center gap-4">
            <div className="relative cursor-pointer" onClick={handleAvatarClick}>
              {user && user.avatar ? (
                <img src={user.avatar} alt="Avatar" className="w-20 h-20 rounded-full object-cover" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary-500 flex items-center justify-center font-bold text-2xl text-white">
                  {getInitials(user ? user.displayName : '')}
                </div>
              )}
              {uploadingAvatar && (
                <div className="absolute inset-0 bg-dark-950/70 rounded-full flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-dark-400 border-t-primary-500 rounded-full animate-spin" />
                </div>
              )}
              <div className="absolute bottom-0 right-0 w-7 h-7 bg-primary-500 rounded-full flex items-center justify-center text-white text-xs border-2 border-dark-950">
                📷
              </div>
            </div>
            <div>
              <button onClick={handleAvatarClick} className="text-primary-500 text-sm hover:underline">
                {uploadingAvatar ? 'Uploading...' : 'Change avatar'}
              </button>
              <p className="text-xs text-dark-500 mt-1">JPG, PNG. Max 5MB</p>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
          </div>
        </div>

        {/* Profile Info */}
        <div>
          <h2 className="text-lg font-bold mb-4">Profile Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-dark-400 mb-2">Display Name</label>
              <input value={displayName} onChange={function(e) { setDisplayName(e.target.value); }} className="input-field" />
            </div>
            <div>
              <label className="block text-sm text-dark-400 mb-2">Bio</label>
              <textarea value={bio} onChange={function(e) { setBio(e.target.value); }} className="input-field" rows={3} maxLength={500} />
              <p className="text-xs text-dark-500 mt-1">{500 - bio.length} characters remaining</p>
            </div>
            <button onClick={handleSave} disabled={saving} className="btn-primary py-2 px-8">
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </div>

        {/* Change Password */}
        <div className="border-t border-dark-700 pt-6">
          <h2 className="text-lg font-bold mb-4">Change Password</h2>
          <div className="space-y-4 max-w-md">
            <input type="password" value={currentPassword} onChange={function(e) { setCurrentPassword(e.target.value); }} placeholder="Current Password" className="input-field" />
            <input type="password" value={newPassword} onChange={function(e) { setNewPassword(e.target.value); }} placeholder="New Password (min 8 chars)" className="input-field" />
            <input type="password" value={confirmNewPassword} onChange={function(e) { setConfirmNewPassword(e.target.value); }} placeholder="Confirm New Password" className="input-field" />
            <button onClick={handleChangePassword} disabled={changingPassword} className="btn-primary py-2 px-8">
              {changingPassword ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </div>

        {/* Account Info */}
        <div className="border-t border-dark-700 pt-6">
          <h2 className="text-lg font-bold mb-4">Account</h2>
          <div className="space-y-2 text-sm text-dark-300">
            <p>Email: <span className="text-white">{user ? user.email : ''}</span></p>
            <p>Username: <span className="text-white">@{user ? user.username : ''}</span></p>
            <p>Tier: <span className="text-white">{user ? user.tier : 'FREE'}</span></p>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="border-t border-dark-700 pt-6">
          <h3 className="text-lg font-bold text-red-500 mb-3">Danger Zone</h3>
          <button onClick={function() { logout(); navigate('/login'); }} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-full">
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}