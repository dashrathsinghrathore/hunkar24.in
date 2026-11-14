import React from 'react';
import {
  Wheat,
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

interface AgricultureFarmersSectionProps {
  excludeIds?: Set<string>;
}

export const AgricultureFarmersSection: React.FC<AgricultureFarmersSectionProps> = ({ excludeIds }) => {
  const { articles, setSelectedCategory } = useNews();

  const publishedArticles = articles.filter(a => a.status === 'published');
  const candidateArticles = excludeIds && excludeIds.size > 0
    ? publishedArticles.filter(a => !excludeIds.has(a.id))
    : publishedArticles;

  const agriArticles = candidateArticles.filter(
    a => a.category === 'agriculture' || a.tags?.some(t => ['किसान', 'कृषि', 'मंडी भाव', 'ग्रामीण', 'कुसुम योजना'].includes(t))
  );

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
              कृषि, किसान एवं ग्रामीण विकास
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
          <span>सभी कृषि व ग्रामीण समाचार देखें</span>
          <ArrowRight className="w-4 h-4" />
        </button>
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
