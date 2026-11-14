import React, { useState } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Check,
  ExternalLink
} from 'lucide-react';
import { useNews } from '../../context/NewsContext';
import { Article } from '../../types';

interface NewsListProps {
  onEditArticle: (article: Article) => void;
  onCreateNew: () => void;
}

export const NewsList: React.FC<NewsListProps> = ({ onEditArticle, onCreateNew }) => {
  const { articles, categories, deleteArticle, updateArticle } = useNews();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filteredArticles = articles.filter(art => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !q ||
      art.headline.toLowerCase().includes(q) ||
      (art.district || '').toLowerCase().includes(q) ||
      (art.category || '').toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || art.status === statusFilter;
    const matchesCat = categoryFilter === 'all' || art.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCat;
  });

  const handleConfirmDelete = (id: string) => {
    deleteArticle(id);
    setConfirmDeleteId(null);
  };

  const handleToggleStatus = (article: Article) => {
    const newStatus = article.status === 'published' ? 'draft' : 'published';
    updateArticle(article.id, { status: newStatus });
  };

  const handleCopyShareLink = async (article: Article) => {
    const origin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'https://hunkar24.in';
    const url = `${origin}/news/${article.slug}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
    }
    setCopiedId(article.id);
    setTimeout(() => setCopiedId(prev => (prev === article.id ? null : prev)), 2500);
  };

  return (
    <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 sm:p-7 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div>
          <h2 className="text-xl font-black font-newspaper-headline text-stone-900 dark:text-stone-100">
            समाचार प्रबंधन (News Management)
          </h2>
          <p className="text-xs text-stone-500">
            कुल {articles.length} समाचार आलेख रिकॉर्ड में दर्ज
          </p>
        </div>

        <button
          onClick={onCreateNew}
          className="flex items-center gap-1.5 px-4 py-2 bg-red-700 hover:bg-red-800 text-white font-bold rounded-xl text-xs transition-colors self-start sm:self-center shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>नया समाचार जोड़ें</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="शीर्षक, ज़िला या श्रेणी द्वारा खोजें..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
          />
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as any)}
          className="px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
        >
          <option value="all">सभी स्थितियां (All Status)</option>
          <option value="published">केवल प्रकाशित (Published)</option>
          <option value="draft">केवल ड्राफ्ट (Draft)</option>
        </select>

        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
        >
          <option value="all">सभी श्रेणियां (All Categories)</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.slug}>
              {cat.nameHi}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-800">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-stone-50 dark:bg-stone-800/80 border-b border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 font-bold">
              <th className="p-3">शीर्षक व लिंक</th>
              <th className="p-3">श्रेणी / ज़िला</th>
              <th className="p-3">प्रकाशन समय</th>
              <th className="p-3">स्थिति</th>
              <th className="p-3 text-right">कार्यवाहियां</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
            {filteredArticles.map(art => (
              <tr
                key={art.id}
                className="hover:bg-stone-50/80 dark:hover:bg-stone-800/40 transition-colors"
              >
                <td className="p-3 max-w-sm">
                  <div className="flex items-center gap-2">
                    <div className="relative shrink-0">
                      <img
                        src={art.mainImage}
                        alt={art.imageAlt || art.headline}
                        className="w-10 h-10 rounded object-cover bg-stone-100 dark:bg-stone-800"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=120&q=80';
                        }}
                      />
                      {art.imageType === 'ai_illustration' && (
                        <span
                          className="absolute -bottom-1 -right-1 bg-indigo-600 text-[8px] text-white px-1 rounded font-bold shadow-xs"
                          title="प्रतीकात्मक AI इलस्ट्रेशन"
                        >
                          AI
                        </span>
                      )}
                    </div>
                    <div className="truncate">
                      <h4 className="font-bold text-stone-900 dark:text-stone-100 truncate">
                        {art.headline}
                      </h4>
                      <span className="text-[10px] text-stone-400 font-mono">
                        /news/{art.slug}
                      </span>
                    </div>
                  </div>
                </td>

                <td className="p-3 whitespace-nowrap">
                  <span className="font-semibold block">{art.category}</span>
                  <span className="text-stone-400 text-[10px]">{art.district || 'राजस्थान'}</span>
                </td>

                <td className="p-3 whitespace-nowrap text-stone-500 font-mono text-[11px]">
                  {art.publishedAt ? new Date(art.publishedAt).toLocaleString('hi-IN', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                </td>

                <td className="p-3 whitespace-nowrap">
                  <button
                    onClick={() => handleToggleStatus(art)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                      art.status === 'published'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {art.status === 'published' ? 'प्रकाशित' : 'ड्राफ्ट'}
                  </button>
                </td>

                <td className="p-3 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => handleCopyShareLink(art)}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                        copiedId === art.id
                          ? 'bg-emerald-600 text-white'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-emerald-50 hover:text-emerald-700'
                      }`}
                      title="पूरा शेयर लिंक कॉपी करें"
                    >
                      {copiedId === art.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId === art.id ? 'कॉपी' : 'लिंक'}</span>
                    </button>
                    <a
                      href={`/news/${art.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-stone-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                      title="लाइव लिंक खोलें"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => onEditArticle(art)}
                      className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                      title="संपादित करें"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {confirmDeleteId === art.id ? (
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleConfirmDelete(art.id)}
                          className="px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold cursor-pointer"
                        >
                          हटाएं
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2 py-1 rounded bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-200 text-[10px] font-bold cursor-pointer"
                        >
                          रद्द
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(art.id)}
                        className="p-1.5 rounded-lg text-stone-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 cursor-pointer"
                        title="विलोपित करें"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
