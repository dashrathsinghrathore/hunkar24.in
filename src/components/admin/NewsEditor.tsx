import React, { useState } from 'react';
import {
  Send,
  Save,
  Eye,
  Sparkles,
  Upload,
  Link,
  MapPin,
  Image,
  Video,
  CheckCircle2,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { useNews } from '../../context/NewsContext';
import { RAJASTHAN_DISTRICTS } from '../../config/siteConfig';
import { Article } from '../../types';

interface NewsEditorProps {
  initialArticle?: Article | null;
  onSaved: () => void;
}

export const NewsEditor: React.FC<NewsEditorProps> = ({ initialArticle, onSaved }) => {
  const { categories, reporters, addArticle, updateArticle, currentUser } = useNews();

  const [headline, setHeadline] = useState(initialArticle?.headline || '');
  const [slug, setSlug] = useState(initialArticle?.slug || '');
  const [summary, setSummary] = useState(initialArticle?.summary || '');
  const [content, setContent] = useState(initialArticle?.content || '');
  const [category, setCategory] = useState(initialArticle?.category || 'rajasthan');
  const [district, setDistrict] = useState(initialArticle?.district || 'jaipur');
  const [tehsil, setTehsil] = useState(initialArticle?.tehsil || '');
  const [village, setVillage] = useState(initialArticle?.village || '');
  const [mainImage, setMainImage] = useState(initialArticle?.mainImage || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80');
  const [imageCaption, setImageCaption] = useState(initialArticle?.imageCaption || '');
  const [imageSource, setImageSource] = useState(initialArticle?.imageSource || 'हुंकार 24 ब्यूरो');
  const [videoUrl, setVideoUrl] = useState(initialArticle?.videoUrl || '');
  const [reporterId, setReporterId] = useState(initialArticle?.reporterId || reporters[0]?.id || '');
  const [isBreaking, setIsBreaking] = useState(initialArticle?.isBreaking || false);
  const [isHero, setIsHero] = useState(initialArticle?.isHero || false);
  const [isExclusive, setIsExclusive] = useState(initialArticle?.isExclusive || false);
  const [tagsInput, setTagsInput] = useState(initialArticle?.tags?.join(', ') || 'राजस्थान, ताज़ा खबर');

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Auto-generate slug from headline
  const handleHeadlineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setHeadline(text);
    if (!initialArticle) {
      const generatedSlug = text
        .toLowerCase()
        .replace(/[^\w\u0900-\u097F]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 70);
      setSlug(generatedSlug || `news-${Date.now()}`);
    }
  };

  // AI Assistant generator mock helper for editorial quick ideas
  const handleAIAssist = () => {
    if (!headline.trim()) {
      setStatusMsg({ type: 'error', text: 'कृपया AI सुझावों के लिए पहले कुछ मुख्य शब्द या शीर्षक लिखें।' });
      return;
    }
    const currentDist = RAJASTHAN_DISTRICTS.find(d => d.id === district)?.nameHi || 'राजस्थान';
    setSummary(`हुंकार 24 ग्राउंड रिपोर्ट: ${currentDist} में ताजा घटनाक्रम को लेकर प्रशासन व नागरिकों के बीच चर्चा तेज। जानिए इस बड़े मामले के सभी तथ्य व ज़मीनी हकीकत।`);
    setTagsInput(`${currentDist}, हुंकार 24, ग्राउंड रिपोर्ट, राजस्थान समाचार, ब्रेकिंग`);
    setStatusMsg({ type: 'success', text: 'AI सहायक ने सारांश, टैग्स एवं SEO मेटाडेटा तैयार कर दिया है!' });
  };

  const handleSave = (status: 'published' | 'draft') => {
    if (!headline.trim() || !content.trim()) {
      setStatusMsg({ type: 'error', text: 'शीर्षक एवं मुख्य समाचार सामग्री भरना अनिवार्य है।' });
      return;
    }

    const assignedReporter = reporters.find(r => r.id === reporterId) || reporters[0];
    const tagsArray = tagsInput.split(',').map(t => t.trim()).filter(Boolean);

    if (initialArticle) {
      updateArticle(initialArticle.id, {
        headline: headline.trim(),
        slug: slug.trim(),
        summary: summary.trim() || headline.slice(0, 100),
        content: content.trim(),
        category,
        district,
        tehsil,
        village,
        mainImage,
        imageCaption,
        imageSource,
        videoUrl: videoUrl.trim() || undefined,
        reporterId: assignedReporter?.id,
        reporterName: assignedReporter ? assignedReporter.name : 'हुंकार न्यूज़ डेस्क',
        reporterPhoto: assignedReporter?.photoUrl,
        reporterRole: assignedReporter?.role,
        isBreaking,
        isHero,
        isExclusive,
        status,
        tags: tagsArray,
        readingTimeMinutes: Math.max(1, Math.ceil(content.split(' ').length / 150))
      });
      setStatusMsg({ type: 'success', text: 'समाचार सफलतापूर्वक संशोधित किया गया!' });
    } else {
      addArticle({
        headline: headline.trim(),
        slug: slug.trim() || `news-${Date.now()}`,
        summary: summary.trim() || headline.slice(0, 100),
        content: content.trim(),
        category,
        district,
        tehsil,
        village,
        mainImage,
        imageCaption,
        imageSource,
        videoUrl: videoUrl.trim() || undefined,
        reporterId: assignedReporter?.id,
        reporterName: assignedReporter ? assignedReporter.name : 'हुंकार न्यूज़ डेस्क',
        reporterPhoto: assignedReporter?.photoUrl,
        reporterRole: assignedReporter?.role,
        isBreaking,
        isHero,
        isExclusive,
        status,
        tags: tagsArray,
        readingTimeMinutes: Math.max(1, Math.ceil(content.split(' ').length / 150))
      });
      setStatusMsg({ type: 'success', text: `समाचार सफलतापूर्वक ${status === 'published' ? 'प्रकाशित' : 'ड्राफ्ट'} किया गया!` });
    }

    setTimeout(() => {
      onSaved();
    }, 1200);
  };

  return (
    <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 sm:p-7 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-stone-200 dark:border-stone-800">
        <div>
          <h2 className="text-xl font-black font-newspaper-headline text-stone-900 dark:text-stone-100">
            {initialArticle ? 'समाचार संशोधित करें (Edit News)' : 'नया समाचार प्रकाशित करें (Create News)'}
          </h2>
          <p className="text-xs text-stone-500">
            हुंकार 24 उन्नत प्रकाशन संपादक · Devanagari Unicode समर्थन
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAIAssist}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-xs font-bold transition-colors"
            title="AI से सारांश एवं टैग्स बनाएं"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI सहायक</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave('draft')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 text-xs font-bold transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>ड्राफ्ट सहेजें</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave('published')}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-bold transition-colors shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>अभी प्रकाशित करें</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`p-3 rounded-lg text-xs font-semibold mb-5 flex items-center gap-2 ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
              : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-950 dark:text-red-300'
          }`}
        >
          {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Editor Form */}
      <div className="space-y-5">
        {/* Headline */}
        <div>
          <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
            समाचार का मुख्य शीर्षक (Headline) <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            required
            value={headline}
            onChange={handleHeadlineChange}
            placeholder="आकर्षक, तथ्यपरक एवं स्पष्ट हिंदी शीर्षक लिखें..."
            className="w-full px-4 py-2.5 text-base sm:text-lg font-bold font-newspaper-headline rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 focus:outline-hidden focus:ring-2 focus:ring-red-600 text-stone-900 dark:text-stone-100"
          />
        </div>

        {/* Slug */}
        <div className="flex items-center gap-2 text-xs text-stone-500">
          <span className="font-bold">स्थायी URL स्लग:</span>
          <span className="font-mono text-red-700 dark:text-red-400">/news/</span>
          <input
            type="text"
            value={slug}
            onChange={e => setSlug(e.target.value)}
            className="flex-1 px-2 py-1 font-mono text-xs rounded border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800"
          />
        </div>

        {/* Lead Deck / Short Description */}
        <div>
          <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
            संक्षिप्त विवरण / लीड डेक (Summary)
          </label>
          <textarea
            rows={2}
            value={summary}
            onChange={e => setSummary(e.target.value)}
            placeholder="1-2 वाक्यों में समाचार का सार लिखें..."
            className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200"
          />
        </div>

        {/* Categorization & Location row */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-200 dark:border-stone-700">
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              श्रेणी (Category)
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-semibold"
            >
              {categories.filter(c => c.slug !== 'all').map(c => (
                <option key={c.id} value={c.slug}>
                  {c.nameHi}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              राजस्थान ज़िला
            </label>
            <select
              value={district}
              onChange={e => setDistrict(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
            >
              {RAJASTHAN_DISTRICTS.map(d => (
                <option key={d.id} value={d.id}>
                  {d.nameHi} ({d.nameEn})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              तहसील / कस्बा
            </label>
            <input
              type="text"
              value={tehsil}
              onChange={e => setTehsil(e.target.value)}
              placeholder="उदा. बस्सी"
              className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              संवाददाता श्रेय (Reporter)
            </label>
            <select
              value={reporterId}
              onChange={e => setReporterId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
            >
              {reporters.map(r => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.assignedDistrict})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Media Inputs (Image URL, Caption, Video) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              मुख्य तस्वीर URL (Main Image)
            </label>
            <input
              type="url"
              value={mainImage}
              onChange={e => setMainImage(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              फोटो कैप्शन (Caption)
            </label>
            <input
              type="text"
              value={imageCaption}
              onChange={e => setImageCaption(e.target.value)}
              placeholder="तस्वीर का संक्षिप्त विवरण"
              className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              वीडियो URL (YouTube / Embed)
            </label>
            <input
              type="url"
              value={videoUrl}
              onChange={e => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/embed/..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-mono"
            />
          </div>
        </div>

        {/* Full Article Content */}
        <div>
          <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
            पूर्ण समाचार आलेख (Full Article Story) <span className="text-red-600">*</span>
          </label>
          <textarea
            required
            rows={10}
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="विस्तृत समाचार लिखें। उप-शीर्षक के लिए **शीर्षक** का प्रयोग कर सकते हैं..."
            className="w-full px-4 py-3 text-sm sm:text-base font-serif rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 leading-relaxed text-stone-900 dark:text-stone-100"
          />
        </div>

        {/* Tags & Flags */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              कीवर्ड / टैग्स (अल्पविराम से अलग करें)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              placeholder="राजस्थान, जयपुर, भर्ती, राजनीति"
              className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
            />
          </div>

          {/* Visibility Flags */}
          <div className="flex items-center gap-4 pt-5">
            <label className="flex items-center gap-1.5 text-xs font-bold text-red-700 dark:text-red-400 cursor-pointer">
              <input
                type="checkbox"
                checked={isBreaking}
                onChange={e => setIsBreaking(e.target.checked)}
                className="rounded text-red-600 focus:ring-red-600"
              />
              <span>बड़ी खबर (Breaking)</span>
            </label>

            <label className="flex items-center gap-1.5 text-xs font-bold text-stone-800 dark:text-stone-200 cursor-pointer">
              <input
                type="checkbox"
                checked={isHero}
                onChange={e => setIsHero(e.target.checked)}
                className="rounded text-red-600 focus:ring-red-600"
              />
              <span>होमपेज लीड (Hero)</span>
            </label>

            <label className="flex items-center gap-1.5 text-xs font-bold text-amber-600 cursor-pointer">
              <input
                type="checkbox"
                checked={isExclusive}
                onChange={e => setIsExclusive(e.target.checked)}
                className="rounded text-amber-600 focus:ring-amber-600"
              />
              <span>एक्सक्लूसिव</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
