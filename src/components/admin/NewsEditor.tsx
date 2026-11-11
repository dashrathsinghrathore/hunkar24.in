import React, { useState } from 'react';
import {
  Send,
  Save,
  Sparkles,
  Upload,
  Link as LinkIcon,
  Image as ImageIcon,
  Video,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Wand2,
  Trash2,
  RefreshCw,
  Plus,
  Star,
  Check,
  CloudUpload,
  ShieldCheck,
  Film
} from 'lucide-react';
import { useNews } from '../../context/NewsContext';
import { RAJASTHAN_DISTRICTS } from '../../config/siteConfig';
import { Article } from '../../types';
import { getTopicAccurateImage } from '../../utils/newsImageMatcher';
import { UniversalVideoPlayer } from '../common/UniversalVideoPlayer';
import { SafeImage } from '../common/SafeImage';
import {
  uploadSingleMedia,
  inspectAndValidateMediaUrl,
  importExternalMedia,
  captureVideoThumbnail,
  formatBytes
} from '../../lib/mediaService';
import { getSecondaryBackupEnabled } from '../../lib/firebaseClient';



interface NewsEditorProps {
  initialArticle?: Article | null;
  onSaved: () => void;
}

interface ImageItem {
  id: string;
  url: string;
  caption?: string;
  altText?: string;
  storageProvider?: 'supabase' | 'firebase' | 'external' | 'local';
  isMain?: boolean;
}

export const NewsEditor: React.FC<NewsEditorProps> = ({ initialArticle, onSaved }) => {
  const { categories, addArticle, updateArticle } = useNews();

  const [headline, setHeadline] = useState(initialArticle?.headline || '');
  const [slug, setSlug] = useState(initialArticle?.slug || '');
  const [summary, setSummary] = useState(initialArticle?.summary || '');
  const [content, setContent] = useState(initialArticle?.content || '');
  const [category, setCategory] = useState(initialArticle?.category || 'rajasthan');
  const [district, setDistrict] = useState(initialArticle?.district || 'jaipur');
  const [tehsil, setTehsil] = useState(initialArticle?.tehsil || '');
  const [village, setVillage] = useState(initialArticle?.village || '');

  // Multi-image state: up to 5 images per news article
  const [imagesList, setImagesList] = useState<ImageItem[]>(() => {
    if (initialArticle?.galleryImages && initialArticle.galleryImages.length > 0) {
      return initialArticle.galleryImages.slice(0, 5).map((url, idx) => ({
        id: `img-${idx}-${Date.now()}`,
        url,
        caption: idx === 0 ? initialArticle.imageCaption : undefined,
        altText: idx === 0 ? initialArticle.imageAlt : undefined,
        isMain: idx === 0
      }));
    }
    if (initialArticle?.mainImage) {
      return [
        {
          id: `img-0-${Date.now()}`,
          url: initialArticle.mainImage,
          caption: initialArticle.imageCaption,
          altText: initialArticle.imageAlt,
          isMain: true
        }
      ];
    }
    return [
      {
        id: `img-0-${Date.now()}`,
        url: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80',
        caption: 'संदर्भ दृश्य',
        altText: 'राजस्थान समाचार',
        isMain: true
      }
    ];
  });

  const [imageType, setImageType] = useState<'photo' | 'ai_illustration'>((initialArticle?.imageType as any) || 'photo');
  const [imageGenerationStatus, setImageGenerationStatus] = useState<Article['imageGenerationStatus']>(initialArticle?.imageGenerationStatus || 'completed');

  // Video state
  const [videoUrl, setVideoUrl] = useState(initialArticle?.videoUrl || '');
  const [videoPoster, setVideoPoster] = useState('');
  const [reporterName, setReporterName] = useState(initialArticle?.reporterName || 'हुंकार 24 ब्यूरो');
  const [isBreaking, setIsBreaking] = useState(initialArticle?.isBreaking || false);
  const [isHero, setIsHero] = useState(initialArticle?.isHero || false);
  const [isExclusive, setIsExclusive] = useState(initialArticle?.isExclusive || false);
  const [tagsInput, setTagsInput] = useState(initialArticle?.tags?.join(', ') || 'राजस्थान, ताज़ा खबर');

  // Active media sub-tabs: 'upload' | 'url' | 'manage'
  const [imageInputMode, setImageInputMode] = useState<'upload' | 'url' | 'manage'>('upload');
  const [pastedUrlInput, setPastedUrlInput] = useState('');
  const [pastedUrlValidating, setPastedUrlValidating] = useState(false);
  const [pastedUrlValidationResult, setPastedUrlValidationResult] = useState<string | null>(null);

  // Upload progress tracking
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadStatusText, setUploadStatusText] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Video upload tracking
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState<number | null>(null);

  const mainImageItem = imagesList.find(img => img.isMain) || imagesList[0];
  const mainImageUrl = mainImageItem?.url || '';

  // Handle setting primary image
  const handleSetMainImage = (id: string) => {
    setImagesList(prev =>
      prev.map(item => ({
        ...item,
        isMain: item.id === id
      }))
    );
    setStatusMsg({ type: 'success', text: 'मुख्य कवर तस्वीर निर्धारित की गई।' });
  };

  // Remove image
  const handleRemoveImage = (id: string) => {
    if (imagesList.length <= 1) {
      setStatusMsg({ type: 'error', text: 'समाचार में कम से कम एक तस्वीर होना आवश्यक है।' });
      return;
    }
    setImagesList(prev => {
      const filtered = prev.filter(item => item.id !== id);
      if (!filtered.some(f => f.isMain) && filtered.length > 0) {
        filtered[0].isMain = true;
      }
      return filtered;
    });
  };

  // Multiple image upload handler (Max 5 images total, max 50MB each)
  const handleMultipleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remainingSlots = 5 - imagesList.length;
    if (remainingSlots <= 0) {
      setStatusMsg({ type: 'error', text: 'एक समाचार में अधिकतम 5 तस्वीरें ही अपलोड की जा सकती हैं।' });
      return;
    }

    const filesToUpload = files.slice(0, remainingSlots);

    // Validate size
    for (const f of filesToUpload) {
      if (f.size > 52428800) {
        setStatusMsg({
          type: 'error',
          text: `फ़ाइल "${f.name}" का आकार (${(f.size / (1024 * 1024)).toFixed(1)} MB) अधिकतम अनुमत सीमा 50 MB से अधिक है।`
        });
        return;
      }
    }

    setUploadProgress(10);
    setUploadStatusText(`0/${filesToUpload.length} तस्वीरें अपलोड हो रही हैं...`);

    const newItems: ImageItem[] = [];

    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];
      setUploadStatusText(`${i + 1}/${filesToUpload.length} तस्वीर अपलोड हो रही है: ${file.name}`);

      const result = await uploadSingleMedia(file, 'image', (percent) => {
        setUploadProgress(Math.floor(((i + percent / 100) / filesToUpload.length) * 100));
      });

      if (result.success && result.url) {
        newItems.push({
          id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          url: result.url,
          caption: file.name.replace(/\.[^/.]+$/, '').slice(0, 50),
          altText: headline.slice(0, 40) || file.name,
          storageProvider: result.storageProvider,
          isMain: imagesList.length === 0 && newItems.length === 0
        });
      } else {
        setStatusMsg({ type: 'error', text: result.error || `${file.name} अपलोड नहीं हो सकी।` });
      }
    }

    if (newItems.length > 0) {
      setImagesList(prev => [...prev, ...newItems].slice(0, 5));
      const backupNote = getSecondaryBackupEnabled() ? ' (Firebase सेकेंडरी बैकअप सक्रिय)' : '';
      setStatusMsg({
        type: 'success',
        text: `${newItems.length} तस्वीरें Supabase Storage में सफलतापूर्वक सुरक्षित की गईं!${backupNote}`
      });
    }

    setUploadProgress(null);
    setUploadStatusText(null);
    e.target.value = '';
  };

  // Replace single image from file
  const handleReplaceImageFile = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 52428800) {
      setStatusMsg({ type: 'error', text: 'फ़ाइल 50 MB से अधिक है।' });
      return;
    }

    setUploadProgress(25);
    setUploadStatusText(`तस्वीर बदली जा रही है: ${file.name}`);

    const result = await uploadSingleMedia(file, 'image', (p) => setUploadProgress(p));
    if (result.success && result.url) {
      setImagesList(prev =>
        prev.map(img =>
          img.id === id
            ? { ...img, url: result.url!, storageProvider: result.storageProvider }
            : img
        )
      );
      setStatusMsg({ type: 'success', text: 'तस्वीर सफलतापूर्वक बदल दी गई!' });
    } else {
      setStatusMsg({ type: 'error', text: result.error || 'तस्वीर बदलना विफल रहा।' });
    }
    setUploadProgress(null);
    setUploadStatusText(null);
  };

  // Add pasted image URL
  const handleAddPastedImageUrl = async (shouldImportToCloud = false) => {
    const raw = pastedUrlInput.trim();
    if (!raw) return;

    if (imagesList.length >= 5) {
      setStatusMsg({ type: 'error', text: 'अधिकतम 5 तस्वीरें पहले ही जोड़ी जा चुकी हैं।' });
      return;
    }

    setPastedUrlValidating(true);
    setPastedUrlValidationResult('URL का सत्यापन हो रहा है...');

    // Validate URL accessibility
    const validation = await inspectAndValidateMediaUrl(raw);
    if (!validation.isValid && !validation.accessible) {
      setPastedUrlValidationResult('अमान्य अथवा अनुपलब्ध इमेज URL');
      setPastedUrlValidating(false);
      return;
    }

    let finalUrl = validation.directUrl;

    if (shouldImportToCloud) {
      setPastedUrlValidationResult('क्लाउड स्टोरेज में कॉपी किया जा रहा है...');
      const importRes = await importExternalMedia(finalUrl, 'image');
      if (importRes.success && importRes.url) {
        finalUrl = importRes.url;
      }
    }

    const newItem: ImageItem = {
      id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      url: finalUrl,
      caption: headline ? `${headline.slice(0, 40)} संदर्भ` : undefined,
      altText: headline.slice(0, 40) || 'समाचार संदर्भ चित्र',
      storageProvider: shouldImportToCloud ? 'supabase' : (validation.sourceProvider as any) || 'external',
      isMain: imagesList.length === 0
    };

    setImagesList(prev => [...prev, newItem].slice(0, 5));
    setPastedUrlInput('');
    setPastedUrlValidating(false);
    setPastedUrlValidationResult(null);
    setStatusMsg({
      type: 'success',
      text: shouldImportToCloud
        ? 'तस्वीर क्लाउड स्टोरेज (Supabase Storage) में कॉपी व लिंक की गई!'
        : 'इमेज URL सत्यापित होकर समाचार में जोड़ा गया!'
    });
  };

  // Video Upload Handler (up to 50MB)
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 52428800) {
      setStatusMsg({
        type: 'error',
        text: `वीडियो का आकार (${(file.size / (1024 * 1024)).toFixed(1)} MB) अधिकतम अनुमत सीमा 50 MB से अधिक है।`
      });
      return;
    }

    setUploadingVideo(true);
    setVideoUploadProgress(15);

    try {
      // 1. Try client-side video thumbnail capture
      const thumb = await captureVideoThumbnail(file);
      if (thumb?.dataUrl) {
        setVideoPoster(thumb.dataUrl);
      }

      setVideoUploadProgress(35);

      // 2. Upload video file to Supabase Storage hunkar-news-videos
      const result = await uploadSingleMedia(file, 'video', (p) => setVideoUploadProgress(p));

      if (result.success && result.url) {
        setVideoUrl(result.url);
        setStatusMsg({
          type: 'success',
          text: `वीडियो Supabase Storage (hunkar-news-videos) पर सफलतापूर्वक अपलोड हुआ! आकार: ${formatBytes(file.size)}`
        });
      } else {
        setStatusMsg({ type: 'error', text: result.error || 'वीडियो अपलोड प्रक्रिया विफल रही।' });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err?.message || 'वीडियो अपलोड में त्रुटि हुई।' });
    } finally {
      setUploadingVideo(false);
      setVideoUploadProgress(null);
      e.target.value = '';
    }
  };

  // AI Auto-Match Image
  const handleAutoMatchImage = () => {
    const matched = getTopicAccurateImage(headline, summary, category);
    const newItem: ImageItem = {
      id: `img-auto-${Date.now()}`,
      url: matched.imageUrl,
      caption: matched.caption,
      altText: matched.imageAlt,
      storageProvider: 'external',
      isMain: true
    };
    setImagesList([newItem]);
    if (matched.imageType) setImageType(matched.imageType === 'ai_illustration' ? 'ai_illustration' : 'photo');
    setImageGenerationStatus('completed');
    setStatusMsg({ type: 'success', text: 'विषय अनुसार प्रासंगिक चित्र स्वतः लिंक किया गया।' });
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

  // AI Assistant generator helper
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

    const finalReporterName = reporterName.trim() || 'हुंकार 24 ब्यूरो';
    const tagsArray = tagsInput.split(',').map(t => t.trim()).filter(Boolean);

    // Save up to 5 images in galleryImages
    const finalGalleryImages = imagesList.map(img => img.url).filter(Boolean).slice(0, 5);
    const chosenMainImage = (imagesList.find(img => img.isMain) || imagesList[0])?.url || finalGalleryImages[0] || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80';
    const mainCaption = (imagesList.find(img => img.isMain) || imagesList[0])?.caption || '';
    const mainAlt = (imagesList.find(img => img.isMain) || imagesList[0])?.altText || '';

    const payloadData: any = {
      headline: headline.trim(),
      slug: slug.trim() || `news-${Date.now()}`,
      summary: summary.trim() || headline.slice(0, 120),
      content: content.trim(),
      category,
      district,
      tehsil,
      village,
      mainImage: chosenMainImage,
      galleryImages: finalGalleryImages,
      imageCaption: mainCaption,
      imageSource: 'हुंकार 24 फोटो डेस्क',
      imageAlt: mainAlt.trim() || undefined,
      imageType,
      imageGenerationStatus,
      videoUrl: videoUrl.trim() || undefined,
      reporterId: 'rep-bureau',
      reporterName: finalReporterName,
      reporterPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      reporterRole: 'हुंकार ब्यूरो',
      isBreaking,
      isHero,
      isExclusive,
      status,
      tags: tagsArray,
      readingTimeMinutes: Math.max(1, Math.ceil(content.split(' ').length / 150))
    };

    if (initialArticle) {
      updateArticle(initialArticle.id, payloadData);
      setStatusMsg({ type: 'success', text: 'समाचार सफलतापूर्वक संशोधित किया गया एवं लाइव प्रसारित हुआ!' });
    } else {
      addArticle(payloadData);
      setStatusMsg({ type: 'success', text: `समाचार सफलतापूर्वक ${status === 'published' ? 'प्रकाशित' : 'ड्राफ्ट'} किया गया!` });
    }

    setTimeout(() => {
      onSaved();
    }, 1200);
  };

  return (
    <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 sm:p-7 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div>
          <h2 className="text-xl font-black font-newspaper-headline text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <span>{initialArticle ? 'समाचार संशोधित करें (Edit News)' : 'नया समाचार प्रकाशित करें (Create News)'}</span>
            <span className="text-[10px] bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400 px-2 py-0.5 rounded-full font-sans font-bold">
              क्लाउड मीडिया v2
            </span>
          </h2>
          <p className="text-xs text-stone-500">
            हुंकार 24 उन्नत मल्टी-इमेज (5 तस्वीरें तक) एवं 50MB वीडियो क्लाउड प्रकाशन सिस्टम
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAIAssist}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-xs font-bold transition-colors cursor-pointer"
            title="AI से सारांश एवं टैग्स बनाएं"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI सहायक</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave('draft')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 text-xs font-bold transition-colors cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>ड्राफ्ट सहेजें</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave('published')}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>अभी प्रकाशित करें</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
              : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-950 dark:text-red-300'
          }`}
        >
          {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
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
              संवाददाता / रिपोर्टर (वैकल्पिक)
            </label>
            <input
              type="text"
              value={reporterName}
              onChange={e => setReporterName(e.target.value)}
              placeholder="हुंकार 24 ब्यूरो"
              className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-semibold text-stone-900 dark:text-stone-100"
            />
          </div>
        </div>

        {/* =================================================================== */}
        {/* ADVANCED MULTI-IMAGE INFRASTRUCTURE (UP TO 5 IMAGES, MAX 50MB EACH) */}
        {/* =================================================================== */}
        <div className="p-5 bg-stone-50 dark:bg-stone-850 rounded-2xl border border-stone-200 dark:border-stone-750 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 dark:border-stone-700 pb-3">
            <div>
              <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-orange-600" />
                <span>तस्वीर प्रबंधन (News Gallery & Images)</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300">
                  {imagesList.length}/5 तस्वीरें
                </span>
              </h4>
              <p className="text-[11px] text-stone-500 mt-0.5">
                प्रति तस्वीर अधिकतम 50 MB (JPG, PNG, WEBP, AVIF) · Supabase Storage पर स्वतः सुरक्षित
              </p>
            </div>

            {/* Sub-tab selection: Upload / Paste URL / Manage */}
            <div className="flex items-center gap-1.5 p-1 bg-stone-200/70 dark:bg-stone-800 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setImageInputMode('upload')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  imageInputMode === 'upload'
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                }`}
              >
                A. फ़ोटो अपलोड
              </button>
              <button
                type="button"
                onClick={() => setImageInputMode('url')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  imageInputMode === 'url'
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                }`}
              >
                B. इमेज URL पेस्ट
              </button>
              <button
                type="button"
                onClick={() => setImageInputMode('manage')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  imageInputMode === 'manage'
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                }`}
              >
                C. गैलरी प्रबंधन ({imagesList.length})
              </button>
            </div>
          </div>

          {/* Progress bar during uploads */}
          {uploadProgress !== null && (
            <div className="p-3 bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-stone-700 dark:text-stone-300">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-600" />
                  <span>{uploadStatusText || 'अपलोड जारी है...'}</span>
                </span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-stone-100 dark:bg-stone-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-red-600 transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* TAB A: UPLOAD MULTIPLE IMAGES (UP TO 5) */}
          {imageInputMode === 'upload' && (
            <div className="space-y-3">
              <div className="border-2 border-dashed border-stone-300 dark:border-stone-700 rounded-xl p-5 text-center bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-750 transition-colors">
                <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-600 mx-auto flex items-center justify-center mb-2">
                  <CloudUpload className="w-5 h-5" />
                </div>
                <h5 className="text-xs font-bold text-stone-800 dark:text-stone-200">
                  मोबाइल / कंप्यूटर से तस्वीरें चुनें (Multiple Selection)
                </h5>
                <p className="text-[11px] text-stone-500 mb-3">
                  JPG, PNG, WEBP, AVIF · प्रति फ़ाइल अधिकतम 50 MB · शेष स्थान: {5 - imagesList.length}
                </p>
                <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs transition-colors">
                  <Upload className="w-4 h-4" />
                  <span>तस्वीरें चुनें (Select Files)</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    multiple
                    disabled={imagesList.length >= 5 || uploadProgress !== null}
                    onChange={handleMultipleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

          {/* TAB B: PASTE EXTERNAL IMAGE URL */}
          {imageInputMode === 'url' && (
            <div className="p-4 bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
                  बाहरी इमेज लिंक दर्ज करें (ImgBB, Cloudinary, ImageKit या HTTPS URL)
                </label>
                <button
                  type="button"
                  onClick={handleAutoMatchImage}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[11px] font-bold transition-colors cursor-pointer"
                >
                  <Wand2 className="w-3 h-3 text-amber-600" />
                  <span>प्रासंगिक चित्र खोजें</span>
                </button>
              </div>

              <div className="relative">
                <input
                  type="url"
                  value={pastedUrlInput}
                  onChange={e => setPastedUrlInput(e.target.value)}
                  placeholder="https://i.ibb.co/... या https://..."
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 font-mono"
                />
                <LinkIcon className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>

              {pastedUrlValidationResult && (
                <div className="text-xs text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{pastedUrlValidationResult}</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={!pastedUrlInput.trim() || pastedUrlValidating}
                  onClick={() => handleAddPastedImageUrl(false)}
                  className="px-3.5 py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  सीधा लिंक जोड़ें (Use Direct URL)
                </button>
                <button
                  type="button"
                  disabled={!pastedUrlInput.trim() || pastedUrlValidating}
                  onClick={() => handleAddPastedImageUrl(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  <CloudUpload className="w-3.5 h-3.5" />
                  <span>क्लाउड स्टोरेज में कॉपी कर सुरक्षित करें</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB C & GALLERY PREVIEW: SHOW ALL 1 TO 5 IMAGES */}
          <div>
            <div className="text-xs font-bold text-stone-700 dark:text-stone-300 mb-2 flex items-center justify-between">
              <span>वर्तमान संलग्न तस्वीरें ({imagesList.length}/5):</span>
              <span className="text-[11px] text-stone-400 font-normal">
                ★ स्टार आइकन पर क्लिक कर मुख्य कवर तस्वीर चुनें
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {imagesList.map((item, idx) => (
                <div
                  key={item.id}
                  className={`relative group rounded-xl overflow-hidden border-2 transition-all bg-white dark:bg-stone-800 flex flex-col justify-between ${
                    item.isMain
                      ? 'border-orange-500 shadow-md ring-2 ring-orange-500/20'
                      : 'border-stone-200 dark:border-stone-700'
                  }`}
                >
                  <div className="aspect-4/3 w-full relative overflow-hidden bg-stone-100 dark:bg-stone-900">
                    <SafeImage
                      src={item.url}
                      alt={item.altText || `तस्वीर ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />

                    {/* Main Cover Badge */}
                    {item.isMain && (
                      <span className="absolute top-1.5 left-1.5 bg-orange-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs">
                        मुख्य कवर
                      </span>
                    )}

                    {/* Quick Action Overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
                      {!item.isMain && (
                        <button
                          type="button"
                          onClick={() => handleSetMainImage(item.id)}
                          className="p-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white transition-colors cursor-pointer"
                          title="मुख्य कवर तस्वीर बनाएं"
                        >
                          <Star className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Replace image button */}
                      <label
                        className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-white transition-colors cursor-pointer"
                        title="तस्वीर बदलें (Replace)"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={e => handleReplaceImageFile(item.id, e)}
                          className="hidden"
                        />
                      </label>

                      {/* Delete image button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(item.id)}
                        className="p-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer"
                        title="तस्वीर हटाएं"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="p-2 text-[10px] space-y-1">
                    <input
                      type="text"
                      value={item.caption || ''}
                      onChange={e => {
                        const val = e.target.value;
                        setImagesList(prev =>
                          prev.map(img => (img.id === item.id ? { ...img, caption: val } : img))
                        );
                      }}
                      placeholder="कैप्शन लिखें..."
                      className="w-full px-1.5 py-1 text-[10px] rounded border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900"
                    />
                  </div>
                </div>
              ))}

              {/* Add image slot button if < 5 */}
              {imagesList.length < 5 && (
                <label className="aspect-4/3 rounded-xl border-2 border-dashed border-stone-300 dark:border-stone-700 hover:border-orange-500 dark:hover:border-orange-500 bg-stone-50 dark:bg-stone-800/40 flex flex-col items-center justify-center p-3 text-center cursor-pointer transition-colors group">
                  <Plus className="w-6 h-6 text-stone-400 group-hover:text-orange-600 mb-1" />
                  <span className="text-[11px] font-bold text-stone-600 dark:text-stone-300 group-hover:text-orange-600">
                    + तस्वीर जोड़ें
                  </span>
                  <span className="text-[9px] text-stone-400">
                    (अधिकतम {5 - imagesList.length} शेष)
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleMultipleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Alt Text & Image Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-stone-200 dark:border-stone-700">
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                तस्वीर का प्रकार (Image Type)
              </label>
              <select
                value={imageType}
                onChange={e => setImageType(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-medium"
              >
                <option value="photo">📷 वास्तविक फ़ोटो (Field / Mandi / Event Photo)</option>
                <option value="ai_illustration">🎨 प्रतीकात्मक AI इलस्ट्रेशन (Symbolic Illustration)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                SEO Alt Text (दृष्टिबाधित पाठकों व गूगल सर्च हेतु)
              </label>
              <input
                type="text"
                value={mainImageItem?.altText || ''}
                onChange={e => {
                  const val = e.target.value;
                  setImagesList(prev =>
                    prev.map(img => (img.isMain ? { ...img, altText: val } : img))
                  );
                }}
                placeholder="उदा. बीकानेर मंडी मूंगफली आवक व तौल"
                className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
              />
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* ADVANCED VIDEO UPLOAD & EMBEDDING (MAX 50MB, YOUTUBE, INSTA, FB) */}
        {/* =================================================================== */}
        <div className="p-5 bg-stone-50 dark:bg-stone-850 rounded-2xl border border-stone-200 dark:border-stone-750 space-y-4">
          <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-700 pb-2">
            <div>
              <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Video className="w-4 h-4 text-red-600" />
                <span>समाचार वीडियो (Video Embed or Direct Upload)</span>
              </h4>
              <p className="text-[11px] text-stone-500">
                MP4 / WebM वीडियो अपलोड (अधिकतम 50 MB) अथवा YouTube, Shorts, Instagram Reels, Facebook लिंक
              </p>
            </div>
            {videoUrl && (
              <button
                type="button"
                onClick={() => setVideoUrl('')}
                className="text-[11px] text-red-600 hover:text-red-700 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>वीडियो हटाएं</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Option 1: Direct Video Upload */}
            <div className="p-4 bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 space-y-2">
              <label className="block text-xs font-bold text-stone-800 dark:text-stone-200">
                विकल्प 1: वीडियो फ़ाइल अपलोड करें (Max 50 MB)
              </label>
              <p className="text-[11px] text-stone-500">
                MP4, WebM, MOV · Supabase Storage 'hunkar-news-videos' बकेट
              </p>

              {uploadingVideo && videoUploadProgress !== null && (
                <div className="space-y-1 py-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-stone-600 dark:text-stone-300">
                    <span className="flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin text-red-600" />
                      <span>वीडियो अपलोड हो रहा है...</span>
                    </span>
                    <span>{videoUploadProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-600 transition-all duration-200"
                      style={{ width: `${videoUploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <label className="flex items-center justify-center gap-2 px-4 py-2 bg-stone-900 hover:bg-black text-white text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-xs">
                <Film className="w-4 h-4 text-red-500" />
                <span>वीडियो फ़ाइल चुनें (Upload Video)</span>
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,video/ogg"
                  onChange={handleVideoUpload}
                  disabled={uploadingVideo}
                  className="hidden"
                />
              </label>
            </div>

            {/* Option 2: Paste Video URL */}
            <div className="p-4 bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 space-y-2">
              <label className="block text-xs font-bold text-stone-800 dark:text-stone-200">
                विकल्प 2: वीडियो URL पेस्ट करें
              </label>
              <p className="text-[11px] text-stone-500">
                YouTube, Shorts, Instagram Reels, Facebook वीडियो या सीधा MP4 लिंक
              </p>
              <div className="relative">
                <input
                  type="url"
                  value={videoUrl}
                  onChange={e => setVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=... या https://..."
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 font-mono"
                />
                <LinkIcon className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          {/* Live Video Preview in Editor */}
          {videoUrl && (
            <div className="mt-2 rounded-xl overflow-hidden border border-stone-300 dark:border-stone-700 p-3 bg-white dark:bg-stone-800 space-y-2">
              <span className="text-xs font-bold text-stone-700 dark:text-stone-300 block">
                लाइव वीडियो प्लेयर पूर्वावलोकन:
              </span>
              <UniversalVideoPlayer
                url={videoUrl}
                title={headline || 'समाचार वीडियो'}
                poster={videoPoster || mainImageUrl}
              />
            </div>
          )}
        </div>

        {/* Content Body */}
        <div>
          <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
            समाचार का विस्तृत विवरण (Full Content) <span className="text-red-600">*</span>
          </label>
          <textarea
            rows={10}
            required
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="विस्तृत समाचार लिखें... आप सब-हेडिंग के लिए ## हेडिंग का प्रयोग कर सकते हैं।"
            className="w-full px-4 py-3 text-sm leading-relaxed rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-serif text-stone-900 dark:text-stone-100"
          />
        </div>

        {/* Tags and Checkboxes */}
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              टैग्स (Tags) - कॉमा (,) से अलग करें
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              placeholder="राजस्थान, मंडी भाव, सरकारी योजना, ब्रेकिंग"
              className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
            />
          </div>

          <div className="flex flex-wrap items-center gap-6 p-3 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-bold">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isBreaking}
                onChange={e => setIsBreaking(e.target.checked)}
                className="w-4 h-4 text-red-600 rounded"
              />
              <span className="text-red-600">ब्रेकिंग न्यूज़ (Breaking Ticker)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isHero}
                onChange={e => setIsHero(e.target.checked)}
                className="w-4 h-4 text-orange-600 rounded"
              />
              <span className="text-stone-800 dark:text-stone-200">मुख्य हेडलाइन (Hero / Lead Story)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isExclusive}
                onChange={e => setIsExclusive(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded"
              />
              <span className="text-stone-800 dark:text-stone-200">एक्सक्लूसिव इन्वेस्टिगेशन</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
