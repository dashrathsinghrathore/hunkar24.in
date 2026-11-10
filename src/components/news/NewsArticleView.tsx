import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Share2,
  Volume2,
  VolumeX,
  Printer,
  Flag,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  MapPin,
  ShieldCheck,
  MessageCircle,
  ThumbsUp,
  ExternalLink,
  BookOpen,
  Send
} from 'lucide-react';
import { Article } from '../../types';
import { useNews } from '../../context/NewsContext';
import { ArticleCard } from './ArticleCard';
import { AdBanner } from '../ads/AdBanner';
import { SITE_CONFIG } from '../../config/siteConfig';
import { SafeImage } from '../common/SafeImage';
import { UniversalVideoPlayer } from '../common/UniversalVideoPlayer';
import { estimateReadingTime, sanitizeHeadline, sanitizeSummary, sanitizeContent } from '../../utils/newsUtils';
import { updateArticleSEO } from '../../utils/seoUtils';

interface NewsArticleViewProps {
  article: Article;
  onBack: () => void;
}

export const NewsArticleView: React.FC<NewsArticleViewProps> = ({ article, onBack }) => {
  const {
    articles,
    setActiveArticle,
    setIsReportIssueOpen,
    fontSize,
    toggleArticleLike
  } = useNews();

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [liked, setLiked] = useState(false);

  // Sanitized content and dynamic read time estimation
  const cleanTitle = sanitizeHeadline(article.headline);
  const cleanDesc = sanitizeSummary(article.summary, cleanTitle, article.category);
  const cleanFullContent = sanitizeContent(article.content, article.summary, cleanTitle, article.sourceName || article.reporterName);
  const readTimeMinutes = estimateReadingTime(cleanFullContent, cleanDesc, article.readingTimeMinutes);

  // Dynamic OpenGraph, Twitter Cards and Google NewsArticle Schema Update
  useEffect(() => {
    updateArticleSEO(article);
    return () => {
      updateArticleSEO(null);
    };
  }, [article]);

  // Stop audio speech when navigating away
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [article.id]);

  // Text to Speech (Listen to News in Hindi)
  const handleToggleAudio = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    } else {
      const textToRead = `${cleanTitle}। ${cleanDesc}। ${cleanFullContent.replace(/[*#`]/g, '')}`;
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.lang = 'hi-IN';
      utterance.rate = 0.95; // Slightly slower for clear Hindi news diction

      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);

      window.speechSynthesis.speak(utterance);
      setIsPlayingAudio(true);
    }
  };

  const handleCopyLink = () => {
    const url = `${SITE_CONFIG.currentSiteUrl}/news/${article.slug}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleLike = () => {
    if (!liked) {
      toggleArticleLike(article.id);
      setLiked(true);
    }
  };

  // Social shares
  const shareUrl = `${SITE_CONFIG.currentSiteUrl}/news/${article.slug}`;
  const shareTitle = `${cleanTitle} - हुंकार 24`;

  const shareWhatsApp = () => {
    const text = `*${cleanTitle}*\n\n${cleanDesc.slice(0, 100)}...\n\nपूरी खबर हुंकार 24 पर पढ़ें:\n${shareUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const shareTelegram = () => {
    const text = `*${cleanTitle}*\n\n${cleanDesc.slice(0, 100)}...\n\nपूरी खबर हुंकार 24 पर पढ़ें:`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`, '_blank');
  };

  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  // Find previous and next articles
  const currentIndex = articles.findIndex(a => a.id === article.id);
  const prevArticle = currentIndex > 0 ? articles[currentIndex - 1] : null;
  const nextArticle = currentIndex < articles.length - 1 ? articles[currentIndex + 1] : null;

  // Related articles in same category or district
  const relatedArticles = articles
    .filter(a => a.id !== article.id && (a.category === article.category || a.district === article.district))
    .slice(0, 3);

  // Format date
  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const months = ['जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'];
      const timeStr = d.toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' });
      return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}, ${timeStr}`;
    } catch {
      return 'आज';
    }
  };

  // Font size multiplier
  const getContentFontSize = () => {
    switch (fontSize) {
      case 'large':
        return 'text-lg leading-relaxed';
      case 'extra-large':
        return 'text-xl leading-loose';
      default:
        return 'text-base sm:text-lg leading-relaxed';
    }
  };

  return (
    <main className="max-w-4xl mx-auto px-3 sm:px-4 py-6">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex items-center justify-between gap-3 mb-4 text-xs text-stone-500 dark:text-stone-400 no-print">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 font-bold text-red-700 dark:text-red-400 hover:text-red-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>मुख्य पृष्ठ पर लौटें</span>
        </button>

        <div className="flex items-center gap-2">
          {article.district && (
            <span className="bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 font-bold px-2 py-0.5 rounded flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span className="capitalize">{article.district}</span>
            </span>
          )}
          <span className="font-semibold uppercase tracking-wider">{article.category}</span>
        </div>
      </div>

      {/* Article Header */}
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-stone-900 dark:text-stone-100 font-newspaper-headline leading-tight tracking-tight mb-4">
          {cleanTitle}
        </h1>

        {/* Lead Deck / Summary — Guaranteed non-empty, cleanly formatted */}
        <div className="text-base sm:text-lg font-medium text-stone-800 dark:text-stone-200 leading-normal border-l-4 border-red-700 pl-4 py-2 mb-4 bg-stone-100/70 dark:bg-stone-900/60 rounded-r">
          <p>{cleanDesc}</p>
        </div>

        {/* Action Ribbon: Audio Reader, Print, Share */}
        <div className="flex items-center justify-between gap-3 py-2.5 my-2 border-y border-stone-200 dark:border-stone-800 text-xs no-print">
          <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400">
            <span className="font-semibold text-stone-800 dark:text-stone-200">{article.reporterName || 'हुंकार डेस्क'}</span>
            <span>·</span>
            <span>{formatDate(article.publishedAt)}</span>
          </div>
          {/* Audio Listen */}
          <button
            onClick={handleToggleAudio}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
              isPlayingAudio
                ? 'bg-red-700 text-white animate-pulse'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:bg-stone-200'
            }`}
          >
            {isPlayingAudio ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-red-600" />}
            <span>{isPlayingAudio ? 'वाचन रोकें' : 'ऑडियो सुनें (Listen in Hindi)'}</span>
          </button>

          {/* Social Share Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={shareWhatsApp}
              className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition-colors cursor-pointer"
              title="व्हाट्सऐप पर शेयर करें"
            >
              <MessageCircle className="w-4 h-4" />
            </button>
            <button
              onClick={shareTelegram}
              className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 hover:bg-sky-100 transition-colors cursor-pointer"
              title="टेलीग्राम पर शेयर करें"
            >
              <Send className="w-4 h-4" />
            </button>
            <button
              onClick={shareFacebook}
              className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 transition-colors cursor-pointer"
              title="फेसबुक पर शेयर करें"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleCopyLink}
              className="p-2 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 transition-colors cursor-pointer"
              title="लिंक कॉपी करें"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={() => window.print()}
              className="p-2 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 transition-colors cursor-pointer"
              title="प्रिंट करें"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Featured Image */}
      <figure className="mb-6 rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-800">
        <SafeImage
          src={article.mainImage}
          alt={article.imageAlt || cleanTitle}
          category={article.category}
          district={article.district}
          imageType={article.imageType}
          className="w-full max-h-[500px]"
        />
        <figcaption className="p-3 text-xs text-stone-600 dark:text-stone-400 bg-stone-50 dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row justify-between gap-1">
          <span className="font-medium">{article.imageCaption || `${cleanTitle} की प्रासंगिक ग्राउंड विज़ुअल तस्वीर`}</span>
          <span className="text-stone-400 shrink-0">
            स्रोत: {article.imageSource || article.sourceName || 'हुंकार 24 फोटो डेस्क'}
          </span>
        </figcaption>
      </figure>

      {/* Embedded Video if present (YouTube, Supabase, MP4, etc.) */}
      {article.videoUrl && (
        <div className="mb-6">
          <UniversalVideoPlayer
            url={article.videoUrl}
            title={cleanTitle}
            poster={article.mainImage}
          />
        </div>
      )}

      {/* Top Banner Advertisement */}
      <AdBanner placement="article_page" className="my-6 no-print" />

      {/* Article Body Content — Thoroughly formatted, no empty pipe, clear paragraphs */}
      <article className={`prose dark:prose-invert max-w-none text-stone-800 dark:text-stone-200 font-serif ${getContentFontSize()} mb-8 space-y-4`}>
        {cleanFullContent.split('\n\n').map((paragraph, idx) => {
          if (paragraph.startsWith('### ') || paragraph.startsWith('## ') || (paragraph.startsWith('**') && paragraph.endsWith('**'))) {
            const cleanHeading = paragraph.replace(/^###?\s*/, '').replace(/\*\*/g, '').trim();
            return (
              <h3 key={idx} className="font-sans font-bold text-lg sm:text-xl text-stone-900 dark:text-stone-100 mt-6 mb-2 pb-1 border-b border-stone-200 dark:border-stone-800 flex items-center gap-2">
                <span className="w-1.5 h-4.5 bg-red-600 rounded-full inline-block"></span>
                <span>{cleanHeading}</span>
              </h3>
            );
          }
          if (paragraph.startsWith('- ') || paragraph.startsWith('1. ') || paragraph.startsWith('* ')) {
            return (
              <div key={idx} className="bg-stone-50 dark:bg-stone-900/60 p-4 rounded-lg my-3 border border-stone-200 dark:border-stone-800 font-sans text-sm">
                <p className="whitespace-pre-line leading-relaxed">{paragraph}</p>
              </div>
            );
          }
          return (
            <p key={idx} className="leading-relaxed">
              {paragraph}
            </p>
          );
        })}

        {article.sourceUrl && (
          <div className="pt-3 border-t border-stone-200 dark:border-stone-800 text-xs text-stone-500 flex items-center gap-1.5">
            <span>मूल समाचार संदर्भ:</span>
            <a
              href={article.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-700 dark:text-red-400 font-semibold hover:underline inline-flex items-center gap-1"
            >
              <span>{article.sourceName || 'स्रोत दस्तावेज़'}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </article>

      {/* Bottom Article Banner */}
      <AdBanner placement="middle_feed" className="my-6 no-print" />

      {/* Previous / Next Article Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-8 pt-6 border-t border-stone-200 dark:border-stone-800 no-print">
        {prevArticle ? (
          <div
            onClick={() => {
              setActiveArticle(prevArticle);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="group cursor-pointer p-4 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-red-600 transition-colors bg-white dark:bg-stone-900 flex items-center gap-3"
          >
            <ChevronLeft className="w-5 h-5 text-red-700 shrink-0" />
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-400 block">पिछली खबर</span>
              <h4 className="text-xs font-bold font-newspaper-headline line-clamp-1 group-hover:text-red-700">
                {sanitizeHeadline(prevArticle.headline)}
              </h4>
            </div>
          </div>
        ) : <div />}

        {nextArticle && (
          <div
            onClick={() => {
              setActiveArticle(nextArticle);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="group cursor-pointer p-4 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-red-600 transition-colors bg-white dark:bg-stone-900 flex items-center justify-between gap-3 text-right"
          >
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-400 block">अगली खबर</span>
              <h4 className="text-xs font-bold font-newspaper-headline line-clamp-1 group-hover:text-red-700">
                {sanitizeHeadline(nextArticle.headline)}
              </h4>
            </div>
            <ChevronRight className="w-5 h-5 text-red-700 shrink-0" />
          </div>
        )}
      </div>

      {/* Related News Grid */}
      {relatedArticles.length > 0 && (
        <section className="my-8 pt-6 border-t border-stone-200 dark:border-stone-800 no-print">
          <h3 className="text-lg font-bold font-newspaper-headline text-stone-900 dark:text-stone-100 mb-4 pb-2 border-b border-stone-200 dark:border-stone-800 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-red-600" />
            <span>संबंधित और महत्वपूर्ण समाचार</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {relatedArticles.map(art => (
              <ArticleCard
                key={art.id}
                article={art}
                layout="standard"
                showSummary={false}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
};
