import React, { useState } from 'react';
import { X, Flag, CheckCircle2, AlertCircle, Send } from 'lucide-react';
import { useNews } from '../../context/NewsContext';

export const ReportIssueModal: React.FC = () => {
  const { isReportIssueOpen, setIsReportIssueOpen, activeArticle, logAction } = useNews();

  const [issueType, setIssueType] = useState('तथ्यात्मक त्रुटि');
  const [details, setDetails] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [reporterEmail, setReporterEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isReportIssueOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!details.trim()) return;

    logAction(
      'त्रुटि रिपोर्ट दर्ज',
      'Editorial Policy',
      `लेख: ${activeArticle?.headline || 'सामान्य'} | प्रकार: ${issueType} | विवरण: ${details} | प्रेषक: ${reporterName || 'अनाम'}`
    );

    setSubmitted(true);
  };

  const handleClose = () => {
    setIsReportIssueOpen(false);
    setSubmitted(false);
    setDetails('');
    setReporterName('');
    setReporterEmail('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden">
        <div className="bg-stone-900 text-white p-4 flex items-center justify-between">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Flag className="w-4 h-4 text-red-500" />
            <span>समाचार सुधार या शिकायत दर्ज करें</span>
          </h3>
          <button
            onClick={handleClose}
            className="p-1 rounded text-stone-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          {submitted ? (
            <div className="text-center py-6">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
              <h4 className="text-base font-bold text-stone-900 dark:text-stone-100 font-newspaper-headline">
                आपकी शिकायत दर्ज कर ली गई है
              </h4>
              <p className="text-xs text-stone-600 dark:text-stone-300 mt-2 max-w-sm mx-auto">
                हुंकार 24 की संपादकीय व फैक्ट-चेक टीम 24 घंटे के भीतर इसकी समीक्षा कर उचित संशोधन करेगी।
              </p>
              <button
                onClick={handleClose}
                className="mt-5 px-5 py-2 bg-stone-900 dark:bg-stone-800 text-white font-bold rounded-lg text-xs"
              >
                बंद करें
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {activeArticle && (
                <div className="p-2.5 bg-stone-50 dark:bg-stone-800/50 rounded-lg text-xs text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                  <span className="font-bold text-stone-700 dark:text-stone-200 block mb-0.5">संबंधित समाचार:</span>
                  <p className="line-clamp-1 italic">{activeArticle.headline}</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  समस्या का प्रकार
                </label>
                <select
                  value={issueType}
                  onChange={e => setIssueType(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
                >
                  <option value="तथ्यात्मक त्रुटि">तथ्यात्मक त्रुटि (Fact Error)</option>
                  <option value="टाइपिंग या वर्तनी की गलती">वर्तनी या व्याकरण की अशुद्धि</option>
                  <option value="फोटो या क्रेडिट गलत">तस्वीर या क्रेडिट का गलत संदर्भ</option>
                  <option value="कॉपीराइट या आपत्तिजनक सामग्री">कॉपीराइट या आपत्तिजनक सामग्री</option>
                  <option value="अन्य">अन्य शिकायत</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  त्रुटि का विवरण एवं सही तथ्य <span className="text-red-600">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={details}
                  onChange={e => setDetails(e.target.value)}
                  placeholder="कृपया बताएं कि क्या गलत है और सही जानकारी क्या होनी चाहिए..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-400 mb-1">
                    आपका नाम (वैकल्पिक)
                  </label>
                  <input
                    type="text"
                    value={reporterName}
                    onChange={e => setReporterName(e.target.value)}
                    placeholder="नाम"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-400 mb-1">
                    ईमेल या फोन
                  </label>
                  <input
                    type="text"
                    value={reporterEmail}
                    onChange={e => setReporterEmail(e.target.value)}
                    placeholder="संपर्क सूत्र"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-3 py-1.5 text-xs text-stone-600 dark:text-stone-400 hover:bg-stone-100 rounded"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-700 text-white text-xs font-bold rounded-lg hover:bg-red-800 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>शिकायत भेजें</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
