import React from 'react';
import { GraduationCap, Briefcase, ExternalLink, Calendar, CheckCircle } from 'lucide-react';
import { useNews } from '../../context/NewsContext';
import { ArticleCard } from './ArticleCard';

interface JobAlert {
  id: string;
  title: string;
  dept: string;
  posts: string;
  lastDate: string;
  applyUrl: string;
  status: 'आवेदन शुरू' | 'विज्ञप्ति जारी' | 'परिणाम घोषित';
}

export const EducationJobsSection: React.FC = () => {
  const { articles, setSelectedCategory } = useNews();

  const educationArticles = articles.filter(
    a => a.category === 'education' || a.category === 'jobs' || a.category === 'schemes'
  );

  const jobAlerts: JobAlert[] = [
    {
      id: 'job-1',
      title: 'तृतीय श्रेणी शिक्षक भर्ती (Level 1 & 2)',
      dept: 'माध्यमिक शिक्षा बोर्ड राजस्थान',
      posts: '7,500 पद',
      lastDate: '30 नवंबर 2026',
      applyUrl: 'https://rpsc.rajasthan.gov.in',
      status: 'आवेदन शुरू'
    },
    {
      id: 'job-2',
      title: 'राजस्थान पुलिस उपनिरीक्षक (SI) सीधी भर्ती',
      dept: 'राजस्थान पुलिस मुख्यालय',
      posts: '620 पद',
      lastDate: '15 दिसंबर 2026',
      applyUrl: 'https://police.rajasthan.gov.in',
      status: 'विज्ञप्ति जारी'
    },
    {
      id: 'job-3',
      title: 'मुख्यमंत्री अनुप्रति कोचिंग योजना 2026-27',
      dept: 'सामाजिक न्याय एवं अधिकारिता विभाग',
      posts: '30,000 सीटें',
      lastDate: '25 नवंबर 2026',
      applyUrl: 'https://sje.rajasthan.gov.in',
      status: 'आवेदन शुरू'
    },
    {
      id: 'job-4',
      title: 'RSMSSB कनिष्ठ लेखाकार (Junior Accountant) परिणाम',
      dept: 'कर्मचारी चयन बोर्ड, जयपुर',
      posts: '5,388 पद',
      lastDate: 'स्कोरकार्ड जारी',
      applyUrl: 'https://rsmssb.rajasthan.gov.in',
      status: 'परिणाम घोषित'
    }
  ];

  return (
    <section className="mb-10 bg-amber-50/50 dark:bg-stone-900/60 p-4 sm:p-6 rounded-2xl border border-amber-200/60 dark:border-stone-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-2 border-b border-amber-200 dark:border-stone-800">
        <div className="flex items-center gap-2.5">
          <div className="bg-amber-600 text-white p-2 rounded-lg">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 font-newspaper-headline">
              शिक्षा, सरकारी नौकरियाँ एवं योजनाएँ
            </h2>
            <p className="text-xs text-stone-600 dark:text-stone-400">
              RPSC, RSMSSB, बोर्ड परीक्षाएं एवं सरकारी जनकल्याणकारी योजनाएं
            </p>
          </div>
        </div>

        <button
          onClick={() => setSelectedCategory('jobs')}
          className="text-xs font-bold text-amber-800 dark:text-amber-400 hover:underline self-start sm:self-center"
        >
          सभी भर्ती अपडेट देखें →
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: News articles in Education & Jobs (7 cols) */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {educationArticles.slice(0, 2).map(art => (
            <ArticleCard
              key={art.id}
              article={art}
              layout="standard"
              showSummary={true}
            />
          ))}
        </div>

        {/* Right: Quick Fast Employment & Schemes Alert Table (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-100 dark:border-stone-800">
            <span className="text-xs font-black text-stone-900 dark:text-stone-100 uppercase tracking-wider flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-amber-600" />
              <span>ताज़ा भर्ती व परिणाम अलर्ट</span>
            </span>
            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
              सत्यापित लिंक
            </span>
          </div>

          <div className="space-y-3">
            {jobAlerts.map(job => (
              <div
                key={job.id}
                className="p-3 rounded-lg border border-stone-100 dark:border-stone-800 hover:border-amber-300 dark:hover:border-amber-700/50 bg-stone-50/50 dark:bg-stone-800/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 leading-snug">
                    {job.title}
                  </h4>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                    job.status === 'आवेदन शुरू'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                      : job.status === 'परिणाम घोषित'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                  }`}>
                    {job.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 mt-2">
                  <span>{job.dept} ({job.posts})</span>
                  <span>अंतिम तिथि: {job.lastDate}</span>
                </div>

                <div className="mt-2.5 pt-2 border-t border-stone-200/60 dark:border-stone-700/60 flex justify-end">
                  <a
                    href={job.applyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 dark:text-red-400 hover:text-red-800"
                  >
                    <span>आधिकारिक पोर्टल पर जाएं</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
