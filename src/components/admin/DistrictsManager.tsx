import React, { useState } from 'react';
import { MapPin, Search, ChevronRight } from 'lucide-react';
import { RAJASTHAN_DISTRICTS } from '../../config/siteConfig';

export const DistrictsManager: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedDist, setSelectedDist] = useState(RAJASTHAN_DISTRICTS[0]);

  const filteredDistricts = RAJASTHAN_DISTRICTS.filter(
    d =>
      d.nameHi.includes(search) ||
      d.nameEn.toLowerCase().includes(search.toLowerCase()) ||
      d.division.includes(search)
  );

  return (
    <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 sm:p-7 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div>
          <h2 className="text-xl font-black font-newspaper-headline text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-red-600" />
            <span>राजस्थान ज़िला एवं संभाग नेटवर्क (Rajasthan Districts)</span>
          </h2>
          <p className="text-xs text-stone-500">
            हुंकार 24 के अंतर्गत राजस्थान के ज़िले, तहसीलें व क्षेत्रीय संभाग
          </p>
        </div>

        <div className="relative sm:w-64">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ज़िला या संभाग खोजें..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left: District List */}
        <div className="md:col-span-5 max-h-96 overflow-y-auto space-y-1.5 pr-2">
          {filteredDistricts.map(dist => (
            <button
              key={dist.id}
              onClick={() => setSelectedDist(dist)}
              className={`w-full p-2.5 rounded-xl border text-left transition-colors flex items-center justify-between text-xs ${
                selectedDist.id === dist.id
                  ? 'bg-red-700 text-white font-bold border-red-700'
                  : 'bg-stone-50 dark:bg-stone-800/40 border-stone-200 dark:border-stone-800 hover:bg-stone-100'
              }`}
            >
              <div>
                <span className="block text-sm">{dist.nameHi}</span>
                <span className={`text-[10px] ${selectedDist.id === dist.id ? 'text-red-100' : 'text-stone-400'}`}>
                  {dist.nameEn} · संभाग: {dist.division}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-60" />
            </button>
          ))}
        </div>

        {/* Right: Selected District Details & Tehsils */}
        <div className="md:col-span-7 p-5 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-700">
            <div>
              <h3 className="text-lg font-black font-newspaper-headline text-stone-900 dark:text-stone-100">
                ज़िला: {selectedDist.nameHi} ({selectedDist.nameEn})
              </h3>
              <span className="text-xs text-stone-500 font-semibold">
                प्रशासनिक संभाग: {selectedDist.division}
              </span>
            </div>
            <span className="px-2.5 py-1 rounded bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 font-bold text-xs">
              {selectedDist.tehsils.length} तहसीलें
            </span>
          </div>

          <div>
            <span className="text-xs font-bold text-stone-600 dark:text-stone-400 block mb-2">
              संबद्ध तहसीलें एवं प्रमुख उपखंड:
            </span>
            <div className="flex flex-wrap gap-2">
              {selectedDist.tehsils.map((t, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-medium text-stone-800 dark:text-stone-200 shadow-2xs"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-stone-200 dark:border-stone-700 text-xs text-stone-500">
            इस ज़िले से संबंधित खबरें सीधे हुंकार 24 होमपेज के <em>"राजस्थान: आपका ज़िला"</em> सेक्शन में स्वतः प्रदर्शित होती हैं।
          </div>
        </div>
      </div>
    </div>
  );
};
