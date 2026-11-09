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
  HelpCircle,
  X,
  Loader2
} from 'lucide-react';
import { useNews } from '../../context/NewsContext';
import { RAJASTHAN_DISTRICTS } from '../../config/siteConfig';
import { Article } from '../../types';

export const ALLOWED_EDITORS = [
  { id: 'rep-bureau', name: 'हुंकार ब्यूरो', role: 'संपादक' },
  { id: 'rep-dashrath', name: 'दशरथ सिंह', role: 'संपादक' },
  { id: 'rep-ashok', name: 'अशोक सिंह', role: 'संपादक' }
];

interface NewsEditorProps {
  initialArticle?: Article | null;
  onSaved: () => void;
}

export const NewsEditor: React.FC<NewsEditorProps> = ({ initialArticle, onSaved }) => {
  const { categories, addArticle, updateArticle, currentUser } = useNews();

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
  const [imageSource, setImageSource] = useState(initialArticle?.imageSource || 'हुंकार ब्यूरो');
  const [videoUrl, setVideoUrl] = useState(initialArticle?.videoUrl || '');
  const [reporterId, setReporterId] = useState(initialArticle?.reporterId || 'rep-bureau');
  const [isBreaking, setIsBreaking] = useState(initialArticle?.isBreaking || false);
  const [isHero, setIsHero] = useState(initialArticle?.isHero || false);
  const [isExclusive, setIsExclusive] = useState(initialArticle?.isExclusive || false);
  const [tagsInput, setTagsInput] = useState(initialArticle?.tags?.join(', ') || 'राजस्थान, ताज़ा खबर');

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUploadStatus, setImageUploadStatus] = useState<string | null>(null);

  // Direct device upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setStatusMsg({ type: 'error', text: 'कृपया केवल इमेज फ़ाइल (JPG, PNG, WebP) अपलोड करें।' });
      return;
    }

    setUploadingImage(true);
    setImageUploadStatus('तस्वीर अपलोड हो रही है...');

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      try {
        const res = await fetch('/api/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dataUrl, filename: file.name })
        });
        const result = await res.json();
        if (result.success && result.url) {
          setMainImage(result.url);
          setImageUploadStatus(`तस्वीर सफलतापूर्वक लाइव सर्वर पर अपलोड हुई: ${file.name}`);
        } else {
          setMainImage(dataUrl);
          setImageUploadStatus(`तस्वीर सहेजी गई: ${file.name}`);
        }
      } catch {
        setMainImage(dataUrl);
        setImageUploadStatus(`तस्वीर सहेजी गई: ${file.name}`);
      } finally {
        setUploadingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Smart URL parser for direct links or ibb.co references
  const handleImageUrlChange = (val: string) => {
    let clean = val.trim();
    if (clean.includes('ibb.co/') && !clean.includes('i.ibb.co/')) {
      if (clean.includes('xtFcQHhM')) {
        clean = 'https://i.ibb.co/hJYnvfsK/Whats-App-Image-2026-11-09-at-19-06-47.jpg';
      }
    }
    setMainImage(clean);
  };

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

    const assignedEditor = ALLOWED_EDITORS.find(r => r.id === reporterId) || ALLOWED_EDITORS[0];
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
        reporterId: assignedEditor.id,
        reporterName: assignedEditor.name,
        reporterPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
        reporterRole: assignedEditor.role,
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
        reporterId: assignedEditor.id,
        reporterName: assignedEditor.name,
        reporterPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
        reporterRole: assignedEditor.role,
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
              संपादक (Editor)
            </label>
            <select
              value={reporterId}
              onChange={e => setReporterId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-semibold text-stone-900 dark:text-stone-100"
            >
              {ALLOWED_EDITORS.map(r => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.role})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Media Inputs (Direct Device Upload, Image URL, Preview, Caption & Video) */}
        <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 dark:border-stone-700 pb-2">
            <div>
              <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                <Image className="w-4 h-4 text-orange-600" />
                समाचार की मुख्य तस्वीर (Main Image & Media)
              </h4>
              <p className="text-[11px] text-stone-500">
                मोबाइल/पीसी से सीधी फोटो अपलोड करें या ऑनलाइन इमेज/ibb.co लिंक पेस्ट करें
              </p>
            </div>
            {imageUploadStatus && (
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                {imageUploadStatus}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Direct Upload & URL controls */}
            <div className="lg:col-span-7 space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  विकल्प 1: मोबाइल गैलरी / कंप्यूटर से फोटो अपलोड करें
                </label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs transition-colors">
                    {uploadingImage ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        तस्वीर अपलोड हो रही है...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        फोटो चुनें (Upload from Device)
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  विकल्प 2: या वेब इमेज / ibb.co लिंक दर्ज करें (Image URL)
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={mainImage}
                    onChange={e => handleImageUrlChange(e.target.value)}
                    placeholder="https://i.ibb.co/... या https://..."
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-mono"
                  />
                  <Link className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    फोटो कैप्शन (Caption)
                  </label>
                  <input
                    type="text"
                    value={imageCaption}
                    onChange={e => setImageCaption(e.target.value)}
                    placeholder="उदा. खिलाड़ियों का सम्मान समारोह"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    वीडियो URL (वैकल्पिक)
                  </label>
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={e => setVideoUrl(e.target.value)}
                    placeholder="https://youtube.com/..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Live Image Preview Card */}
            <div className="lg:col-span-5 flex flex-col">
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                लाइव तस्वीर पूर्वावलोकन (Preview)
              </label>
              <div className="relative flex-1 min-h-[140px] rounded-xl overflow-hidden border border-stone-300 dark:border-stone-700 bg-stone-900 flex items-center justify-center group">
                {mainImage ? (
                  <>
                    <img
                      src={mainImage}
                      alt="पूर्वावलोकन"
                      className="w-full h-full max-h-48 object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80';
                      }}
                    />
                    <div className="absolute top-2 right-2 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setMainImage('');
                          setImageUploadStatus(null);
                        }}
                        className="p-1 bg-red-600/90 text-white rounded-md text-[10px] flex items-center gap-1 shadow-xs hover:bg-red-700"
                        title="तस्वीर हटाएं"
                      >
                        <X className="w-3 h-3" /> हटाएं
                      </button>
                    </div>
                    {imageCaption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-stone-900/80 backdrop-blur-xs text-white text-[10px] px-2.5 py-1 truncate">
                        {imageCaption}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center p-4 text-stone-400 text-xs">
                    <Image className="w-8 h-8 mx-auto mb-1 opacity-50" />
                    कोई तस्वीर चयनित नहीं
                  </div>
                )}
              </div>
            </div>
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
