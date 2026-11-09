import React, { useState } from 'react';
import {
  Wheat,
  TrendingUp,
  MapPin,
  CheckCircle2,
  Calendar,
  ExternalLink,
  ArrowRight,
  Sun,
  ShieldCheck,
  HelpCircle,
  Clock
} from 'lucide-react';
import { useNews } from '../../context/NewsContext';
import { ArticleCard } from './ArticleCard';

import {
  INITIAL_MANDI_DATA,
  RAJASTHAN_MANDIS,
  COMMODITIES_HI,
  MandiRecord
} from '../../data/mandiData';

interface AgricultureFarmersSectionProps {
  excludeIds?: Set<string>;
}

export const AgricultureFarmersSection: React.FC<AgricultureFarmersSectionProps> = ({ excludeIds }) => {
  const { articles, setSelectedCategory, setActiveArticle, incrementArticleViews } = useNews();
  const [selectedCommodity, setSelectedCommodity] = useState<string>('all');
  const [selectedMandi, setSelectedMandi] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Filter agriculture, farmer and rural articles, excluding stories shown in previous sections
  const candidateArticles = excludeIds && excludeIds.size > 0
    ? articles.filter(a => !excludeIds.has(a.id))
    : articles;

  const agriArticles = candidateArticles.filter(
    a => a.category === 'agriculture' || a.tags?.some(t => ['किसान', 'कृषि', 'मंडी भाव', 'ग्रामीण', 'कुसुम योजना'].includes(t))
  );

  const filteredMandiRates = INITIAL_MANDI_DATA.filter(item => {
    const matchCrop = selectedCommodity === 'all' || item.cropHi.includes(selectedCommodity);
    const matchMandi = selectedMandi === 'all' || item.mandi.includes(selectedMandi) || item.district === selectedMandi;
    return matchCrop && matchMandi;
  });


  const farmerSchemes = [
    {
      id: 'sch-1',
      title: 'प्रधानमंत्री कुसुम योजना (Solar Pump)',
      benefit: '75% सरकारी अनुदान',
      desc: '3 से 7.5 HP क्षमता के सोलर कृषि पंप पर भारी सब्सिडी। ढाणियों व बिना बिजली के खेतों के लिए वरदान।',
      lastDate: '31 दिसंबर 2026',
      linkUrl: 'https://rajkisan.rajasthan.gov.in',
      tag: 'सोलर पंप'
    },
    {
      id: 'sch-2',
      title: 'खेत तारबंदी योजना (Farm Fencing)',
      benefit: 'लागत का 50% से 60% अनुदान',
      desc: 'आवारा पशुओं व नीलगाय से फसल सुरक्षा के लिए 400 मीटर तक तारबंदी हेतु अधिकतम 48,000 रुपये तक सहायता।',
      lastDate: 'चलंत योजना',
      linkUrl: 'https://rajkisan.rajasthan.gov.in',
      tag: 'फसल सुरक्षा'
    },
    {
      id: 'sch-3',
      title: 'शून्य प्रतिशत ब्याज फसली ऋण योजना',
      benefit: '25,000 करोड़ का ऋण वितरण',
      desc: 'सहकारी भूमि विकास बैंकों एवं ग्राम सेवा सहकारी समितियों के माध्यम से समय पर भुगतान करने पर ब्याजमुक्त ऋण।',
      lastDate: '31 मार्च 2026',
      linkUrl: 'https://cooperative.rajasthan.gov.in',
      tag: 'ब्याजमुक्त ऋण'
    },
    {
      id: 'sch-4',
      title: 'पीएम किसान सम्मान निधि (19वीं किस्त)',
      benefit: '₹2,000 प्रत्यक्ष बैंक हस्तांतरण',
      desc: 'ई-केवाईसी और लैंड सीडिंग अनिवार्य। किसी भी तकनीकी समस्या के लिए नजदीकी ई-मित्र पर संपर्क करें।',
      lastDate: 'डीबीटी जारी',
      linkUrl: 'https://pmkisan.gov.in',
      tag: 'डीबीटी सहायता'
    }
  ];

  return (
    <section className="mb-12 border-t-4 border-amber-600 pt-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-amber-600 text-white p-2.5 rounded-xl shadow-md">
            <Wheat className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-full">
                अन्नदाता कल्याण एवं चौपाल
              </span>
              <span className="text-[11px] font-bold text-stone-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>प्रतिदिन अद्यतित</span>
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-stone-100 font-newspaper-headline tracking-tight mt-0.5">
              कृषि, किसान एवं राजस्थान मंडी भाव
            </h2>
          </div>
        </div>

        <button
          onClick={() => {
            setSelectedCategory('agriculture');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer self-start md:self-center"
        >
          <span>सभी कृषि व मंडी समाचार देखें</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Live Mandi Rates Interactive Control & Rates Grid */}
      <div className="mb-8 bg-gradient-to-r from-amber-50/90 via-orange-50/70 to-amber-50/90 dark:from-stone-900 dark:via-stone-900/90 dark:to-stone-900 rounded-2xl border border-amber-200 dark:border-amber-900/50 p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-amber-200/80 dark:border-amber-900/40">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <h3 className="text-sm font-black text-stone-900 dark:text-stone-100 uppercase tracking-wide">
              राजस्थान कृषि उपज मंडी आज के भाव (Mandi Bhav Live 12 फसलें):
            </h3>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-bold text-stone-500">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>दैनिक लाइव दरें | स्रोत: राजस्थान कृषि विपणन बोर्ड</span>
          </div>
        </div>

        {/* Commodity Filter Pills */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <span className="text-stone-400 font-bold shrink-0 text-[11px]">फसल चुनें:</span>
            <button
              onClick={() => setSelectedCommodity('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 transition-colors cursor-pointer ${
                selectedCommodity === 'all'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200'
              }`}
            >
              सभी 12 फसलें
            </button>
            {COMMODITIES_HI.map(crop => (
              <button
                key={crop}
                onClick={() => setSelectedCommodity(crop)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
                  selectedCommodity === crop
                    ? 'bg-amber-600 text-white font-bold shadow-xs'
                    : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200'
                }`}
              >
                {crop}
              </button>
            ))}
          </div>

          {/* Mandi Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <span className="text-stone-400 font-bold shrink-0 text-[11px]">मंडी चुनें:</span>
            <button
              onClick={() => setSelectedMandi('all')}
              className={`px-2 py-0.5 rounded text-[11px] font-bold shrink-0 transition-colors cursor-pointer ${
                selectedMandi === 'all'
                  ? 'bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900'
                  : 'bg-stone-100 dark:bg-stone-800/60 text-stone-600 dark:text-stone-400'
              }`}
            >
              सभी मंडियां (10)
            </button>
            {RAJASTHAN_MANDIS.map(m => (
              <button
                key={m.name}
                onClick={() => setSelectedMandi(m.district)}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold shrink-0 transition-colors cursor-pointer ${
                  selectedMandi === m.district
                    ? 'bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900 font-bold'
                    : 'bg-stone-100 dark:bg-stone-800/60 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
                }`}
              >
                {m.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Mandi Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {filteredMandiRates.slice(0, 12).map((m) => (
            <div
              key={m.id}
              className="bg-white dark:bg-stone-800/90 rounded-xl p-3 border border-stone-200 dark:border-stone-700/80 shadow-2xs hover:border-amber-400 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="text-xs font-black text-stone-900 dark:text-stone-100 truncate">
                  {m.cropHi}
                </div>
                <div className="text-[11px] text-stone-500 dark:text-stone-400 truncate flex items-center gap-0.5 mt-0.5">
                  <MapPin className="w-2.5 h-2.5 shrink-0 text-amber-600" />
                  <span>{m.mandi}</span>
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-stone-100 dark:border-stone-700/50">
                <div className="flex items-baseline justify-between">
                  <div className="text-sm font-black text-amber-700 dark:text-amber-400 font-mono">
                    ₹{m.modalPrice.toLocaleString()}
                  </div>
                  <span
                    className={`text-[10px] font-bold px-1 py-0.5 rounded ${
                      m.trend === 'up'
                        ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40'
                        : m.trend === 'down'
                        ? 'text-red-600 bg-red-50 dark:bg-red-950/40'
                        : 'text-stone-500 bg-stone-100 dark:bg-stone-800'
                    }`}
                  >
                    {m.changeAmount}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-stone-400 mt-1">
                  <span>रेंज: {m.minPrice}-{m.maxPrice}</span>
                  <span>{m.arrivalQuintal}q आवक</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Grid: Articles on Left (8 cols) + Farmer Schemes on Right (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Agriculture & Rural News Stories */}
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {agriArticles.slice(0, 4).map(art => (
              <ArticleCard key={art.id} article={art} layout="standard" showSummary={true} />
            ))}
          </div>

          {agriArticles.length > 4 && (
            <div className="space-y-4 pt-2">
              <h4 className="text-base font-bold font-newspaper-headline text-stone-900 dark:text-stone-100 border-b border-stone-200 dark:border-stone-800 pb-2">
                अन्य प्रमुख ग्रामीण व कृषि हलचल:
              </h4>
              <div className="space-y-3">
                {agriArticles.slice(4, 7).map(art => (
                  <ArticleCard key={art.id} article={art} layout="horizontal" />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Farmer Schemes & Subsidies */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-stone-100 dark:border-stone-800">
              <ShieldCheck className="w-5 h-5 text-amber-600" />
              <div>
                <h3 className="text-base font-black font-newspaper-headline text-stone-900 dark:text-stone-100">
                  किसान कल्याण योजनाएं व सब्सिडी
                </h3>
                <p className="text-[11px] text-stone-500">सीधा लाभ एवं आवेदन लिंक</p>
              </div>
            </div>

            <div className="space-y-4">
              {farmerSchemes.map(sch => (
                <div
                  key={sch.id}
                  className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/80 hover:border-amber-300 dark:hover:border-amber-700 transition-colors group"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded">
                      {sch.tag}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                      {sch.benefit}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                    {sch.title}
                  </h4>

                  <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 leading-relaxed">
                    {sch.desc}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-stone-200/60 dark:border-stone-700/60 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-stone-500">
                      अंतिम तिथि: <strong className="text-stone-700 dark:text-stone-300">{sch.lastDate}</strong>
                    </span>
                    <a
                      href={sch.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-bold text-amber-700 dark:text-amber-400 hover:underline"
                    >
                      <span>पोर्टल खोलें</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
              <span className="text-xs font-bold text-amber-900 dark:text-amber-300 block mb-1">
                किसान हेल्पलाइन नंबर (निःशुल्क):
              </span>
              <a
                href="tel:18001801551"
                className="text-base font-black text-amber-700 dark:text-amber-400 tracking-wider hover:underline"
              >
                1800-180-1551
              </a>
              <p className="text-[10px] text-stone-500 mt-0.5">
                फसल बीमा, मौसम व कृषि परामर्श हेतु 24x7 सेवा
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
