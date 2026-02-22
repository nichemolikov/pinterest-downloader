import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, Github, ListPlus, Download, Share2, Trash2 } from 'lucide-react';
import { UrlForm } from './components/UrlForm';
import { ResultCard } from './components/ResultCard';
import { Disclaimer } from './components/Disclaimer';
import { Terms } from './pages/Terms';
import { Privacy } from './pages/Privacy';

interface PinResult {
  url: string;
  title: string;
  author?: string;
  thumbnail?: string;
  videoUrl?: string;
  imageUrl?: string;
  type: 'video' | 'image';
  description?: string;
  style?: string;
}

function Home() {
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<PinResult | null>(null);
  const [collection, setCollection] = useState<PinResult[]>([]);
  const [showCollection, setShowCollection] = useState(false);

  // Load collection from URL if present
  useEffect(() => {
    const urlsParam = searchParams.get('urls');
    if (urlsParam) {
      try {
        const decodedUrls = JSON.parse(atob(urlsParam));
        if (Array.isArray(decodedUrls) && decodedUrls.length > 0) {
          handleBulkResolve(decodedUrls);
        }
      } catch (e) {
        console.error("Failed to decode collection URLs", e);
      }
    }
  }, [searchParams]);

  const handleResolve = async (urlInput: string) => {
    const urls = urlInput.split('\n').map(u => u.trim()).filter(u => u.length > 0);

    if (urls.length > 1) {
      handleBulkResolve(urls);
      return;
    }

    const url = urls[0];
    setIsLoading(true);
    setError(null);
    setCurrentResult(null);

    try {
      const response = await fetch('/api/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to process URL');

      setCurrentResult({ ...data, url });
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkResolve = async (urls: string[]) => {
    setIsLoading(true);
    setError(null);
    const newResults: PinResult[] = [];

    for (const url of urls) {
      try {
        const response = await fetch('/api/resolve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });
        const data = await response.json();
        if (response.ok) {
          newResults.push({ ...data, url });
        }
      } catch (err) {
        console.error(`Failed to resolve ${url}`, err);
      }
    }

    if (newResults.length > 0) {
      setCollection(prev => {
        const unique = [...prev];
        newResults.forEach(res => {
          if (!unique.find(p => p.url === res.url)) unique.push(res);
        });
        return unique;
      });
      setShowCollection(true);
    } else {
      setError("Failed to load any items from the collection.");
    }
    setIsLoading(false);
  };

  const addToCollection = (item: PinResult) => {
    if (!collection.find(p => p.url === item.url)) {
      setCollection(prev => [...prev, item]);
    }
    setCurrentResult(null);
    setShowCollection(true);
  };

  const removeFromCollection = (url: string) => {
    setCollection(prev => prev.filter(p => p.url !== url));
  };

  const shareCollection = () => {
    const urls = collection.map(p => p.url);
    const encoded = btoa(JSON.stringify(urls));
    const url = `${window.location.origin}${window.location.pathname}?urls=${encoded}`;
    navigator.clipboard.writeText(url);
    alert("Collection link copied to clipboard!");
  };

  const downloadAll = async () => {
    for (const item of collection) {
      const downloadUrl = item.type === 'video' ? item.videoUrl : item.imageUrl;
      if (downloadUrl) {
        try {
          const queryParams = new URLSearchParams({
            url: downloadUrl,
            title: item.title,
            author: item.author || ''
          });

          const response = await fetch(`/api/download?${queryParams.toString()}`);
          if (!response.ok) throw new Error("Failed to download item");

          const blob = await response.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;

          // Try to get filename from server headers
          const disposition = response.headers.get('Content-Disposition');
          let filename = `pinterest-${item.type}-${Date.now()}.${item.type === 'video' ? 'mp4' : 'jpg'}`;
          if (disposition && disposition.includes('filename=')) {
            const match = disposition.match(/filename="(.+)"/);
            if (match && match[1]) filename = match[1];
          }

          link.setAttribute('download', filename);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(blobUrl);

          // Small delay between downloads to prevent overwhelming the browser
          await new Promise(r => setTimeout(r, 800));
        } catch (err) {
          console.error("Batch download failed for:", item.title, err);
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <main className="flex-grow container mx-auto px-6 py-12 md:py-24">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold text-slate-900 tracking-tight mb-4"
          >
            Pinterest Media Helper
            <span className="block text-lg md:text-xl font-medium text-slate-500 mt-2">
              (Educational Use Only)
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-slate-600 text-lg max-w-2xl mx-auto"
          >
            A school project demonstrating how to safely extract public media metadata.
            Paste multiple Pinterest links or build a collection to download all at once.
          </motion.p>
        </div>

        <div className="mb-12">
          <UrlForm onSubmit={handleResolve} isLoading={isLoading} />
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-2xl mx-auto bg-red-50 border border-red-100 p-4 rounded-2xl flex items-start gap-3 text-red-700 mb-8"
            >
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </motion.div>
          )}

          {currentResult && (
            <div className="space-y-4">
              <ResultCard
                title={currentResult.title}
                author={currentResult.author}
                thumbnail={currentResult.thumbnail}
                videoUrl={currentResult.videoUrl}
                imageUrl={currentResult.imageUrl}
                type={currentResult.type}
                description={currentResult.description}
                style={currentResult.style}
              />
              <div className="flex justify-center">
                <button
                  onClick={() => addToCollection(currentResult)}
                  className="bg-white border border-slate-200 text-slate-700 font-medium px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm"
                >
                  <ListPlus className="h-4 w-4" />
                  Add to Download List
                </button>
              </div>
            </div>
          )}

          {collection.length > 0 && showCollection && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-3xl p-8 shadow-xl shadow-slate-100 overflow-hidden"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900">Download List ({collection.length})</h2>
                <div className="flex gap-2">
                  <button
                    onClick={shareCollection}
                    className="p-3 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                    title="Share List"
                  >
                    <Share2 className="h-5 w-5" />
                  </button>
                  <button
                    onClick={downloadAll}
                    className="px-6 py-3 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2"
                  >
                    <Download className="h-5 w-5" />
                    Download All
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {collection.map((item) => (
                  <div key={item.url} className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 relative group">
                    <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-slate-200">
                      {item.thumbnail && (
                        <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-grow min-w-0">
                      <h4 className="font-semibold text-slate-900 truncate mb-1">{item.title}</h4>
                      <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">{item.type}</p>
                    </div>
                    <button
                      onClick={() => removeFromCollection(item.url)}
                      className="absolute -top-2 -right-2 p-2 bg-red-50 text-red-500 rounded-full border border-red-100 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="max-w-2xl mx-auto mt-12">
          <Disclaimer />
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-slate-500">
            © {new Date().getFullYear()} School Project. Not affiliated with Pinterest.
          </div>
          <div className="flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link to="/terms" className="hover:text-emerald-600 transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-emerald-600 transition-colors">Privacy</Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-slate-900 transition-colors"
            >
              <Github className="h-4 w-4" />
              Source
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
      </Routes>
    </Router>
  );
}
