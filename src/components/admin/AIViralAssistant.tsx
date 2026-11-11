import React, { useState } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  Send,
  MessageCircle,
  Facebook,
  Instagram,
  Search,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { useNews } from '../../context/NewsContext';
import { RAJASTHAN_DISTRICTS } from '../../config/siteConfig';

export const AIViralAssistant: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [district, setDistrict] = useState('jaipur');
  const [tone, setTone] = useState<'breaking' | 'investigative' | 'public_interest'>('breaking');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [generatedResults, setGeneratedResults] = useState<{
    headlines: string[];
    summary: string;
    whatsappCaption: string;
    facebookCaption: string;
    instagramCaption: string;
    seoTitle: string;
    keywords: string[];
  } | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    const distName = RAJASTHAN_DISTRICTS.find(d => d.id === district)?.nameHi || 'राजस्थान';

    // Generates high quality Hindi news content tailored to Rajasthani readers
    const results = {
      headlines: [
        `बड़ी खबर: ${distName} में ${topic} को लेकर बड़ा प्रशासनिक फैसला, आदेश तत्काल प्रभाव से लागू`,
        `हुंकार विशेष पड़ताल: ${distName} के नागरिकों से जुड़ा ${topic} का मामला, जानिए क्या है पूरी ज़मीनी सच्चाई`,
        `राजस्थान ताज़ा अपडेट: ${topic} पर सचिवालय से मिली हरी झंडी, ${distName} वासियों को मिलेगी बड़ी राहत`
      ],
      summary: `राजस्थान के ${distName} ज़िले में ${topic} को लेकर हलचल तेज हो गई है। हुंकार 24 की विशेष रिपोर्ट में जानिए आमजन पर पड़ने वाले प्रभाव और विभागीय दिशा-निर्देश।`,
      whatsappCaption: `🚨 *हुंकार 24 ब्रेकिंग न्यूज़* 🚨\n\n📌 *${distName}:* ${topic} को लेकर सबसे बड़ा अपडेट सामने आया है।\n\nपूरी निष्पक्ष ग्राउंड रिपोर्ट अभी पढ़ें:\n👉 https://hunkar24.in\n\n_राजस्थान की बुलंद आवाज़ - हुंकार 24 ग्रुप से जुड़ें_`,
      facebookCaption: `📢 बड़ी खबर: राजस्थान के ${distName} अंचल से ${topic} पर विशेष ग्राउंड रिपोर्ट। क्या प्रशासन की यह पहल आम नागरिकों के जीवन में बदलाव लाएगी? अपने विचार कमेंट्स में साझा करें और हुंकार 24 को फॉलो करें।`,
      instagramCaption: `⚡ ${distName} अपडेट: ${topic} पर हुंकार 24 की एक्सक्लूसिव रिपोर्ट। पूरी खबर के लिए बायो में दिए लिंक पर क्लिक करें। #Hunkar24 #RajasthanNews #${distName} #HindiNews`,
      seoTitle: `${distName} ${topic} न्यूज़: ताज़ा अपडेट और ग्राउंड रिपोर्ट | Hunkar 24`,
      keywords: [distName, topic, 'राजस्थान न्यूज़', 'हुंकार 24', 'ताज़ा खबर', 'ग्राउंड रिपोर्ट']
    };

    setGeneratedResults(results);
  };

  return (
    <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 sm:p-7 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div>
          <h2 className="text-xl font-black font-newspaper-headline text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <span>AI वायरल कंटेंट एवं सोशल मीडिया सहायक (Viral Content Assistant)</span>
          </h2>
          <p className="text-xs text-stone-500">
            हिंदी समाचारों के लिए आकर्षक शीर्षक, व्हाट्सएप / फेसबुक कैप्शन व SEO मेटाडेटा जनरेटर
          </p>
        </div>
      </div>

      {/* Editorial Warning Advisory */}
      <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          <strong>पत्रकारिता आचार संहिता निर्देश:</strong> AI द्वारा सुझाए गए सभी शीर्षक और कैप्शन केवल विचार व प्रारूप के लिए हैं। किसी भी सामग्री को प्रकाशित करने से पहले तथ्यों की सत्यता की पुष्टि अनिवार्य है।
        </div>
      </div>

      {/* Input Generator Form */}
      <form onSubmit={handleGenerate} className="p-4 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-200 dark:border-stone-700 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              समाचार का विषय / घटना के मुख्य शब्द *
            </label>
            <input
              type="text"
              required
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="उदा. सड़क मरम्मत को लेकर ग्रामीणों का चक्काजाम / नई भर्ती परीक्षा तिथि"
              className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              संबंधित ज़िला
            </label>
            <select
              value={district}
              onChange={e => setDistrict(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800"
            >
              {RAJASTHAN_DISTRICTS.map(d => (
                <option key={d.id} value={d.id}>
                  {d.nameHi}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-1.5 px-5 py-2 bg-red-700 hover:bg-red-800 text-white font-bold text-xs rounded-lg shadow-xs transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>वायरल प्रारूप तैयार करें</span>
          </button>
        </div>
      </form>

      {/* Results View */}
      {generatedResults && (
        <div className="space-y-5 pt-2">
          {/* Headline Options */}
          <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
            <h3 className="text-xs font-bold text-red-700 uppercase tracking-wider mb-3">
              शीर्षक सुझाव (Headlines)
            </h3>
            <div className="space-y-2">
              {generatedResults.headlines.map((hl, i) => (
                <div
                  key={i}
                  className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-lg flex items-center justify-between gap-3 text-xs"
                >
                  <span className="font-bold text-stone-900 dark:text-stone-100 font-newspaper-headline">
                    {hl}
                  </span>
                  <button
                    onClick={() => handleCopy(hl, `hl-${i}`)}
                    className="p-1.5 text-stone-400 hover:text-stone-900 shrink-0"
                    title="कॉपी करें"
                  >
                    {copiedKey === `hl-${i}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Social Captions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* WhatsApp */}
            <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/20 dark:bg-emerald-950/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4" />
                  <span>व्हाट्सऐप ग्रुप एवं ब्रॉडकास्ट कैप्शन</span>
                </span>
                <button
                  onClick={() => handleCopy(generatedResults.whatsappCaption, 'wa')}
                  className="p-1 text-stone-500 hover:text-emerald-700"
                >
                  {copiedKey === 'wa' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <pre className="text-xs font-sans whitespace-pre-wrap text-stone-800 dark:text-stone-200 bg-white dark:bg-stone-900 p-3 rounded-lg border border-emerald-100 dark:border-emerald-900">
                {generatedResults.whatsappCaption}
              </pre>
            </div>

            {/* Facebook */}
            <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/20 dark:bg-blue-950/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-blue-700 flex items-center gap-1.5">
                  <Facebook className="w-4 h-4" />
                  <span>फेसबुक पेज पोस्ट कैप्शन</span>
                </span>
                <button
                  onClick={() => handleCopy(generatedResults.facebookCaption, 'fb')}
                  className="p-1 text-stone-500 hover:text-blue-700"
                >
                  {copiedKey === 'fb' ? <Check className="w-3.5 h-3.5 text-blue-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <pre className="text-xs font-sans whitespace-pre-wrap text-stone-800 dark:text-stone-200 bg-white dark:bg-stone-900 p-3 rounded-lg border border-blue-100 dark:border-blue-900">
                {generatedResults.facebookCaption}
              </pre>
            </div>
          </div>

          {/* SEO & Keywords */}
          <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/40 text-xs">
            <span className="font-bold text-stone-700 dark:text-stone-300 block mb-2">
              SEO टाइटल एवं अनुशंसित कीवर्ड्स:
            </span>
            <div className="p-2 bg-white dark:bg-stone-900 rounded border border-stone-200 dark:border-stone-700 font-mono text-[11px] mb-2">
              {generatedResults.seoTitle}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {generatedResults.keywords.map((kw, i) => (
                <span key={i} className="px-2 py-0.5 bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 rounded text-[11px] font-medium">
                  #{kw}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
