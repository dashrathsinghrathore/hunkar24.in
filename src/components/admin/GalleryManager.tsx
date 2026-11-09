import React, { useState } from 'react';
import { Camera, Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import { useNews } from '../../context/NewsContext';

export const GalleryManager: React.FC = () => {
  const { galleries, addGallery } = useNews();

  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [category, setCategory] = useState('संस्कृति एवं पर्यटन');
  const [photoUrl1, setPhotoUrl1] = useState('');
  const [caption1, setCaption1] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !coverImage.trim()) return;

    addGallery({
      title: title.trim(),
      description: description.trim() || title.trim(),
      coverImage: coverImage.trim(),
      category,
      photos: [
        {
          id: `p-${Date.now()}-1`,
          url: coverImage.trim(),
          caption: caption1.trim() || title.trim(),
          photographer: 'हुंकार फोटो डेस्क'
        },
        ...(photoUrl1.trim()
          ? [
              {
                id: `p-${Date.now()}-2`,
                url: photoUrl1.trim(),
                caption: caption1.trim() || title.trim(),
                photographer: 'हुंकार 24'
              }
            ]
          : [])
      ]
    });

    setShowAddModal(false);
    setTitle('');
    setDescription('');
    setCoverImage('');
  };

  return (
    <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 sm:p-7 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div>
          <h2 className="text-xl font-black font-newspaper-headline text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Camera className="w-5 h-5 text-red-600" />
            <span>फोटो गैलरी एल्बम (Photo Gallery Manager)</span>
          </h2>
          <p className="text-xs text-stone-500">
            राजस्थान के सांस्कृतिक उत्सवों, मेलों एवं धरोहरों के फोटो एल्बम
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-red-700 hover:bg-red-800 text-white font-bold rounded-xl text-xs transition-colors self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>नया एल्बम जोड़ें</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {galleries.map(album => (
          <div
            key={album.id}
            className="rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden bg-stone-50 dark:bg-stone-800/40 flex flex-col justify-between"
          >
            <div className="aspect-16/9 relative overflow-hidden bg-stone-200">
              <img
                src={album.coverImage}
                alt=""
                className="w-full h-full object-cover"
              />
              <span className="absolute top-2 left-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                {album.photos.length} तस्वीरें
              </span>
            </div>

            <div className="p-4">
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide block mb-1">
                {album.category}
              </span>
              <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 font-newspaper-headline">
                {album.title}
              </h4>
              <p className="text-xs text-stone-500 mt-1 line-clamp-2">
                {album.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 w-full max-w-md border border-stone-200 dark:border-stone-800 space-y-3">
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
              नया फोटो एल्बम बनाएं
            </h3>
            <form onSubmit={handleAdd} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">एल्बम का शीर्षक *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-stone-50 dark:bg-stone-800"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">संक्षिप्त विवरण</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-stone-50 dark:bg-stone-800"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">मुख्य कवर तस्वीर URL *</label>
                <input
                  type="url"
                  required
                  value={coverImage}
                  onChange={e => setCoverImage(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-stone-50 dark:bg-stone-800 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">अतिरिक्त फोटो URL (वैकल्पिक)</label>
                <input
                  type="url"
                  value={photoUrl1}
                  onChange={e => setPhotoUrl1(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-stone-50 dark:bg-stone-800 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">फोटो कैप्शन</label>
                <input
                  type="text"
                  value={caption1}
                  onChange={e => setCaption1(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-stone-50 dark:bg-stone-800"
                />
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
                  एल्बम सुरक्षित करें
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
