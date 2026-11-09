import React from 'react';
import {
  MessageCircle,
  Send,
  Youtube,
  Instagram,
  Facebook,
  Twitter,
  Mail,
  Phone,
  MapPin,
  Shield,
  FileText,
  ExternalLink
} from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';
import { SITE_CONFIG } from '../../config/siteConfig';
import { useNews } from '../../context/NewsContext';

interface FooterProps {
  onSelectPolicy: (policyName: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectPolicy }) => {
  const {
    setSelectedCategory,
    setActiveArticle,
    setIsSubmitNewsOpen,
    setIsPromotionModalOpen
  } = useNews();

  const handleCategoryClick = (slug: string) => {
    setSelectedCategory(slug);
    setActiveArticle(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-stone-950 text-stone-300 pt-12 pb-8 border-t-4 border-red-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Grid: 4 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10 pb-10 border-b border-stone-800">
          {/* Col 1: Brand & Bio */}
          <div className="space-y-4">
            <BrandLogo variant="footer" showTagline={false} />
            <p className="text-xs text-stone-400 leading-relaxed">
              <strong className="text-stone-200">HUNKAR 24 (हुंकार 24)</strong> – राजस्थान का अग्रणी स्वतंत्र डिजिटल समाचार मंच। प्रदेश के हर गांव, ढाणी, शहर की समस्याओं, विकास, रोजगार एवं संस्कृति को बेबाक स्वर देने के लिए समर्पित।
            </p>

            <div className="pt-2">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-2">
                हमसे सोशल मीडिया पर जुड़ें
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={SITE_CONFIG.social.whatsappChannel}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-stone-900 hover:bg-emerald-600 text-stone-300 hover:text-white transition-colors"
                  title="व्हाट्सऐप चैनल"
                >
                  <MessageCircle className="w-4 h-4" />
                </a>
                <a
                  href={SITE_CONFIG.social.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-stone-900 hover:bg-sky-500 text-stone-300 hover:text-white transition-colors"
                  title="टेलीग्राम"
                >
                  <Send className="w-4 h-4" />
                </a>
                <a
                  href={SITE_CONFIG.social.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-stone-900 hover:bg-red-600 text-stone-300 hover:text-white transition-colors"
                  title="यूट्यूब"
                >
                  <Youtube className="w-4 h-4" />
                </a>
                <a
                  href={SITE_CONFIG.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-stone-900 hover:bg-pink-600 text-stone-300 hover:text-white transition-colors"
                  title="इंस्टाग्राम"
                >
                  <Instagram className="w-4 h-4" />
                </a>
                <a
                  href={SITE_CONFIG.social.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-stone-900 hover:bg-blue-600 text-stone-300 hover:text-white transition-colors"
                  title="फेसबुक"
                >
                  <Facebook className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Col 2: Key Categories */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-red-700/60 pb-1.5 inline-block">
              प्रमुख श्रेणियां
            </h3>
            <ul className="grid grid-cols-2 gap-y-2 text-xs text-stone-400">
              <li>
                <button onClick={() => handleCategoryClick('rajasthan')} className="hover:text-red-400">
                  राजस्थान समाचार
                </button>
              </li>
              <li>
                <button onClick={() => handleCategoryClick('jobs')} className="hover:text-red-400">
                  नौकरी एवं रोजगार
                </button>
              </li>
              <li>
                <button onClick={() => handleCategoryClick('schemes')} className="hover:text-red-400">
                  सरकारी योजनाएं
                </button>
              </li>
              <li>
                <button onClick={() => handleCategoryClick('agriculture')} className="hover:text-red-400">
                  कृषि एवं मंडी भाव
                </button>
              </li>
              <li>
                <button onClick={() => handleCategoryClick('politics')} className="hover:text-red-400">
                  राजनीति
                </button>
              </li>
              <li>
                <button onClick={() => handleCategoryClick('ground-report')} className="hover:text-red-400">
                  ग्राउंड रिपोर्ट
                </button>
              </li>
              <li>
                <button onClick={() => handleCategoryClick('education')} className="hover:text-red-400">
                  शिक्षा व परिणाम
                </button>
              </li>
              <li>
                <button onClick={() => handleCategoryClick('weather')} className="hover:text-red-400">
                  मौसम अपडेट
                </button>
              </li>
              <li>
                <button onClick={() => handleCategoryClick('video')} className="hover:text-red-400">
                  वीडियो न्यूज़
                </button>
              </li>
              <li>
                <button onClick={() => handleCategoryClick('gallery')} className="hover:text-red-400">
                  फोटो गैलरी
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Editorial & Statutory Policies */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-red-700/60 pb-1.5 inline-block">
              संपादकीय व विधिक नीतियां
            </h3>
            <ul className="space-y-2 text-xs text-stone-400">
              <li>
                <button onClick={() => onSelectPolicy('editorial')} className="hover:text-stone-100 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-red-500" />
                  <span>संपादकीय नीति (Editorial Policy)</span>
                </button>
              </li>
              <li>
                <button onClick={() => onSelectPolicy('fact-check')} className="hover:text-stone-100 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-red-500" />
                  <span>तथ्य जांच नीति (Fact Checking Policy)</span>
                </button>
              </li>
              <li>
                <button onClick={() => onSelectPolicy('corrections')} className="hover:text-stone-100 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-red-500" />
                  <span>संशोधन एवं खंडन नीति (Corrections)</span>
                </button>
              </li>
              <li>
                <button onClick={() => onSelectPolicy('privacy')} className="hover:text-stone-100 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-red-500" />
                  <span>गोपनीयता नीति (Privacy Policy)</span>
                </button>
              </li>
              <li>
                <button onClick={() => onSelectPolicy('terms')} className="hover:text-stone-100 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-red-500" />
                  <span>नियम एवं शर्तें (Terms & Conditions)</span>
                </button>
              </li>
              <li>
                <button onClick={() => onSelectPolicy('grievance')} className="hover:text-stone-100 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-red-500" />
                  <span>शिकायत निवारण अधिकारी (Grievance)</span>
                </button>
              </li>
              <li className="pt-2 border-t border-stone-800 flex items-center gap-3 text-[11px]">
                <a
                  href="/sitemap.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-amber-400 flex items-center gap-1 text-stone-400"
                  title="गूगल व सर्च इंजन साइटमैप"
                >
                  <FileText className="w-3 h-3 text-amber-500" />
                  <span>साइटमैप (Sitemap)</span>
                </a>
                <span className="text-stone-600">·</span>
                <a
                  href="/llms.txt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-amber-400 flex items-center gap-1 text-stone-400"
                  title="AI मॉडल सर्च मैनिफेस्ट"
                >
                  <ExternalLink className="w-3 h-3 text-amber-500" />
                  <span>AI Index (llms.txt)</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact & Newsroom */}
          <div className="space-y-3 text-xs text-stone-400">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-red-700/60 pb-1.5 inline-block">
              न्यूज़रूम संपर्क
            </h3>
            
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{SITE_CONFIG.contact.officeAddress}</span>
            </div>

            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-red-500 shrink-0" />
              <span>फोन: {SITE_CONFIG.contact.phone}</span>
            </div>

            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-red-500 shrink-0" />
              <span>ईमेल: {SITE_CONFIG.contact.email}</span>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => setIsSubmitNewsOpen(true)}
                className="w-full py-1.5 px-3 bg-red-700 hover:bg-red-800 text-white font-bold rounded-lg text-center"
              >
                खबर भेजें (जन-रिपोर्टर)
              </button>
              <button
                onClick={() => setIsPromotionModalOpen(true)}
                className="w-full py-1.5 px-3 border border-amber-600 text-amber-400 hover:bg-amber-950 font-bold rounded-lg text-center"
              >
                विज्ञापन के लिए संपर्क करें
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Domain Information */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <div>
            © {new Date().getFullYear()} <strong className="text-stone-300">HUNKAR 24 (हुंकार 24)</strong>. सर्वाधिकार सुरक्षित।
          </div>

          {/* Centralized Domain Information */}
          <div className="flex items-center gap-2 text-[11px] bg-stone-900 px-3 py-1 rounded-full border border-stone-800">
            <span>लाइव डिजिटल न्यूज़: <strong className="text-stone-300">{SITE_CONFIG.currentSiteUrl.replace('https://', '')}</strong></span>
            <span>·</span>
            <span className="text-amber-400">हुंकार 24 — निष्पक्ष पत्रकारिता</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
