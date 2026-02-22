import React, { useState } from 'react';
import { Download, ExternalLink, Copy, Check } from 'lucide-react';
import { motion } from 'motion/react';

interface ResultCardProps {
  title: string;
  thumbnail?: string;
  videoUrl?: string;
  imageUrl?: string;
  type: 'video' | 'image';
  description?: string;
  style?: string;
}

export const ResultCard: React.FC<ResultCardProps> = ({ title, thumbnail, videoUrl, imageUrl, type, description, style }) => {
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedStyle, setCopiedStyle] = useState(false);

  const mainUrl = type === 'video' ? videoUrl : imageUrl;

  const handleDownload = () => {
    if (!mainUrl) return;
    // Use our proxy endpoint to avoid CORS issues and force download
    window.location.href = `/api/download?url=${encodeURIComponent(mainUrl)}`;
  };

  const copyToClipboard = async (text: string, type: 'caption' | 'style') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'caption') {
        setCopiedCaption(true);
        setTimeout(() => setCopiedCaption(false), 2000);
      } else {
        setCopiedStyle(true);
        setTimeout(() => setCopiedStyle(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl shadow-slate-100 mb-8"
    >
      <div className="md:flex">
        <div className="md:w-1/3 bg-slate-100 aspect-video md:aspect-square relative overflow-hidden">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              No Preview
            </div>
          )}
        </div>
        <div className="p-6 md:w-2/3 flex flex-col">
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-slate-900 line-clamp-2 mb-2">
              {title}
            </h3>
            {description && (
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Caption</span>
                  <button
                    onClick={() => copyToClipboard(description, 'caption')}
                    className="text-emerald-600 hover:text-emerald-700 p-1 rounded-md hover:bg-emerald-50 transition-colors flex items-center gap-1 text-xs font-medium"
                  >
                    {copiedCaption ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedCaption ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <p className="text-sm text-slate-600 line-clamp-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {description}
                </p>
              </div>
            )}
            {style && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Style / Hashtags</span>
                  <button
                    onClick={() => copyToClipboard(style, 'style')}
                    className="text-emerald-600 hover:text-emerald-700 p-1 rounded-md hover:bg-emerald-50 transition-colors flex items-center gap-1 text-xs font-medium"
                  >
                    {copiedStyle ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedStyle ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <p className="text-xs font-mono text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-100/50">
                  {style}
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-auto">
            <button
              onClick={handleDownload}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download {type === 'video' ? 'MP4' : 'JPG'}
            </button>
            <a
              href={mainUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Direct Link
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
