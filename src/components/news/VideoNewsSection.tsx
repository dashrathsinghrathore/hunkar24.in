import React, { useState } from 'react';
import { Play, Video, Eye, X } from 'lucide-react';
import { useNews } from '../../context/NewsContext';
import { VideoNewsItem } from '../../types';

export const VideoNewsSection: React.FC = () => {
  const { videos } = useNews();
  const [selectedVideo, setSelectedVideo] = useState<VideoNewsItem | null>(null);

  if (videos.length === 0) return null;

  return (
    <section className="mb-10 bg-stone-900 text-white p-5 sm:p-7 rounded-2xl">
      <div className="flex items-center justify-between mb-6 pb-2 border-b border-stone-800">
        <div className="flex items-center gap-2.5">
          <div className="bg-red-600 text-white p-2 rounded-lg">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black font-newspaper-headline text-stone-100">
              हुंकार वीडियो न्यूज़
            </h2>
            <p className="text-xs text-stone-400">
              ग्राउंड रिपोर्ट, विशेष साक्षात्कार एवं वायरल वीडियो बुलेटिन
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {videos.map(item => (
          <div
            key={item.id}
            onClick={() => setSelectedVideo(item)}
            className="group cursor-pointer rounded-xl overflow-hidden bg-stone-800 border border-stone-700/60 hover:border-red-500 transition-all flex flex-col"
          >
            <div className="aspect-16/9 relative overflow-hidden bg-stone-950">
              <img
                src={item.thumbnailUrl}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-red-600 group-hover:bg-red-500 text-white flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                </div>
              </div>
              <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-mono font-bold px-1.5 py-0.5 rounded">
                {item.duration}
              </span>
              <span className="absolute top-2 left-2 bg-red-700 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                {item.category}
              </span>
            </div>

            <div className="p-4 flex-1 flex flex-col justify-between">
              <h3 className="text-sm font-bold text-stone-100 group-hover:text-red-400 font-newspaper-headline leading-snug line-clamp-2 mb-2">
                {item.title}
              </h3>

              <div className="flex items-center justify-between text-xs text-stone-400 pt-2 border-t border-stone-700/50">
                <span className="flex items-center gap-1 font-mono">
                  <Eye className="w-3.5 h-3.5" />
                  <span>{item.views.toLocaleString()}</span>
                </span>
                <span className="text-red-400 font-bold hover:underline">
                  वीडियो देखें →
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Video Modal Player */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-3xl bg-stone-900 rounded-2xl overflow-hidden border border-stone-800 shadow-2xl">
            <div className="p-4 flex items-center justify-between border-b border-stone-800">
              <h3 className="text-sm font-bold text-white truncate pr-4">
                {selectedVideo.title}
              </h3>
              <button
                onClick={() => setSelectedVideo(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="aspect-16/9 w-full bg-black">
              <iframe
                src={`${selectedVideo.videoUrl}?autoplay=1`}
                title={selectedVideo.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
