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
                  href={SITE_CONFIG.social.whatsappGroup}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-emerald-900/60 hover:bg-emerald-600 text-emerald-300 hover:text-white transition-colors"
                  title="हुंकार 24 व्हाट्सऐप ग्रुप से जुड़ें"
                >
                  <MessageCircle className="w-4 h-4" />
                </a>
                <a
                  href={SITE_CONFIG.social.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-sky-900/60 hover:bg-sky-500 text-sky-300 hover:text-white transition-colors"
                  title="टेलीग्राम चैनल (@HUNKAR24)"
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

          {/* Col 3: Journalistic Ethics & Statutory Policies */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-red-700/60 pb-1.5 inline-block">
              नीति एवं विधिक नियम
            </h3>
            <ul className="space-y-2 text-xs text-stone-400">
              <li>
                <button onClick={() => onSelectPolicy('editorial')} className="hover:text-stone-100 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-red-500" />
                  <span>पत्रकारिता आचार संहिता (Code of Ethics)</span>
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
            </ul>
          </div>

          {/* Col 4: Contact & Newsroom */}
          <div className="space-y-3 text-xs text-stone-400">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-red-700/60 pb-1.5 inline-block">
              न्यूज़रूम एवं सहायता संपर्क
            </h3>
            
            {/* Only WhatsApp Mobile Number */}
            <a
              href="https://wa.me/917726084809"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-700/60 hover:bg-emerald-900/80 transition-colors group"
            >
              <div className="p-1.5 rounded-md bg-emerald-600 text-white shrink-0">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-emerald-400 block font-bold tracking-wide">
                  मोबाइल (Only WhatsApp):
                </span>
                <span className="font-mono font-black text-sm text-white group-hover:text-emerald-300">
                  7726084809
                </span>
              </div>
            </a>

            {/* Official Community Channels */}
            <div className="grid grid-cols-1 gap-2 pt-1">
              <a
                href="https://chat.whatsapp.com/FCPFV5r3eruEvFMS9yy2Fa?s=cl&p=a&iam=2"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-center transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>व्हाट्सऐप ग्रुप से जुड़ें</span>
              </a>

              <a
                href="https://t.me/HUNKAR24"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-2 px-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg text-center transition-colors"
              >
                <Send className="w-4 h-4" />
                <span>टेलीग्राम चैनल (@HUNKAR24)</span>
              </a>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => setIsSubmitNewsOpen(true)}
                className="w-full py-1.5 px-3 bg-red-700 hover:bg-red-800 text-white font-bold rounded-lg text-center cursor-pointer transition-colors"
              >
                खबर भेजें (जन-रिपोर्टर)
              </button>
              <button
                onClick={() => setIsPromotionModalOpen(true)}
                className="w-full py-1.5 px-3 border border-amber-600 text-amber-400 hover:bg-amber-950 font-bold rounded-lg text-center cursor-pointer transition-colors"
              >
                विज्ञापन के लिए संपर्क करें
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright Information */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <div>
            © {new Date().getFullYear()} <strong className="text-stone-300">HUNKAR 24 (हुंकार 24)</strong>. सर्वाधिकार सुरक्षित।
          </div>
        </div>
      </div>
    </footer>
  );
};
