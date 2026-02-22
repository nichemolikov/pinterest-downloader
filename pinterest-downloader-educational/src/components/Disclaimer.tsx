import React from 'react';

interface DisclaimerProps {
  className?: string;
}

export const Disclaimer: React.FC<DisclaimerProps> = ({ className }) => {
  return (
    <div className={`text-xs text-slate-500 border-t border-slate-200 pt-6 mt-8 ${className}`}>
      <p className="mb-2">
        <strong>Educational Disclaimer:</strong> This tool is a school project created for educational purposes only. 
        It is not affiliated with, endorsed by, or connected to Pinterest.
      </p>
      <p>
        Users are solely responsible for respecting copyright and intellectual property rights. 
        Only use this tool with content you have the legal right to access and for personal, non-commercial use.
      </p>
    </div>
  );
};
