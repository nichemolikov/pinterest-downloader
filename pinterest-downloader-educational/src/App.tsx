import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, Github } from 'lucide-react';
import { UrlForm } from './components/UrlForm';
import { ResultCard } from './components/ResultCard';
import { Disclaimer } from './components/Disclaimer';
import { Terms } from './pages/Terms';
import { Privacy } from './pages/Privacy';

interface VideoResult {
  title: string;
  thumbnail?: string;
  videoUrl: string;
}

function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VideoResult | null>(null);

  const handleResolve = async (url: string) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process URL');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
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
            Pinterest Video Helper
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
            Paste a public Pinterest video link below to get started.
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

          {result && (
            <ResultCard 
              title={result.title} 
              thumbnail={result.thumbnail} 
              videoUrl={result.videoUrl} 
            />
          )}
        </AnimatePresence>

        <div className="max-w-2xl mx-auto">
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
