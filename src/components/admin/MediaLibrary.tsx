import React, { useState, useEffect } from 'react';
import {
  Image as ImageIcon,
  Video,
  Plus,
  Copy,
  Check,
  Trash2,
  Upload,
  Loader2,
  Link as LinkIcon,
  CloudUpload,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Filter,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useNews } from '../../context/NewsContext';
import { MediaAsset } from '../../types';
import {
  uploadSingleMedia,
  importExternalMedia,
  formatBytes,
  inspectAndValidateMediaUrl
} from '../../lib/mediaService';
import { SafeImage } from '../common/SafeImage';
import { UniversalVideoPlayer } from '../common/UniversalVideoPlayer';

export const MediaLibrary: React.FC = () => {
  const { articles } = useNews();

  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Add / Upload Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalMode, setModalMode] = useState<'upload' | 'url'>('upload');
  const [selectedMediaType, setSelectedMediaType] = useState<'image' | 'video'>('image');
  const [pastedUrl, setPastedUrl] = useState('');
  const [pastedTitle, setPastedTitle] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch media assets from server
  const loadAssets = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/media/assets');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.assets)) {
          const serverList: MediaAsset[] = data.assets;

          // Also merge article images that might not be in assets
          const existingUrls = new Set(serverList.map(a => a.mediaUrl));
          const articleAssets: MediaAsset[] = [];

          for (const art of articles) {
            if (art.mainImage && !existingUrls.has(art.mainImage)) {
              articleAssets.push({
                id: `art-img-${art.id}`,
                newsId: art.id,
                mediaType: 'image',
                sourceType: 'imported',
                storageProvider: art.mainImage.includes('supabase.co') ? 'supabase' : 'external',
                mediaUrl: art.mainImage,
                caption: art.imageCaption || art.headline,
                altText: art.imageAlt || art.headline,
                backupStatus: 'backed_up',
                createdAt: art.publishedAt || new Date().toISOString(),
                updatedAt: art.updatedAt || new Date().toISOString()
              });
              existingUrls.add(art.mainImage);
            }
            if (art.videoUrl && !existingUrls.has(art.videoUrl)) {
              articleAssets.push({
                id: `art-vid-${art.id}`,
                newsId: art.id,
                mediaType: 'video',
                sourceType: 'external_url',
                storageProvider: art.videoUrl.includes('supabase.co') ? 'supabase' : 'external',
                mediaUrl: art.videoUrl,
                caption: `${art.headline} वीडियो`,
                backupStatus: 'backed_up',
                createdAt: art.publishedAt || new Date().toISOString(),
                updatedAt: art.updatedAt || new Date().toISOString()
              });
              existingUrls.add(art.videoUrl);
            }
          }

          setAssets([...serverList, ...articleAssets]);
          setLoading(false);
          return;
        }
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    loadAssets();
  }, [articles]);

  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('क्या आप इस मीडिया फाइल को लाइब्रेरी से हटाना चाहते हैं?')) return;

    try {
      const res = await fetch(`/api/media/assets/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setAssets(prev => prev.filter(a => a.id !== id));
        setStatusMsg({ type: 'success', text: 'मीडिया फ़ाइल हटाई गई।' });
      }
    } catch {
      setStatusMsg({ type: 'error', text: 'हटाने में त्रुटि हुई।' });
    }
  };

  const handleRetryBackup = async (id: string) => {
    try {
      const res = await fetch(`/api/media/retry-backup/${id}`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.asset) {
          setAssets(prev => prev.map(a => (a.id === id ? data.asset : a)));
          setStatusMsg({ type: 'success', text: 'Firebase सेकेंडरी बैकअप सफलतापूर्वक पूरा हुआ!' });
        }
      }
    } catch {
      setStatusMsg({ type: 'error', text: 'बैकअप पुनः प्रयास विफल रहा।' });
    }
  };

  // Upload handler from modal
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 52428800) {
      setStatusMsg({
        type: 'error',
        text: `फ़ाइल का आकार (${formatBytes(file.size)}) 50 MB से अधिक है।`
      });
      return;
    }

    setIsProcessing(true);
    setUploadPercent(10);

    const result = await uploadSingleMedia(file, selectedMediaType, (p) => setUploadPercent(p));

    if (result.success && result.url && result.asset) {
      setAssets(prev => [result.asset!, ...prev]);
      setStatusMsg({
        type: 'success',
        text: `${selectedMediaType === 'video' ? 'वीडियो' : 'तस्वीर'} Supabase Storage में सफलतापूर्वक सुरक्षित की गई!`
      });
      setShowAddModal(false);
    } else {
      setStatusMsg({ type: 'error', text: result.error || 'अपलोड विफल रहा।' });
    }

    setIsProcessing(false);
    setUploadPercent(null);
    e.target.value = '';
  };

  // External URL import handler
  const handleImportUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = pastedUrl.trim();
    if (!raw) return;

    setIsProcessing(true);
    setStatusMsg(null);

    const importRes = await importExternalMedia(raw, selectedMediaType);
    if (importRes.success && importRes.url && importRes.mediaAsset) {
      setAssets(prev => [importRes.mediaAsset!, ...prev]);
      setStatusMsg({
        type: 'success',
        text: 'बाहरी मीडिया डाउनलोड कर Supabase Storage में सफलतापूर्वक सहेजा गया!'
      });
      setShowAddModal(false);
      setPastedUrl('');
      setPastedTitle('');
    } else {
      setStatusMsg({ type: 'error', text: importRes.error || 'मीडिया इम्पोर्ट विफल रहा।' });
    }

    setIsProcessing(false);
  };

  const filteredAssets = assets.filter(item => {
    if (filterType === 'image') return item.mediaType === 'image';
    if (filterType === 'video') return item.mediaType === 'video';
    return true;
  });

  return (
    <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 sm:p-7 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div>
          <h2 className="text-xl font-black font-newspaper-headline text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-orange-600" />
            <span>सेंट्रल मीडिया लाइब्रेरी (Central Cloud Media Library)</span>
          </h2>
          <p className="text-xs text-stone-500">
            हुंकार 24 एकीकृत मीडिया हब · Supabase प्राथमिक स्टोरेज एवं Firebase सेकेंडरी बैकअप
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Pills */}
          <div className="flex items-center p-1 bg-stone-100 dark:bg-stone-800 rounded-xl text-xs font-bold">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                filterType === 'all'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400'
              }`}
            >
              सभी ({assets.length})
            </button>
            <button
              onClick={() => setFilterType('image')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                filterType === 'image'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400'
              }`}
            >
              तस्वीरें ({assets.filter(a => a.mediaType === 'image').length})
            </button>
            <button
              onClick={() => setFilterType('video')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                filterType === 'video'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400'
              }`}
            >
              वीडियो ({assets.filter(a => a.mediaType === 'video').length})
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-700 hover:bg-red-800 text-white font-bold rounded-xl text-xs transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>नया मीडिया जोड़ें</span>
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

      {/* Grid of Media Assets */}
      {loading ? (
        <div className="py-16 text-center text-stone-400 flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-red-600" />
          <span className="text-xs">मीडिया लाइब्रेरी लोड हो रही है...</span>
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-dashed border-stone-300 dark:border-stone-800 p-8 space-y-3">
          <ImageIcon className="w-10 h-10 text-stone-400 mx-auto" />
          <h4 className="text-sm font-bold text-stone-700 dark:text-stone-300">
            कोई मीडिया उपलब्ध नहीं है
          </h4>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            कंप्यूटर/मोबाइल से 50 MB तक की तस्वीरें या वीडियो अपलोड करें, अथवा बाहरी लिंक इम्पोर्ट करें।
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            + पहला मीडिया जोड़ें
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredAssets.map(item => (
            <div
              key={item.id}
              className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-850 overflow-hidden shadow-xs flex flex-col justify-between group hover:border-orange-500 transition-colors"
            >
              {/* Media Preview (Image or Video) */}
              <div className="aspect-16/10 w-full relative bg-black overflow-hidden">
                {item.mediaType === 'video' ? (
                  <div className="w-full h-full relative">
                    <UniversalVideoPlayer url={item.mediaUrl} />
                    <span className="absolute top-2 left-2 z-10 bg-black/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 pointer-events-none">
                      <Video className="w-3 h-3 text-red-500" />
                      <span>वीडियो</span>
                    </span>
                  </div>
                ) : (
                  <SafeImage
                    src={item.mediaUrl}
                    alt={item.caption || item.altText || 'मीडिया'}
                    allowFullscreen
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Storage Provider Badge */}
                <div className="absolute top-2 right-2 pointer-events-none flex flex-col gap-1 items-end">
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs ${
                      item.storageProvider === 'supabase'
                        ? 'bg-emerald-600 text-white'
                        : item.storageProvider === 'firebase'
                        ? 'bg-amber-600 text-white'
                        : 'bg-stone-800 text-stone-200'
                    }`}
                  >
                    {item.storageProvider === 'supabase'
                      ? 'Supabase'
                      : item.storageProvider === 'firebase'
                      ? 'Firebase'
                      : 'External'}
                  </span>

                  {/* Firebase backup status badge */}
                  {item.backupStatus === 'backed_up' && (
                    <span className="bg-sky-600 text-white text-[8px] font-bold px-1 rounded">
                      ✓ FB Backup
                    </span>
                  )}
                </div>
              </div>

              {/* Media Details & Actions */}
              <div className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-1">
                  <span className="text-xs font-bold text-stone-900 dark:text-stone-100 line-clamp-1">
                    {item.caption || item.altText || item.id}
                  </span>
                </div>

                <div className="text-[10px] text-stone-500 flex items-center justify-between">
                  <span>{item.fileSize ? formatBytes(item.fileSize) : 'क्लाउड लिंक'}</span>
                  <span>{item.createdAt?.slice(0, 10)}</span>
                </div>

                <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-1">
                  <button
                    onClick={() => handleCopy(item.mediaUrl, item.id)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    {copiedId === item.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>कॉपी हुआ</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>URL कॉपी</span>
                      </>
                    )}
                  </button>

                  {item.backupStatus !== 'backed_up' && (
                    <button
                      onClick={() => handleRetryBackup(item.id)}
                      className="p-1.5 rounded bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 hover:bg-sky-100 text-[10px] font-bold transition-colors cursor-pointer"
                      title="Firebase बैकअप पुनः प्रयास करें"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 rounded bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 hover:bg-red-100 transition-colors cursor-pointer"
                    title="हटाएं"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Add New Media */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 max-w-lg w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <CloudUpload className="w-5 h-5 text-orange-600" />
                <span>नया मीडिया अपलोड / इम्पोर्ट करें</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 cursor-pointer"
              >
                <Trash2 className="hidden" />
                ✕
              </button>
            </div>

            {/* MediaType Switch: Image or Video */}
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => setSelectedMediaType('image')}
                className={`py-2 rounded-xl flex items-center justify-center gap-1.5 border transition-colors cursor-pointer ${
                  selectedMediaType === 'image'
                    ? 'bg-orange-50 dark:bg-orange-950/40 border-orange-500 text-orange-700 dark:text-orange-300'
                    : 'border-stone-200 dark:border-stone-700 text-stone-600'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                <span>तस्वीर (Image)</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedMediaType('video')}
                className={`py-2 rounded-xl flex items-center justify-center gap-1.5 border transition-colors cursor-pointer ${
                  selectedMediaType === 'video'
                    ? 'bg-red-50 dark:bg-red-950/40 border-red-500 text-red-700 dark:text-red-300'
                    : 'border-stone-200 dark:border-stone-700 text-stone-600'
                }`}
              >
                <Video className="w-4 h-4" />
                <span>वीडियो (Video)</span>
              </button>
            </div>

            {/* Sub-tab: Upload vs Paste URL */}
            <div className="flex border-b border-stone-200 dark:border-stone-800 text-xs font-bold">
              <button
                onClick={() => setModalMode('upload')}
                className={`flex-1 py-2 text-center border-b-2 transition-colors cursor-pointer ${
                  modalMode === 'upload'
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-stone-500'
                }`}
              >
                कंप्यूटर/मोबाइल से अपलोड (Max 50MB)
              </button>
              <button
                onClick={() => setModalMode('url')}
                className={`flex-1 py-2 text-center border-b-2 transition-colors cursor-pointer ${
                  modalMode === 'url'
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-stone-500'
                }`}
              >
                बाहरी URL इम्पोर्ट करें
              </button>
            </div>

            {modalMode === 'upload' ? (
              <div className="space-y-3 py-2">
                <div className="border-2 border-dashed border-stone-300 dark:border-stone-700 rounded-xl p-8 text-center space-y-3 bg-stone-50 dark:bg-stone-800/40">
                  <Upload className="w-8 h-8 text-stone-400 mx-auto" />
                  <div>
                    <h5 className="text-xs font-bold text-stone-800 dark:text-stone-200">
                      {selectedMediaType === 'video'
                        ? 'MP4, WebM, QuickTime MOV वीडियो चुनें'
                        : 'JPG, PNG, WEBP, AVIF तस्वीर चुनें'}
                    </h5>
                    <p className="text-[11px] text-stone-500">
                      अधिकतम अनुमत आकार: 50 MB प्रति फ़ाइल
                    </p>
                  </div>

                  {uploadPercent !== null && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-stone-600">
                        <span>अपलोड हो रहा है...</span>
                        <span>{uploadPercent}%</span>
                      </div>
                      <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-600"
                          style={{ width: `${uploadPercent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-xs">
                    <Upload className="w-4 h-4" />
                    <span>फ़ाइल चुनें (Select File)</span>
                    <input
                      type="file"
                      accept={
                        selectedMediaType === 'video'
                          ? 'video/mp4,video/webm,video/quicktime'
                          : 'image/jpeg,image/png,image/webp,image/avif'
                      }
                      onChange={handleFileUpload}
                      disabled={isProcessing}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            ) : (
              <form onSubmit={handleImportUrl} className="space-y-3 py-2">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    बाहरी लिंक (ImgBB, Cloudinary, YouTube, Direct URL)
                  </label>
                  <input
                    type="url"
                    required
                    value={pastedUrl}
                    onChange={e => setPastedUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!pastedUrl.trim() || isProcessing}
                  className="w-full py-2.5 bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>क्लाउड स्टोरेज में कॉपी हो रहा है...</span>
                    </>
                  ) : (
                    <>
                      <CloudUpload className="w-4 h-4" />
                      <span>इम्पोर्ट करें एवं Supabase Storage में सुरक्षित करें</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
