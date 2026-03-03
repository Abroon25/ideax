import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatCurrency, truncateText } from '../utils/helpers';
import { HiOutlineDocumentDownload, HiOutlineShieldCheck, HiOutlineExclamationCircle } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function Purchases() {
  const { user } = useAuth();
  const [data, setData] = useState({ transactions: [], ndas: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('transactions');

  useEffect(() => {
    api.get('/payments/transactions')
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(() => {
        toast.error('Failed to load wallet data');
        setLoading(false);
      });
  }, []);

  const handleDispute = async (transactionId) => {
    const reason = window.prompt("Please describe the issue with this purchase:");
    if (!reason) return;

    try {
      await api.post('/business/disputes', { transactionId, reason });
      toast.success('Dispute raised successfully. Admin will review it.');
      // Refresh data
      const res = await api.get('/payments/transactions');
      setData(res.data);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to raise dispute');
    }
  };

  if (loading) return <div className="py-20 flex justify-center"><div className="w-8 h-8 border-2 border-dark-600 border-t-primary-500 rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="sticky top-0 z-30 bg-dark-950/80 backdrop-blur-md border-b border-dark-700 p-4">
        <h1 className="text-xl font-bold">Wallet & Contracts 💼</h1>
        
        <div className="flex mt-4 border-b border-dark-700">
          <button 
            onClick={() => setActiveTab('transactions')}
            className={`flex-1 pb-3 text-sm font-bold relative ${activeTab === 'transactions' ? 'text-white' : 'text-dark-400'}`}>
            Transactions
            {activeTab === 'transactions' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary-500 rounded-full" />}
          </button>
          <button 
            onClick={() => setActiveTab('ndas')}
            className={`flex-1 pb-3 text-sm font-bold relative ${activeTab === 'ndas' ? 'text-white' : 'text-dark-400'}`}>
            My NDAs
            {activeTab === 'ndas' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary-500 rounded-full" />}
          </button>
        </div>
      </div>

      <div className="p-4">
        {/* TRANSACTIONS TAB */}
        {activeTab === 'transactions' && (
          <div className="space-y-4">
            {data.transactions.length === 0 ? (
              <p className="text-center text-dark-400 py-10">No transactions yet.</p>
            ) : (
              data.transactions.map(tx => (
                <div key={tx.id} className="card p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className={`text-xs px-2 py-1 rounded-full font-bold ${tx.status === 'COMPLETED' ? 'bg-green-900/30 text-green-400' : 'bg-dark-700 text-dark-300'}`}>
                        {tx.type.replace(/_/g, ' ')}
                      </span>
                      <p className="text-dark-400 text-xs mt-2">{formatDate(tx.createdAt)}</p>
                    </div>
                    <p className="font-bold text-lg">{formatCurrency(tx.amount)}</p>
                  </div>
                  
                  {tx.idea && <p className="text-sm text-dark-200 mt-2 mb-3">"{truncateText(tx.idea.content, 100)}"</p>}

                  <div className="flex gap-3 mt-4 pt-3 border-t border-dark-700">
                    {tx.invoice?.invoiceUrl && (
                      <a href={tx.invoice.invoiceUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm text-primary-500 hover:underline">
                        <HiOutlineDocumentDownload className="w-4 h-4" /> Download Invoice
                      </a>
                    )}
                    
                    {tx.type === 'IDEA_PURCHASE' && tx.disputes?.length === 0 && (
                      <button onClick={() => handleDispute(tx.id)} className="flex items-center gap-1 text-sm text-red-400 hover:underline ml-auto">
                        <HiOutlineExclamationCircle className="w-4 h-4" /> Report Issue
                      </button>
                    )}

                    {tx.disputes?.length > 0 && (
                      <span className="flex items-center gap-1 text-sm text-amber-500 ml-auto font-bold">
                        Dispute {tx.disputes[0].status}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* NDAs TAB */}
        {activeTab === 'ndas' && (
          <div className="space-y-4">
            {data.ndas.length === 0 ? (
              <p className="text-center text-dark-400 py-10">No active NDAs.</p>
            ) : (
              data.ndas.map(nda => (
                <div key={nda.id} className="card p-4 border-primary-900/50 bg-primary-900/5">
                  <div className="flex items-center gap-2 mb-3 text-primary-500">
                    <HiOutlineShieldCheck className="w-6 h-6" />
                    <h3 className="font-bold">Non-Disclosure Agreement</h3>
                  </div>
                  
                  <p className="text-sm text-dark-200 mb-4 italic">"{truncateText(nda.idea.content, 100)}"</p>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm bg-dark-900 p-3 rounded-lg mb-3">
                    <div>
                      <p className="text-dark-400 text-xs">Buyer</p>
                      <p className="font-bold">{nda.buyer.displayName}</p>
                    </div>
                    <div>
                      <p className="text-dark-400 text-xs">Seller (Creator)</p>
                      <p className="font-bold">{nda.seller.displayName}</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs text-dark-400">
                    <span>Signed: {formatDate(nda.createdAt)}</span>
                    <span className="bg-green-900/30 text-green-400 px-2 py-1 rounded">Status: {nda.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}