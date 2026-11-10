import React from 'react';
import { Briefcase, CheckCircle2, Phone, MessageCircle, DollarSign, Calendar, Check, X } from 'lucide-react';
import { useNews } from '../../context/NewsContext';

export const PromotionRequestsManager: React.FC = () => {
  const { promotionRequests, updatePromotionStatus } = useNews();

  return (
    <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 sm:p-7 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div>
          <h2 className="text-xl font-black font-newspaper-headline text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-amber-600" />
            <span>व्यापारिक विज्ञापन प्रस्ताव (Business Promotion Requests)</span>
          </h2>
          <p className="text-xs text-stone-500">
            स्थानीय स्कूलों, कोचिंग, अस्पतालों व व्यवसायों के विज्ञापन आवेदनों की समीक्षा
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {promotionRequests.map(req => (
          <div
            key={req.id}
            className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded">
                  {req.id}
                </span>
                <span className="text-xs text-stone-500 font-semibold">{req.category}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  req.status === 'pending'
                    ? 'bg-amber-100 text-amber-800'
                    : req.status === 'approved'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {req.status === 'pending' ? 'प्रतीक्षारत' : req.status === 'approved' ? 'स्वीकृत' : 'अस्वीकृत'}
                </span>
              </div>

              <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                {req.businessName} – {req.title}
              </h4>
              <p className="text-xs text-stone-600 dark:text-stone-300 mt-1 line-clamp-2">
                {req.description}
              </p>

              <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 mt-2">
                <span>संपर्क: <strong>{req.contactPerson}</strong></span>
                <span>·</span>
                <a href={`tel:${req.mobile}`} className="flex items-center gap-1 text-emerald-600 font-bold">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{req.mobile}</span>
                </a>
                <span>·</span>
                <span>स्थान: <strong>{req.preferredPlacement}</strong></span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs shrink-0">
              <div className="text-right">
                <span className="text-base font-bold text-emerald-600 font-mono block">
                  ₹{req?.budgetInr != null ? Number(req.budgetInr).toLocaleString('hi-IN') : '0'}
                </span>
                <span className="text-[10px] text-stone-400">{req.campaignDurationDays || 7} दिनों के लिए</span>
              </div>

              {req.status === 'pending' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updatePromotionStatus(req.id, 'approved', 'completed')}
                    className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                    title="स्वीकार करें"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => updatePromotionStatus(req.id, 'rejected', 'failed')}
                    className="p-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-700"
                    title="अस्वीकार करें"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
