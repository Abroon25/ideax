import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function GenreSelection() {
  const [genres, setGenres] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { fetchUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/genres').then(({ data }) => { setGenres(data.genres); setLoading(false); }).catch(() => { toast.error('Failed to load genres'); setLoading(false); });
  }, []);

  const toggle = (id) => {
    setSelected((p) => p.includes(id) ? p.filter((x) => x !== id) : p.length >= 10 ? (toast.error('Max 10'), p) : [...p, id]);
  };

  const handleSubmit = async () => {
    if (selected.length === 0) return toast.error('Select at least one');
    setSubmitting(true);
    try {
      await api.post('/genres/select', { genreIds: selected });
      await fetchUser();
      toast.success('Genres selected!');
      navigate('/');
    } catch { toast.error('Failed'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-dark-600 border-t-primary-500 rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-dark-950">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">What interests you? 🎯</h1>
          <p className="text-dark-400 text-lg">Select genres to personalize your feed ({selected.length}/10)</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
          {genres.map((g) => (
            <button key={g.id} onClick={() => toggle(g.id)}
              className={`p-4 rounded-xl border-2 transition-all text-left ${selected.includes(g.id) ? 'border-primary-500 bg-primary-500/10' : 'border-dark-700 bg-dark-800 hover:border-dark-500'}`}>
              <span className="text-2xl">{g.icon}</span>
              <p className="font-bold mt-2">{g.name}</p>
              <p className="text-xs text-dark-400 mt-1">{g.description}</p>
            </button>
          ))}
        </div>
        <div className="text-center">
          <button onClick={handleSubmit} disabled={selected.length === 0 || submitting} className="btn-primary py-3 px-10 text-lg">
            {submitting ? 'Saving...' : `Continue (${selected.length} selected)`}
          </button>
        </div>
      </div>
    </div>
  );
}
