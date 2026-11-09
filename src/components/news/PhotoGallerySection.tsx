import React, { useState } from 'react';
import { Camera, ChevronLeft, ChevronRight, X, Image as ImageIcon } from 'lucide-react';
import { useNews } from '../../context/NewsContext';
import { PhotoGalleryAlbum, GalleryPhoto } from '../../types';

export const PhotoGallerySection: React.FC = () => {
  const { galleries } = useNews();
  const [activeAlbum, setActiveAlbum] = useState<PhotoGalleryAlbum | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);

  if (galleries.length === 0) return null;

  const handleOpenAlbum = (album: PhotoGalleryAlbum) => {
    setActiveAlbum(album);
    setPhotoIndex(0);
  };

  const handleNextPhoto = () => {
    if (!activeAlbum) return;
    setPhotoIndex(prev => (prev + 1) % activeAlbum.photos.length);
  };

  const handlePrevPhoto = () => {
    if (!activeAlbum) return;
    setPhotoIndex(prev => (prev - 1 + activeAlbum.photos.length) % activeAlbum.photos.length);
  };

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-stone-800 dark:border-stone-700">
        <div className="flex items-center gap-2">
          <div className="bg-stone-800 text-white p-1.5 rounded">
            <Camera className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 font-newspaper-headline">
              फोटो गैलरी एवं सांस्कृतिक झलकियां
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              राजस्थान के मेले, ऐतिहासिक धरोहरें और जनजीवन के अनूठे रंग
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {galleries.map(album => (
          <div
            key={album.id}
            onClick={() => handleOpenAlbum(album)}
            className="group cursor-pointer rounded-xl overflow-hidden border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:shadow-lg transition-all"
          >
            <div className="aspect-16/9 relative overflow-hidden bg-stone-100 dark:bg-stone-800">
              <img
                src={album.coverImage}
                alt={album.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              
              <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-xs text-white text-[11px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                <span>{album.photos.length} तस्वीरें</span>
              </div>

              <div className="absolute bottom-3 left-3 right-3 text-white">
                <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider block mb-1">
                  {album.category}
                </span>
                <h3 className="text-base sm:text-lg font-bold font-newspaper-headline leading-tight line-clamp-2">
                  {album.title}
                </h3>
              </div>
            </div>

            <div className="p-3.5 text-xs text-stone-600 dark:text-stone-300 line-clamp-2">
              {album.description}
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {activeAlbum && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-4 sm:p-6 select-none">
          {/* Top Bar */}
          <div className="flex items-center justify-between text-white border-b border-stone-800 pb-3">
            <div>
              <h3 className="text-base font-bold font-newspaper-headline truncate">
                {activeAlbum.title}
              </h3>
              <p className="text-xs text-stone-400">
                तस्वीर {photoIndex + 1} / {activeAlbum.photos.length}
              </p>
            </div>
            <button
              onClick={() => setActiveAlbum(null)}
              className="p-2 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Center Image */}
          <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden">
            <img
              src={activeAlbum.photos[photoIndex].url}
              alt={activeAlbum.photos[photoIndex].caption}
              className="max-h-full max-w-full object-contain rounded shadow-2xl"
            />

            {/* Prev / Next controls */}
            <button
              onClick={handlePrevPhoto}
              className="absolute left-2 p-3 rounded-full bg-black/60 text-white hover:bg-red-700 transition-colors"
              title="पिछली तस्वीर"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={handleNextPhoto}
              className="absolute right-2 p-3 rounded-full bg-black/60 text-white hover:bg-red-700 transition-colors"
              title="अगली तस्वीर"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Caption Box */}
          <div className="text-center text-white bg-stone-900/80 p-3 rounded-lg border border-stone-800">
            <p className="text-sm font-medium">
              {activeAlbum.photos[photoIndex].caption}
            </p>
            {activeAlbum.photos[photoIndex].photographer && (
              <span className="text-xs text-stone-400 mt-1 block">
                तस्वीर: {activeAlbum.photos[photoIndex].photographer}
              </span>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
