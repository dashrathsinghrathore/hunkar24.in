import React, { useState } from 'react';
import { FolderTree, Plus, Power, Edit2, Trash2 } from 'lucide-react';
import { useNews } from '../../context/NewsContext';

export const CategoriesManager: React.FC = () => {
  const { categories, addCategory, updateCategory, deleteCategory } = useNews();
  const [nameHi, setNameHi] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [slug, setSlug] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameHi.trim() || !slug.trim()) return;

    addCategory({
      nameHi: nameHi.trim(),
      nameEn: nameEn.trim() || nameHi.trim(),
      slug: slug.trim().toLowerCase(),
      order: categories.length + 1,
      isVisible: true
    });

    setNameHi('');
    setNameEn('');
    setSlug('');
  };

  const handleToggleVisible = (id: string, currentVisible: boolean) => {
    updateCategory(id, { isVisible: !currentVisible });
  };

  return (
    <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 sm:p-7 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div>
          <h2 className="text-xl font-black font-newspaper-headline text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-red-600" />
            <span>समाचार श्रेणियां (Categories Management)</span>
          </h2>
          <p className="text-xs text-stone-500">
            नेविगेशन बार एवं होमपेज पर प्रदर्शित होने वाली श्रेणियों का नियंत्रण
          </p>
        </div>
      </div>

      {/* Add New Category */}
      <form onSubmit={handleAdd} className="p-4 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-200 dark:border-stone-700 flex flex-wrap items-end gap-3 text-xs">
        <div className="flex-1 min-w-[140px]">
          <label className="block font-bold mb-1">श्रेणी का नाम (हिंदी) *</label>
          <input
            type="text"
            required
            value={nameHi}
            onChange={e => {
              setNameHi(e.target.value);
              if (!slug) setSlug(e.target.value.toLowerCase().replace(/[^\w]+/g, '-'));
            }}
            placeholder="उदा. व्यापार"
            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-stone-800"
          />
        </div>

        <div className="flex-1 min-w-[140px]">
          <label className="block font-bold mb-1">Category (English)</label>
          <input
            type="text"
            value={nameEn}
            onChange={e => setNameEn(e.target.value)}
            placeholder="उदा. Business"
            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-stone-800"
          />
        </div>

        <div className="flex-1 min-w-[140px]">
          <label className="block font-bold mb-1">URL स्लग *</label>
          <input
            type="text"
            required
            value={slug}
            onChange={e => setSlug(e.target.value)}
            placeholder="उदा. business"
            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-stone-800 font-mono"
          />
        </div>

        <button
          type="submit"
          className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white font-bold rounded-lg flex items-center gap-1 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>श्रेणी जोड़ें</span>
        </button>
      </form>

      {/* Existing Categories Table */}
      <div className="overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-800">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-stone-50 dark:bg-stone-800/80 border-b border-stone-200 dark:border-stone-800 font-bold">
              <th className="p-3">क्रम</th>
              <th className="p-3">हिंदी नाम</th>
              <th className="p-3">अंग्रेजी नाम</th>
              <th className="p-3">स्लग (Slug)</th>
              <th className="p-3">दृश्यता (Visibility)</th>
              <th className="p-3 text-right">कार्यवाहियां</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
            {categories.map((cat, idx) => (
              <tr key={cat.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/40">
                <td className="p-3 font-mono">{idx + 1}</td>
                <td className="p-3 font-bold text-stone-900 dark:text-stone-100">{cat.nameHi}</td>
                <td className="p-3 text-stone-500">{cat.nameEn}</td>
                <td className="p-3 font-mono text-red-700 dark:text-red-400">/{cat.slug}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    cat.isVisible ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'
                  }`}>
                    {cat.isVisible ? 'दिखाई दे रहा है' : 'छिपा हुआ'}
                  </span>
                </td>
                <td className="p-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => handleToggleVisible(cat.id, cat.isVisible)}
                      className="p-1.5 rounded hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400"
                      title={cat.isVisible ? 'छिपाएं' : 'दिखाएं'}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>
                    {cat.slug !== 'all' && (
                      <button
                        onClick={() => deleteCategory(cat.id)}
                        className="p-1.5 rounded hover:bg-red-50 text-stone-400 hover:text-red-600"
                        title="हटाएं"
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
