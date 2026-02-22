import React from 'react';
import { Download, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';

interface ResultCardProps {
  title: string;
  thumbnail?: string;
  videoUrl: string;
}

export const ResultCard: React.FC<ResultCardProps> = ({ title, thumbnail, videoUrl }) => {
  const handleDownload = () => {
    // Use our proxy endpoint to avoid CORS issues and force download
    window.location.href = `/api/download?url=${encodeURIComponent(videoUrl)}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl shadow-slate-100"
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
        <div className="p-6 md:w-2/3 flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-semibold text-slate-900 line-clamp-2 mb-2">
              {title}
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Public video source found. You can now download it for personal educational use.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleDownload}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download MP4
            </button>
            <a
              href={videoUrl}
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
