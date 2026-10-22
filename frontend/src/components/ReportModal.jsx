import React, { useState } from 'react';
import api from '../services/api';
import { X, ShieldAlert } from 'lucide-react';

const REASONS = [
  'Harassment or Hate Speech',
  'Inappropriate Content',
  'Spam or Scam',
  'Underage User',
  'Copyright Violation',
  'Other',
];

const ReportModal = ({ isOpen, onClose, target }) => {
  const [reason, setReason] = useState(REASONS[0]);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.post('/reports', {
        reportedUserId: target?.reportedUserId || null,
        reportedRoomId: target?.reportedRoomId || null,
        reason,
        description,
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 1500);
    } catch (err) {
      alert('Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm bg-vibe-card border border-white/10 rounded-3xl p-5 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-white rounded-full bg-white/5"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-3">
          <ShieldAlert className="w-5 h-5 text-amber-400" />
          <h3 className="font-bold text-sm text-white">Report Content or User</h3>
        </div>

        {submitted ? (
          <div className="p-4 text-center bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-xs">
            ✓ Report submitted. Thank you for keeping PartyVibe safe!
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Reason
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-vibe-bg border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
              >
                {REASONS.map((r) => (
                  <option key={r} value={r} className="bg-vibe-card text-white">
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Additional Details (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what occurred..."
                rows={3}
                className="w-full bg-vibe-bg border border-white/10 rounded-xl p-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-400 text-black py-2.5 rounded-xl font-bold text-xs shadow-md transition-all disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ReportModal;
