import React, { useState } from 'react';
import {
  Inbox,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Phone,
  Eye,
  ExternalLink,
  MessageCircle,
  Check,
  X
} from 'lucide-react';
import { useNews } from '../../context/NewsContext';
import { PublicNewsSubmission } from '../../types';

export const PublicSubmissionsReview: React.FC = () => {
  const { submissions, approveSubmission, rejectSubmission } = useNews();
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [rejectReason, setRejectReason] = useState<{ [id: string]: string }>({});
  const [showRejectInput, setShowRejectInput] = useState<{ [id: string]: boolean }>({});

  const filtered = submissions.filter(
    s => filterStatus === 'all' || s.status === filterStatus
  );

  const handleApprove = (id: string) => {
    approveSubmission(id, 'संपादकीय पुष्टि उपरांत स्वीकृत व प्रकाशित।');
  };

  const handleReject = (id: string) => {
    const reason = rejectReason[id] || 'तथ्यों की अपूर्णता या नियमों के अनुरूप न होने के कारण।';
    rejectSubmission(id, reason);
    setShowRejectInput(prev => ({ ...prev, [id]: false }));
  };

  return (
    <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 sm:p-7 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div>
          <h2 className="text-xl font-black font-newspaper-headline text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Inbox className="w-5 h-5 text-red-600" />
            <span>नागरिक समाचार समीक्षा कक्ष (Citizen Journalism Submissions)</span>
          </h2>
          <p className="text-xs text-stone-500">
            आम पाठकों व जन-रिपोर्टरों द्वारा भेजी गई खबरों का संपादकीय सत्यापन व प्रकाशन
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1 rounded-lg ${filterStatus === 'all' ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs' : 'text-stone-500'}`}
          >
            सभी ({submissions.length})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1 rounded-lg ${filterStatus === 'pending' ? 'bg-amber-500 text-white shadow-xs' : 'text-stone-500'}`}
          >
            समीक्षाधीन ({submissions.filter(s => s.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilterStatus('approved')}
            className={`px-3 py-1 rounded-lg ${filterStatus === 'approved' ? 'bg-emerald-600 text-white shadow-xs' : 'text-stone-500'}`}
          >
            स्वीकृत ({submissions.filter(s => s.status === 'approved').length})
          </button>
        </div>
      </div>

      {/* Submissions List */}
      <div className="space-y-4">
        {filtered.map(sub => (
          <div
            key={sub.id}
            className={`p-4 sm:p-5 rounded-xl border transition-all ${
              sub.status === 'pending'
                ? 'bg-amber-50/20 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900'
                : sub.status === 'approved'
                ? 'bg-emerald-50/20 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900'
                : 'bg-stone-50 dark:bg-stone-800/30 border-stone-200 dark:border-stone-800'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-950 px-2 py-0.5 rounded">
                    {sub.id}
                  </span>
                  <span className="text-xs text-stone-500">
                    {new Date(sub.createdAt).toLocaleString('hi-IN')}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    sub.status === 'pending'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                      : sub.status === 'approved'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {sub.status === 'pending' ? 'समीक्षाधीन' : sub.status === 'approved' ? 'स्वीकृत व प्रकाशित' : 'अस्वीकृत'}
                  </span>
                </div>

                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 font-newspaper-headline">
                  {sub.headline}
                </h3>
              </div>

              {/* Status Action Buttons */}
              {sub.status === 'pending' && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleApprove(sub.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>स्वीकार व प्रकाशित करें</span>
                  </button>
                  <button
                    onClick={() => setShowRejectInput(prev => ({ ...prev, [sub.id]: !prev[sub.id] }))}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-xs font-bold transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>अस्वीकृत</span>
                  </button>
                </div>
              )}
            </div>

            {/* Reject reason box */}
            {showRejectInput[sub.id] && (
              <div className="my-3 p-3 bg-red-50 dark:bg-red-950/60 rounded-lg border border-red-200 dark:border-red-800 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="अस्वीकृति का कारण लिखें..."
                  value={rejectReason[sub.id] || ''}
                  onChange={e => setRejectReason({ ...rejectReason, [sub.id]: e.target.value })}
                  className="flex-1 px-2 py-1 text-xs border rounded bg-white dark:bg-stone-800"
                />
                <button
                  onClick={() => handleReject(sub.id)}
                  className="px-3 py-1 bg-red-700 text-white text-xs font-bold rounded"
                >
                  पुष्टि करें
                </button>
              </div>
            )}

            {/* Description */}
            <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed my-3 bg-white dark:bg-stone-800/80 p-3 rounded-lg border border-stone-100 dark:border-stone-700">
              {sub.description}
            </p>

            {/* Attached media if available */}
            {sub.imageUrls.length > 0 && sub.imageUrls[0] && (
              <div className="my-2 flex items-center gap-2">
                <img
                  src={sub.imageUrls[0]}
                  alt=""
                  className="w-20 h-14 object-cover rounded border border-stone-200 dark:border-stone-700"
                />
                <a
                  href={sub.imageUrls[0]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-red-700 dark:text-red-400 font-bold hover:underline flex items-center gap-1"
                >
                  <span>मूल तस्वीर देखें</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {/* Submitter & Location Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-200 dark:border-stone-700 text-xs text-stone-600 dark:text-stone-400">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 font-bold text-stone-800 dark:text-stone-200">
                  <MapPin className="w-3.5 h-3.5 text-red-600" />
                  <span>{sub.village ? `${sub.village}, ` : ''}{sub.tehsil}, {sub.district}</span>
                </span>
                <span>·</span>
                <span>प्रेषक: <strong>{sub.submitterName}</strong></span>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href={`tel:${sub.mobile}`}
                  className="flex items-center gap-1 hover:text-stone-900 dark:hover:text-stone-100"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{sub.mobile}</span>
                </a>
                <a
                  href={`https://wa.me/91${sub.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-emerald-600 hover:underline"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>व्हाट्सऐप पर संपर्क</span>
                </a>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-stone-400 text-xs">
            कोई समाचार प्रविष्टि नहीं मिली।
          </div>
        )}
      </div>
    </div>
  );
};
