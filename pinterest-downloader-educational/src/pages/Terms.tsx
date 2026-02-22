import React from 'react';
import { Link } from 'react-router-dom';

export const Terms: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Terms of Service</h1>
      <div className="prose prose-slate">
        <p className="lead text-lg text-slate-600 mb-6">
          This tool is an educational project designed to demonstrate web technologies.
        </p>
        
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">1. Educational Use Only</h2>
          <p className="text-slate-600">
            The Pinterest Video Helper is created as a school project. It is intended for personal, non-commercial, 
            and educational use only. It is not intended for production use or bulk data extraction.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">2. Public Content Only</h2>
          <p className="text-slate-600">
            This tool only works with publicly accessible Pinterest URLs. It does not bypass any security measures, 
            logins, or private content restrictions.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">3. User Responsibility</h2>
          <p className="text-slate-600">
            Users are solely responsible for the content they access and download. You must respect the copyright 
            and intellectual property rights of the original content creators. The developers of this tool 
            assume no responsibility for any misuse.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">4. No Storage</h2>
          <p className="text-slate-600">
            We do not store any media files on our servers. The tool acts as a temporary bridge to help you 
            locate the public source of a video.
          </p>
        </section>
      </div>
      <Link to="/" className="inline-block mt-8 text-emerald-600 hover:text-emerald-700 font-medium">
        ← Back to Home
      </Link>
    </div>
  );
};
