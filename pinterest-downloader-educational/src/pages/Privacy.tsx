import React from 'react';
import { Link } from 'react-router-dom';

export const Privacy: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Privacy Policy</h1>
      <div className="prose prose-slate">
        <p className="lead text-lg text-slate-600 mb-6">
          Your privacy is important to us. This policy explains how we handle data.
        </p>
        
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">1. No User Accounts</h2>
          <p className="text-slate-600">
            We do not require or support user accounts. No personal information like names, emails, 
            or passwords is ever collected.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">2. No Permanent Logs</h2>
          <p className="text-slate-600">
            We do not maintain permanent logs of the URLs you process. Any data processed is handled 
            in-memory and discarded after the request is complete.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">3. No Third-Party Sharing</h2>
          <p className="text-slate-600">
            We do not sell, trade, or otherwise transfer your information to outside parties. 
            This tool is strictly for educational purposes.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">4. Cookies</h2>
          <p className="text-slate-600">
            This application does not use tracking cookies.
          </p>
        </section>
      </div>
      <Link to="/" className="inline-block mt-8 text-emerald-600 hover:text-emerald-700 font-medium">
        ← Back to Home
      </Link>
    </div>
  );
};
