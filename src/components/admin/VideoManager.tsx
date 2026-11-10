import React, { useState } from 'react';
import { Video, Plus, Trash2, ExternalLink, Play } from 'lucide-react';
import { useNews } from '../../context/NewsContext';
import { UniversalVideoPlayer, parseVideoUrl } from '../common/UniversalVideoPlayer';

export const VideoManager: React.FC = () => {
  const { videos, addVideo, deleteVideo, clearAllVideos } = useNews();

  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [category, setCategory] = useState('ग्राउंड रिपोर्ट');
  const [duration, setDuration] = useState('05:30');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !videoUrl.trim()) return;

    addVideo({
      title: title.trim(),
      videoUrl: videoUrl.trim(),
      thumbnailUrl: thumbnailUrl.trim() || 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=800&q=80',
      category,
      duration,
      source: 'youtube'
    });

    setShowAddModal(false);
    setTitle('');
    setVideoUrl('');
    setThumbnailUrl('');
  };

  return (
    <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 sm:p-7 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div>
          <h2 className="text-xl font-black font-newspaper-headline text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Video className="w-5 h-5 text-red-600" />
            <span>वीडियो न्यूज़ प्रबंधन (Video News Management)</span>
          </h2>
          <p className="text-xs text-stone-500">
            यूट्यूब, समाचार बुलेटिन एवं ग्राउंड रिपोर्ट वीडियो का प्रबंधन
          </p>
        </div>

        <div className="flex items-center gap-2">
          {videos.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('क्या आप सभी वीडियो हटाना चाहते हैं?')) {
                  clearAllVideos();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-red-50 text-stone-700 hover:text-red-600 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-red-950/40 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
              <span>सभी वीडियो हटाएं</span>
            </button>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-700 hover:bg-red-800 text-white font-bold rounded-xl text-xs transition-colors self-start sm:self-center cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>नया वीडियो जोड़ें</span>
          </button>
        </div>
      </div>

      {videos.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-xl border border-dashed border-stone-300 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/20">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 flex items-center justify-center mx-auto mb-3">
            <Video className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-stone-800 dark:text-stone-200 mb-1">
            वर्तमान में कोई वीडियो उपलब्ध नहीं है
          </h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto mb-4">
            सभी पुराने/असंबद्ध वीडियो हटा दिए गए हैं। आप 'नया वीडियो जोड़ें' पर क्लिक करके वास्तविक समाचार एवं ग्राउंड रिपोर्ट वीडियो अपलोड या लिंक कर सकते हैं।
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-700 hover:bg-red-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>पहला समाचार वीडियो जोड़ें</span>
          </button>
        </div>
      ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {videos.map(item => (
          <div
            key={item.id}
            className="rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden bg-stone-50 dark:bg-stone-800/40 flex flex-col justify-between"
          >
            <div className="aspect-16/9 relative overflow-hidden bg-black">
              <img
                src={item.thumbnailUrl}
                alt=""
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-2 right-2 bg-black/80 text-white font-mono text-[10px] px-1.5 py-0.5 rounded">
                {item.duration}
              </span>
            </div>

            <div className="p-3">
              <span className="text-[10px] font-bold text-red-700 dark:text-red-400 uppercase tracking-wider block mb-1">
                {item.category}
              </span>
              <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 line-clamp-2">
                {item.title}
              </h4>
              <div className="flex items-center justify-between text-[11px] text-stone-500 font-mono mt-2 pt-2 border-t border-stone-200 dark:border-stone-700">
                <span className="text-[10px] text-stone-400 font-sans">वीडियो बुलेटिन</span>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`क्या आप वीडियो "${item.title.slice(0, 30)}..." हटाना चाहते हैं?`)) {
                      deleteVideo(item.id);
                    }
                  }}
                  className="p-1 rounded text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                  title="वीडियो हटाएं"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 w-full max-w-md border border-stone-200 dark:border-stone-800 space-y-3">
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
              नया वीडियो बुलेटिन जोड़ें
            </h3>
            <form onSubmit={handleAdd} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">वीडियो शीर्षक *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-stone-50 dark:bg-stone-800"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">वीडियो URL (YouTube, Supabase, MP4, Vimeo) *</label>
                <input
                  type="url"
                  required
                  placeholder="https://www.youtube.com/watch?v=... या Supabase MP4 URL"
                  value={videoUrl}
                  onChange={e => {
                    const val = e.target.value;
                    setVideoUrl(val);
                    // If YouTube and no thumbnail provided, extract high-res thumbnail automatically
                    const ytMatch = val.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
                    if (ytMatch && ytMatch[1] && !thumbnailUrl) {
                      setThumbnailUrl(`https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`);
                    }
                  }}
                  className="w-full px-3 py-2 border rounded-lg bg-stone-50 dark:bg-stone-800 font-mono"
                />
                {videoUrl && (
                  <div className="mt-2 rounded-lg overflow-hidden border border-stone-700">
                    <UniversalVideoPlayer url={videoUrl} title="पूर्वावलोकन" />
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold mb-1">थंबनेल इमेज URL (वैकल्पिक)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={thumbnailUrl}
                  onChange={e => setThumbnailUrl(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-stone-50 dark:bg-stone-800 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold mb-1">श्रेणी</label>
                  <input
                    type="text"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-stone-50 dark:bg-stone-800"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">अवधि (उदा. 04:30)</label>
                  <input
                    type="text"
                    value={duration}
                    onChange={e => setDuration(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-stone-50 dark:bg-stone-800 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded bg-stone-200 dark:bg-stone-700"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-red-700 text-white font-bold"
                >
                  जोड़ें
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
