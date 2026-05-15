import React from 'react';
import { LogIn, ShieldCheck, Globe } from 'lucide-react';
import { loginWithGoogle } from '../lib/firebase';
import { motion } from 'motion/react';

export const LoginPage = () => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
    } catch (error: any) {
      console.error(error);
      setError(error.message || 'Gagal masuk. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="p-12 text-center">
          <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-8 shadow-xl shadow-blue-200">
            <ShieldCheck className="w-10 h-10" />
          </div>
          
          <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">SatuInApp</h1>
          <p className="text-slate-500 mb-10 font-medium">Internal Reporting System</p>
          
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-sm font-medium">
              {error}
            </div>
          )}
          
          <button 
            onClick={handleLogin}
            disabled={loading}
            className="w-full h-14 flex items-center justify-center gap-4 bg-white border-2 border-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-50 hover:border-blue-200 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <img src="https://www.google.com/favicon.ico" className="w-6 h-6" alt="google" />
            {loading ? 'Masuk...' : 'Masuk dengan Google'}
          </button>
          
          <div className="mt-10 pt-8 border-t border-slate-100">
            <div className="flex items-center justify-center gap-6 text-slate-400">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                <Globe className="w-3.5 h-3.5" /> BPS Version
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
