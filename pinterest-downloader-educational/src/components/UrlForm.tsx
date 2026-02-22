import React, { useState, useRef, useEffect } from 'react';
import { Link2, Loader2, ListTree, ChevronDown, ChevronUp } from 'lucide-react';

interface UrlFormProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
}

export const UrlForm: React.FC<UrlFormProps> = ({ onSubmit, isLoading }) => {
  const [url, setUrl] = useState('');
  const [isBulkMode, setIsBulkMode] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handlePaste = (e: React.ClipboardEvent) => {
    const pastedData = e.clipboardData.getData('text');
    if (!pastedData) return;

    // Process pasted data: ensure each link or the whole block ends with a newline
    let processedData = pastedData;
    if (!processedData.endsWith('\n')) {
      processedData += '\n';
    }

    e.preventDefault();

    if (!isBulkMode) {
      setIsBulkMode(true);
      const target = e.target as HTMLInputElement;
      const start = target.selectionStart || 0;
      const end = target.selectionEnd || 0;
      const newValue = url.substring(0, start) + processedData + url.substring(end);
      setUrl(newValue);

      // The cursor will be handled by the useEffect after mode switch
    } else {
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart || 0;
      const end = target.selectionEnd || 0;
      const newValue = url.substring(0, start) + processedData + url.substring(end);
      setUrl(newValue);

      const newCursorPos = start + processedData.length;
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = newCursorPos;
          textareaRef.current.focus();
        }
      }, 0);
    }
  };

  // Focus the textarea and set cursor if we just switched to bulk mode via paste or toggle
  useEffect(() => {
    if (isBulkMode && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.selectionStart = textareaRef.current.selectionEnd = url.length;
    }
  }, [isBulkMode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (trimmed) {
      onSubmit(trimmed);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setIsBulkMode(!isBulkMode)}
          className="text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-emerald-500 transition-colors flex items-center gap-2"
        >
          {isBulkMode ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {isBulkMode ? "Switch to Single Link" : "Bulk Mode (BETA)"}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative group">
          <div className="absolute top-4 left-4 pointer-events-none">
            {isBulkMode ? (
              <ListTree className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
            ) : (
              <Link2 className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
            )}
          </div>

          {isBulkMode ? (
            <textarea
              ref={textareaRef}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onPaste={handlePaste}
              placeholder="Paste multiple Pinterest links here (one per line)..."
              className="block w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all shadow-sm text-slate-700 placeholder:text-slate-400 min-h-[120px] resize-none"
              required
            />
          ) : (
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onPaste={handlePaste}
              placeholder="Paste Pinterest link here..."
              className="block w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all shadow-sm text-slate-700 placeholder:text-slate-400"
              required
            />
          )}
        </div>
        <button
          type="submit"
          disabled={isLoading || !url.trim()}
          className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <span>{isBulkMode ? "Process All Links" : "Get Media"}</span>
          )}
        </button>
      </form>
    </div>
  );
};
