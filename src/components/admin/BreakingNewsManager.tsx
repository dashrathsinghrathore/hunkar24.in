import React, { useState } from 'react';
import { AlertCircle, Plus, Trash2, Power, Link, CheckCircle2 } from 'lucide-react';
import { useNews } from '../../context/NewsContext';

export const BreakingNewsManager: React.FC = () => {
  const {
    breakingNews,
    addBreakingNews,
    toggleBreakingNews,
    deleteBreakingNews,
    articles
  } = useNews();

  const [text, setText] = useState('');
  const [selectedArticleId, setSelectedArticleId] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    addBreakingNews(text.trim(), undefined, selectedArticleId || undefined);
    setText('');
    setSelectedArticleId('');
    setSuccessMsg('बड़ी खबर सफलतापूर्वक जोड़ी गई!');
    setTimeout(() => setSuccessMsg(''), 2500);
  };

  return (
    <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 sm:p-7 shadow-xs space-y-6">
      <div>
        <h2 className="text-xl font-black font-newspaper-headline text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span>ब्रेकिंग न्यूज़ टिकर प्रबंधन (Breaking News)</span>
        </h2>
        <p className="text-xs text-stone-500">
          वेबसाइट के शीर्ष पर तुरंत लाइव होने वाली तत्काल व बड़ी खबरों का नियंत्रण
        </p>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Add New Breaking Item Form */}
      <form onSubmit={handleAdd} className="p-4 bg-red-50/50 dark:bg-stone-800/40 rounded-xl border border-red-100 dark:border-stone-700 space-y-3">
        <label className="block text-xs font-bold text-red-900 dark:text-red-300">
          नई बड़ी खबर जोड़ें (Urgent Headline)
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            required
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="उदा. राजस्थान विधानसभा सत्र से पहले कैबिनेट का बड़ा फैसला..."
            className="flex-1 px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800"
          />

          <select
            value={selectedArticleId}
            onChange={e => setSelectedArticleId(e.target.value)}
            className="sm:w-64 px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800"
          >
            <option value="">संबंधित समाचार से जोड़ें (वैकल्पिक)</option>
            {articles.map(a => (
              <option key={a.id} value={a.id}>
                {a.headline.slice(0, 45)}...
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>लाइव जोड़ें</span>
          </button>
        </div>
      </form>

      {/* Existing Breaking News Items */}
      <div className="space-y-3">
        <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">
          सक्रिय एवं पूर्ववर्ती ब्रेकिंग टिकर ({breakingNews.length})
        </span>

        {breakingNews.map(item => (
          <div
            key={item.id}
            className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 transition-colors ${
              item.isActive
                ? 'bg-red-50/30 dark:bg-red-950/20 border-red-200 dark:border-red-900'
                : 'bg-stone-50 dark:bg-stone-800/40 border-stone-200 dark:border-stone-800 opacity-60'
            }`}
          >
            <div className="flex items-center gap-3 truncate">
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${item.isActive ? 'bg-red-600 animate-ping' : 'bg-stone-400'}`} />
              <div className="truncate">
                <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                  {item.text}
                </h4>
                {item.linkArticleId && (
                  <span className="text-[10px] text-red-700 dark:text-red-400 font-mono block">
                    लिंक: समाचार आईडी #{item.linkArticleId}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => toggleBreakingNews(item.id)}
                className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 ${
                  item.isActive
                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                    : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                }`}
                title={item.isActive ? 'अक्रिय करें' : 'सक्रिय करें'}
              >
                <Power className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{item.isActive ? 'सक्रिय' : 'बंद'}</span>
              </button>

              <button
                onClick={() => deleteBreakingNews(item.id)}
                className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950"
                title="विलोपित करें"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
