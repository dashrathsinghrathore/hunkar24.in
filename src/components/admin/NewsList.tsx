import React, { useState } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Filter,
  CheckCircle,
  Clock,
  ExternalLink,
  Flame
} from 'lucide-react';
import { useNews } from '../../context/NewsContext';
import { Article } from '../../types';

interface NewsListProps {
  onEditArticle: (article: Article) => void;
  onCreateNew: () => void;
}

export const NewsList: React.FC<NewsListProps> = ({ onEditArticle, onCreateNew }) => {
  const { articles, deleteArticle, updateArticle, setActiveArticle } = useNews();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filteredArticles = articles.filter(art => {
    const matchesSearch =
      art.headline.toLowerCase().includes(searchTerm.toLowerCase()) ||
      art.reporterName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || art.status === statusFilter;
    const matchesCat = categoryFilter === 'all' || art.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCat;
  });

  const handleDelete = (id: string, headline: string) => {
    if (window.confirm(`क्या आप वाकई इस समाचार को हटाना चाहते हैं?\n"${headline}"`)) {
      deleteArticle(id);
    }
  };

  const handleToggleStatus = (article: Article) => {
    const newStatus = article.status === 'published' ? 'draft' : 'published';
    updateArticle(article.id, { status: newStatus });
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
          className="flex items-center gap-1.5 px-4 py-2 bg-red-700 hover:bg-red-800 text-white font-bold rounded-xl text-xs transition-colors self-start sm:self-center shadow-xs"
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
            placeholder="शीर्षक या रिपोर्टर द्वारा खोजें..."
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
          <option value="rajasthan">राजस्थान</option>
          <option value="jobs">नौकरी व रोजगार</option>
          <option value="schemes">सरकारी योजनाएं</option>
          <option value="agriculture">कृषि एवं मंडी</option>
          <option value="ground-report">ग्राउंड रिपोर्ट</option>
          <option value="weather">मौसम</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-800">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-stone-50 dark:bg-stone-800/80 border-b border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 font-bold">
              <th className="p-3">शीर्षक व विवरण</th>
              <th className="p-3">श्रेणी / ज़िला</th>
              <th className="p-3">संपादक / ब्यूरो</th>
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
                        className="w-10 h-10 rounded object-cover"
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

                <td className="p-3 whitespace-nowrap">
                  <span className="font-medium">{art.reporterName}</span>
                </td>

                <td className="p-3 whitespace-nowrap">
                  <button
                    onClick={() => handleToggleStatus(art)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
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
                      onClick={() => onEditArticle(art)}
                      className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800"
                      title="संपादित करें"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(art.id, art.headline)}
                      className="p-1.5 rounded-lg text-stone-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                      title="विलोपित करें"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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
