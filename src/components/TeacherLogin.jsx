import React, { useState } from 'react';
import { LockKeyhole, X } from 'lucide-react';
import { signInTeacher } from '../services/vocabularyService';

export default function TeacherLogin({ onClose, onSignedIn }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const session = await signInTeacher(email.trim(), password);
      await onSignedIn(session);
    } catch (submitError) {
      setError(submitError.message || 'Teacher login failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="absolute inset-0 z-[140] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl md:p-8">
        <div className="mb-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600"><LockKeyhole size={24} /></span>
            <div><h2 className="text-2xl font-black text-gray-800">Teacher Login</h2><p className="text-sm font-medium text-gray-400">Students do not need an account.</p></div>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-gray-400 hover:bg-gray-100" aria-label="Close teacher login"><X size={20} /></button>
        </div>
        <label className="mb-1 block text-xs font-black uppercase tracking-widest text-gray-400">Email</label>
        <input type="email" required autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} className="mb-4 w-full rounded-2xl border-2 border-gray-100 bg-gray-50 p-4 outline-none focus:border-indigo-500" />
        <label className="mb-1 block text-xs font-black uppercase tracking-widest text-gray-400">Password</label>
        <input type="password" required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mb-4 w-full rounded-2xl border-2 border-gray-100 bg-gray-50 p-4 outline-none focus:border-indigo-500" />
        {error && <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-600">{error}</p>}
        <button disabled={submitting} className="w-full rounded-2xl bg-indigo-600 py-4 font-black text-white shadow-lg hover:bg-indigo-700 disabled:opacity-50">{submitting ? 'Signing in…' : 'Sign In as Teacher'}</button>
      </form>
    </div>
  );
}
