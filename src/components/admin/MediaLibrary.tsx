import React, { useState } from 'react';
import { Image as ImageIcon, Plus, Copy, Check, Trash2, Upload, Loader2, Link } from 'lucide-react';
import { useNews } from '../../context/NewsContext';
import { uploadImageToSupabase } from '../../lib/supabaseClient';

interface MediaItem {
  id: string;
  title: string;
  url: string;
  caption: string;
  uploadedAt: string;
}

export const MediaLibrary: React.FC = () => {
  const { articles } = useNews();

  // Extract all media images from articles and seed list
  const [mediaList, setMediaList] = useState<MediaItem[]>(() => {
    const list: MediaItem[] = [
      {
        id: 'med-1',
        title: 'सचिवालय पेयजल बैठक',
        url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=1200&q=80',
        caption: 'सचिवालय में जल जीवन मिशन समीक्षा',
        uploadedAt: '2026-11-07'
      },
      {
        id: 'med-2',
        title: 'शेखावाटी सरसों फसल',
        url: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=80',
        caption: 'सीकर जिले के ग्रामीण खेतों में लहलहाती फसल',
        uploadedAt: '2026-11-06'
      },
      {
        id: 'med-3',
        title: 'थार रेगिस्तान सीमांत गांव',
        url: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1200&q=80',
        caption: 'थार के रेगिस्तान में पारंपरिक जल स्रोत',
        uploadedAt: '2026-11-06'
      },
      {
        id: 'med-4',
        title: 'पुष्कर मेला ऊंट कारवां',
        url: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80',
        caption: 'पुष्कर के रेतीले धोरों पर सजे ऊंट',
        uploadedAt: '2026-11-05'
      },
      {
        id: 'med-5',
        title: 'हवामहल जयपुर धरोहर',
        url: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80',
        caption: 'हवामहल की स्थापत्य कला',
        uploadedAt: '2026-11-04'
      }
    ];

    // Merge images from current articles
    for (const art of articles) {
      if (art.mainImage && !list.some(m => m.url === art.mainImage)) {
        list.push({
          id: `art-img-${art.id}`,
          title: art.headline.slice(0, 30),
          url: art.mainImage,
          caption: art.imageCaption || art.headline,
          uploadedAt: art.publishedAt?.slice(0, 10) || '2026-11-10'
        });
      }
    }

    return list;
  });

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newUrl, setNewUrl] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setStatusMsg('तस्वीर अपलोड हो रही है...');

    try {
      // 1. Direct Supabase Storage
      const sbResult = await uploadImageToSupabase(file);
      if (sbResult.success && sbResult.url) {
        setNewUrl(sbResult.url);
        if (!newTitle) setNewTitle(file.name.replace(/\.[^/.]+$/, ''));
        setStatusMsg('Supabase Storage में सफलता से अपलोड हुआ!');
        setIsUploading(false);
        return;
      }

      // 2. Server upload
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
            setNewUrl(result.url);
            if (!newTitle) setNewTitle(file.name.replace(/\.[^/.]+$/, ''));
            setStatusMsg('तस्वीर सफलतापूर्वक अपलोड हुई!');
          } else {
            setStatusMsg('अपलोड विफल: ' + (result.error || 'त्रुटि'));
          }
        } catch {
          setStatusMsg('सर्वर से कनेक्ट करने में त्रुटि');
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setStatusMsg('अपलोड में त्रुटि हुई');
      setIsUploading(false);
    }
  };

  const handleUrlChange = async (val: string) => {
    let clean = val.trim();
    setNewUrl(clean);

    if (clean.includes('ibb.co/') && !clean.includes('i.ibb.co/')) {
      try {
        const res = await fetch(`/api/resolve-image-url?url=${encodeURIComponent(clean)}`);
        const data = await res.json();
        if (data?.success && data?.directUrl) {
          setNewUrl(data.directUrl);
        }
      } catch {}
    }
  };

  const handleAddMedia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim() || !newTitle.trim()) return;

    const item: MediaItem = {
      id: `med-${Date.now()}`,
      title: newTitle.trim(),
      url: newUrl.trim(),
      caption: newTitle.trim(),
      uploadedAt: new Date().toISOString().slice(0, 10)
    };

    setMediaList(prev => [item, ...prev]);
    setShowAddModal(false);
    setNewUrl('');
    setNewTitle('');
    setStatusMsg(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('क्या आप इस मीडिया फाइल को लाइब्रेरी से हटाना चाहते हैं?')) {
      setMediaList(prev => prev.filter(m => m.id !== id));
    }
  };

  return (
    <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 sm:p-7 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div>
          <h2 className="text-xl font-black font-newspaper-headline text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-red-600" />
            <span>मीडिया लाइब्रेरी (Media Library)</span>
          </h2>
          <p className="text-xs text-stone-500">
            समाचार आलेखों के लिए छवियां, तस्वीरें व ग्राफिक्स का संग्रह एवं लिंक कॉपी
          </p>
        </div>

        <button
          onClick={() => {
            setShowAddModal(true);
            setStatusMsg(null);
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-red-700 hover:bg-red-800 text-white font-bold rounded-xl text-xs transition-colors self-start sm:self-center cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>नई मीडिया फाइल जोड़ें / अपलोड करें</span>
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {mediaList.map(item => (
          <div
            key={item.id}
            className="group rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/40 overflow-hidden hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="aspect-16/10 relative overflow-hidden bg-stone-100 dark:bg-stone-900">
              <img
                src={item.url}
                alt={item.title}
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=400&q=80';
                }}
              />
            </div>

            <div className="p-3">
              <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate" title={item.title}>
                {item.title}
              </h4>
              <span className="text-[10px] text-stone-400 block mt-0.5">
                दिनांक: {item.uploadedAt}
              </span>

              <div className="flex items-center justify-between mt-3 pt-2 border-t border-stone-200 dark:border-stone-700">
                <button
                  onClick={() => handleCopy(item.url, item.id)}
                  className="flex items-center gap-1 text-[11px] font-bold text-red-700 dark:text-red-400 hover:underline cursor-pointer"
                >
                  {copiedId === item.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>कॉपी हुआ!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>URL कॉपी</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-stone-400 hover:text-red-600 p-1 cursor-pointer"
                  title="विलोपित करें"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Media Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 w-full max-w-md border border-stone-200 dark:border-stone-800 space-y-4">
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
              मीडिया लाइब्रेरी में नई तस्वीर जोड़ें
            </h3>

            {/* Direct Device Upload Option */}
            <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-stone-200 dark:border-stone-700">
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                डिवाइस (मोबाइल / कंप्यूटर) से सीधी फ़ोटो अपलोड:
              </label>
              <label className="flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-xs">
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    तस्वीर अपलोड हो रही है...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    फ़ोटो चुनें (Direct Upload)
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>
            </div>

            {statusMsg && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                {statusMsg}
              </p>
            )}

            <form onSubmit={handleAddMedia} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1 text-stone-700 dark:text-stone-300">छवि का शीर्षक / कैप्शन *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="उदा. जयपुर परकोटा"
                  className="w-full px-3 py-2 border rounded-lg bg-stone-50 dark:bg-stone-800 border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-stone-700 dark:text-stone-300">छवि प्रत्यक्ष URL *</label>
                <div className="relative">
                  <input
                    type="url"
                    required
                    value={newUrl}
                    onChange={e => handleUrlChange(e.target.value)}
                    placeholder="https://... या अपलोड करने पर स्वतः भरेगा"
                    className="w-full pl-8 pr-3 py-2 border rounded-lg bg-stone-50 dark:bg-stone-800 border-stone-300 dark:border-stone-700 font-mono text-stone-900 dark:text-stone-100"
                  />
                  <Link className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {newUrl && (
                <div className="aspect-16/10 rounded-lg overflow-hidden border border-stone-700 bg-stone-900">
                  <img
                    src={newUrl}
                    alt="पूर्वावलोकन"
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-stone-200 dark:bg-stone-700 font-bold cursor-pointer"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-red-700 hover:bg-red-800 text-white font-bold cursor-pointer"
                >
                  लाइब्रेरी में सहेजें
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
